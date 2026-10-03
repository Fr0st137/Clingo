const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const apiRequire = require('node:module').createRequire(resolve(__dirname, '../apps/api/package.json'));
const { UnauthorizedException } = apiRequire('@nestjs/common');
const { ProviderOffersService } = require('../apps/api/dist/provider/provider-offers.service');
const { offerInput, defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const draft = () => ({ title: 'Sprzątanie domu', category: 'homes', description: '', priceMinor: 14990, durationMinutes: 90, status: 'draft' });
const status = code => error => error.getStatus() === code;
function setup(role = 'owner') {
  const rows = new Map();
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const repository = {
    create: input => ({ ...input, id: randomUUID() }),
    async save(row) { rows.set(row.id, structuredClone(row)); return structuredClone(row); },
    async find({ where }) { return [...rows.values()].filter(row => matches(row, where)).map(row => structuredClone(row)); },
    async findOneBy(where) { const row = [...rows.values()].find(row => matches(row, where)); return row ? structuredClone(row) : null; },
    async update(where, input) { const row = rows.get(where.id); if (!row || !matches(row, where)) return { affected: 0 }; rows.set(row.id, { ...row, ...input }); return { affected: 1 }; }
  };
  const service = new ProviderOffersService({ async sessionUser(token) { if (!token) throw new UnauthorizedException(); return { id: token }; } }, { async findOneBy({ userId }) { return userId === 'none' ? null : { accountId: userId, role }; } }, repository);
  return { service, rows };
}

const { ProviderSettingsService } = require('../apps/api/dist/provider/provider-settings.service');
const { locationInput } = require('../apps/api/dist/provider/provider-location.input');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const frontend = { exports: {} };
new Function('module', 'exports', ts.transpileModule(readFileSync(resolve(__dirname, '../apps/provider/lib/provider-offers.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(frontend, frontend.exports);
test('offer prices use exact minor units and reject ambiguous, fractional or out-of-range inputs', () => {
  for (const [input, expected] of [['149,90',14990],['0.29',29],['100000',10000000],['0,01',1],[' 7,5 ',750]]) assert.equal(frontend.exports.priceMinor(input),expected);
  for (const input of ['', '-1', '0', '1e3', '1.999', '1,2,3','100000,01']) assert.equal(frontend.exports.priceMinor(input),null);
  for (const change of [{ priceMinor: 1.5 }, { priceMinor: '199' }, { priceMinor: 0 }, { priceMinor: 10000001 }, { durationMinutes: 14 }, { durationMinutes: 1441 }, { durationMinutes: 15.5 }, { category:'other' }, { title:'' }, { description:'x'.repeat(2001) }, { accountId:'b' }, { status:'published' }, { status:'archived' }, { revision:1 }]) assert.throws(() => offerInput({...draft(),...change}),status(400));
  assert.equal(offerInput({...draft(),description:' Line one\nLine two '}).description,'Line one\nLine two');
  assert.throws(() => offerInput(draft(),true),status(400));
});
test('offer configuration validates rates, continuous area tiers, toggles and add-ons', () => {
  const configuration=defaultOfferConfiguration();
  const result=offerInput({...draft(),configuration});
  assert.equal(result.configuration.ratePerSquareMeterMinor,150);
  assert.equal(result.configuration.areaTiers[2].maxSquareMeters,null);
  assert.equal(result.configuration.addOns.length,10);
  for (const configuration of [
    {...defaultOfferConfiguration(),ratePerSquareMeterMinor:0},
    {...defaultOfferConfiguration(),durationPer100SquareMetersMinutes:14},
    {...defaultOfferConfiguration(),leadTimeEnabled:'yes'},
    {...defaultOfferConfiguration(),areaTiers:[{minSquareMeters:1,maxSquareMeters:50,workers:1},{minSquareMeters:52,maxSquareMeters:null,workers:2}]},
    {...defaultOfferConfiguration(),areaTiers:[{minSquareMeters:1,maxSquareMeters:null,workers:1},{minSquareMeters:2,maxSquareMeters:null,workers:2}]},
    {...defaultOfferConfiguration(),addOns:[{id:'same',title:'A',priceMinor:100,billingUnit:'piece'},{id:'same',title:'B',priceMinor:200,billingUnit:'piece'}]},
    {...defaultOfferConfiguration(),unknown:true}
  ]) assert.throws(()=>offerInput({...draft(),configuration}),status(400));
});
test('offer actions require a session and management membership', async () => {
  for (const [token,role,code] of [[undefined,'owner',401],['none','owner',403],['a','employee',403],['a','unknown',403]]) {
    const { service }=setup(role);
    for (const action of [()=>service.list(token),()=>service.get(token,'id'),()=>service.create(token,draft()),()=>service.update(token,'id',{...draft(),revision:1})]) await assert.rejects(action,status(code));
  }
  assert.equal((await setup('admin').service.create('a',draft())).revision,1);
});
test('offers remain private to the owner account across edits, archive and restore', async () => {
  const { service, rows }=setup(); const created=await service.create('a',draft());
  assert.equal(created.accountId,undefined); assert.equal(rows.get(created.id).accountId,'a');
  rows.get(created.id).configuration={};
  assert.equal((await service.get('a',created.id)).configuration.ratePerSquareMeterMinor,150);
  assert.deepEqual(await service.list('b'),[]); assert.equal((await service.list('a')).length,1);
  await assert.rejects(()=>service.get('b',created.id),status(404));
  await assert.rejects(()=>service.update('b',created.id,{...draft(),revision:1}),status(404));
  const archived=await service.update('a',created.id,{...draft(),status:'archived',revision:1});
  assert.equal(archived.status,'archived'); assert.equal(archived.priceMinor,14990);
  const configuration={...defaultOfferConfiguration(),bufferMinutes:45};
  const restored=await service.update('a',created.id,{...draft(),configuration,revision:2});
  assert.equal(restored.status,'draft'); assert.equal(restored.revision,3);
  assert.equal((await service.get('a',created.id)).configuration.bufferMinutes,45);
});
test('competing price or status updates cannot overwrite one another', async () => {
  const {service}=setup(); const created=await service.create('a',draft());
  const results=await Promise.allSettled([service.update('a',created.id,{...draft(),priceMinor:19999,revision:1}),service.update('a',created.id,{...draft(),status:'archived',revision:1})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.find(r=>r.status==='rejected').reason.getStatus(),409);
  assert.deepEqual(await service.get('a',created.id),results.find(r=>r.status==='fulfilled').value);
});
const location = () => ({street:'Testowa 12',postalCode:'00-001',city:'Warszawa',radiusKm:25,revision:1});
function locations(role='owner') {
  const rows=new Map(['a','b'].map(id=>[id,{id,location:{street:'',postalCode:'',city:'',radiusKm:0},locationRevision:1,profileRevision:7,notificationsRevision:4}]));
  const service=new ProviderSettingsService({async sessionUser(token){if(!token)throw new UnauthorizedException();return{id:token};}}, {async findOneBy({userId}){return userId==='none'?null:{accountId:userId,role};}}, {async findOneBy({id}){return structuredClone(rows.get(id));},async update(where,input){const row=rows.get(where.id);if(!row||!Object.entries(where).every(([k,v])=>row[k]===v))return{affected:0};rows.set(where.id,{...row,...input});return{affected:1};}},{});
  return {service,rows};
}
test('location validates a complete address, postal code and bounded integer radius', () => {
  assert.equal(locationInput({...location(),city:' Warszawa ',radiusKm:0}).city,'Warszawa');
  assert.equal(locationInput({...location(),radiusKm:100}).radiusKm,100);
  for (const change of [{street:''},{city:''},{postalCode:'12345'},{radiusKm:-1},{radiusKm:101},{radiusKm:2.5},{radiusKm:'25'},{revision:0},{latitude:52},{accountId:'b'}]) assert.throws(()=>locationInput({...location(),...change}),status(400));
});
test('location reads and edits require management membership and do not alter other accounts or settings revisions', async () => {
  const {service,rows}=locations();
  for (const token of [undefined,'none']) {await assert.rejects(()=>service.getLocation(token),status(token?403:401));await assert.rejects(()=>service.saveLocation(token,location()),status(token?403:401));}
  await assert.rejects(()=>locations('employee').service.getLocation('a'),status(403));
  await assert.rejects(()=>locations('employee').service.saveLocation('a',location()),status(403));
  assert.equal((await locations('admin').service.saveLocation('a',location())).revision,2);
  const result=await service.saveLocation('a',location()); assert.equal(result.radiusKm,25); assert.equal(result.revision,2);
  assert.equal((await service.getLocation('b')).city,''); assert.equal(rows.get('a').profileRevision,7); assert.equal(rows.get('a').notificationsRevision,4);
});
test('simultaneous location saves accept exactly one revision', async () => {
  const {service}=locations(); const results=await Promise.allSettled([20,80].map(radiusKm=>service.saveLocation('a',{...location(),radiusKm})));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.getStatus(),409);
  assert.deepEqual(await service.getLocation('a'),results.find(r=>r.status==='fulfilled').value);
});

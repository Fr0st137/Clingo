const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const apiRequire = require('node:module').createRequire(resolve(__dirname, '../apps/api/package.json'));
const { UnauthorizedException } = apiRequire('@nestjs/common');
const { ProviderReviewsService } = require('../apps/api/dist/provider/provider-reviews.service');
const { reviewReportInput } = require('../apps/api/dist/provider/provider-reviews.input');
const {ACCOUNT_REVIEWS_SQL,ACCOUNT_REVIEW_SUMMARY_SQL,CUSTOMER_REVIEW_FOR_ACCOUNT_SQL}=require('../apps/api/dist/dashboard/review-bridge');
const status = code => error => error.getStatus() === code;

function setup(role = 'owner') {
  const id = randomUUID();
  const rows = new Map([[id, { id, accountId: 'a', authorName: 'Anna Nowak', serviceTitle: 'Sprzątanie mieszkania', rating: 5, content: 'Bardzo dobrze wykonana usługa.', helpfulCount: 2, reported: false, revision: 1, createdAt: new Date('2026-09-30T10:00:00Z') }]]);
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const customers=new Map();
  const raw=row=>({id:row.id,source:row.source??'legacy',author_name:row.authorName,service_title:row.serviceTitle,rating:row.rating,content:row.content,helpful_count:row.helpfulCount,reported:row.reported,revision:row.revision,created_at:row.createdAt,updated_at:row.createdAt,images:[]});
  const manager={
    async query(sql,[accountId,id]){const own=[...rows.values(),...customers.values()].filter(row=>row.accountId===accountId);
      if(sql===ACCOUNT_REVIEW_SUMMARY_SQL)return[{count:own.length,average:own.length?own.reduce((sum,row)=>sum+row.rating,0)/own.length:null}];
      if(sql===ACCOUNT_REVIEWS_SQL)return own.map(raw);
      if(sql===CUSTOMER_REVIEW_FOR_ACCOUNT_SQL)return own.filter(row=>row.source==='customer'&&row.id===id).map(raw);
      return[];
    },
    async findOneOrFail(_entity,{where,lock}){assert.equal(lock.mode,'pessimistic_write');return{id:where.id};},
    async update(_entity,where,input){const row=customers.get(where.orderId);if(!row||row.revision!==where.revision)return{affected:0};customers.set(row.id,{...row,reported:input.providerReported,revision:input.revision});return{affected:1};},
    async transaction(callback){return callback(this);}
  };
  const repository = {
    manager,
    async find({ where }) { return [...rows.values()].filter(row => matches(row, where)).map(row => structuredClone(row)); },
    async findOneBy(where) { const row = [...rows.values()].find(row => matches(row, where)); return row ? structuredClone(row) : null; },
    async update(where, input) { const row = rows.get(where.id); if (!row || !matches(row, where)) return { affected: 0 }; rows.set(row.id, { ...row, ...input }); return { affected: 1 }; }
  };
  const service = new ProviderReviewsService({ async sessionUser(token) { if (!token) throw new UnauthorizedException(); return { id: token }; } }, { async findOneBy({ userId }) { return userId === 'none' ? null : { accountId: userId, role }; } }, repository);
  return { service, rows, customers, id };
}

test('review reports accept only a boolean and a positive revision', () => {
  assert.deepEqual(reviewReportInput({ reported: true, revision: 1 }), { reported: true, revision: 1 });
  for (const input of [{ reported: 'yes', revision: 1 }, { reported: true, revision: 0 }, { reported: true, revision: 1, accountId: 'b' }]) assert.throws(() => reviewReportInput(input), status(400));
  assert.throws(()=>reviewReportInput({reported:true,revision:1,source:'forged'}),status(400));
});

test('reviews are private to one provider account', async () => {
  const { service, id } = setup();
  assert.equal((await service.list('a')).length, 1);
  assert.deepEqual(await service.list('b'), []);
  await assert.rejects(() => service.report('b', id, { reported: true, revision: 1 }), status(404));
  await assert.rejects(() => service.list(undefined), status(401));
  await assert.rejects(() => service.list('none'), status(403));
});

test('owners and admins can report a review with optimistic locking', async () => {
  for (const role of ['owner', 'admin']) {
    const { service, id } = setup(role);
    const saved = await service.report('a', id, { reported: true, revision: 1 });
    assert.equal(saved.reported, true); assert.equal(saved.revision, 2);
    await assert.rejects(() => service.report('a', id, { reported: false, revision: 1 }), status(409));
  }
  const employee = setup('employee');
  assert.equal((await employee.service.list('a')).length, 1);
  await assert.rejects(() => employee.service.report('a', employee.id, { reported: true, revision: 1 }), status(403));
});

test('rating summary uses only the signed-in company and handles no reviews',async()=>{
 const {service,rows,id}=setup();const first=rows.get(id);
 rows.set('second',{...first,id:'second',rating:5});rows.set('third',{...first,id:'third',rating:4});rows.set('foreign',{...first,id:'foreign',accountId:'b',rating:1});
 assert.deepEqual(await service.summary('a'),{average:14/3,count:3});assert.deepEqual(await service.summary('b'),{average:1,count:1});assert.deepEqual(await service.summary('empty'),{average:null,count:0});
 await assert.rejects(()=>service.summary(undefined),status(401));await assert.rejects(()=>service.summary('none'),status(403));
});

test('live customer reviews join legacy reviews without duplication and keep report permissions/revisions',async()=>{
 const {service,rows,customers,id}=setup();customers.set('order',{...rows.get(id),id:'order',source:'customer',rating:3});
 const version={source:'customer',updatedAt:rows.get(id).createdAt.toISOString()};
 assert.equal((await service.list('a')).length,2);assert.deepEqual(await service.summary('a'),{average:4,count:2});
 const flagged=await service.report('a','order',{...version,reported:true,revision:1});assert.equal(flagged.source,'customer');assert.equal(flagged.reported,true);assert.equal(flagged.revision,2);
 await assert.rejects(()=>service.report('a','order',{...version,reported:false,revision:1}),status(409));
 await assert.rejects(()=>service.report('b','order',{...version,reported:true,revision:2}),status(404));
 const employee=setup('employee');employee.customers.set('order',{...employee.rows.get(employee.id),id:'order',source:'customer'});await assert.rejects(()=>employee.service.report('a','order',{...version,reported:true,revision:1}),status(403));
 customers.set('order',{...customers.get('order'),rating:1,reported:false,revision:3,content:'Zmieniona opinia'});await assert.rejects(()=>service.report('a','order',{...version,reported:true,revision:2}),status(409));
 assert.equal((await service.list('a')).find(row=>row.id==='order').content,'Zmieniona opinia');customers.delete('order');assert.equal((await service.summary('a')).count,1);
});

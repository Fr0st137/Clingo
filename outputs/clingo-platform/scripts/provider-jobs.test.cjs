const {test}=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./provider-jobs-fixture.cjs');
const {jobInput}=require('../apps/api/dist/provider/provider-jobs.input');
const status=code=>error=>error.getStatus()===code;
test('job input validates actual calendar dates, same-day times, integer amounts and all explicit references',()=>{
 const {draft}=setup();
 assert.equal(jobInput({...draft(),date:'2024-02-29',notes:' First\nSecond '}).notes,'First\nSecond');
 for(const change of [{date:'2023-02-29'},{date:'2026-04-31'},{date:'2200-01-01'},{startMinute:1400,durationMinutes:90},{startMinute:-1},{durationMinutes:14},{durationMinutes:15.5},{priceMinor:0},{priceMinor:1.5},{employeeId:'bad'},{clientId:null},{offerId:''},{status:'completed'},{revision:1},{accountId:'b'},{clientName:'forged'},{notes:'x'.repeat(2001)}])assert.throws(()=>jobInput({...draft(),...change}),status(400));
 assert.throws(()=>jobInput(draft(),true),status(400));
});
test('all job operations require an authenticated managing member',async()=>{
 for(const [token,role,code] of [[undefined,'owner',401],['none','owner',403],['a','employee',403],['a','unknown',403]]){const {service,draft}=setup(role);for(const action of [()=>service.list(token),()=>service.get(token,'id'),()=>service.save(token,draft()),()=>service.save(token,{...draft(),revision:1},'id')])await assert.rejects(action,status(code));}
 const {service,draft}=setup('admin');assert.equal((await service.save('a',draft())).revision,1);
});
test('foreign jobs and references cannot be read, reassigned or attached to this account',async()=>{
 const {service,ids,draft}=setup();const job=await service.save('a',draft());
 assert.deepEqual(await service.list('b'),[]);assert.equal(job.accountId,undefined);
 await assert.rejects(()=>service.get('b',job.id),status(404));await assert.rejects(()=>service.save('b',{...draft(),revision:1},job.id),status(404));
 for(const change of [{clientId:ids.clientB},{offerId:ids.offerB},{employeeId:ids.employeeB}])await assert.rejects(()=>service.save('a',{...draft(),...change}),status(400));
});
test('client contact, address and service title are snapshots; later catalogue edits do not rewrite job history',async()=>{
 const {service,clients,offers,ids,draft}=setup();const job=await service.save('a',draft());
 clients.get(ids.clientA).name='Changed client';clients.get(ids.clientA).street='New street';offers.get(ids.offerA).title='Changed service';
 const updated=await service.save('a',{...draft(),notes:'Later note',revision:1},job.id);
 assert.equal(updated.clientName,'Klient QA');assert.equal(updated.address,'Testowa 12, 00-001 Warszawa');assert.equal(updated.serviceTitle,'Sprzątanie QA');assert.equal(updated.priceMinor,14990);
});
test('same-employee overlaps and parallel competing creates are rejected, while adjacent slots and unassigned work are allowed',async()=>{
 const {service,draft}=setup();const results=await Promise.allSettled([service.save('a',draft()),service.save('a',draft())]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.getStatus(),400);
 await assert.rejects(()=>service.save('a',{...draft(),startMinute:600}),status(400));
 assert.equal((await service.save('a',{...draft(),startMinute:630})).startMinute,630);
 assert.equal((await service.save('a',{...draft(),employeeId:null})).employeeId,null);
});
test('cancellation releases the slot; reopening rechecks conflicts; stale edits cannot overwrite newer changes',async()=>{
 const {service,draft}=setup();const original=await service.save('a',draft());
 const cancelled=await service.save('a',{...draft(),status:'cancelled',revision:1},original.id);assert.equal(cancelled.status,'cancelled');
 await service.save('a',draft());await assert.rejects(()=>service.save('a',{...draft(),revision:2},original.id),status(400));
 await assert.rejects(()=>service.save('a',{...draft(),status:'cancelled',revision:1},original.id),status(409));
 const results=await Promise.allSettled(['first','second'].map(notes=>service.save('a',{...draft(),status:'cancelled',notes,revision:2},original.id)));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.getStatus(),409);
});
test('archived services may remain on existing jobs but cannot be selected for new work; future jobs cannot be completed',async()=>{
 const {service,offers,ids,draft}=setup();const job=await service.save('a',draft());offers.get(ids.offerA).status='archived';
 await assert.rejects(()=>service.save('a',{...draft(),employeeId:null}),status(400));
 assert.equal((await service.save('a',{...draft(),status:'completed',revision:1},job.id)).status,'completed');
 await assert.rejects(()=>service.save('a',{...draft(),date:'2099-12-31',status:'completed',revision:2},job.id),status(400));
});
const {readFileSync}=require('node:fs');const {resolve,dirname}=require('node:path');const ts=require('typescript');
function loadTs(file){const module={exports:{}};new Function('module','exports','require',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports,p=>p.startsWith('.')?loadTs(resolve(dirname(file),p+'.ts')):require(p));return module.exports;}
const dates=loadTs(resolve(__dirname,'../apps/provider/lib/provider-jobs.ts'));
test('calendar grouping covers complete Monday-first weeks, leap days and month/year navigation',()=>{
 assert.deepEqual(dates.calendarDates('2024-02-29','day'),['2024-02-29']);const month=dates.calendarDates('2024-02-29','month');assert.equal(month.length,35);assert.equal(new Set(month).size,35);assert.equal(month[0],'2024-01-29');assert.equal(month.at(-1),'2024-03-03');assert.ok(month.includes('2024-02-29'));
 assert.equal(dates.shiftCalendar('2026-12-31','month',1),'2027-01-01');assert.equal(dates.shiftCalendar('2024-03-01','day',-1),'2024-02-29');assert.equal(dates.timeLabel(1440),'24:00');
});

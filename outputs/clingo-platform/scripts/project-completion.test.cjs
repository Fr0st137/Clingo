const {test}=require('node:test');const assert=require('node:assert/strict');
const {projectCompletionInput,projectCompletion}=require('../apps/api/dist/provider/project-completion');
const {bookingJobs}=require('../apps/api/dist/dashboard/booking-bridge');
const {jobView}=require('../apps/api/dist/provider/provider-jobs.service');

test('R07: completion requires an explicit confirmation and a positive integer revision',()=>{
 assert.deepEqual(projectCompletionInput({revision:3,confirmCompletion:true}),{revision:3});
 for(const input of [{revision:3},{revision:3,confirmCompletion:false},{revision:3,confirmCompletion:'true'},{revision:0,confirmCompletion:true},{revision:1.5,confirmCompletion:true},{revision:3,confirmCompletion:true,actor:'forged'}])assert.throws(()=>projectCompletionInput(input));
});
test('R07: only sessions beginning after completion are released; original plan is preserved',()=>{
 const now=new Date('2026-11-01T10:00:00Z'),sessions=[{id:'past',startsAt:new Date('2026-10-31T09:00:00Z')},{id:'ongoing',startsAt:new Date(+now-3600000)},{id:'boundary',startsAt:now},{id:'future',startsAt:new Date(+now+1)}],before=structuredClone(sessions);
 assert.deepEqual(projectCompletion(sessions,'owner@example.test',now),{at:now.toISOString(),actor:'owner@example.test',releasedSessionIds:['future']});assert.deepEqual(sessions,before);
});
test('R07: released public sessions are cancelled history, not performed future work',()=>{
 const order={id:'order',mode:'Wielosesyjne',status:'Wykonane zlecenie',summary:{total:'123,45 zł'},selectedOptions:{projectCompletion:{at:'2026-11-01T10:00:00Z',actor:'owner',releasedSessionIds:['future']},sessions:[{id:'past',startsAt:'2026-10-31T09:00:00Z',endsAt:'2026-10-31T10:00:00Z',workers:1,priceMinor:5000},{id:'future',startsAt:'2026-11-02T09:00:00Z',endsAt:'2026-11-02T10:00:00Z',workers:1,priceMinor:7345}]}};
 const jobs=bookingJobs(order);assert.deepEqual(jobs.map(row=>row.status),['completed','cancelled']);assert.equal(jobs[1].releasedByCompletion,true);assert.equal(jobs.reduce((sum,row)=>sum+row.priceMinor,0),12345);assert.equal(jobs[1].id,'booking:order:future');assert.equal(Date.parse(jobs[1].startsAt),Date.parse(order.selectedOptions.sessions[1].startsAt));
 // Older ordinal session identifiers remain compatible.
 delete order.selectedOptions.sessions[1].id;order.selectedOptions.projectCompletion.releasedSessionIds=['2'];assert.equal(bookingJobs(order)[1].releasedByCompletion,true);
});
test('R07: manual history distinguishes a released session from an unrelated cancellation',()=>{
 const completion={at:'2026-11-01T10:00:00Z',releasedSessionIds:['stable']},row={id:'job',projectSessionId:'stable',status:'cancelled',employees:[]};
 assert.equal(jobView(row,completion).releasedByCompletion,true);assert.equal(jobView({...row,projectSessionId:'other'},completion).releasedByCompletion,false);assert.equal(jobView(row).releasedByCompletion,false);
});

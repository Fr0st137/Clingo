const{test}=require('node:test');const assert=require('node:assert/strict');
const{projectBalance,estimateForArea,historicalEstimate}=require('../apps/api/dist/provider/project-work');
const{validateProjectPlan,allocateProjectPrice,projectInterval}=require('../apps/api/dist/provider/project-plan');
const{warsawDate,localDate,localTime,localDuration}=require('../apps/api/dist/dashboard/booking-time');
const now=warsawDate('2026-11-01','12:00');
const staff=()=>({category:'homes',occupied:[],employees:['a','b'].map(id=>({id,name:id,services:['homes'],schedule:Array.from({length:7},(_,day)=>({day,enabled:true,start:'08:00',end:'20:00'}))}))});
const session=(id,date,start,end,ids=['a'])=>({id,startsAt:warsawDate(date,start),endsAt:warsawDate(date,end),employees:ids.map(id=>({id,name:id})),workers:ids.length,priceMinor:1000});
const first=session('first','2026-11-02','08:00','12:00'),second=session('second','2026-11-03','08:00','12:00');
const input=rows=>({revision:1,sessions:rows.map(row=>({id:row.id,date:localDate(row.startsAt),startMinute:Number(localTime(row.startsAt).slice(0,2))*60+Number(localTime(row.startsAt).slice(3)),endMinute:Number(localTime(row.endsAt).slice(0,2))*60+Number(localTime(row.endsAt).slice(3)),employeeIds:row.employees.map(row=>row.id)}))});
const estimate=historicalEstimate(100,480,1);
test('R06: workload is hours times crew; shortage/excess and percentage are not capped at 100%',()=>{
 const result=projectBalance(3000,[{durationMinutes:660,workers:5}]);assert.equal(result.plannedMinutes,3300);assert.equal(result.percentage,110);assert.equal(result.excessMinutes,300);
 assert.equal(projectBalance(3000,[{durationMinutes:300,workers:5}]).remainingMinutes,1500);
 const original={source:'area',areaSquareMeters:100,workMinutesPerSquareMeter:1.8,fixedWorkMinutes:60,requiredWorkMinutes:240,estimatedWorkers:2};
 assert.equal(estimateForArea(original,200).requiredWorkMinutes,420);assert.equal(original.requiredWorkMinutes,240);assert.ok(estimateForArea(original,.29));assert.throws(()=>estimateForArea(original,1.001));
});
test('R06: deleting a future session requires explicit shortage consent; small provider sessions are allowed',()=>{
 assert.throws(()=>validateProjectPlan(input([first]),[first,second],estimate,staff(),0,now),/za mało/);
 assert.equal(validateProjectPlan({...input([first]),confirmUnderplanned:true},[first,second],estimate,staff(),0,now).balance.remainingMinutes,240);
 const short=session('11111111-1111-4111-8111-111111111111','2026-11-04','09:00','09:01');
 assert.throws(()=>validateProjectPlan(input([first,second,short]),[first,second],estimate,staff(),0,now),/nadmiar/);
 assert.equal(validateProjectPlan({...input([first,second,short]),confirmOverplanned:true},[first,second],estimate,staff(),0,now).balance.excessMinutes,1);
});
test('R06: adding/removing workers updates the balance and requires the appropriate acknowledgement',()=>{
 const more={...first,employees:[{id:'a',name:'a'},{id:'b',name:'b'}],workers:2};
 assert.throws(()=>validateProjectPlan(input([more,second]),[first,second],estimate,staff(),0,now),/nadmiar/);
 assert.equal(validateProjectPlan({...input([more,second]),confirmOverplanned:true},[first,second],estimate,staff(),0,now).balance.plannedMinutes,720);
 const bad=input([first,second]);bad.sessions[0].employeeIds=[];assert.throws(()=>validateProjectPlan({...bad,confirmUnderplanned:true},[first,second],estimate,staff(),0,now),/co najmniej/);
});
test('R06: completed sessions are immutable; an ongoing session permits only its future end to change',()=>{
 const past=session('past','2026-10-31','08:00','10:00'),active=session('active','2026-11-01','11:00','13:00');
 const original=[past,active],work=historicalEstimate(null,240,1);
 const valid={...active,endsAt:warsawDate('2026-11-01','12:30')};
 assert.equal(validateProjectPlan({...input([past,valid]),confirmUnderplanned:true},original,work,staff(),0,now).balance.plannedMinutes,210);
 for(const changed of[{...past,endsAt:warsawDate('2026-10-31','10:01')},{...active,startsAt:warsawDate('2026-11-01','11:15')},{...active,employees:[{id:'b',name:'b'}]}])assert.throws(()=>validateProjectPlan({...input(changed.id==='past'?[changed,active]:[past,changed]),confirmUnderplanned:true,confirmOverplanned:true},original,work,staff(),0,now));
 assert.throws(()=>validateProjectPlan({...input([past]),confirmUnderplanned:true},original,work,staff(),0,now),/usunąć/);
});
test('R06: changed/new times check live availability; original reservations survive later absences; pending proposals recheck everything',()=>{
 const busy=staff();busy.occupied.push({startsAt:first.startsAt,endsAt:first.endsAt,employeeIds:['a'],bufferMinutes:0});
 assert.doesNotThrow(()=>validateProjectPlan(input([first,second]),[first,second],estimate,structuredClone(busy),0,now));
 assert.throws(()=>validateProjectPlan(input([first,second]),[first,second],estimate,structuredClone(busy),0,now,true),error=>error.getStatus()===409);
 const shifted={...first,startsAt:warsawDate('2026-11-02','09:00'),endsAt:warsawDate('2026-11-02','13:00')};
 assert.throws(()=>validateProjectPlan(input([shifted,second]),[first,second],estimate,structuredClone(busy),0,now),error=>error.getStatus()===409);
});
test('R06: overlap, buffers, duplicate IDs, forged crews and extra fields cannot bypass validation',()=>{
 const overlapping={...second,startsAt:warsawDate('2026-11-02','11:00'),endsAt:warsawDate('2026-11-02','15:00')};
 assert.throws(()=>validateProjectPlan(input([first,overlapping]),[first,second],estimate,staff(),0,now),/nachodzić/);
 const adjacent={...second,startsAt:warsawDate('2026-11-02','12:00'),endsAt:warsawDate('2026-11-02','16:00')};assert.throws(()=>validateProjectPlan(input([first,adjacent]),[first,second],estimate,staff(),30,now),/bufor/);
 const duplicated=input([first,first]);assert.throws(()=>validateProjectPlan(duplicated,[first,second],estimate,staff(),0,now));
 const forged=input([first,second]);forged.sessions[0].employeeIds=['foreign'];assert.throws(()=>validateProjectPlan(forged,[first,second],estimate,staff(),0,now));
 assert.throws(()=>validateProjectPlan({...input([first,second]),requiredWorkMinutes:1},[first,second],estimate,staff(),0,now));
});
test('R06: redistributing session prices preserves already ended amounts and exact total',()=>{
 const past=session('past','2026-10-31','08:00','09:00');past.priceMinor=3334;
 const planned=[past,{...first,priceMinor:3333},{...second,priceMinor:3333}];
 const result=allocateProjectPrice(10000,[...planned,session('new','2026-11-04','08:00','09:00')],planned,now);
 assert.equal(result[0].priceMinor,3334);assert.equal(result.reduce((sum,row)=>sum+row.priceMinor,0),10000);
});
test('R06: Warsaw DST uses actual elapsed work and rejects a nonexistent local time',()=>{
 assert.equal(localDuration('2027-03-28',60,240),120);assert.equal(localDuration('2027-10-31',60,240),240);
 assert.throws(()=>projectInterval({date:'2027-03-28',startMinute:150,endMinute:240}));
 assert.throws(()=>projectInterval({date:'2026-02-30',startMinute:60,endMinute:120}));assert.equal(localDuration('',NaN,NaN),0);
 assert.equal(localDate(projectInterval({date:'2026-11-02',startMinute:1380,endMinute:1440}).endsAt),'2026-11-03');
});
test('R06: an unaccepted expired proposal may be replanned, but cannot be accepted in the past',()=>{
 const expired=session('expired','2026-10-31','08:00','12:00'),work=historicalEstimate(100,240,1);
 assert.throws(()=>validateProjectPlan(input([expired]),[expired],work,staff(),0,now,true),/przyszłości/);
 const next={...expired,startsAt:first.startsAt,endsAt:first.endsAt};assert.doesNotThrow(()=>validateProjectPlan(input([next]),[expired],work,staff(),0,now,true));
});

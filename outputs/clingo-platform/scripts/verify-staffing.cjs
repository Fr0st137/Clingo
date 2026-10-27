const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { writeFileSync } = require('node:fs');
const { defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const { localDate, addLocalDays, warsawDate } = require('../apps/api/dist/dashboard/booking');
const run = randomUUID(), emails = ['owner','customer','foreign'].map(role => `r03-${role}-${run}@example.test`);
const accounts = [], profiles = [];
const db = new Client({ host:'127.0.0.1',port:55432,database:'clingo',user:'clingo',password:'clingo' });
async function request(path, token, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch('http://localhost:4000'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  return {status:response.status,data:await response.json()};
}
async function ok(path,token,body,method) {const result=await request(path,token,body,method);assert.ok(result.status<300,JSON.stringify(result));return result.data;}
async function main() {
  await db.connect();
  try {
    const users=[]; for(const email of emails) users.push(await ok('/auth/register',null,{email,password:`Test only ${run}`}));
    const [owner,customer,foreign] = users;
    for(const user of [owner,foreign]) {const result=await ok('/provider/account',user.token,{name:`Obsada QA ${run}`});accounts.push(result.account.id);}
    await ok('/provider/settings/location',owner.token,{street:'Testowa 1',city:'Warszawa',postalCode:'00-001',radiusKm:25,revision:1},'PUT');
    const schedule=Array.from({length:7},(_,day)=>({day,enabled:true,start:'08:00',end:'20:00'}));
    const employees=[];
    for(const [index,services] of [['A',['homes']],['B',['homes']],['C',['homes']],['D',['offices']]]) employees.push(await ok('/provider/employees',owner.token,{name:`Pracownik ${index}`,email:'',phone:'',showInCalendar:true,services,schedule}));
    const outsider=await ok('/provider/employees',foreign.token,{name:'Obcy',email:'',phone:'',showInCalendar:true,services:['homes'],schedule});
    async function publish(workers) {const input={title:`Obsada ${workers} QA`,category:'homes',description:'Test dostępności zespołu.',priceMinor:15000,durationMinutes:60,status:'draft',configuration:{...defaultOfferConfiguration(),standardsAccepted:true,bufferEnabled:false,areaTiers:[{minSquareMeters:15,maxSquareMeters:1000,workers}]}};const offer=await ok('/provider/services',owner.token,input);await ok(`/provider/services/${offer.id}`,owner.token,{...input,status:'published',revision:offer.revision},'PUT');const id=`service-${offer.id}`;profiles.push(id);return id;}
    const two=await publish(2),one=await publish(1);
    const date=addLocalDays(localDate(new Date()),2), startsAt=warsawDate(date,'09:00').toISOString();
    const selection=providerId=>({providerId,pricingId:'area-100',frequencyId:'once',addOns:[]});
    const booking=providerId=>({...selection(providerId),startsAt,requestId:randomUUID(),address:'Testowa 1, Warszawa',contactName:'Klient obsady',contactPhone:'500600700'});
    const first=await ok('/dashboard/orders',customer.token,booking(two));
    let jobs=await ok(`/provider/bookings/${first.id}`,owner.token);assert.equal(jobs[0].employees.length,2);assert.equal(new Set(jobs[0].employeeIds).size,2);
    assert.equal((await request('/dashboard/orders',customer.token,booking(two))).status,409);
    const second=await ok('/dashboard/orders',customer.token,booking(one));
    const secondJobs=await ok(`/provider/bookings/${second.id}`,owner.token);assert.ok(!jobs[0].employeeIds.includes(secondJobs[0].employeeId));
    assert.equal((await request('/dashboard/orders',customer.token,booking(one))).status,409);
    const client=await ok('/provider/clients',owner.token,{name:'Klient ręczny obsady',email:'',phone:'500600700',street:'Testowa 1',city:'Warszawa',postalCode:'00-001',notes:''});
    const manual={clientId:client.id,offerId:one.slice(8),employeeId:jobs[0].employeeId,date,startMinute:540,durationMinutes:60,priceMinor:10000,status:'scheduled',notes:''};
    assert.equal((await request('/provider/jobs',owner.token,manual)).status,400,'Manual work respects public employee assignments');
    assert.equal((await request('/provider/jobs',owner.token,{...manual,employeeId:employees[3].id,startMinute:750})).status,400,'Manual work requires service qualification');
    const manualSaved=await ok('/provider/jobs',owner.token,{...manual,startMinute:750});
    assert.ok((await ok('/dashboard/booking/availability',null,{...selection(one),month:date.slice(0,7)})).days.find(row=>row.date===date).slots.some(row=>row.time==='12:30'),'A manual job does not block other employees');
    await ok(`/provider/jobs/${manualSaved.id}`,owner.token,{...manual,startMinute:750,status:'cancelled',revision:1},'PUT');
    const staffing=await ok(`/provider/bookings/${first.id}/staffing`,owner.token,{sessionIndex:0});
    assert.equal(staffing.available.length,2);
    assert.equal((await request(`/provider/bookings/${first.id}/staffing`,foreign.token,{sessionIndex:0})).status,404);
    assert.equal((await request(`/provider/bookings/${first.id}/staffing`,owner.token,{revision:jobs[0].revision,employeeIds:[outsider.id]},'PUT')).status,400);
    assert.equal((await request(`/provider/bookings/${first.id}/staffing`,owner.token,{revision:jobs[0].revision,employeeIds:[outsider.id],acceptUnderstaffing:true},'PUT')).status,409);
    assert.equal((await request(`/provider/bookings/${first.id}/staffing`,owner.token,{revision:jobs[0].revision,employeeIds:[jobs[0].employeeId]},'PUT')).status,400);
    const changed=await ok(`/provider/bookings/${first.id}/staffing`,owner.token,{revision:jobs[0].revision,employeeIds:[jobs[0].employeeId],acceptUnderstaffing:true},'PUT');assert.equal(changed[0].employees.length,1);
    assert.equal((await request(`/provider/bookings/${first.id}/staffing`,owner.token,{revision:jobs[0].revision,employeeIds:jobs[0].employeeIds},'PUT')).status,409);
    await ok(`/provider/bookings/${first.id}`,owner.token,{status:'cancelled',revision:changed[0].revision},'PUT');
    const race=await Promise.all(Array.from({length:3},()=>request('/dashboard/orders',customer.token,booking(one))));
    assert.deepEqual(race.map(row=>row.status).sort(),[201,201,409]);
    const assigned=(await ok('/provider/jobs',owner.token)).filter(row=>row.status==='scheduled');assert.equal(new Set(assigned.flatMap(row=>row.employeeIds)).size,3);
    const overlappingAbsence=await ok('/provider/absences',owner.token,{start:`${date}T08:00`,end:`${date}T20:00`,reason:'L4',employeeIds:[assigned[0].employeeId]});
    assert.equal((await ok('/provider/jobs',owner.token)).filter(row=>row.status==='scheduled').length,3,'Overlapping absence preserves all existing bookings');
    await ok(`/provider/absences/${overlappingAbsence.id}`,owner.token,{cancelled:true,revision:overlappingAbsence.revision},'PUT');
    const absenceDate=addLocalDays(date,2);
    const absence=await ok('/provider/absences',owner.token,{start:`${absenceDate}T08:00`,end:`${absenceDate}T20:00`,reason:'Urlop wypoczynkowy',employeeIds:employees.slice(0,3).map(row=>row.id)});
    const available=await ok('/dashboard/booking/availability',null,{...selection(one),month:absenceDate.slice(0,7)});
    assert.equal(available.days.find(row=>row.date===absenceDate).slots.length,0);
    assert.equal(JSON.stringify(available).includes('Pracownik'),false,'Public availability must not disclose employees');
    assert.equal((await ok('/provider/jobs',owner.token)).filter(row=>row.status==='scheduled').length,3,'Absence must preserve existing orders');
    await ok(`/provider/absences/${absence.id}`,owner.token,{cancelled:true,revision:absence.revision},'PUT');
    assert.ok((await ok('/dashboard/booking/availability',null,{...selection(one),month:absenceDate.slice(0,7)})).days.find(row=>row.date===absenceDate).slots.length);
    assert.equal((await request('/provider/absences',owner.token,{start:`${absenceDate}T08:00`,end:`${absenceDate}T20:00`,reason:'L4',employeeIds:[outsider.id]})).status,400);
    // Every generated project session must keep the required two real workers.
    const projectSelection={...selection(two),pricingId:'area-1000'};
    const generated=await ok('/dashboard/booking/multi-schedule',null,{...projectSelection,startsAt:warsawDate(absenceDate,'08:00').toISOString()});
    assert.equal(generated.sessions.reduce((sum,row)=>sum+row.durationMinutes,0),900);assert.ok(generated.sessions.every(row=>row.workers===2));
    assert.equal(JSON.stringify(generated).includes('employeeIds'),false);
    const project=await ok('/dashboard/orders',customer.token,{...booking(two),...projectSelection,sessions:generated.sessions});
    assert.ok(project.bookingDetails.sessions.every(row=>!row.employees));
    const projectJobs=await ok(`/provider/bookings/${project.id}`,owner.token);assert.ok(projectJobs.every(row=>row.employees.length===2));
    const employee=employees.find(row=>row.id===projectJobs[0].employeeId);
    assert.equal((await request(`/provider/employees/${employee.id}`,owner.token,{revision:employee.revision},'DELETE')).status,409);
    // Rescheduling reassigns a real available person when the former worker is absent.
    const newDate=addLocalDays(date,5), original=secondJobs[0];
    await ok('/provider/absences',owner.token,{start:`${newDate}T08:00`,end:`${newDate}T20:00`,reason:'Szkolenie',employeeIds:[original.employeeId]});
    const reschedule=await ok(`/provider/bookings/${second.id}/reschedule-availability`,owner.token,{month:newDate.slice(0,7)});
    const newSlot=reschedule.days.find(row=>row.date===newDate).slots.find(row=>row.time==='09:00');assert.ok(newSlot);
    const moved=await ok(`/provider/bookings/${second.id}/reschedule`,owner.token,{revision:original.revision,startsAt:newSlot.startsAt,endsAt:newSlot.endsAt},'PUT');
    assert.notEqual(moved[0].employeeId,original.employeeId);assert.equal(moved[0].durationMinutes,original.durationMinutes);
    for(const row of employees.slice(0,3)) await ok(`/provider/employees/${row.id}`,owner.token,{name:row.name,email:row.email,phone:row.phone,showInCalendar:row.showInCalendar,services:row.services,schedule:schedule.map(day=>({...day,start:'06:00',end:'10:00'})),revision:row.revision},'PUT');
    const profile=await ok(`/dashboard/provider-profiles/${two}`);assert.equal(profile.bookingSettings.startHour,6);assert.equal(profile.areaPricing.dailyCapacityByWorkers['2'],240);
    assert.equal((await ok('/dashboard/booking/quote',null,{...selection(two),pricingId:'area-400'})).mode,'multi');
    const earlyDate=addLocalDays(date,8),early=await ok('/dashboard/booking/availability',null,{...selection(two),month:earlyDate.slice(0,7)});
    assert.ok(early.days.find(row=>row.date===earlyDate).slots.some(row=>row.time==='06:00'));
    for(const invalid of ['2026-13-01T08:00','2026-02-30T08:00']) assert.equal((await request('/provider/absences',owner.token,{start:invalid,end:'2026-12-31T20:00',reason:'L4',employeeIds:[employee.id]})).status,400);
    const message='PASS: real API/PostgreSQL; automatic named crews; parallel bookings per employee; last-capacity race; service qualifications; staffing ownership/revisions/understaffing acknowledgement; absences block/release without cancellation; multi-session crews persist; public responses hide identities; active assignments prevent employee deletion.';
    writeFileSync('tmp/r03-integration.log',message);console.log(message);
  } finally {
    await db.query('DELETE FROM orders WHERE provider_id=ANY($1)',[profiles]);
    await db.query('DELETE FROM provider_jobs WHERE account_id=ANY($1::uuid[])',[accounts]);
    await db.query('DELETE FROM board_listings WHERE id=ANY($1)',[profiles]);
    await db.query('DELETE FROM provider_profiles WHERE id=ANY($1)',[profiles]);
    await db.query('DELETE FROM provider_accounts WHERE id=ANY($1::uuid[])',[accounts]);
    await db.query('DELETE FROM auth_sessions WHERE email=ANY($1)',[emails]);await db.query('DELETE FROM users WHERE email=ANY($1)',[emails]);await db.end();
  }
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});

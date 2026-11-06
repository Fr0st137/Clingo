const { finishFixtureRegistration } = require('./test-registration.cjs');
// Real HTTP/SQL end-to-end check. Only uniquely named fixtures are removed.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { localDate, localTime, addLocalDays } = require('../apps/api/dist/dashboard/booking');
const base = process.env.CLINGO_TEST_API || 'http://localhost:4000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Only local development APIs are supported.');
const run = randomUUID(), profiles = [1, 2].map(n => `bridge-${run}-${n}`), emails = [1, 2, 3].map(n => `bridge-${run}-${n}@example.test`);
const db = new Client({host:process.env.POSTGRES_HOST || '127.0.0.1',port:Number(process.env.POSTGRES_PORT || 55432),database:process.env.POSTGRES_DB || 'clingo',user:process.env.POSTGRES_USER || 'clingo',password:process.env.POSTGRES_PASSWORD || 'clingo',connectionTimeoutMillis:5000});
const accountIds = [];
async function request(path, token, body, method = body === undefined ? 'GET' : 'POST') {
  const result = await fetch(base + path, {method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body === undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
  return {status:result.status,data:await finishFixtureRegistration(path, await result.json())};
}
async function main() {
  await db.connect();
  try {
    const users = [];
    for (const email of emails) { const result = await request('/auth/register',undefined,{email,password:`test only ${run}`}); assert.equal(result.status,201,JSON.stringify(result.data)); users.push(result.data); }
    const [customer,owner,other] = users;
    for (const user of [owner,other]) { const result=await request('/provider/account',user.token,{name:`Bridge QA ${run}`}); assert.equal(result.status,201); accountIds.push(result.data.account.id); }
    const employee = await request('/provider/employees', owner.token, { name: 'Pracownik integracji', email: '', phone: '', showInCalendar: true, services: ['homes'], schedule: Array.from({ length: 7 }, (_, day) => ({ day, enabled: true, start: '08:00', end: '20:00' })) }); assert.equal(employee.status, 201, JSON.stringify(employee.data));
    const pricing=[{id:'base',label:'Sprzątanie 30m²',description:'QA',duration:'2 godz.',price:'120,01 zł',priceValue:120.01}];
    for (const id of profiles) await db.query(`INSERT INTO provider_profiles SELECT * FROM jsonb_populate_record(NULL::provider_profiles,
      (SELECT to_jsonb(p) || jsonb_build_object('id',$1::text,'account_id',$2::uuid,'reviews','[]'::text,'booking_settings',$3::text,'pricing',$4::text,'frequencies',$5::text,'tags','["Jednosesyjne"]'::text,'metrics',$6::text) FROM provider_profiles p WHERE id='paulina-jagielska'))`,
      [id,accountIds[0],JSON.stringify({days:[0,1,2,3,4,5,6],startHour:8,endHour:20,bufferMinutes:0,leadHours:0}),JSON.stringify(pricing),JSON.stringify([{id:'once',label:'Jednorazowo',discount:'0%',description:'QA'}]),JSON.stringify([{id:'location',label:'Obsługiwany obszar',value:'Warszawa'}])]);
    const selection={providerId:profiles[0],pricingId:'base',frequencyId:'once',addOns:[]};
    let month=localDate(new Date()).slice(0,7);
    async function availability(providerId=profiles[0]) { return request('/dashboard/booking/availability',undefined,{...selection,providerId,month}); }
    let slots=(await availability()).data.days.flatMap(day=>day.slots);
    if(!slots.length){month=addLocalDays(localDate(new Date()),7).slice(0,7);slots=(await availability()).data.days.flatMap(day=>day.slots);}
    const first=slots[0];assert.ok(first);
    const draft={...selection,startsAt:first.startsAt,address:'Warszawa, Testowa 10',contactName:'Klient integracji',accessMethod: 'someone-present', contactPhone: '500600700',notes:'Uwagi testu integracji',requestId:randomUUID()};
    const created=await request('/dashboard/orders',customer.token,draft);assert.equal(created.status,201,JSON.stringify(created.data));const id=created.data.id;
    const jobs=()=>request('/provider/jobs',owner.token);
    let job=(await jobs()).data.find(row=>row.bookingId===id);assert.ok(job);assert.equal(job.clientName,draft.contactName);assert.equal(job.accessMethod,draft.accessMethod);assert.equal(job.notes,draft.notes);assert.equal(job.priceMinor,12001);assert.equal(job.revision,1);
    assert.equal((await request('/provider/bookings/profiles',owner.token)).data.length,2);
    assert.deepEqual((await request('/provider/jobs',other.token)).data,[]);
    assert.equal((await request(`/provider/bookings/${id}`,other.token)).status,404);
    assert.equal((await request(`/provider/bookings/${id}`)).status,401);
    assert.equal((await request(`/provider/bookings/${id}`,customer.token)).status,403);
    assert.equal((await request(`/provider/bookings/${id}`,other.token,{status:'cancelled',revision:1},'PUT')).status,404);
    assert.equal((await request(`/provider/bookings/${id}`,owner.token,{status:'completed',revision:1},'PUT')).status,400);
    assert.equal((await request(`/provider/bookings/${id}`,owner.token,{status:'cancelled',revision:1,accountId:accountIds[1]},'PUT')).status,400);
    assert.ok(!(await availability(profiles[1])).data.days.flatMap(day=>day.slots).some(slot=>slot.startsAt===first.startsAt),'Linked offers must share availability');
    const next=(await availability()).data.days.flatMap(day=>day.slots).find(slot=>slot.startsAt>first.endsAt);assert.ok(next);
    assert.equal((await request(`/dashboard/orders/${id}/reschedule`,customer.token,{startsAt:next.startsAt,endsAt:next.endsAt,revision:1},'PATCH')).status,200);
    job=(await jobs()).data.find(row=>row.bookingId===id);assert.equal(job.startsAt,next.startsAt);assert.equal(job.revision,2);
    assert.equal((await request(`/provider/bookings/${id}`,owner.token,{status:'cancelled',revision:1},'PUT')).status,409);
    const client=(await request('/provider/clients',owner.token,{name:'Klient ręczny QA',email:emails[0],phone:'500600700',street:'Testowa 10',city:'Warszawa',postalCode:'00-001',notes:''}));assert.equal(client.status,201,JSON.stringify(client.data));
    const offer=await request('/provider/services',owner.token,{title:'Usługa QA',category:'homes',description:'',priceMinor:12001,durationMinutes:120,status:'draft'});assert.equal(offer.status,201);
    const [h,m]=localTime(new Date(next.startsAt)).split(':').map(Number);
    const manual={clientId:client.data.id,offerId:offer.data.id,employeeId:null,date:localDate(new Date(next.startsAt)),startMinute:h*60+m,durationMinutes:120,priceMinor:12001,status:'scheduled',notes:''};
    assert.equal((await request('/provider/jobs',owner.token,manual)).status,400,'Manual work must not overlap an existing public reservation');
    const competing=await Promise.all([1,2].map(()=>request(`/provider/bookings/${id}`,owner.token,{status:'cancelled',revision:2},'PUT')));assert.deepEqual(competing.map(r=>r.status).sort(),[200,409]);
    assert.match((await request(`/dashboard/orders/${id}`,customer.token)).data.status,/Odwoł/);
    const manualSaved=await request('/provider/jobs',owner.token,manual);assert.equal(manualSaved.status,201);
    assert.ok(!(await availability()).data.days.flatMap(day=>day.slots).some(slot=>slot.startsAt===next.startsAt),'Manual work must remove public slots');
    assert.equal((await request('/dashboard/orders',customer.token,{...draft,startsAt:next.startsAt,requestId:randomUUID()})).status,409);
    assert.equal((await request(`/provider/jobs/${manualSaved.data.id}`,owner.token,{...manual,status:'cancelled',revision:1},'PUT')).status,200);
    // Account lock serializes the customer and manual-job create, in either ordering.
    const race=await Promise.all([request('/provider/jobs',owner.token,manual),request('/dashboard/orders',customer.token,{...draft,startsAt:next.startsAt,requestId:randomUUID()})]);
    assert.equal(race.filter(r=>r.status===201).length,1,JSON.stringify(race));
    if(race[0].status===201) await request(`/provider/jobs/${race[0].data.id}`,owner.token,{...manual,status:'cancelled',revision:1},'PUT');
    else await request(`/dashboard/orders/${race[1].data.id}/cancel`,customer.token,{},'PATCH');
    await db.query('UPDATE provider_profiles SET tags=$1, pricing=$3 WHERE id=ANY($2)', [JSON.stringify(['Wielosesyjne']), profiles, JSON.stringify([{...pricing[0], duration:'20 godz.'}])]);
    const schedule=await request('/dashboard/booking/multi-schedule',undefined,{...selection,startsAt:first.startsAt});assert.equal(schedule.status,201,JSON.stringify(schedule.data));
    const multi=await request('/dashboard/orders',customer.token,{...draft,startsAt:undefined,sessions:schedule.data.sessions,requestId:randomUUID()});assert.equal(multi.status,201,JSON.stringify(multi.data));
    let multiJobs=(await jobs()).data.filter(row=>row.bookingId===multi.data.id);assert.equal(multiJobs.length,schedule.data.sessions.length);assert.equal(multiJobs.reduce((sum,row)=>sum+row.priceMinor,0),12001);
    assert.equal((await request(`/dashboard/orders/${multi.data.id}/cancel`,customer.token,{},'PATCH')).status,200);
    multiJobs=(await jobs()).data.filter(row=>row.bookingId===multi.data.id);assert.ok(multiJobs.every(row=>row.status==='cancelled'&&row.revision===2));
    // Past fixture verifies provider completion and the customer's exact same record.
    await db.query('UPDATE orders SET status=$1,"startsAt"=$2,"endsAt"=$3,selected_options=$4 WHERE id=$5',['Zaplanowane zlecenie','2020-01-06T08:00:00Z','2020-01-06T10:00:00Z',JSON.stringify({contactName:draft.contactName,contactPhone:draft.contactPhone,addOns:[],frequencyId:'once',pricingId:'base'}),id]);
    assert.equal((await request(`/provider/bookings/${id}`,owner.token,{status:'completed',revision:3},'PUT')).status,200);
    assert.match((await request(`/dashboard/orders/${id}`,customer.token)).data.status,/Wykonane/);
    assert.equal((await request(`/dashboard/orders/${id}/cancel`,customer.token,{},'PATCH')).status,400);
    assert.equal((await db.query('SELECT revision FROM orders WHERE id=$1',[id])).rows[0].revision,4);
    await db.query('UPDATE provider_profiles SET tags=$1, pricing=$3 WHERE id=ANY($2)', [JSON.stringify(['Jednosesyjne']), profiles, JSON.stringify(pricing)]);
    const free=(await availability()).data.days.flatMap(day=>day.slots)[0];assert.ok(free);
    const actionBooking=await request('/dashboard/orders',customer.token,{...draft,startsAt:free.startsAt,requestId:randomUUID()});assert.equal(actionBooking.status,201);
    const actionId=actionBooking.data.id;
    const monthInput={month:localDate(new Date(free.startsAt)).slice(0,7)};
    assert.equal((await request(`/provider/bookings/${actionId}/reschedule-availability`,other.token,monthInput)).status,404);
    const providerSlots=await request(`/provider/bookings/${actionId}/reschedule-availability`,owner.token,monthInput);assert.equal(providerSlots.status,201);
    const moved=providerSlots.data.days.flatMap(day=>day.slots).find(slot=>slot.startsAt>free.endsAt);assert.ok(moved);
    const moveInput={revision:1,startsAt:moved.startsAt,endsAt:moved.endsAt,message:'Nowy termin uzgodniony telefonicznie.'};
    assert.equal((await request(`/provider/bookings/${actionId}/reschedule`,other.token,moveInput,'PUT')).status,404);
    assert.equal((await request(`/provider/bookings/${actionId}/reschedule`,owner.token,{...moveInput,message:'x'.repeat(101)},'PUT')).status,400);
    const moves=await Promise.all([1,2].map(()=>request(`/provider/bookings/${actionId}/reschedule`,owner.token,moveInput,'PUT')));
    assert.deepEqual(moves.map(row=>row.status).sort(),[200,409]);
    const movedView=(await request(`/provider/bookings/${actionId}`,owner.token)).data[0];
    assert.equal(movedView.startsAt,moved.startsAt);assert.equal(movedView.providerMessages[0].message,moveInput.message);
    assert.equal(movedView.notes,draft.notes);
    assert.equal((await request(`/provider/bookings/${actionId}`,owner.token,{revision:2,status:'cancelled',message:'Powód odwołania'},'PUT')).status,200);
    const cancelledView=(await request(`/provider/bookings/${actionId}`,owner.token)).data[0];
    assert.equal(cancelledView.providerMessages.length,2);assert.equal(cancelledView.status,'cancelled');
    console.log('PASS: shared orders, provider rescheduling with saved messages, cancellation, completion, ownership, availability and concurrent revision protection.');
  } finally {
    await db.query('DELETE FROM orders WHERE provider_id=ANY($1)',[profiles]);
    await db.query('DELETE FROM provider_profiles WHERE id=ANY($1)',[profiles]);
    await db.query('DELETE FROM provider_jobs WHERE account_id=ANY($1::uuid[])',[accountIds]);
    await db.query('DELETE FROM provider_accounts WHERE id=ANY($1::uuid[])',[accountIds]);
    await db.query('DELETE FROM auth_sessions WHERE email=ANY($1)',[emails]);
    await db.query('DELETE FROM users WHERE email=ANY($1)',[emails]);
    await db.end();
  }
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});

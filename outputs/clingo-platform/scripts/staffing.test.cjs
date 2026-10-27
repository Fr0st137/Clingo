const { test } = require('node:test');
const assert = require('node:assert/strict');
const { freeEmployees, staffedSlots, assignStaff, planStaffedSessions, rosterHours, rosterCapacity } = require('../apps/api/dist/dashboard/staffing');
const { warsawDate } = require('../apps/api/dist/dashboard/booking');
const hours = { days: [1,2,3,4,5,6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 };
const date = '2026-11-02', now = warsawDate('2026-11-01', '12:00');
const at = time => warsawDate(date, time);
const worker = (id, start = '08:00', end = '20:00', services = ['homes']) => ({ id, name: id, services, showInCalendar: false, schedule: Array.from({ length: 7 }, (_, day) => ({ day, enabled: true, start, end })) });
const fixture = employees => ({ employees, category: 'homes', occupied: [] });

test('R03: only matching service and full-shift availability count; hidden calendar rows still work', () => {
  const staff = fixture([worker('a','08:00','12:00'), worker('b','10:00','20:00'), worker('c','08:00','20:00',['offices'])]);
  assert.deepEqual(freeEmployees(staff,at('08:00'),at('12:00')).map(row => row.id), ['a']);
  assert.equal(staffedSlots(staff,date,240,2,hours,now).length, 0);
  assert.equal(freeEmployees(staff,at('10:00'),at('12:00')).length, 2);
  assert.equal(freeEmployees(staff,at('10:00'),at('12:15')).length, 1);
});
test('R03: roster determines early/late hours and capacity for a stable crew, rounding to quarter-hours', () => {
  const employees = [worker('a','06:10','14:00'),worker('b','07:00','11:00'),worker('c','14:00','22:00')];
  const hours = rosterHours(employees, { days: [], startHour:8,endHour:20,bufferMinutes:15,leadHours:24 });
  assert.equal(hours.startHour,6.25);assert.equal(hours.endHour,22);assert.equal(hours.bufferMinutes,15);
  assert.equal(rosterCapacity(employees,1),480);assert.equal(rosterCapacity(employees,2),240);assert.equal(rosterCapacity(employees,3),0);
});
test('R03: concurrent work uses different employees; exhausted capacity rejects and legacy unassigned blocks everyone', () => {
  const staff = fixture([worker('a'),worker('b')]);
  assert.deepEqual(assignStaff(staff,at('09:00'),at('10:00'),1,0).map(row => row.id), ['a']);
  assert.deepEqual(assignStaff(staff,at('09:00'),at('10:00'),1,0).map(row => row.id), ['b']);
  assert.throws(() => assignStaff(staff,at('09:00'),at('10:00'),1,0));
  const legacy = fixture([worker('a'),worker('b')]); legacy.occupied.push({ startsAt: at('09:00'), endsAt: at('10:00'), employeeIds: null, bufferMinutes: 0 });
  assert.equal(freeEmployees(legacy,at('09:00'),at('10:00')).length,0);
});
test('R03/R05: partial absence blocks only selected people; buffers use the greater of both offers', () => {
  const staff = fixture([worker('a'),worker('b')]);
  staff.occupied.push({ startsAt: at('09:00'), endsAt: at('10:00'), employeeIds: ['a'], bufferMinutes: 30 });
  assert.deepEqual(freeEmployees(staff,at('10:15'),at('11:15'),15).map(row => row.id),['b']);
  assert.equal(freeEmployees(staff,at('10:30'),at('11:30'),15).length,2);
  assert.throws(() => assignStaff(staff,at('10:15'),at('11:15'),1,15,['a']));
  assert.throws(() => assignStaff(staff,at('11:00'),at('12:00'),2,0,['b','b']));
});
test('R03: multi-session planner keeps the whole crew for each session, instead of mixing incompatible shifts', () => {
  const staff = fixture([worker('a','08:00','12:00'),worker('b','12:00','20:00')]);
  const rows = planStaffedSessions(staff,600,1,at('08:00'),hours,now);
  assert.deepEqual(rows.map(row => row.employees.map(row => row.id)), [['a'],['b']]);
  assert.deepEqual(rows.map(row => (+row.endsAt-+row.startsAt)/60000),[240,360]);
  assert.throws(() => planStaffedSessions(fixture([worker('a','08:00','12:00'),worker('b','12:00','20:00')]),60,2,at('08:00'),hours,now));
});
test('R03: sessions preserve all minutes, buffers, excluded days, max gaps and required crew count', () => {
  const rows = planStaffedSessions(fixture([worker('a'),worker('b')]),900,2,at('17:00'),{...hours,bufferMinutes:30},now,['2026-11-03']);
  assert.equal(rows.reduce((sum,row)=>sum+(+row.endsAt-+row.startsAt)/60000,0),900);
  assert.equal(rows.length,2); assert.ok(rows.every(row=>row.employees.length===2));
  assert.ok(rows[1].startsAt.toISOString().startsWith('2026-11-04'));
  assert.throws(() => planStaffedSessions(fixture([worker('a')]),900,1,at('17:00'),{...hours,days:[1]},now));
});
test('R03: spare employees allow parallel orders, while sessions of one project remain sequential', () => {
  const rows = planStaffedSessions(fixture([worker('a'),worker('b')]),900,1,at('08:00'),hours,now);
  assert.equal(rows.length,2);assert.equal((+rows[0].endsAt-+rows[0].startsAt)/60000,720);
  assert.ok(+rows[1].startsAt >= +rows[0].endsAt);
  const legacy = planStaffedSessions(fixture([worker('a')]),100,1,at('08:00'),hours,now);
  assert.equal((+legacy[0].endsAt-+legacy[0].startsAt)/60000,100);
  const shortShifts = planStaffedSessions(fixture([worker('a','08:00','09:30')]),100,1,at('08:00'),hours,now);
  assert.equal(shortShifts.reduce((sum,row)=>sum+(+row.endsAt-+row.startsAt)/60000,0),100);
  assert.ok(shortShifts.every(row=>(+row.endsAt-+row.startsAt)/60000>=15));
});

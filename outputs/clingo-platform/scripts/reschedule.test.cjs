const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BookingService } = require('../apps/api/dist/dashboard/booking.service');
const { warsawDate, localDate, addLocalDays } = require('../apps/api/dist/dashboard/booking');
const date = offset => addLocalDays(localDate(new Date()), offset);
const interval = (offset, time = '10:00') => { const startsAt = warsawDate(date(offset), time); return { startsAt, endsAt: new Date(startsAt.getTime() + 135 * 60000) }; };
function setup(multi = false) {
  const first = interval(1);
  const second = interval(2);
  const sessions = multi ? [first, second].map(s => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), workers: 2 })) : undefined;
  const order = { id: 'test-order', providerId: 'provider', userEmail: 'owner@example.com', status: 'Zaplanowane zlecenie', mode: multi ? 'Wielosesyjne' : 'Jednosesyjne', ...first, endsAt: multi ? second.endsAt : first.endsAt, summary: { total: '300 zł' }, selectedOptions: { sessions, contactName: 'Anna', addOns: [{ id: 'oven', quantity: 2 }] } };
  const others = [];
  const saved = [];
  const provider = { id: 'provider', bookingSettings: { days: [0,1,2,3,4,5,6], startHour: 8, endHour: 20, leadHours: 0, bufferMinutes: 0 } };
  const manager = {
    findOne: async () => provider,
    findOneBy: async (_entity, where) => where.id === order.id && where.userEmail === order.userEmail ? order : null,
    findOneByOrFail: async () => order,
    find: async () => [order, ...others],
    save: async value => { saved.push(structuredClone(value)); return value; }
  };
  const service = new BookingService({ manager, transaction: cb => cb(manager) });
  return { service, order, others, saved };
}
test('availability excludes the current order, retains its duration and requires ownership', async () => {
  const { service, order } = setup();
  const result = await service.rescheduleAvailability(order.id, order.userEmail, date(1).slice(0,7));
  assert.ok(result.days.find(d => d.date === date(1)).slots.some(s => s.startsAt === order.startsAt.toISOString()));
  assert.ok(result.days.flatMap(d => d.slots).every(s => Date.parse(s.endsAt) - Date.parse(s.startsAt) === 135 * 60000));
  await assert.rejects(service.rescheduleAvailability(order.id, 'someone@example.com', date(1).slice(0,7)));
});
test('rescheduling saves the new date without changing price or extras and rechecks conflicts', async () => {
  const { service, order, saved, others } = setup();
  const before = structuredClone(order.selectedOptions);
  const next = interval(3);
  await service.reschedule(order.id, order.userEmail, next.startsAt, next.endsAt);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].startsAt.toISOString(), next.startsAt.toISOString());
  assert.equal(saved[0].summary.total, '300 zł');
  assert.deepEqual(saved[0].selectedOptions, before);
  const occupied = interval(4);
  others.push({ id: 'occupied', status: 'Zaplanowane zlecenie', ...occupied });
  await assert.rejects(service.reschedule(order.id, order.userEmail, occupied.startsAt, occupied.endsAt));
  await assert.rejects(service.reschedule(order.id, order.userEmail, next.startsAt, new Date(next.endsAt.getTime() + 60000)));
  assert.equal(saved.length, 1);
});
test('multi-session move preserves other sessions, workers and updates the overall date range', async () => {
  const { service, order, saved } = setup(true);
  const otherSession = structuredClone(order.selectedOptions.sessions[1]);
  const next = interval(3);
  await service.reschedule(order.id, order.userEmail, next.startsAt, next.endsAt, 0);
  assert.deepEqual(order.selectedOptions.sessions[0], otherSession);
  assert.equal(order.selectedOptions.sessions[1].startsAt, next.startsAt.toISOString());
  assert.equal(order.selectedOptions.sessions[1].workers, 2);
  assert.equal(order.startsAt.toISOString(), otherSession.startsAt);
  assert.equal(order.endsAt.toISOString(), next.endsAt.toISOString());
  assert.equal(saved.length, 1);
});
test('multi-session availability and save reject overlaps, excessive gaps and invalid session indices', async () => {
  const { service, order, saved } = setup(true);
  const result = await service.rescheduleAvailability(order.id, order.userEmail, date(1).slice(0,7), 0);
  const occupied = interval(2);
  assert.ok(!result.days.find(d => d.date === date(2))?.slots.some(s => s.startsAt === occupied.startsAt.toISOString()));
  await assert.rejects(service.reschedule(order.id, order.userEmail, occupied.startsAt, occupied.endsAt, 0));
  const far = interval(8);
  await assert.rejects(service.reschedule(order.id, order.userEmail, far.startsAt, far.endsAt, 0));
  for (const index of [undefined, -1, 2, 0.5, '0']) await assert.rejects(service.rescheduleAvailability(order.id, order.userEmail, date(1).slice(0,7), index));
  assert.equal(saved.length, 0);
});
test('cancelled, completed and past services cannot be rescheduled', async () => {
  for (const status of ['Odwołane zlecenie', 'Wykonane zlecenie', 'Anulowane', 'completed']) {
    const { service, order } = setup(); order.status = status;
    await assert.rejects(service.rescheduleAvailability(order.id, order.userEmail, date(1).slice(0,7)));
  }
  const { service, order } = setup(); order.startsAt = new Date(Date.now() - 60000);
  await assert.rejects(service.rescheduleAvailability(order.id, order.userEmail, date(1).slice(0,7)));
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { quoteBooking, daySlots, warsawDate, bookingLimit, localDate, addLocalDays, multiSessionDurations } = require('../apps/api/dist/dashboard/booking');
const { BookingService } = require('../apps/api/dist/dashboard/booking.service');

const offer = { pricing: [{ id: 'base', label: 'Sprzątanie', priceValue: 165, duration: '3 godziny 15 minut' }],
  frequencies: [{ id: 'once', label: 'Jednorazowo', discount: '0%' }, { id: 'weekly', label: 'Co tydzień', discount: '-8%' }],
  addOns: [{ id: 'oven', label: 'Piekarnik', priceValue: 24, durationMinutes: 25 }] };

test('quote includes selected quantity, service duration and frequency discount', () => {
  const quote = quoteBooking(offer, { pricingId: 'base', frequencyId: 'weekly', addOns: [{ id: 'oven', quantity: 2 }] });
  assert.equal(quote.totalValue, 199.8);
  assert.equal(quote.durationMinutes, 245);
  assert.equal(quote.summary.lines[1].value, '48 zł');
});
test('rejects unavailable variants and invalid/duplicate add-ons instead of silently changing the order', () => {
  for (const selection of [{ pricingId: 'missing' }, { frequencyId: 'missing' }, { addOns: [{ id: 'missing', quantity: 1 }] },
    { addOns: [{ id: 'oven', quantity: -1 }] }, { addOns: [{ id: 'oven', quantity: 1.5 }] }, { addOns: [{ id: 'oven', quantity: 21 }] },
    { addOns: [{ id: 'oven', quantity: 1 }, { id: 'oven', quantity: 1 }] }]) assert.throws(() => quoteBooking(offer, selection));
});
test('Polish wall time is independent of the server time zone and daylight saving changes', () => {
  assert.equal(warsawDate('2026-08-31', '08:00').toISOString(), '2026-08-31T06:00:00.000Z');
  assert.equal(warsawDate('2026-11-02', '08:00').toISOString(), '2026-11-02T07:00:00.000Z');
  assert.equal(localDate(new Date('2026-08-30T23:30:00Z')), '2026-08-31');
  assert.equal(bookingLimit(new Date('2026-08-31T10:00:00Z')), '2027-02-28');
});
test('availability respects full duration, overlapping orders, work hours, Sundays and the six-month horizon', () => {
  const now = new Date('2026-08-30T10:00:00Z');
  const busy = [{ startsAt: warsawDate('2026-08-31', '11:00'), endsAt: warsawDate('2026-08-31', '12:00') }];
  const slots = daySlots('2026-08-31', 195, busy, undefined, now);
  assert.ok(!slots.some(s => s.time === '08:00'));
  assert.ok(slots.some(s => s.time === '12:00'));
  assert.ok(slots.some(s => s.time === '16:45'));
  assert.ok(!slots.some(s => s.time === '17:00'));
  assert.equal(daySlots('2026-08-30', 195, [], undefined, now).length, 0);
  assert.equal(daySlots('2027-03-01', 195, [], undefined, now).length, 0);
  assert.throws(() => daySlots('2026-02-31', 195, [], undefined, now));
});
test('buffers, lead time and past hours are enforced', () => {
  const hours = { days: [1], startHour: 8, endHour: 20, bufferMinutes: 15, leadHours: 2 };
  const slots = daySlots('2026-08-31', 60, [{ startsAt: warsawDate('2026-08-31', '12:00'), endsAt: warsawDate('2026-08-31', '13:00') }], hours, warsawDate('2026-08-31', '08:00'));
  assert.ok(!slots.some(s => s.time === '09:00' || s.time === '10:00' || s.time === '11:00' || s.time === '13:00'));
  assert.ok(slots.some(s => s.time === '13:15'));
});
test('multi-session duration is split into at least two bounded sessions without losing minutes', () => {
  for (const duration of [270, 540, 1665]) {
    const sessions = multiSessionDurations(duration);
    assert.ok(sessions.length >= 2);
    assert.ok(sessions.every(value => value > 0 && value <= 480));
    assert.equal(sessions.reduce((sum, value) => sum + value, 0), duration);
  }
  assert.equal(addLocalDays('2026-10-31', 1), '2026-11-01');
});
test('multi-session generator uses real free slots and returns a complete schedule', async () => {
  const service = new BookingService({});
  const offer = {
    id: 'multi-provider', provider: 'Zespół', service: 'Sprzątanie', tags: ['Wielosesyjne'], metrics: [],
    pricing: [{ id: 'large', label: 'Sprzątanie 120m²', priceValue: 400, duration: '9 godzin' }],
    frequencies: [{ id: 'weekly', label: 'Co tydzień', discount: '-10%' }], addOns: [],
    bookingSettings: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 }
  };
  service.offer = async () => offer;
  service.busy = async () => [];
  const firstDate = addLocalDays(localDate(new Date()), 1);
  const result = await service.multiSchedule({ providerId: offer.id, pricingId: 'large', frequencyId: 'weekly', addOns: [], startsAt: warsawDate(firstDate, '08:00').toISOString() });
  assert.equal(result.sessions.length, 2);
  assert.equal(result.sessions.reduce((sum, session) => sum + session.durationMinutes, 0), 540);
  assert.equal(result.quote.totalValue, 360);
  assert.equal(result.quote.frequencyLabel, 'Co tydzień');
  assert.ok(result.sessions.every(session => session.workers === 2));
  assert.ok(result.sessions[1].startsAt > result.sessions[0].endsAt);
});
test('confirmed multi-session order is persisted with its schedule and mode', async () => {
  let savedOrder;
  const manager = {
    createQueryBuilder: () => ({ where() { return this; }, andWhere() { return this; }, async getOne() { return null; } }),
    create: (_entity, value) => value,
    save: async value => { savedOrder = { ...value, id: '11111111-1111-4111-8111-111111111111' }; return savedOrder; }
  };
  const service = new BookingService({ transaction: callback => callback(manager) });
  const offer = {
    id: 'multi-provider', provider: 'Zespół', service: 'Sprzątanie', tags: ['Wielosesyjne'],
    metrics: [{ id: 'location', label: 'Obsługiwany obszar', value: 'Warszawa' }],
    pricing: [{ id: 'large', label: 'Sprzątanie 120m²', priceValue: 400, duration: '9 godzin' }],
    frequencies: [{ id: 'weekly', label: 'Co tydzień', discount: '-10%' }], addOns: [],
    bookingSettings: { days: [0, 1, 2, 3, 4, 5, 6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 }
  };
  service.offer = async () => offer;
  service.busy = async () => [];
  const firstDate = addLocalDays(localDate(new Date()), 1);
  const secondDate = addLocalDays(firstDate, 1);
  const firstStart = warsawDate(firstDate, '08:00');
  const secondStart = warsawDate(secondDate, '08:00');
  const id = await service.create({
    providerId: offer.id, pricingId: 'large', frequencyId: 'weekly', addOns: [], address: 'Testowa 1, Warszawa',
    contactName: 'Anna Nowak', contactPhone: '500600700', requestId: '22222222-2222-4222-8222-222222222222', expectedTotal: 360,
    sessions: [
      { startsAt: firstStart.toISOString(), endsAt: new Date(firstStart.getTime() + 270 * 60_000).toISOString() },
      { startsAt: secondStart.toISOString(), endsAt: new Date(secondStart.getTime() + 270 * 60_000).toISOString() }
    ]
  }, 'anna@example.com');
  assert.equal(id, '11111111-1111-4111-8111-111111111111');
  assert.equal(savedOrder.mode, 'Wielosesyjne');
  assert.equal(savedOrder.selectedOptions.frequencyLabel, 'Co tydzień');
  assert.equal(savedOrder.selectedOptions.sessions.length, 2);
  assert.ok(savedOrder.selectedOptions.sessions.every(session => session.workers === 2));
});

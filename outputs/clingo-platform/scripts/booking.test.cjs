const { test } = require('node:test');
const assert = require('node:assert/strict');
const { quoteBooking, daySlots, warsawDate, bookingLimit, localDate } = require('../apps/api/dist/dashboard/booking');

const offer = { pricing: [{ id: 'base', label: 'Sprzątanie', priceValue: 165, duration: '3 godziny 15 minut' }],
  frequencies: [{ id: 'once', label: 'Jednorazowo', discount: '0%' }, { id: 'weekly', label: 'Co tydzień', discount: '-8%' }],
  addOns: [{ id: 'oven', label: 'Piekarnik', priceValue: 24, durationMinutes: 25 }] };

test('quote includes selected quantity, service duration and frequency discount', () => {
  const quote = quoteBooking(offer, { pricingId: 'base', frequencyId: 'weekly', addOns: [{ id: 'oven', quantity: 2 }] });
  assert.equal(quote.totalValue, 200);
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

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BookingService } = require('../apps/api/dist/dashboard/booking.service');
const { bookingJobs } = require('../apps/api/dist/dashboard/booking-bridge');

test('K05: API rejects missing, unknown and non-string access choices before writing an order', async () => {
  let transactions = 0;
  const service = new BookingService({ transaction() { transactions++; throw new Error('Unexpected write'); } });
  const input = { address: 'Testowa 1, Warszawa', contactName: 'Anna Nowak', contactPhone: '500600700', requestId: '22222222-2222-4222-8222-222222222222' };
  for (const accessMethod of [undefined, null, '', ' ', 'keys', 'PHONE-CONTACT', 1, true, {}, ['someone-present']]) {
    await assert.rejects(service.create({ ...input, accessMethod }, 'customer@example.test'), error => error.getStatus?.() === 400 && /udostępnienia lokalu/.test(error.message));
  }
  assert.equal(transactions, 0);
});

test('K05: every provider session retains the customer choice and legacy orders have no invented default', () => {
  const order = { id: 'order', providerId: 'profile', userEmail: 'customer@example.test', status: 'Zaplanowane', mode: 'Wielosesyjne', revision: 1,
    selectedOptions: { addOns: [], sessions: [{ startsAt: '2026-11-10T07:00:00Z', endsAt: '2026-11-10T09:00:00Z' }, { startsAt: '2026-11-11T07:00:00Z', endsAt: '2026-11-11T09:00:00Z' }] } };
  for (const accessMethod of ['phone-contact', 'someone-present', undefined]) {
    const rows = bookingJobs({ ...order, selectedOptions: { ...order.selectedOptions, accessMethod } });
    assert.equal(rows.length, 2);
    assert.ok(rows.every(row => row.accessMethod === accessMethod));
  }
});

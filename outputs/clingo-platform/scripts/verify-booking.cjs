const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { localDate } = require('../apps/api/dist/dashboard/booking');
const base = process.env.CLINGO_TEST_API || 'http://localhost:4000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('This check only runs against a local development API.');
const runId = randomUUID();
const providerId = `booking-test-${runId}`;
const emails = [1, 2].map(n => `booking-${runId}-${n}@example.test`);
const db = new Client({ host: process.env.POSTGRES_HOST || '127.0.0.1', port: Number(process.env.POSTGRES_PORT || 55432),
  database: process.env.POSTGRES_DB || 'clingo', user: process.env.POSTGRES_USER || 'clingo', password: process.env.POSTGRES_PASSWORD || 'clingo' });
async function request(path, input, token, method = 'POST') {
  const result = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(input ? { body: JSON.stringify(input) } : {}) });
  return { status: result.status, data: await result.json() };
}
async function main() {
  await db.connect();
  try {
    await db.query(`INSERT INTO provider_profiles SELECT * FROM jsonb_populate_record(NULL::provider_profiles,
      (SELECT to_jsonb(p) || jsonb_build_object('id', $1::text, 'provider', 'Wykonawca testowy') FROM provider_profiles p WHERE id='paulina-jagielska'))`, [providerId]);
    const accounts = [];
    for (const email of emails) {
      const result = await request('/auth/register', { email, password: `LocalTest-${runId}`, firstName: 'Test', lastName: 'Rezerwacji' });
      assert.equal(result.status, 201); accounts.push(result.data);
    }
    const selection = { providerId, pricingId: 'single-62', frequencyId: 'once', addOns: [{ id: 'oven-cleaning', quantity: 2 }] };
    const month = localDate(new Date()).slice(0, 7);
    let availability = await request('/dashboard/booking/availability', { ...selection, month });
    assert.equal(availability.status, 201);
    let slot = availability.data.days.flatMap(d => d.slots)[0];
    if (!slot) {
      const next = new Date(`${month}-01T12:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1);
      availability = await request('/dashboard/booking/availability', { ...selection, month: next.toISOString().slice(0, 7) });
      slot = availability.data.days.flatMap(d => d.slots)[0];
    }
    assert.ok(slot);
    const input = { ...selection, startsAt: slot.startsAt, address: 'Testowa 1, 00-001 Warszawa', apartment: '7',
      contactName: 'Test Rezerwacji', contactPhone: '500000000', notes: 'Test zapisu uwag', requestId: randomUUID(),
      invoice: { companyName: 'Firma testowa', taxId: '1234567890', address: 'Testowa 2, Warszawa' } };
    assert.equal((await request('/dashboard/orders', input)).status, 401);
    assert.equal((await request('/dashboard/orders', { ...input, contactPhone: 'abc' }, accounts[0].token)).status, 400);
    assert.equal((await request('/dashboard/orders', { ...input, address: 'Kraków, Testowa 1' }, accounts[0].token)).status, 400, 'An address outside provider coverage must be rejected on the server');
    assert.equal((await request('/dashboard/orders', { ...input, expectedTotal: 1 }, accounts[0].token)).status, 409);
    const [first, other] = await Promise.all([
      request('/dashboard/orders', input, accounts[0].token),
      request('/dashboard/orders', { ...input, requestId: randomUUID() }, accounts[1].token)
    ]);
    assert.deepEqual([first.status, other.status].sort(), [201, 409], 'Exactly one competing reservation should succeed');
    const winner = first.status === 201 ? first : other;
    const index = first.status === 201 ? 0 : 1;
    const token = accounts[index].token;
    assert.equal(winner.data.summary.total, '213 zł');
    assert.equal(winner.data.mode, 'Jednosesyjne');
    assert.equal(winner.data.bookingDetails.notes, input.notes);
    assert.equal(winner.data.bookingDetails.invoice.taxId, '1234567890');
    assert.match(winner.data.address, /lok\. 7/);
    const read = await request(`/dashboard/orders/${winner.data.id}?email=${encodeURIComponent(emails[1 - index])}`, null, token, 'GET');
    assert.equal(read.status, 200, 'The verified session determines ownership, not the supplied email');
    assert.equal((await request(`/dashboard/orders/${winner.data.id}`, null, accounts[1 - index].token, 'GET')).status, 404);
    if (index === 0) {
      const retry = await request('/dashboard/orders', input, token);
      assert.equal(retry.status, 201); assert.equal(retry.data.id, winner.data.id);
      assert.equal((await request('/dashboard/orders', { ...input, notes: 'Changed' }, token)).status, 409);
    }
    const booked = await request('/dashboard/booking/availability', { ...selection, month: localDate(new Date(slot.startsAt)).slice(0, 7) });
    assert.ok(!booked.data.days.flatMap(d => d.slots).some(s => s.startsAt === slot.startsAt));
    assert.equal((await request(`/dashboard/orders/${winner.data.id}/cancel`, {}, token, 'PATCH')).status, 200);
    const freed = await request('/dashboard/booking/availability', { ...selection, month: localDate(new Date(slot.startsAt)).slice(0, 7) });
    assert.ok(freed.data.days.flatMap(d => d.slots).some(s => s.startsAt === slot.startsAt));
    // Deterministic retry check even when the other concurrent request won the first race.
    const retryInput = { ...input, requestId: randomUUID() };
    const saved = await request('/dashboard/orders', retryInput, token);
    const retry = await request('/dashboard/orders', retryInput, token);
    assert.equal(saved.status, 201); assert.equal(retry.data.id, saved.data.id);
    assert.equal((await request('/dashboard/orders', { ...retryInput, requestId: randomUUID(), startsAt: '2001-01-01T08:00:00Z' }, token)).status, 409);
    const list = await request('/dashboard/orders', null, token, 'GET');
    assert.equal(list.data.orders.length, 1);
    console.log('PASS: quote, validation, account ownership, concurrent conflict, persisted details, retry deduplication, cancellation and calendar release.');
  } finally {
    await db.query('DELETE FROM orders WHERE provider_id = $1', [providerId]);
    await db.query('DELETE FROM auth_sessions WHERE email = ANY($1)', [emails]);
    await db.query('DELETE FROM users WHERE email = ANY($1)', [emails]);
    await db.query('DELETE FROM provider_profiles WHERE id = $1', [providerId]);
    await db.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

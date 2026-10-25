const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const { localDate, addLocalDays } = require('../apps/api/dist/dashboard/booking');
const base = process.env.CLINGO_TEST_API || 'http://localhost:4000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local verification only.');
const run = randomUUID(), emails = ['owner', 'customer', 'other'].map(role => `publication-${role}-${run}@example.test`);
const db = new Client({ host: process.env.POSTGRES_HOST || '127.0.0.1', port: Number(process.env.POSTGRES_PORT || 55432), database: 'clingo', user: 'clingo', password: 'clingo', connectionTimeoutMillis: 5000 });
const accountIds = [], profileIds = [];
async function request(path, token, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000) });
  return { status: response.status, data: await response.json() };
}
async function main() {
  await db.connect();
  try {
    const users = [];
    for (const email of emails) {
      const result = await request('/auth/register', undefined, { email, password: `test only ${run}` });
      assert.equal(result.status, 201, JSON.stringify(result.data)); users.push(result.data);
    }
    const [owner, customer, other] = users;
    for (const user of [owner, other]) {
      const result = await request('/provider/account', user.token, { name: `Publikacja QA ${run}` });
      assert.equal(result.status, 201); accountIds.push(result.data.account.id);
    }
    const configuration = { ...defaultOfferConfiguration(), standardsAccepted: true, ratePerSquareMeterMinor: 237, bufferEnabled: false, leadTimeEnabled: false };
    const draft = { title: `Sprzątanie QA ${run}`, category: 'homes', description: 'Rzeczywisty zakres usługi testowej.', priceMinor: 15000, durationMinutes: 60, configuration, status: 'draft' };
    let offer = (await request('/provider/services', owner.token, draft)).data;
    const id = offer.id, publicId = `service-${id}`; profileIds.push(publicId);
    const save = (changes, token = owner.token) => request(`/provider/services/${id}`, token, { ...draft, revision: offer.revision, ...changes }, 'PUT');
    const board = () => request('/dashboard/board');
    assert.ok(!(await board()).data.listings.some(row => row.id === publicId));
    assert.equal((await save({ status: 'published' })).status, 400, 'Publishing requires service location');
    assert.equal((await request(`/provider/services/${id}`, owner.token)).data.revision, 1, 'Rejected publication must roll back');
    const location = { street: 'Testowa 10', postalCode: '00-001', city: 'Warszawa', radiusKm: 25, revision: 1 };
    assert.equal((await request('/provider/settings/location', owner.token, location, 'PUT')).status, 200);
    assert.equal((await save({ status: 'published', configuration: { ...configuration, standardsAccepted: false } })).status, 400);
    assert.equal((await save({ status: 'published' }, other.token)).status, 404);
    const publication = await save({ status: 'published' });
    assert.equal(publication.status, 200, JSON.stringify(publication.data)); offer = publication.data;
    assert.equal(offer.publicProfileId, publicId);
    let listing = (await board()).data.listings.find(row => row.id === publicId); assert.ok(listing);
    assert.match(listing.price, /2,37/);
    const profile = (await request(`/dashboard/provider-profiles/${publicId}`)).data;
    assert.equal(profile.verified, false); assert.equal(profile.service, draft.title); assert.equal(profile.location, 'Warszawa');
    assert.equal(profile.accountId, accountIds[0]); assert.equal(profile.areaPricing.rateMinor, 237);
    const company = (await request('/provider/settings/profile', owner.token)).data.profile;
    const renamed = { ...company, name: `Nowa nazwa QA ${run}` };
    assert.equal((await request('/provider/settings/profile', owner.token, renamed, 'PUT')).status, 200);
    assert.equal((await request(`/dashboard/provider-profiles/${publicId}`)).data.provider, renamed.name);
    assert.equal((await board()).data.listings.find(row => row.id === publicId).provider, renamed.name);
    assert.equal((await request('/provider/settings/location', owner.token, { ...location, city: 'Kraków', revision: 2 }, 'PUT')).status, 200);
    assert.equal((await request(`/dashboard/provider-profiles/${publicId}`)).data.metrics.find(row => row.id === 'location').value, 'Kraków');
    assert.equal((await request('/provider/settings/location', owner.token, { ...location, revision: 3 }, 'PUT')).status, 200);
    const selection = { providerId: publicId, pricingId: 'area-62.5', frequencyId: 'once', addOns: [{ id: 'oven', quantity: 2 }] };
    let quote = await request('/dashboard/booking/quote', undefined, selection);
    assert.equal(quote.status, 201, JSON.stringify(quote.data)); assert.equal(quote.data.totalValue, 208.13);
    assert.equal((await request('/dashboard/booking/quote', undefined, { ...selection, pricingId: 'area-0' })).status, 400);
    assert.equal((await request('/dashboard/booking/quote', undefined, { ...selection, pricingId: 'single' })).status, 400);
    let month = localDate(new Date()).slice(0,7);
    let available = (await request('/dashboard/booking/availability', undefined, { ...selection, month })).data.days.flatMap(day => day.slots);
    if (!available.length) { month = addLocalDays(localDate(new Date()), 10).slice(0,7); available = (await request('/dashboard/booking/availability', undefined, { ...selection, month })).data.days.flatMap(day => day.slots); }
    assert.ok(available.length);
    const booking = { ...selection, startsAt: available[0].startsAt, address: 'Warszawa, Testowa 10', contactName: 'Klient publikacji', contactPhone: '500600700', notes: 'Uwagi od klienta', requestId: randomUUID(), expectedTotal: quote.data.totalValue };
    const created = await request('/dashboard/orders', customer.token, booking);
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const jobs = () => request('/provider/jobs', owner.token);
    let job = (await jobs()).data.find(row => row.bookingId === created.data.id);
    assert.ok(job); assert.equal(job.priceMinor, 20813); assert.equal(job.serviceTitle, draft.title); assert.equal(job.notes, booking.notes);
    assert.deepEqual((await request('/provider/jobs', other.token)).data, []);
    assert.equal((await request('/dashboard/orders', customer.token, { ...booking, requestId: randomUUID() })).status, 409);
    const updated = await save({ status: 'published', description: 'Zaktualizowany opis.', configuration: { ...configuration, ratePerSquareMeterMinor: 300 } });
    assert.equal(updated.status, 200); offer = updated.data;
    assert.equal((await jobs()).data.find(row => row.bookingId === created.data.id).priceMinor, 20813, 'Old booking keeps its price');
    assert.equal((await request('/dashboard/booking/quote', undefined, selection)).data.totalValue, 247.5);
    const withdrawn = await save({ status: 'archived' }); assert.equal(withdrawn.status, 200); offer = withdrawn.data;
    assert.ok(!(await board()).data.listings.some(row => row.id === publicId));
    assert.equal((await request(`/dashboard/provider-profiles/${publicId}`)).status, 404);
    assert.equal((await request('/dashboard/booking/quote', undefined, selection)).status, 404);
    assert.equal((await request('/dashboard/orders', customer.token, { ...booking, requestId: randomUUID() })).status, 404);
    assert.ok((await jobs()).data.some(row => row.bookingId === created.data.id), 'Withdrawal preserves existing bookings');
    const cancelled = await request(`/provider/bookings/${created.data.id}`, owner.token, { status: 'cancelled', revision: job.revision }, 'PUT');
    assert.equal(cancelled.status, 200); assert.match((await request(`/dashboard/orders/${created.data.id}`, customer.token)).data.status, /Odwoł/);
    const restored = await save({ status: 'published' }); assert.equal(restored.status, 200); offer = restored.data;
    assert.equal(offer.publicProfileId, publicId); assert.equal((await board()).data.listings.filter(row => row.id === publicId).length, 1);
    const race = await Promise.all([save({ status: 'draft' }), save({ status: 'archived' })]);
    assert.deepEqual(race.map(result => result.status).sort(), [200,409]);
    console.log('PASS: draft -> publication -> public catalogue -> per-area quote -> customer booking -> provider job -> price update -> withdrawal -> cancellation -> republication; ownership, rollback and revision conflicts.');
  } finally {
    await db.query('DELETE FROM orders WHERE provider_id=ANY($1)', [profileIds]);
    await db.query('DELETE FROM board_listings WHERE id=ANY($1)', [profileIds]);
    await db.query('DELETE FROM provider_profiles WHERE id=ANY($1)', [profileIds]);
    await db.query('DELETE FROM provider_accounts WHERE id=ANY($1::uuid[])', [accountIds]);
    await db.query('DELETE FROM auth_sessions WHERE email=ANY($1)', [emails]);
    await db.query('DELETE FROM users WHERE email=ANY($1)', [emails]);
    await db.end();
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });

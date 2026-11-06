const { finishFixtureRegistration } = require('./test-registration.cjs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
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
  return { status: response.status, data: await finishFixtureRegistration(path, await response.json()) };
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
      for (let index = 0; index < 3; index++) {
        const employee = await request('/provider/employees', user.token, { name: `Pracownik QA ${index+1}`, email: '', phone: '', showInCalendar: true, services: ['homes'], schedule: Array.from({ length: 7 }, (_, day) => ({ day, enabled: true, start: '08:00', end: '20:00' })) });
        assert.equal(employee.status, 201, JSON.stringify(employee.data));
      }
    }
    const configuration = { ...defaultOfferConfiguration(),requiresClientPhotos:false, standardsAccepted: true, ratePerSquareMeterMinor: 237, bufferEnabled: false, leadTimeEnabled: false };
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
    assert.deepEqual(profile.areaPricing.workerTiers, configuration.areaTiers);
    // Backfill must also repair already published profiles, without touching orders.
    await db.query('UPDATE provider_profiles SET area_pricing = (area_pricing::jsonb - $2)::text WHERE id=$1', [publicId, 'workerTiers']);
    const staffingMigration = readFileSync(resolve(__dirname, '../apps/api/src/database/migrations/20261026-offer-staffing-estimate.sql'), 'utf8');
    assert.match(publicId, /^service-[a-f0-9-]{36}$/);
    const scopedMigration = staffingMigration.replace("WHERE profile.id = 'service-'", `WHERE profile.id = '${publicId}' AND profile.id = 'service-'`);
    assert.notEqual(scopedMigration, staffingMigration, 'Backfill test must be limited to its disposable offer');
    await db.query(scopedMigration); await db.query(scopedMigration);
    assert.deepEqual((await request(`/dashboard/provider-profiles/${publicId}`)).data.areaPricing.workerTiers, configuration.areaTiers);
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
    assert.equal(quote.data.durationMinutes, 60); assert.equal(quote.data.estimatedWorkers, 2);
    assert.equal((await request('/dashboard/booking/quote', undefined, { ...selection, pricingId: 'area-0' })).status, 400);
    assert.equal((await request('/dashboard/booking/quote', undefined, { ...selection, pricingId: 'single' })).status, 400);
    let month = localDate(new Date()).slice(0,7);
    let available = (await request('/dashboard/booking/availability', undefined, { ...selection, month })).data.days.flatMap(day => day.slots);
    if (!available.length) { month = addLocalDays(localDate(new Date()), 10).slice(0,7); available = (await request('/dashboard/booking/availability', undefined, { ...selection, month })).data.days.flatMap(day => day.slots); }
    assert.ok(available.length);
    const booking = { ...selection, startsAt: available[0].startsAt, address: 'Warszawa, Testowa 10', contactName: 'Klient publikacji', accessMethod: 'someone-present', contactPhone: '500600700', notes: 'Uwagi od klienta', requestId: randomUUID(), expectedTotal: quote.data.totalValue };
    const created = await request('/dashboard/orders', customer.token, booking);
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const jobs = () => request('/provider/jobs', owner.token);
    let job = (await jobs()).data.find(row => row.bookingId === created.data.id);
    assert.ok(job); assert.equal(job.priceMinor, 20813); assert.equal(job.serviceTitle, draft.title); assert.equal(job.notes, booking.notes);
    assert.equal(job.durationMinutes, 60); assert.equal(job.estimatedWorkers, 2);
    assert.equal(Date.parse(job.endsAt) - Date.parse(job.startsAt), 60 * 60_000);
    const orderSnapshot = (await db.query('SELECT selected_options FROM orders WHERE id=$1', [created.data.id])).rows[0].selected_options;
    assert.equal((typeof orderSnapshot === 'string' ? JSON.parse(orderSnapshot) : orderSnapshot).estimatedWorkers, 2);
    assert.deepEqual((await request('/provider/jobs', other.token)).data, []);
    assert.equal((await request('/dashboard/orders', customer.token, { ...booking, requestId: randomUUID() })).status, 409);
    const changedStaffing = configuration.areaTiers.map(row => ({ ...row, workers: 1 }));
    const updated = await save({ status: 'published', description: 'Zaktualizowany opis.', configuration: { ...configuration, ratePerSquareMeterMinor: 300, areaTiers: changedStaffing } });
    assert.equal(updated.status, 200); offer = updated.data;
    assert.equal((await jobs()).data.find(row => row.bookingId === created.data.id).priceMinor, 20813, 'Old booking keeps its price');
    const preserved = (await jobs()).data.find(row => row.bookingId === created.data.id);
    assert.equal(preserved.durationMinutes, 60); assert.equal(preserved.estimatedWorkers, 2, 'Old booking keeps its staffing estimate');
    const nextQuote = (await request('/dashboard/booking/quote', undefined, selection)).data;
    assert.equal(nextQuote.durationMinutes, 120); assert.equal(nextQuote.estimatedWorkers, 1);
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
    const largeConfiguration = { ...configuration, areaTiers: [{ minSquareMeters: 15, maxSquareMeters: 1000, workers: 1 }] };
    const largePublication = await save({ status: 'published', configuration: largeConfiguration });
    assert.equal(largePublication.status, 200); offer = largePublication.data;
    // Simulate the old one-visit cap, then verify the R02 backfill twice.
    await db.query('UPDATE provider_profiles SET area_pricing = (area_pricing::jsonb - $2 || $3::jsonb)::text WHERE id=$1', [publicId, 'maxSessionMinutes', JSON.stringify({ maximum: 400 })]);
    const multiMigration = readFileSync(resolve(__dirname, '../apps/api/src/database/migrations/20261026-multi-session-publication.sql'), 'utf8').replace("WHERE profile.id = 'service-'", `WHERE profile.id = '${publicId}' AND profile.id = 'service-'`);
    await db.query(multiMigration); await db.query(multiMigration);
    assert.equal((await request(`/dashboard/provider-profiles/${publicId}`)).data.areaPricing.maximum, 1000);
    const largeSelection = { providerId: publicId, pricingId: 'area-500', frequencyId: 'weekly', addOns: [] };
    const largeQuote = (await request('/dashboard/booking/quote', undefined, largeSelection)).data;
    assert.equal(largeQuote.mode, 'multi'); assert.equal(largeQuote.durationMinutes, 900); assert.equal(largeQuote.frequencyId, 'once');
    const firstWindows = (await request('/dashboard/booking/multi-availability', undefined, { ...largeSelection, month })).data.days.flatMap(day => day.slots);
    assert.ok(firstWindows.length);
    const generated = await request('/dashboard/booking/multi-schedule', undefined, { ...largeSelection, startsAt: firstWindows[0].startsAt });
    assert.equal(generated.status, 201, JSON.stringify(generated.data)); assert.ok(generated.data.sessions.length >= 2);
    const project = await request('/dashboard/orders', customer.token, { ...booking, ...largeSelection, sessions: generated.data.sessions, expectedTotal: largeQuote.totalValue, requestId: randomUUID() });
    assert.equal(project.status, 201, JSON.stringify(project.data)); assert.equal(project.data.mode, 'Wielosesyjne');
    const projectJobs = (await jobs()).data.filter(row => row.bookingId === project.data.id);
    assert.equal(projectJobs.length, generated.data.sessions.length);
    assert.equal(projectJobs.reduce((sum, row) => sum + row.durationMinutes, 0), 900);
    assert.equal(projectJobs.reduce((sum, row) => sum + row.priceMinor, 0), Math.round(largeQuote.totalValue * 100));
    assert.equal((await request(`/provider/bookings/${project.data.id}`, owner.token, { status: 'cancelled', revision: projectJobs[0].revision }, 'PUT')).status, 200);
    const race = await Promise.all([save({ status: 'draft' }), save({ status: 'archived' })]);
    assert.deepEqual(race.map(result => result.status).sort(), [200,409]);
    console.log('PASS: publication -> per-area/staffing quote -> booking -> provider job; preserved snapshots; withdrawal/cancellation/republication; idempotent R01/R02 backfills; full-area multi-session project with exact duration and price; ownership, rollback and revision conflicts.');
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

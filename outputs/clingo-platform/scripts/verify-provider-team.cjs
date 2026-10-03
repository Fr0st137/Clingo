// Full HTTP/SQL verification in a disposable schema; never uses application rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const apiRequire = require('node:module').createRequire(resolve(__dirname, '../apps/api/package.json'));
const { Client } = apiRequire('pg');
const { DataSource } = apiRequire('typeorm');
const { Test } = apiRequire('@nestjs/testing');
const { TypeOrmModule } = apiRequire('@nestjs/typeorm');
const { ConfigModule } = apiRequire('@nestjs/config');
const { UserEntity } = require('../apps/api/dist/auth/user.entity');
const { AuthSessionEntity } = require('../apps/api/dist/auth/auth-session.entity');
const { AuthRateLimitEntity } = require('../apps/api/dist/auth/auth-rate-limit.entity');
const { RedisModule } = require('../apps/api/dist/redis/redis.module');
const { ProviderModule } = require('../apps/api/dist/provider/provider.module');
const { ProviderAccountEntity, ProviderMembershipEntity, ProviderEmployeeEntity } = require('../apps/api/dist/provider/provider.entity');
const { ProviderClientEntity } = require('../apps/api/dist/provider/provider-clients.entity');
const { ProviderOfferEntity } = require('../apps/api/dist/provider/provider-offers.entity');
const { ProviderReviewEntity } = require('../apps/api/dist/provider/provider-reviews.entity');
const { ProviderMultiOrderEntity } = require('../apps/api/dist/provider/provider-multi-orders.entity');
const { ProviderJobEntity } = require('../apps/api/dist/provider/provider-jobs.entity');

async function main() {
  const schema = `provider_test_${randomUUID().replaceAll('-', '')}`;
  if (!/^provider_test_[a-f0-9]{32}$/.test(schema)) throw new Error('Invalid test schema');
  const connection = { host: process.env.POSTGRES_HOST ?? '127.0.0.1', port: Number(process.env.POSTGRES_PORT ?? 55432), database: process.env.POSTGRES_DB ?? 'clingo', user: process.env.POSTGRES_USER ?? 'clingo', password: process.env.POSTGRES_PASSWORD ?? 'clingo', connectionTimeoutMillis: 3000 };
  const db = new Client(connection);
  let app, source, created = false;
  await db.connect();
  try {
    await db.query(`CREATE SCHEMA "${schema}"`); created = true;
    const authEntities = [UserEntity, AuthSessionEntity, AuthRateLimitEntity];
    // Auth also uses unqualified SQL for rate limits: isolate every pooled connection.
    const options = { type: 'postgres', host: connection.host, port: connection.port, database: connection.database, username: connection.user, password: connection.password, schema, extra: { options: `-c search_path=${schema},public` } };
    source = new DataSource({ ...options, entities: authEntities, synchronize: true });
    await source.initialize(); await source.destroy();
    await db.query(`SET search_path TO "${schema}"`);
    for (const file of ['20260924-provider-team.sql', '20260925-provider-settings.sql', '20260925-provider-clients.sql', '20260928-provider-offers-location.sql', '20260929-provider-jobs.sql', '20261003-provider-offer-configuration.sql', '20261003-provider-reviews.sql', '20261003-provider-multi-orders.sql']) {
      const migration = readFileSync(resolve(__dirname, '../apps/api/src/database/migrations', file), 'utf8');
      await db.query(migration); await db.query(migration);
    }
    const module = await Test.createTestingModule({ imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), RedisModule,
      TypeOrmModule.forRoot({ ...options, entities: [...authEntities, ProviderAccountEntity, ProviderMembershipEntity, ProviderEmployeeEntity, ProviderClientEntity, ProviderOfferEntity, ProviderJobEntity, ProviderReviewEntity, ProviderMultiOrderEntity], synchronize: false, retryAttempts: 0 }),
      ProviderModule
    ] }).compile();
    app = module.createNestApplication({ logger: false }); await app.listen(0, '127.0.0.1');
    const origin = await app.getUrl();
    async function request(path, method = 'GET', token, body) {
      const response = await fetch(origin + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, data: await response.json() };
    }
    async function register(tag) {
      const testPassword = `test only ${randomUUID()}`;
      const result = await request('/auth/register', 'POST', undefined, { email: `${tag}-${randomUUID()}@example.test`, password: testPassword });
      assert.equal(result.status, 201); return { ...result.data, testPassword };
    }
    assert.equal((await request('/provider/employees')).status, 401);
    const a = await register('a'), b = await register('b');
    assert.equal((await request('/provider/employees', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/me', 'GET', a.token)).data.account, null);
    const accountResults = await Promise.all([1, 2].map(() => request('/provider/account', 'POST', a.token, { name: 'Test team A' })));
    assert.deepEqual(accountResults.map(result => result.status).sort(), [201, 409]);
    assert.equal((await db.query('SELECT count(*) FROM provider_accounts')).rows[0].count, '1');
    assert.equal((await request('/provider/account', 'POST', b.token, { name: 'Test team B' })).status, 201);
    const initialProfile = (await request('/provider/settings/profile', 'GET', a.token)).data;
    assert.equal(initialProfile.profile.name, 'Test team A');
    const profileChanges = { ...initialProfile.profile, name: 'Updated team A', contactEmail: 'CONTACT@example.test', phone: '+48 123 456 789' };
    const profileResponses = await Promise.all([1, 2].map(() => request('/provider/settings/profile', 'PUT', a.token, profileChanges)));
    assert.deepEqual(profileResponses.map(result => result.status).sort(), [200, 409]);
    assert.equal((await request('/provider/me', 'GET', a.token)).data.account.name, 'Updated team A');
    assert.equal((await request('/provider/settings/profile', 'GET', b.token)).data.profile.name, 'Test team B');
    assert.equal((await request('/provider/settings/profile', 'PUT', a.token, { ...profileChanges, accountId: 'forged' })).status, 400);
    const notifications = (await request('/provider/settings/notifications', 'GET', a.token)).data;
    assert.equal(notifications.email.marketing, false);
    notifications.email.created = true;
    assert.equal((await request('/provider/settings/notifications', 'PUT', a.token, notifications)).status, 200);
    assert.equal((await request('/provider/settings/notifications', 'PUT', a.token, notifications)).status, 409);
    assert.equal((await request('/provider/settings/notifications', 'GET', b.token)).data.email.created, false);
    const offerDraft = { title: 'Sprzątanie testowe', category: 'homes', description: 'Zakres\nDruga linia', priceMinor: 14990, durationMinutes: 90, status: 'draft' };
    assert.equal((await request('/provider/services')).status, 401);
    assert.equal((await request('/provider/services', 'POST', a.token, { ...offerDraft, status: 'published' })).status, 400);
    const offer = await request('/provider/services', 'POST', a.token, offerDraft);
    assert.equal(offer.status, 201); assert.equal(offer.data.priceMinor, 14990);
    assert.deepEqual((await request('/provider/services', 'GET', b.token)).data, []);
    for (const method of ['GET', 'PUT']) assert.equal((await request(`/provider/services/${offer.data.id}`, method, b.token, method === 'GET' ? undefined : { ...offerDraft, revision: 1 })).status, 404);
    const offerEdits = await Promise.all([20000, 30000].map(priceMinor => request(`/provider/services/${offer.data.id}`, 'PUT', a.token, { ...offerDraft, priceMinor, revision: 1 })));
    assert.deepEqual(offerEdits.map(result => result.status).sort(), [200, 409]);
    const savedOffer = (await request(`/provider/services/${offer.data.id}`, 'GET', a.token)).data;
    assert.equal((await db.query('SELECT price_minor FROM provider_offers WHERE id=$1', [offer.data.id])).rows[0].price_minor, savedOffer.priceMinor);
    assert.equal((await request(`/provider/services/${offer.data.id}`, 'PUT', a.token, { ...offerDraft, status: 'archived', revision: 2 })).data.status, 'archived');
    assert.equal((await request(`/provider/services/${offer.data.id}`, 'PUT', a.token, { ...offerDraft, revision: 3 })).data.status, 'draft');
    const location = { street: 'Testowa 12', postalCode: '00-001', city: 'Warszawa', radiusKm: 25, revision: 1 };
    assert.equal((await request('/provider/settings/location', 'GET', a.token)).data.city, '');
    const locationEdits = await Promise.all([10, 80].map(radiusKm => request('/provider/settings/location', 'PUT', a.token, { ...location, radiusKm })));
    assert.deepEqual(locationEdits.map(result => result.status).sort(), [200, 409]);
    assert.equal((await request('/provider/settings/location', 'GET', b.token)).data.city, '');
    assert.equal((await request('/provider/settings/location', 'PUT', a.token, { ...location, radiusKm: 101, revision: 2 })).status, 400);
    const locationRow = (await db.query('SELECT location, location_revision FROM provider_accounts WHERE id=(SELECT account_id FROM provider_memberships WHERE user_id=$1)', [a.user.id])).rows[0];
    assert.equal(locationRow.location.city, 'Warszawa'); assert.equal(locationRow.location_revision, 2);
    assert.equal((await request('/provider/clients')).status, 401);
    const clientDraft = { name: 'Klient testowy', email: 'CLIENT@example.test', phone: '+48 123 456 789', street: 'Testowa 12', postalCode: '00-001', city: 'Warszawa', notes: 'Notatka\nDruga linia' };
    assert.equal((await request('/provider/clients', 'POST', a.token, { ...clientDraft, accountId: 'forged' })).status, 400);
    const client = await request('/provider/clients', 'POST', a.token, clientDraft);
    assert.equal(client.status, 201); assert.equal(client.data.email, 'client@example.test');
    assert.deepEqual((await request('/provider/clients', 'GET', b.token)).data, []);
    assert.equal((await request('/provider/clients', 'GET', a.token)).data.length, 1);
    for (const method of ['GET', 'PUT']) assert.equal((await request(`/provider/clients/${client.data.id}`, method, b.token, method === 'GET' ? undefined : { ...clientDraft, revision: 1 })).status, 404);
    assert.equal((await request('/provider/clients/not-a-uuid', 'GET', a.token)).status, 400);
    const clientEdits = await Promise.all(['First', 'Second'].map(notes => request(`/provider/clients/${client.data.id}`, 'PUT', a.token, { ...clientDraft, notes, revision: 1 })));
    assert.deepEqual(clientEdits.map(result => result.status).sort(), [200, 409]);
    const savedClient = (await request(`/provider/clients/${client.data.id}`, 'GET', a.token)).data;
    const sqlClient = (await db.query('SELECT notes, street, revision FROM provider_clients WHERE id=$1', [client.data.id])).rows[0];
    assert.equal(sqlClient.notes, savedClient.notes); assert.equal(sqlClient.revision, 2); assert.equal(sqlClient.street, clientDraft.street);
    const draft = { name: 'Łukasz Żak', email: 'employee@example.test', phone: '+48 123 456 789', showInCalendar: true, services: ['homes'], schedule: [1, 2, 3, 4, 5, 6, 0].map(day => ({ day, enabled: day === 1, start: '08:15', end: '16:45' })) };
    assert.equal((await request('/provider/employees', 'POST', a.token, { ...draft, accountId: 'forged' })).status, 400);
    const invalid = { ...draft, schedule: draft.schedule.map(day => ({ ...day, end: '05:00' })) };
    assert.equal((await request('/provider/employees', 'POST', a.token, invalid)).status, 400);
    const employee = await request('/provider/employees', 'POST', a.token, draft);
    assert.equal(employee.status, 201); const id = employee.data.id;
    assert.equal((await request('/provider/employees', 'GET', a.token)).data.length, 1);
    assert.deepEqual((await request('/provider/employees', 'GET', b.token)).data, []);
    for (const method of ['GET', 'PUT', 'DELETE']) assert.equal((await request(`/provider/employees/${id}`, method, b.token, method === 'GET' ? undefined : { ...draft, revision: 1 })).status, 404);
    assert.equal((await request('/provider/employees/not-a-uuid', 'GET', a.token)).status, 400);
    const competing = await Promise.all(['First', 'Second'].map(name => request(`/provider/employees/${id}`, 'PUT', a.token, { ...draft, name, revision: 1 })));
    assert.deepEqual(competing.map(result => result.status).sort(), [200, 409]);
    const saved = (await request(`/provider/employees/${id}`, 'GET', a.token)).data;
    assert.equal(saved.revision, 2); assert.equal(saved.schedule[0].start, '08:15');
    // Independent SQL connection proves the HTTP mutation committed to PostgreSQL.
    const persisted = (await db.query('SELECT name, revision, schedule FROM provider_employees WHERE id=$1', [id])).rows[0];
    assert.equal(persisted.name, saved.name); assert.equal(persisted.revision, 2); assert.equal(persisted.schedule[0].end, '16:45');
    const jobDraft = { clientId: client.data.id, offerId: offer.data.id, employeeId: id, date: '2020-01-06', startMinute: 540, durationMinutes: 90, priceMinor: 14990, notes: '', status: 'scheduled' };
    assert.equal((await request('/provider/jobs')).status, 401);
    const parallelJobs = await Promise.all([1, 2].map(() => request('/provider/jobs', 'POST', a.token, jobDraft)));
    assert.deepEqual(parallelJobs.map(result => result.status).sort(), [201, 400]);
    const job = parallelJobs.find(result => result.status === 201).data;
    assert.deepEqual((await request('/provider/jobs', 'GET', b.token)).data, []);
    assert.equal((await request(`/provider/jobs/${job.id}`, 'GET', b.token)).status, 404);
    assert.equal((await request(`/provider/jobs/${job.id}`, 'PUT', b.token, { ...jobDraft, revision: 1 })).status, 404);
    const parallelJobEdits = await Promise.all(['First', 'Second'].map(notes => request(`/provider/jobs/${job.id}`, 'PUT', a.token, { ...jobDraft, notes, revision: 1 })));
    assert.deepEqual(parallelJobEdits.map(result => result.status).sort(), [200, 409]);
    const sqlJob = (await db.query('SELECT client_name, price_minor, revision FROM provider_jobs WHERE id=$1', [job.id])).rows[0];
    assert.equal(sqlJob.client_name, job.clientName); assert.equal(sqlJob.price_minor, 14990); assert.equal(sqlJob.revision, 2);
    assert.equal((await request(`/provider/jobs/${job.id}`, 'PUT', a.token, { ...jobDraft, status: 'cancelled', revision: 2 })).status, 200);
    const replacementJob = await request('/provider/jobs', 'POST', a.token, jobDraft);
    assert.equal(replacementJob.status, 201);
    assert.equal((await request(`/provider/jobs/${job.id}`, 'PUT', a.token, { ...jobDraft, revision: 3 })).status, 400);
    assert.equal((await request(`/provider/jobs/${replacementJob.data.id}`, 'PUT', a.token, { ...jobDraft, date: '2099-12-31', status: 'completed', revision: 1 })).status, 400);
    assert.equal((await request(`/provider/jobs/${replacementJob.data.id}`, 'PUT', a.token, { ...jobDraft, status: 'completed', revision: 1 })).status, 200);
    const accountId = (await db.query('SELECT account_id FROM provider_memberships WHERE user_id=$1', [a.user.id])).rows[0].account_id;
    const multiOrderId = randomUUID();
    const sessions = [
      { date: '2098-10-10', startMinute: 540, durationMinutes: 60, employeeId: null },
      { date: '2098-10-11', startMinute: 600, durationMinutes: 75, employeeId: null },
      { date: '2098-10-12', startMinute: 660, durationMinutes: 90, employeeId: null }
    ];
    await db.query(`INSERT INTO provider_multi_orders (id, account_id, client_id, offer_id, client_name, service_title, service_detail, start_date, end_date, area_square_meters, add_on_count, total_price_minor, external, status, sessions, notes, revision)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending',$14::jsonb,$15,1)`, [multiOrderId, accountId, client.data.id, offer.data.id, client.data.name, offer.data.title, 'Pakiet testowy', sessions[0].date, sessions.at(-1).date, 80, 2, 10001, false, JSON.stringify(sessions), 'Test akceptacji']);
    assert.equal((await request('/provider/multi-orders')).status, 401);
    assert.deepEqual((await request('/provider/multi-orders', 'GET', b.token)).data, []);
    const multiOrders = await request('/provider/multi-orders', 'GET', a.token);
    assert.equal(multiOrders.status, 200); assert.equal(multiOrders.data.length, 1); assert.equal(multiOrders.data[0].sessions.length, 3);
    const accepted = await request(`/provider/multi-orders/${multiOrderId}/action`, 'PUT', a.token, { action: 'accept', revision: 1 });
    assert.equal(accepted.status, 200); assert.equal(accepted.data.status, 'accepted'); assert.equal(accepted.data.revision, 2);
    assert.equal((await request(`/provider/multi-orders/${multiOrderId}/action`, 'PUT', a.token, { action: 'accept', revision: 1 })).status, 409);
    const sessionRows = (await db.query('SELECT session_index, session_count, price_minor FROM provider_jobs WHERE multi_order_id=$1 ORDER BY session_index', [multiOrderId])).rows;
    assert.equal(sessionRows.length, 3); assert.equal(sessionRows.reduce((sum, row) => sum + row.price_minor, 0), 10001); assert.deepEqual(sessionRows.map(row => row.session_index), [1, 2, 3]);
    const exportData = (await request('/provider/settings/export', 'GET', a.token)).data;
    assert.equal(exportData.employees.length, 1); assert.equal(exportData.account.contactEmail, 'contact@example.test');
    assert.equal(JSON.stringify(exportData).includes('passwordHash'), false);
    assert.equal((await request('/provider/settings/export', 'GET', b.token)).data.employees.length, 0);
    await db.query("UPDATE provider_memberships SET role='employee' WHERE user_id=$1", [a.user.id]);
    assert.equal((await request('/provider/employees', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/clients', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/services', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/jobs', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/jobs', 'POST', a.token, jobDraft)).status, 403);
    assert.equal((await request('/provider/multi-orders', 'GET', a.token)).status, 403);
    assert.equal((await request(`/provider/multi-orders/${multiOrderId}/action`, 'PUT', a.token, { action: 'reject', revision: 2 })).status, 403);
    assert.equal((await request('/provider/settings/location', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/settings/location', 'PUT', a.token, { ...location, revision: 2 })).status, 403);
    assert.equal((await request(`/provider/clients/${client.data.id}`, 'PUT', a.token, { ...clientDraft, revision: 2 })).status, 403);
    assert.equal((await request('/provider/settings/profile', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/settings/export', 'GET', a.token)).status, 403);
    assert.equal((await request('/provider/settings/notifications', 'PUT', a.token, notifications)).status, 403);
    assert.equal((await request(`/provider/employees/${id}`, 'DELETE', a.token, { revision: 2 })).status, 403);
    await db.query("UPDATE provider_memberships SET role='owner' WHERE user_id=$1", [a.user.id]);
    assert.equal((await request(`/provider/employees/${id}`, 'DELETE', a.token, { revision: 1 })).status, 409);
    assert.equal((await request(`/provider/employees/${id}`, 'DELETE', a.token, { revision: 2 })).status, 200);
    assert.equal((await db.query('SELECT count(*) FROM provider_employees')).rows[0].count, '0');
    assert.equal((await db.query('SELECT employee_id FROM provider_jobs WHERE id=$1', [job.id])).rows[0].employee_id, null);
    const newPassword = `new test only ${randomUUID()}`;
    assert.equal((await request('/provider/settings/password', 'POST', a.token, { currentPassword: 'wrong password', newPassword, confirmPassword: newPassword })).status, 400);
    const rotated = await request('/provider/settings/password', 'POST', a.token, { currentPassword: a.testPassword, newPassword, confirmPassword: newPassword });
    assert.equal(rotated.status, 201); assert.ok(rotated.data.token);
    assert.equal((await request('/provider/me', 'GET', a.token)).status, 401);
    a.token = rotated.data.token;
    assert.equal((await request('/provider/me', 'GET', a.token)).status, 200);
    await request('/auth/logout', 'POST', a.token, {});
    assert.equal((await request('/provider/me', 'GET', a.token)).status, 401);
    console.log('PASS: additive migrations, real auth, concurrent onboarding, ownership/roles, validation, competing edits, PostgreSQL persistence, settings, export, password rotation, delete and logout.');
  } finally {
    if (app) await app.close();
    if (source?.isInitialized) await source.destroy();
    if (created) { await db.query('ROLLBACK'); await db.query('RESET search_path'); await db.query(`DROP SCHEMA "${schema}" CASCADE`); }
    await db.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });



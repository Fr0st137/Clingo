const assert = require('node:assert/strict');
const { randomUUID, createHash, scryptSync } = require('node:crypto');
const { Client } = require('pg');
const sharp = require('sharp');
const base = process.env.CLINGO_TEST_API || 'http://localhost:4000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local test API required.');
const run = randomUUID();
const emails = [1, 2, 3].map(n => `account-${run}-${n}@example.test`);
const providerId = `account-test-${run}`;
const password = `Test account ${run}`;
const newPassword = `  New password ${run}  `;
const db = new Client({ host: process.env.POSTGRES_HOST || '127.0.0.1', port: Number(process.env.POSTGRES_PORT || 55432), database: process.env.POSTGRES_DB || 'clingo', user: process.env.POSTGRES_USER || 'clingo', password: process.env.POSTGRES_PASSWORD || 'clingo' });
const accounts = [];
async function request(path, body, token, method = 'GET') {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(method !== 'GET' ? { body: JSON.stringify(body ?? {}) } : {}) });
  return { status: response.status, data: await response.json() };
}
async function expect(path, method, body, token, status) {
  const result = await request(path, body, token, method);
  assert.equal(result.status, status, `${method} ${path}: ${result.status} (${result.data.message || ''})`);
  return result.data;
}
async function main() {
  await db.connect();
  try {
    await db.query(`INSERT INTO provider_profiles SELECT * FROM jsonb_populate_record(NULL::provider_profiles,
      (SELECT to_jsonb(p) || jsonb_build_object('id', $1::text, 'provider', 'Wykonawca testowy') FROM provider_profiles p WHERE id='paulina-jagielska'))`, [providerId]);
    for (const email of emails) accounts.push(await expect('/auth/register', 'POST', { email, password, firstName: 'Anna', lastName: 'Testowa' }, null, 201));
    let token = accounts[0].token;
    const other = accounts[1].token;
    for (const path of ['/auth/profile', '/dashboard/settings', '/dashboard/favorites', '/dashboard/reviews/opinions']) await expect(path, 'GET', null, null, 401);
    await expect('/auth/profile?email=' + encodeURIComponent(emails[0]), 'PATCH', { firstName: 'Attacker' }, null, 401);
    await expect('/auth/profile?email=' + encodeURIComponent(emails[1]), 'PATCH', { firstName: 'Zmieniona', phone: '+48 500 111 222' }, token, 200);
    await expect('/auth/profile', 'PATCH', { street: 'Testowa 10', apartment: '7', city: 'Warszawa', postalCode: '00-001', companyName: 'Firma testowa' }, token, 200);
    const profile = await expect('/auth/profile?email=' + encodeURIComponent(emails[1]), 'GET', null, token, 200);
    assert.equal(profile.user.email, emails[0]); assert.equal(profile.user.firstName, 'Zmieniona'); assert.equal(profile.user.street, 'Testowa 10');
    assert.equal((await expect('/auth/profile', 'GET', null, other, 200)).user.firstName, 'Anna');
    assert.ok(!JSON.stringify(profile).includes('password'));
    for (const body of [{ email: emails[1] }, { passwordHash: 'raw' }, { firstName: {} }, { postalCode: '123' }, { phone: 'abc' }]) await expect('/auth/profile', 'PATCH', body, token, 400);
    await expect('/auth/notifications', 'PATCH', { email: false, sms: true }, token, 200);
    const settings = await expect('/dashboard/settings', 'GET', null, token, 200);
    assert.deepEqual(settings.notifications.map(item => item.enabled), [false, true]);
    assert.ok(settings.sections.find(item => item.id === 'password').fields.every(field => field.value === ''));
    const saved = (await db.query('SELECT password_hash, password_salt, notification_preferences, street FROM users WHERE email=$1', [emails[0]])).rows[0];
    assert.match(saved.password_hash, /^scrypt\$131072\$8\$1\$/); assert.notEqual(saved.password_hash, password);
    assert.deepEqual(saved.notification_preferences, { email: false, sms: true }); assert.equal(saved.street, 'Testowa 10');
    assert.notEqual(saved.password_salt, (await db.query('SELECT password_salt FROM users WHERE email=$1', [emails[1]])).rows[0].password_salt);
    console.log('PASS: authenticated settings, persisted profile/preferences, validation and account isolation.');

    const secondSession = (await expect('/auth/login', 'POST', { email: emails[0], password }, null, 201)).token;
    await expect('/auth/password', 'POST', { currentPassword: 'incorrect', newPassword, confirmPassword: newPassword }, token, 400);
    await expect('/auth/password', 'POST', { currentPassword: password, newPassword: 'short', confirmPassword: 'short' }, token, 400);
    await expect('/auth/password', 'POST', { currentPassword: password, newPassword, confirmPassword: 'mismatch' }, token, 400);
    const changed = await expect('/auth/password', 'POST', { currentPassword: password, newPassword, confirmPassword: newPassword }, token, 201);
    await expect('/auth/profile', 'GET', null, token, 401);
    await expect('/auth/profile', 'GET', null, secondSession, 401);
    token = changed.token;
    await expect('/auth/profile', 'GET', null, token, 200);
    await expect('/auth/login', 'POST', { email: emails[0], password }, null, 401);
    await expect('/auth/login', 'POST', { email: emails[0], password: newPassword.trim() }, null, 401);
    const fresh = await expect('/auth/login', 'POST', { email: emails[0], password: newPassword }, null, 201);
    await expect('/auth/logout', 'POST', {}, fresh.token, 201);
    await expect('/auth/profile', 'GET', null, fresh.token, 401);
    const salt = 'b'.repeat(32);
    await db.query('UPDATE users SET password_hash=$2,password_salt=$3 WHERE email=$1', [emails[2], scryptSync(password, salt, 64).toString('hex'), salt]);
    await expect('/auth/login', 'POST', { email: emails[2], password }, null, 201);
    assert.match((await db.query('SELECT password_hash FROM users WHERE email=$1', [emails[2]])).rows[0].password_hash, /^scrypt\$/);
    const concurrentPassword = `Concurrent change ${run}`;
    const rotations = await Promise.all([1, 2].map(() => request('/auth/password', { currentPassword: password, newPassword: concurrentPassword, confirmPassword: concurrentPassword }, accounts[2].token, 'POST')));
    assert.deepEqual(rotations.map(result => result.status).sort(), [201, 401], 'Only one simultaneous password rotation can use the old session');
    await expect('/auth/profile', 'GET', null, rotations.find(result => result.status === 201).data.token, 200);
    console.log('PASS: scrypt hashing, salt rotation, old-password rejection, whitespace preservation, session revocation/logout and legacy upgrade.');

    assert.deepEqual(await expect('/dashboard/favorites', 'GET', null, token, 200), []);
    const favoritePath = `/dashboard/favorites/${providerId}`;
    await Promise.all([expect(favoritePath, 'PUT', {}, token, 200), expect(favoritePath, 'PUT', {}, token, 200)]);
    assert.equal((await expect('/dashboard/favorites', 'GET', null, token, 200)).length, 1);
    assert.deepEqual(await expect('/dashboard/favorites', 'GET', null, other, 200), []);
    await expect(favoritePath, 'DELETE', {}, other, 200);
    assert.equal((await expect('/dashboard/favorites', 'GET', null, token, 200)).length, 1);
    assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM customer_favorites WHERE user_id=$1', [accounts[0].user.id])).rows[0].count, 1);
    await expect('/dashboard/favorites/missing-provider', 'PUT', {}, token, 404);
    await expect(favoritePath, 'DELETE', {}, token, 200);
    assert.deepEqual(await expect('/dashboard/favorites', 'GET', null, token, 200), []);
    console.log('PASS: persistent account-scoped favorites, concurrent deduplication, removal and invalid provider rejection.');

    const orders = [];
    for (const status of ['Wykonane zlecenie', 'Oczekujące', 'Odwołane zlecenie']) {
      const row = await db.query(`INSERT INTO orders (user_email,provider_id,provider,status,mode,"serviceType",address,"startsAt","endsAt") VALUES ($1,$2,'Wykonawca testowy',$3,'Jednosesyjne','Sprzątanie','Warszawa, Testowa 1',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day') RETURNING id`, [emails[0], providerId, status]);
      orders.push(row.rows[0].id);
    }
    const opinions = await expect('/dashboard/reviews/opinions', 'GET', null, token, 200);
    assert.deepEqual(opinions.pendingReviews.map(item => item.id), [orders[0]]);
    assert.deepEqual((await expect('/dashboard/reviews/opinions', 'GET', null, other, 200)).pendingReviews, []);
    const reviewPath = `/dashboard/reviews/${orders[0]}`;
    const input = { rating: 5, content: 'Rzetelna usługa testowa', images: [] };
    await expect(reviewPath, 'PUT', input, null, 401);
    await expect(reviewPath, 'PUT', input, other, 404);
    for (const id of orders.slice(1)) await expect(`/dashboard/reviews/${id}`, 'PUT', input, token, 400);
    for (const rating of [0, 6, 1.5, '5']) await expect(reviewPath, 'PUT', { ...input, rating }, token, 400);
    await expect(reviewPath, 'PUT', { ...input, content: 'x'.repeat(1001) }, token, 400);
    await expect(reviewPath, 'PUT', { ...input, images: [{ dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }] }, token, 400);
    await expect(reviewPath, 'PUT', { ...input, images: [{ dataUrl: 'data:image/png;base64,bm90LWEtcG5n' }] }, token, 400);
    const png = await sharp({ create: { width: 30, height: 20, channels: 3, background: '#0079de' } }).withMetadata().png().toBuffer();
    const withPhoto = { ...input, images: [{ dataUrl: `data:image/png;base64,${png.toString('base64')}` }] };
    const review = await expect(reviewPath, 'PUT', withPhoto, token, 200);
    assert.equal(review.images.length, 1);
    const bytes = await fetch(`${base}/dashboard/review-images/${review.images[0].id}`);
    assert.equal(bytes.status, 200); assert.match(bytes.headers.get('content-type'), /image\/webp/);
    const meta = await sharp(Buffer.from(await bytes.arrayBuffer())).metadata();
    assert.equal(meta.format, 'webp'); assert.equal(meta.exif, undefined); assert.equal(meta.icc, undefined);
    const publicProfile = await expect(`/dashboard/provider-profiles/${providerId}`, 'GET', null, null, 200);
    assert.equal(publicProfile.reviews[0].content, input.content); assert.equal(publicProfile.reviews[0].author, 'Zmieniona T.');
    assert.ok(!JSON.stringify(publicProfile).includes(emails[0]));
    await expect(`/dashboard/reviews/${orders[0]}`, 'DELETE', {}, other, 404);
    const otherOrder = (await db.query(`INSERT INTO orders (user_email,provider_id,provider,status,mode,"serviceType",address) VALUES ($1,$2,'Wykonawca testowy','Wykonane zlecenie','Jednosesyjne','Sprzątanie','Warszawa') RETURNING id`, [emails[1], providerId])).rows[0].id;
    await expect(`/dashboard/reviews/${otherOrder}`, 'PUT', { ...input, images: [{ id: review.images[0].id }] }, other, 400);
    await Promise.all([expect(reviewPath, 'PUT', { ...input, rating: 4 }, token, 200), expect(reviewPath, 'PUT', { ...input, rating: 3 }, token, 200)]);
    assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM customer_reviews WHERE order_id=$1', [orders[0]])).rows[0].count, 1);
    assert.equal((await fetch(`${base}/dashboard/review-images/${review.images[0].id}`)).status, 404);
    await expect(reviewPath, 'DELETE', {}, token, 200);
    assert.equal((await expect('/dashboard/reviews/opinions', 'GET', null, token, 200)).pendingReviews.length, 1);
    console.log('PASS: verified-order reviews, ownership, validation, concurrent uniqueness, public display, safe photo storage/removal and deletion.');

    // Exercise the durable limiter without many expensive password hashes.
    for (let n = 0; n < 20; n++) await expect('/auth/lookup', 'POST', { email: emails[2] }, null, 201);
    await expect('/auth/lookup', 'POST', { email: emails[2] }, null, 429);
    console.log('PASS: database-backed rate limit. All account integration checks passed.');
  } finally {
    await db.query('DELETE FROM orders WHERE provider_id=$1', [providerId]);
    await db.query('DELETE FROM auth_sessions WHERE email=ANY($1)', [emails]);
    const keys = emails.flatMap(email => ['lookup-email', 'register-email', 'login-email', 'password-change'].map(scope => createHash('sha256').update(`${scope}:${email}`).digest('hex')));
    keys.push(...accounts.map(account => createHash('sha256').update(`review-save:${account.user.id}`).digest('hex')));
    await db.query('DELETE FROM auth_rate_limits WHERE key=ANY($1)', [keys]);
    await db.query('DELETE FROM users WHERE email=ANY($1)', [emails]);
    await db.query('DELETE FROM provider_profiles WHERE id=$1', [providerId]);
    await db.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

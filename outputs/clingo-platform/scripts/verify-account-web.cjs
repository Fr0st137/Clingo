const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { Client } = require('pg');
const base = process.env.CLINGO_TEST_WEB || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local web test only.');
const email = `web-account-${randomUUID()}@example.test`;
const password = `Local account password ${randomUUID()}`;
const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
let cookie = '';
async function req(path, method = 'GET', body, origin = base, session = cookie) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}), ...(session ? { Cookie: session } : {}) }, ...(method !== 'GET' ? { body: JSON.stringify(body ?? {}) } : {}) });
  const data = await response.json();
  return { response, data };
}
async function main() {
  await db.connect();
  try {
    assert.equal((await req('/api/auth/register', 'POST', { email, password }, 'https://other.test')).response.status, 403);
    assert.equal((await req('/api/auth/register', 'POST', { email, password }, null)).response.status, 403);
    const registered = await req('/api/auth/register', 'POST', { email, password });
    assert.equal(registered.response.status, 201); assert.equal(registered.data.token, undefined);
    const setCookie = registered.response.headers.getSetCookie().find(value => value.startsWith('clingo-session='));
    assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /SameSite=lax/i);
    cookie = setCookie.split(';')[0];
    assert.equal((await req('/api/account/profile')).data.user.email, email);
    assert.equal((await req('/api/account/profile', 'PATCH', { firstName: 'Test' }, 'https://other.test')).response.status, 403);
    assert.equal((await req('/api/account/profile', 'PATCH', { firstName: 'Test' }, null)).response.status, 403);
    assert.equal((await req('/api/account/profile', 'PATCH', { firstName: 'Test' })).response.status, 200);
    assert.equal((await req('/api/account/profile')).data.user.firstName, 'Test');
    assert.deepEqual((await req('/api/account/favorites')).data, []);
    const changed = await req('/api/account/password', 'POST', { currentPassword: password, newPassword: password + ' new', confirmPassword: password + ' new' });
    assert.equal(changed.response.status, 201); assert.equal(changed.data.token, undefined);
    assert.equal((await req('/api/account/profile')).response.status, 401);
    cookie = changed.response.headers.getSetCookie().find(value => value.startsWith('clingo-session=')).split(';')[0];
    assert.equal((await req('/api/account/profile')).response.status, 200);
    const logout = await req('/api/auth/logout', 'POST', {});
    assert.equal(logout.response.status, 201);
    assert.match(logout.response.headers.getSetCookie().find(value => value.startsWith('clingo-session=')), /Max-Age=0/);
    assert.equal((await req('/api/account/profile')).response.status, 401);
    console.log('PASS: same-origin CSRF checks, HttpOnly session cookies, profile/favorites proxy, password rotation and server logout.');
  } finally {
    await db.query('DELETE FROM auth_sessions WHERE email=$1', [email]);
    await db.query('DELETE FROM users WHERE email=$1', [email]);
    await db.query('DELETE FROM auth_rate_limits WHERE key=ANY($1)', [['register-email', 'password-change'].map(scope => createHash('sha256').update(`${scope}:${email}`).digest('hex'))]);
    await db.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

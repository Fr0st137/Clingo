const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const route = { exports: {} };
new Function('module', 'exports', 'require', ts.transpileModule(readFileSync(resolve(__dirname, '../apps/provider/app/api/provider/[...path]/route.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText)(route, route.exports, require);

function call(path, method = 'GET', options = {}) {
  const request = new NextRequest(`http://panel.test/api/provider/${path}`, { method,
    headers: { origin: 'http://panel.test', 'content-type': 'application/json', ...(options.token ? { cookie: `clingo-provider-session=${options.token}` } : {}), ...options.headers },
    ...(method !== 'GET' ? { body: options.body ?? '{}' } : {}) });
  return route.exports[method](request, { params: Promise.resolve({ path: path.split('/') }) });
}
test('proxy requires provider cookie and denies arbitrary upstream routes', async () => {
  assert.equal((await call('employees')).status, 401);
  assert.equal((await call('../auth/profile')).status, 404);
  assert.equal((await call('account', 'DELETE', { token: 'session' })).status, 404);
  assert.equal((await call('services')).status, 401);
  assert.equal((await call('jobs')).status, 401);
  assert.equal((await call('multi-orders')).status, 401);
  assert.equal((await call('settings/location')).status, 401);
  assert.equal((await call('services', 'DELETE', { token: 'session' })).status, 404);
});

test('service and location writes forward only to their allowed provider endpoints', async t => {
  let observed;
  t.mock.method(global, 'fetch', async (url, init) => { observed = { url, init }; return Response.json({ revision: 2 }); });
  for (const path of ['services/11111111-1111-4111-8111-111111111111', 'jobs/11111111-1111-4111-8111-111111111111', 'multi-orders/11111111-1111-4111-8111-111111111111/action', 'settings/location']) {
    assert.equal((await call(path, 'PUT', { token: 'session', body: JSON.stringify({ revision: 1 }) })).status, 200);
    assert.ok(observed.url.endsWith(`/provider/${path}`)); assert.equal(observed.init.headers.Authorization, 'Bearer session');
    assert.equal((await call(path, 'PUT', { token: 'session', headers: { origin: 'https://foreign.test' } })).status, 403);
  }
});

test('client proxy permits authenticated reads and edits but rejects unsupported operations', async t => {
  const id = '11111111-1111-4111-8111-111111111111';
  for (const path of ['clients', `clients/${id}`]) assert.equal((await call(path)).status, 401);
  assert.equal((await call(`clients/${id}`, 'DELETE', { token: 'session' })).status, 404);
  assert.equal((await call('clients/invalid', 'GET', { token: 'session' })).status, 404);
  let observed;
  t.mock.method(global, 'fetch', async (url, init) => { observed = { url, init }; return Response.json({ id, revision: 2 }); });
  const response = await call(`clients/${id}`, 'PUT', { token: 'session', body: JSON.stringify({ name: 'Klient', revision: 1 }) });
  assert.equal(response.status, 200); assert.ok(observed.url.endsWith(`/provider/clients/${id}`));
  assert.equal(observed.init.headers.Authorization, 'Bearer session');
  assert.equal(JSON.parse(observed.init.body).revision, 1);
});
test('writes reject foreign or missing Origin, cross-site requests and invalid payloads', async () => {
  for (const headers of [{ origin: 'https://foreign.test' }, { origin: '' }, { 'sec-fetch-site': 'cross-site' }]) assert.equal((await call('auth/login', 'POST', { headers })).status, 403);
  assert.equal((await call('auth/login', 'POST', { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await call('auth/login', 'POST', { body: '{' })).status, 400);
  assert.equal((await call('auth/login', 'POST', { body: JSON.stringify({ value: 'a'.repeat(17000) }) })).status, 413);
});
test('login sets a separate HttpOnly cookie and never exposes the token in JSON', async t => {
  t.mock.method(global, 'fetch', async () => Response.json({ token: 'a'.repeat(64), user: { email: 'qa@example.test' } }));
  const response = await call('auth/login', 'POST');
  assert.equal(response.status, 200); assert.equal((await response.json()).token, undefined);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /clingo-provider-session=/); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
test('proxy forwards only the provider session, path and validated body', async t => {
  let observed;
  t.mock.method(global, 'fetch', async (url, init) => { observed = { url, init }; return Response.json([]); });
  const response = await call('employees', 'GET', { token: 'provider-token', headers: { authorization: 'Bearer forged', cookie: 'clingo-session=customer; clingo-provider-session=provider-token' } });
  assert.deepEqual(await response.json(), []);
  assert.ok(observed.url.endsWith('/provider/employees'));
  assert.equal(observed.init.headers.Authorization, 'Bearer provider-token');
  assert.equal(observed.init.cache, 'no-store');
});
test('expired sessions clear the cookie; service outages return an explicit error', async t => {
  const mock = t.mock.method(global, 'fetch', async () => Response.json({ message: 'Sesja wygasła.' }, { status: 401 }));
  const expired = await call('me', 'GET', { token: 'expired' });
  assert.equal(expired.status, 401); assert.match(expired.headers.get('set-cookie'), /Max-Age=0/);
  mock.mock.mockImplementation(async () => { throw new Error('offline'); });
  assert.equal((await call('employees', 'GET', { token: 'valid' })).status, 503);
});

test('settings routes are authenticated and password rotation replaces the HttpOnly cookie', async t => {
  for (const path of ['settings/profile', 'settings/notifications', 'settings/export']) assert.equal((await call(path)).status, 401);
  assert.equal((await call('settings/password', 'GET', { token: 'session' })).status, 404);
  assert.equal((await call('settings/profile', 'DELETE', { token: 'session' })).status, 404);
  let observed;
  t.mock.method(global, 'fetch', async (url, init) => { observed = { url, init }; return Response.json({ token: 'rotated-token', message: 'Zmieniono hasło.' }); });
  const response = await call('settings/password', 'POST', { token: 'old-token', body: JSON.stringify({ currentPassword: 'current', newPassword: 'new long password', confirmPassword: 'new long password' }) });
  assert.ok(observed.url.endsWith('/provider/settings/password'));
  assert.equal(observed.init.headers.Authorization, 'Bearer old-token');
  assert.equal((await response.json()).token, undefined);
  assert.match(response.headers.get('set-cookie'), /clingo-provider-session=rotated-token/);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
});

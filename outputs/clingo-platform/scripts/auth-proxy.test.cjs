const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript'), { NextRequest } = require('next/server');
const moduleProxy = { exports: {} };
new Function('module', 'exports', 'require', ts.transpileModule(fs.readFileSync('apps/web/lib/account-proxy.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(moduleProxy, moduleProxy.exports, require);
const call = (path, body = {}, cookie = '') => moduleProxy.exports.proxyAccount(new NextRequest('http://clingo.test/api' + path, { method: 'POST', headers: { origin: 'http://clingo.test', 'content-type': 'application/json', cookie }, body: JSON.stringify(body) }), path, false);
test('K07: pending registration creates only an HttpOnly activation credential and hides it from JavaScript', async t => {
  t.mock.method(global, 'fetch', async () => Response.json({ verificationRequired: true, verificationToken: 'a'.repeat(64), email: 'test@example.test', expiresAt: '2026-11-06T10:00:00Z', resendAt: '2026-11-06T09:51:00Z' }, { status: 201 }));
  const response = await call('/auth/register'), data = await response.json(), cookies = response.headers.getSetCookie();
  assert.equal(data.verificationRequired, true); assert.equal(data.verificationToken, undefined); assert.equal(data.token, undefined);
  assert.match(cookies.find(value => value.startsWith('clingo-verification=')), /HttpOnly/);
  assert.match(cookies.find(value => value.startsWith('clingo-session=')), /Max-Age=0/);
});
test('K07: verification requires its cookie and ignores a forged credential in the JSON body', async t => {
  assert.equal((await call('/auth/verify-email', { verificationToken: 'forged', code: '1234' })).status, 401);
  let forwarded;
  t.mock.method(global, 'fetch', async (_url, init) => { forwarded = JSON.parse(init.body); return Response.json({ user: { email: 'test@example.test' }, token: 'b'.repeat(64) }, { status: 201 }); });
  const response = await call('/auth/verify-email', { verificationToken: 'forged', code: '1234' }, 'clingo-verification=' + 'a'.repeat(64));
  assert.equal(forwarded.verificationToken, 'a'.repeat(64)); assert.equal((await response.json()).token, undefined);
  assert.match(response.headers.getSetCookie().find(value => value.startsWith('clingo-session=')), /HttpOnly/);
  assert.match(response.headers.getSetCookie().find(value => value.startsWith('clingo-verification=')), /Max-Age=0/);
});

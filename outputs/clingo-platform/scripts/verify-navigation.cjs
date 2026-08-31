const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { Client } = require('pg');

const web = process.env.CLINGO_TEST_WEB || 'http://localhost:3000';
const api = process.env.CLINGO_TEST_API || 'http://localhost:4000';
for (const base of [web, api]) {
  if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local verification only.');
}
const email = `navigation-${randomUUID()}@example.test`;
const db = new Client({ host: process.env.POSTGRES_HOST || '127.0.0.1', port: Number(process.env.POSTGRES_PORT || 55432),
  database: process.env.POSTGRES_DB || 'clingo', user: process.env.POSTGRES_USER || 'clingo', password: process.env.POSTGRES_PASSWORD || 'clingo' });

async function main() {
  await db.connect();
  try {
    const registration = await fetch(`${api}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: `LocalTest-${randomUUID()}`, firstName: 'Test', lastName: 'Nawigacji' }), signal: AbortSignal.timeout(10_000) });
    assert.equal(registration.status, 201);
    const { token } = await registration.json();
    const cookie = `clingo-auth=1; clingo-session=${token}; clingo-user-email=${encodeURIComponent(email)}`;
    const routes = ['/home', '/tablica-ogloszen', '/profil-ogloszeniowy/paulina-jagielska', '/wykonawcy/paulina-jagielska',
      '/logowanie', '/zamowienia', '/ulubione', '/chat', '/opinie', '/ustawienia', '/standardy-uslug', '/regulaminy',
      '/zamowienie?provider=paulina-jagielska&pricing=single-62&area=62&address=Warszawa%2C%20Testowa%201'];
    const report = [];
    for (const path of routes) {
      const times = [];
      for (let visit = 0; visit < 3; visit++) {
        const started = performance.now();
        const response = await fetch(`${web}${path}`, { headers: { Cookie: cookie }, redirect: 'manual', signal: AbortSignal.timeout(20_000) });
        const body = await response.text();
        assert.equal(response.status, 200, path);
        assert.ok(!body.includes('Internal Server Error') && !body.includes('NEXT_HTTP_ERROR_FALLBACK;500'), path);
        if (path === '/zamowienia') assert.ok(body.includes('Test Nawigacji'), 'The response must belong to the test account');
        if (path.startsWith('/zamowienie?')) assert.ok(body.includes('Wybierz termin'), 'Checkout must render its calendar');
        times.push(Math.round(performance.now() - started));
      }
      report.push({ route: path.split('?')[0], firstMs: times[0], warmMs: Math.round((times[1] + times[2]) / 2) });
    }
    const anonymous = await fetch(`${web}/zamowienia`, { redirect: 'manual' });
    assert.equal(anonymous.status, 307);
    assert.ok(anonymous.headers.get('location').includes('/logowanie'));
    console.table(report);
    console.log('PASS: public and private pages, current account, checkout, anonymous redirect. Timings include complete HTML, not browser rendering.');
  } finally {
    await db.query('DELETE FROM auth_sessions WHERE email = $1', [email]);
    await db.query('DELETE FROM users WHERE email = $1', [email]);
    await db.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

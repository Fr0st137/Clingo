const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const apiRequire = createRequire(resolve(__dirname, '../apps/api/package.json'));
const { Client } = apiRequire('pg');
const { ProviderAbsencesService } = require('../apps/api/dist/provider/provider-absences.service');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
  await db.connect();
  let browser;
  try {
    await db.query('BEGIN');
    const target = (await db.query('SELECT u.id,a.id account_id FROM users u JOIN provider_memberships m ON m.user_id=u.id JOIN provider_accounts a ON a.id=m.account_id WHERE u.email=$1 AND a.name=$2', ['kounterstrike6@gmail.com', 'testFirma'])).rows;
    assert.equal(target.length, 1);
    const repository = { findOneBy: async ({ userId }) => (await db.query('SELECT account_id "accountId",role FROM provider_memberships WHERE user_id=$1', [userId])).rows[0], query: async (sql, params) => (await db.query(sql, params)).rows };
    const service = new ProviderAbsencesService({ sessionUser: async token => { if (token !== 'test-only') throw Error('Unauthorized'); return { id: target[0].id }; } }, repository);
    await assert.rejects(service.list('invalid'), /Unauthorized/);
    const outsider = new ProviderAbsencesService({ sessionUser: async () => ({ id: target[0].id }) }, { ...repository, findOneBy: async () => ({ accountId: '00000000-0000-4000-8000-000000000000', role: 'owner' }) });
    assert.deepEqual(await outsider.list('test-only'), []);
    const data = await service.list('test-only');
    assert.equal(data.length, 8);
    assert.equal(data.filter(row => row.status === 'ongoing').length, 1);
    assert.equal(data.filter(row => row.status === 'upcoming').length, 4);
    assert.equal(data.filter(row => row.status === 'completed').length, 3);
    assert(data.every(row => row.employees.length && !row.employees.some(name => name === 'undefined')));
    await assert.rejects(outsider.cancel('test-only', data[0].id, { cancelled: true, revision: data[0].revision }), error => error.getStatus() === 404);
    await assert.rejects(service.cancel('test-only', data[0].id, { cancelled: 'yes', revision: 1 }), error => error.getStatus() === 400);
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1920, height: 915 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/provider/**', async route => {
      const request = route.request(), path = new URL(request.url()).pathname;
      if (path.endsWith('/absences')) return route.fulfill({ json: await service.list('test-only') });
      if (/\/absences\/[a-f0-9-]{36}$/.test(path)) return route.fulfill({ json: await service.cancel('test-only', path.split('/').pop(), request.postDataJSON()) });
      return route.fulfill({ json: path.endsWith('/me') ? { user: { name: 'Test', email: 'kounterstrike6@gmail.com' }, account: { id: target[0].account_id, name: 'testFirma', role: 'owner' } } : [] });
    });
    async function open(label) {
      await page.getByRole('button', { name: 'Dodaj zdarzenie', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Nieobecność (urlop, choroba)', exact: true }).click();
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.locator('tbody tr').first().waitFor();
    }
    await page.goto('http://127.0.0.1:3108/');
    await open('Zarządzaj aktywnymi nieobecnościami');
    assert.equal(await page.locator('tbody tr').count(), 5);
    await page.screenshot({ path: '../../tmp/testfirma-absences-live.png' });
    await page.locator('.absence-delete').first().click();
    await page.getByRole('button', { name: 'Cofnij usunięcie' }).waitFor();
    assert.equal((await service.list('test-only')).length, 7);
    assert.equal(await page.locator('tbody tr').count(), 4);
    await page.getByRole('button', { name: 'Cofnij usunięcie' }).click();
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 5);
    assert.equal((await service.list('test-only')).length, 8);
    await page.keyboard.press('Escape');
    await open('Historia nieobecności');
    assert.equal(await page.locator('tbody tr').count(), 3);
    assert.equal(await page.locator('.absence-delete').count(), 0);
    await page.screenshot({ path: '../../tmp/testfirma-absence-history-live.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: 8 persisted account-scoped records, 5 active / 3 historical, real SQL cancellation and restore, cross-account rejection, input validation, live data in both screens. All test mutations rolled back.');
  } finally { if (browser) await browser.close(); await db.query('ROLLBACK'); await db.end(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

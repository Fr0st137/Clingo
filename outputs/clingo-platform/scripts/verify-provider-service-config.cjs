const { chromium } = require(process.env.CLINGO_PLAYWRIGHT || 'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const apiRequire = createRequire(resolve(__dirname, '../apps/api/package.json'));
const { Client } = apiRequire('pg');

const base = process.env.CLINGO_TEST_PROVIDER || 'http://localhost:3001';
const email = `service-config-${randomUUID()}@example.test`;
const password = `Service config ${randomUUID()}`;
const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });

(async () => {
  await db.connect();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    async function request(path, method = 'GET', data) {
      const response = await context.request.fetch(`${base}/api/provider/${path}`, { method, data, headers: { Origin: base } });
      assert.ok(response.ok(), `${path}: ${response.status()} ${await response.text()}`);
      return response.json();
    }
    await request('auth/register', 'POST', { email, password });
    await request('account', 'POST', { name: 'Test konfiguracji usług' });
    const offer = await request('services', 'POST', { category: 'homes', title: 'Sprzątanie obiektów', description: 'Zakres usługi', priceMinor: 14990, durationMinutes: 90, status: 'draft' });
    assert.equal(offer.configuration.ratePerSquareMeterMinor, 150);

    await page.goto(`${base}/services`);
    await page.getByRole('link', { name: /^Edytuj usługę: Sprzątanie obiektów/ }).click();
    await page.waitForURL(`${base}/services/${offer.id}`);
    await page.getByLabel('Stawka za metr kwadratowy').fill('2,75');
    await page.getByLabel('Stawka za kilometr').fill('0,80');
    await page.getByRole('switch', { name: 'Wyprzedzenie zamówienia' }).click();
    await page.getByLabel('Czas wykonania w minutach').fill('210');
    await page.getByRole('button', { name: 'Zapisz jako szkic' }).first().click();
    await page.waitForTimeout(1200);
    const feedback = await page.locator('.provider-feedback').allTextContents();
    assert.deepEqual(feedback, [], `Save feedback: ${feedback.join(' | ')}`);
    assert.ok((await page.locator('.offer-config-save-state').allTextContents()).includes('Szkic zapisany'), 'Missing save confirmation');

    await page.reload();
    assert.equal(await page.getByLabel('Stawka za metr kwadratowy').inputValue(), '2,75');
    assert.equal(await page.getByLabel('Stawka za kilometr').inputValue(), '0,80');
    assert.equal(await page.getByRole('switch', { name: 'Wyprzedzenie zamówienia' }).getAttribute('aria-checked'), 'true');
    const sql = (await db.query('SELECT configuration, revision FROM provider_offers WHERE id=$1', [offer.id])).rows[0];
    assert.equal(sql.configuration.ratePerSquareMeterMinor, 275);
    assert.equal(sql.configuration.travelRatePerKmMinor, 80);
    assert.equal(sql.configuration.durationPer100SquareMetersMinutes, 210);
    assert.equal(sql.configuration.leadTimeEnabled, true);
    assert.equal(sql.revision, 2);
    assert.deepEqual(errors, []);
    console.log('PASS: list navigation, configuration save, reload and PostgreSQL JSONB persistence.');
  } finally {
    await browser.close();
    const user = (await db.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
    if (user) {
      const membership = (await db.query('SELECT account_id FROM provider_memberships WHERE user_id=$1', [user.id])).rows[0];
      if (membership) await db.query('DELETE FROM provider_accounts WHERE id=$1', [membership.account_id]);
      await db.query('DELETE FROM auth_sessions WHERE email=$1', [email]);
      await db.query('DELETE FROM users WHERE id=$1', [user.id]);
    }
    await db.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

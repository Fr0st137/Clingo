const { chromium } = require(process.env.CLINGO_PLAYWRIGHT || 'C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { Client } = require('pg');
const { randomUUID } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.CLINGO_TEST_PROVIDER || 'http://localhost:3107';
const output = resolve(__dirname, '../../../tmp');
const email = `services-design-${randomUUID()}@example.test`;
const password = `Services design ${randomUUID()}`;
const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });

(async () => {
  mkdirSync(output, { recursive: true });
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
    await request('account', 'POST', { name: 'Test projektu usług' });
    const offers = [];
    for (const [category, title] of [['homes', 'Sprzątanie obiektów'], ['offices', 'Sprzątanie obiektów'], ['pressure', 'Mycie ciśnieniowe'], ['painting', 'Malowanie pow.']]) offers.push(await request('services', 'POST', { category, title, description: '', priceMinor: 14990, durationMinutes: 90, status: 'draft' }));
    await page.goto(base + '/services');
    await page.getByRole('button', { name: 'Dodaj ogłoszenie', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.service-card').count(), 4);
    assert.equal(await page.locator('.service-status').filter({ hasText: 'Opublikowane' }).count(), 0);
    const panel = page.locator('.services-content');
    await panel.screenshot({ path: resolve(output, 'services-figma-desktop.png') });
    const geometry = await panel.evaluate(element => {
      const panel = element.getBoundingClientRect();
      return { width: panel.width, height: panel.height, cards: [...element.querySelectorAll('.service-card')].map(card => { const box = card.getBoundingClientRect(); return { width: box.width, height: box.height, x: box.x - panel.x, y: box.y - panel.y }; }), images: [...element.querySelectorAll('img')].map(img => { const box = img.getBoundingClientRect(); return { src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0, width: box.width, height: box.height }; }) };
    });
    assert.equal(geometry.width, 1548);
    assert.equal(geometry.height, 835);
    assert.ok(geometry.cards.every(card => card.width === 185 && card.height === 219 && card.y === 101), JSON.stringify(geometry.cards));
    assert.ok(geometry.images.every(img => img.loaded));
    assert.ok(geometry.images.filter(img => /cleaning|pressure-washing|painting/.test(img.src)).every(img => img.width === 90 && img.height === 90));
    assert.ok(geometry.images.filter(img => /status-draft/.test(img.src)).every(img => img.width === 5 && img.height === 5));
    assert.ok(geometry.images.filter(img => /plus/.test(img.src)).every(img => img.width === 14 && img.height === 14));
    await page.getByRole('button', { name: 'Dodaj ogłoszenie', exact: true }).click();
    await page.getByLabel('Nazwa usługi', { exact: true }).fill('Usługa testowa Łódź');
    await page.getByLabel('Cena za usługę (zł)', { exact: true }).fill('219,90');
    await page.getByLabel('Czas trwania (minuty)', { exact: true }).fill('120');
    await page.getByRole('button', { name: 'Zapisz usługę', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.reload();
    await page.getByRole('button', { name: /^Edytuj usługę: Usługa testowa Łódź/ }).waitFor();
    const created = (await request('services')).find(offer => offer.title === 'Usługa testowa Łódź');
    assert.ok(created);
    const persisted = (await db.query('SELECT price_minor, duration_minutes FROM provider_offers WHERE id=$1', [created.id])).rows[0];
    assert.deepEqual(persisted, { price_minor: 21990, duration_minutes: 120 });
    await page.getByRole('searchbox', { name: 'Szukaj usługi', exact: true }).fill('lodz');
    assert.equal(await page.locator('.service-card').count(), 1);
    await page.locator('.service-card').click();
    await page.getByLabel('Cena za usługę (zł)', { exact: true }).fill('229,90');
    await page.getByRole('button', { name: 'Zapisz usługę', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await request(`services/${created.id}`)).priceMinor, 22990);
    await page.getByRole('button', { name: /^Edytuj usługę: Usługa testowa Łódź/ }).click();
    await page.getByRole('dialog').getByRole('combobox', { name: /^Status/ }).selectOption('archived');
    await page.getByRole('button', { name: 'Zapisz usługę', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await request(`services/${created.id}`)).status, 'archived');
    assert.equal(await page.getByRole('button', { name: 'Archiwum (1)', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.locator('.service-card').click();
    await page.getByRole('dialog').getByRole('combobox', { name: /^Status/ }).selectOption('draft');
    await page.getByRole('button', { name: 'Zapisz usługę', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal((await request(`services/${created.id}`)).status, 'draft');
    await page.getByRole('button', { name: /^Edytuj usługę: Usługa testowa Łódź/ }).click();
    await page.getByLabel('Nazwa usługi', { exact: true }).fill('Niezapisana zmiana');
    await page.getByRole('button', { name: 'Anuluj', exact: true }).click();
    await page.getByRole('button', { name: 'Odrzuć zmiany', exact: true }).click();
    assert.equal((await request(`services/${created.id}`)).title, 'Usługa testowa Łódź');
    await page.getByRole('button', { name: /^Edytuj usługę: Usługa testowa Łódź/ }).click();
    const latest = await request(`services/${created.id}`);
    const { id, ...input } = latest;
    await request(`services/${id}`, 'PUT', { ...input, priceMinor: 23990 });
    await page.getByLabel('Cena za usługę (zł)', { exact: true }).fill('249,90');
    await page.getByRole('button', { name: 'Zapisz usługę', exact: true }).click();
    await page.getByRole('button', { name: 'Wczytaj aktualne dane', exact: true }).click();
    await page.getByRole('button', { name: 'Odrzuć zmiany i wczytaj', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('input[inputmode="decimal"]')?.value === '239,90');
    await page.getByRole('button', { name: 'Anuluj', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await panel.screenshot({ path: resolve(output, 'services-figma-mobile.png') });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile overflow');
    await page.getByRole('button', { name: 'Dodaj ogłoszenie', exact: true }).click();
    await page.getByRole('dialog').screenshot({ path: resolve(output, 'services-figma-mobile-editor.png') });
    assert.ok(await page.getByRole('dialog').evaluate(element => element.getBoundingClientRect().right <= innerWidth));
    await page.getByRole('button', { name: 'Anuluj', exact: true }).click();
    const longName = 'BardzoDlugaNazwaUslugi'.repeat(8);
    const longOffer = await request(`services/${created.id}`);
    const { id: longId, ...longInput } = longOffer;
    await request(`services/${longId}`, 'PUT', { ...longInput, title: longName });
    await page.getByRole('button', { name: 'Odśwież', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(`^Edytuj usługę: ${longName}`) }).waitFor();
    for (const width of [390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}`);
      assert.ok(await page.locator('.service-card').evaluateAll(cards => cards.every(card => card.scrollHeight <= card.clientHeight && card.scrollWidth <= card.clientWidth)), `Card overflow at ${width}`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: Figma geometry/assets, actual PostgreSQL create and reload, edit, search, archive/restore, discard, stale-edit conflict and mobile layout. Temporary account cleaned up.');
    console.log(JSON.stringify(geometry));
  } finally {
    await browser.close();
    // The random email identifies only the account created by this run.
    await db.query('BEGIN');
    try {
      const user = (await db.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
      if (user) {
        const membership = (await db.query('SELECT account_id FROM provider_memberships WHERE user_id=$1', [user.id])).rows[0];
        if (membership) await db.query('DELETE FROM provider_accounts WHERE id=$1', [membership.account_id]);
        await db.query('DELETE FROM auth_sessions WHERE email=$1', [email]);
        await db.query('DELETE FROM users WHERE id=$1', [user.id]);
      }
      await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    finally { await db.end(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

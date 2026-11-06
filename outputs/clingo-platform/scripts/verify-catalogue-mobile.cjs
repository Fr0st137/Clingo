const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
const ids = Array.from({ length: 13 }, (_, index) => `k11-${randomUUID()}-${index}`);
const request = new URLSearchParams({ area: '62', address: 'Warszawa', addons: 'oven-cleaning:2' });
const checks = [], errors = [];
let browser, page;

async function fits(label) {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(size.document <= size.viewport + 1 && size.body <= size.viewport + 1, `${label}: ${JSON.stringify(size)}`);
}
async function reachable(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(), viewport = page.viewportSize();
  assert.ok(box && box.x >= -1 && box.x + box.width <= viewport.width + 1, 'Control must fit horizontally');
}
async function total(value) {
  await page.getByText('Suma', { exact: true }).locator('..').getByText(value, { exact: true }).waitFor();
}

(async () => {
  await db.connect();
  try {
    for (const [index, id] of ids.entries()) {
      const provider = `K11 Bardzo długa nazwa firmy sprzątającej mieszkania i lokale ${index}`;
      const pricing = [{ id: 'single-62', label: 'Mieszkanie 62 m²', duration: '3 godziny 15 minut', priceValue: 165, price: '165 zł', description: '' }];
      const addOns = [{ id: 'oven-cleaning', label: 'Mycie piekarnika', priceValue: 24, durationMinutes: 25, price: '24 zł', description: '' }];
      await db.query(`INSERT INTO provider_profiles SELECT * FROM jsonb_populate_record(NULL::provider_profiles, (SELECT to_jsonb(p) || $1::jsonb FROM provider_profiles p WHERE id='paulina-jagielska'))`, [JSON.stringify({
        id, account_id: null, provider, published: true, pricing: JSON.stringify(pricing), addOns: JSON.stringify(addOns),
        frequencies: JSON.stringify([{ id: 'once', label: 'Jednorazowo', discount: '0%' }, { id: 'weekly', label: 'Co tydzień', discount: '-8%' }]),
        metrics: JSON.stringify([{ id: 'location', label: 'Obszar', value: 'Warszawa' }]), area_pricing: null
      })]);
      await db.query(`INSERT INTO board_listings SELECT * FROM jsonb_populate_record(NULL::board_listings, (SELECT to_jsonb(b) || $1::jsonb FROM board_listings b WHERE id='paulina-jagielska'))`, [JSON.stringify({ id, provider, price: '165 zł', orderIndex: -500 + index })]);
    }
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    page = await browser.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`http://localhost:3000/tablica-ogloszen?${request}`, { waitUntil: 'networkidle' });
      await fits(`board ${width}`);
      const card = page.locator('[data-name="Ogłoszenie na tablicy"]').first();
      await card.getByText('213 zł', { exact: true }).waitFor();
      await reachable(card.getByRole('button', { name: 'Dodaj do ulubionych', exact: true }));
      await reachable(card.getByRole('link', { name: 'Zamów usługę', exact: true }));
      if (width === 1440) {
        assert.equal(Math.round((await page.locator('[data-board-results]').boundingBox()).width), 1075);
        assert.equal(Math.round((await page.locator('aside[data-node-id="1141:1456"]').boundingBox()).width), 345);
      }
      await page.goto(`http://localhost:3000/profil-ogloszeniowy/${ids[0]}?${request}`, { waitUntil: 'networkidle' });
      await total('213 zł');
      await fits(`offer ${width}`);
      await reachable(page.getByLabel('Metraż', { exact: true }));
      await reachable(page.getByLabel('Sposób udostępnienia lokalu', { exact: true }));
      await reachable(page.getByRole('button', { name: 'Przejdź do zamówienia', exact: true }));
      if (width === 1440) {
        assert.equal(Math.round((await page.locator('main main').boundingBox()).width), 800);
        assert.equal(Math.round((await page.locator('aside').boundingBox()).width), 380);
      }
      if (width === 390 || width === 1440) await page.screenshot({ path: `tmp/k11-offer-${width}.png`, fullPage: true });
      checks.push(`Board and offer fit ${width}px; price, favorites, access and checkout reachable`);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://localhost:3000/tablica-ogloszen?${request}`, { waitUntil: 'networkidle' });
    await page.locator('[data-service-trigger]').click();
    const dropdown = page.locator('[data-service-dropdown]');
    await dropdown.waitFor({ state: 'visible' });
    assert.ok((await dropdown.boundingBox()).height <= 480);
    await fits('open service menu');
    await page.keyboard.press('Escape');
    await dropdown.waitFor({ state: 'hidden' });
    await page.getByLabel('Cena do', { exact: true }).fill('0');
    await page.getByText('Brak ogłoszeń dla wybranych filtrów', { exact: true }).waitFor();
    await fits('empty result');
    await page.getByRole('button', { name: 'Wyczyść filtry', exact: true }).click();
    await page.locator('[data-name="Ogłoszenie na tablicy"]').first().waitFor();
    await page.getByRole('button', { name: /Pokaż ogłoszenia/ }).click();
    await page.waitForFunction(() => { const y = document.querySelector('[data-board-results]').getBoundingClientRect().top; return y >= 0 && y <= 150; });
    await page.getByRole('combobox').filter({ has: page.locator('option[value="price-asc"]') }).selectOption('price-asc');
    await page.getByRole('button', { name: 'Następna', exact: true }).click();
    await page.waitForURL(url => url.searchParams.get('page') === '2');
    await fits('second page');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    await fits('reloaded second page');
    checks.push('Mobile search menu closes with Escape; empty results, clearing, results button, sorting, pagination and reload work');

    await page.locator('button[aria-controls="board-add-ons-overlay"]').click();
    const overlay = page.locator('#board-add-ons-overlay');
    await overlay.waitFor();
    await fits('open add-ons');
    await reachable(overlay.getByRole('button', { name: 'Zamknij usługi dodatkowe', exact: true }));
    const oven = overlay.locator('article').filter({ has: page.getByText('Mycie piekarnika', { exact: true }) });
    await oven.getByRole('button', { name: 'Wybierz', exact: true }).click();
    await oven.getByRole('button', { name: 'Zwiększ ilość: Mycie piekarnika', exact: true }).click();
    await page.waitForURL(url => url.searchParams.get('addons')?.includes('oven-cleaning:2'));
    await overlay.screenshot({ path: 'tmp/k11-addons-390.png' });
    await overlay.getByRole('button', { name: 'Zamknij usługi dodatkowe', exact: true }).click();
    await overlay.waitFor({ state: 'detached' });
    const card = page.locator('[data-name="Ogłoszenie na tablicy"]').filter({ has: page.locator(`a[href^="/profil-ogloszeniowy/${ids[0]}?"]`) });
    await card.getByText('213 zł', { exact: true }).waitFor();
    await page.screenshot({ path: 'tmp/k11-board-390.png', fullPage: true });
    await card.getByRole('link', { name: 'Zamów usługę', exact: true }).click();
    await total('213 zł');
    await page.getByRole('button', { name: 'Zwiększ ilość: Mycie piekarnika', exact: true }).click();
    await total('237 zł');
    await page.getByRole('button').filter({ has: page.getByText('Raz w tygodniu', { exact: true }) }).click();
    await total('223,8 zł');
    await page.getByLabel('Sposób udostępnienia lokalu', { exact: true }).selectOption('someone-present');
    await page.reload({ waitUntil: 'networkidle' });
    await total('223,8 zł');
    assert.equal(await page.getByLabel('Sposób udostępnienia lokalu', { exact: true }).inputValue(), 'someone-present');
    const checkout = page.getByRole('link', { name: 'Przejdź do zamówienia', exact: true });
    await reachable(checkout);
    await checkout.click();
    await page.waitForURL('**/logowanie?**');
    const destination = new URL(new URL(page.url()).searchParams.get('next'), 'http://localhost:3000');
    assert.equal(destination.searchParams.get('access'), 'someone-present');
    assert.equal(destination.searchParams.get('addons'), 'oven-cleaning:3');
    assert.equal(destination.searchParams.get('frequency'), 'weekly');
    checks.push('Mobile add-ons close and update prices; offer keeps quantity, frequency, access and guest checkout after reload');
    assert.deepEqual(errors, []);
    fs.writeFileSync('tmp/k11-integration.json', JSON.stringify({ status: 'PASS', checks, errors }, null, 2));
    console.log(`PASS: K11, ${checks.length} groups of checks; no browser errors.`);
  } catch (error) {
    if (page) await page.screenshot({ path: 'tmp/k11-failure.png', fullPage: true });
    throw error;
  } finally {
    if (browser) await browser.close();
    await db.query('DELETE FROM board_listings WHERE id=ANY($1::text[])', [ids]);
    await db.query('DELETE FROM provider_profiles WHERE id=ANY($1::text[])', [ids]);
    await db.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

const { finishFixtureRegistration } = require('./test-registration.cjs');
const assert = require('node:assert/strict'), fs = require('node:fs'), { randomUUID } = require('node:crypto');
const { Client } = require('pg'), ts = require('typescript');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const bridge = require('../apps/api/dist/dashboard/review-bridge');
const { matchesCatalogueRequest } = require('../apps/api/dist/dashboard/catalogue-search');
const fallback = { exports: {} };
new Function('module', 'exports', 'require', ts.transpileModule(fs.readFileSync('apps/web/lib/db-fallback.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(fallback, fallback.exports, name => name === '../../api/src/dashboard/review-bridge' ? bridge : require(name));
const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
const run = randomUUID(), emails = ['warsaw', 'krakow'].map(role => `catalogue-${role}-${run}@example.test`), accounts = [], profiles = [], fixture = {};
const labels = { homes: 'Sprzątanie obiektów · Mieszkań i domów', offices: 'Sprzątanie obiektów · Biur i lokali użytkowych', paving: 'Mycie ciśnieniowe · Kostki, chodników, tarasów', roofs: 'Mycie ciśnieniowe · Dachów skośnych i płaskich', walls: 'Malowanie powierzchni · Ścian i sufitów', tiles: 'Malowanie powierzchni · Dachówek' };
async function api(url, token, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch('http://localhost:4000' + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await finishFixtureRegistration(url, await response.json()); assert.ok(response.ok, JSON.stringify(data)); return data;
}
(async () => { await db.connect(); let browser; try {
  for (const [index, city] of ['Warszawa', 'Kraków'].entries()) {
    const owner = await api('/auth/register', null, { email: emails[index], password: `Catalogue test ${run}` });
    const account = (await api('/provider/account', owner.token, { name: `K01 ${city} ${run}` })).account; accounts.push(account.id);
    await api('/provider/employees', owner.token, { name: 'Osoba katalogu', email: '', phone: '', showInCalendar: true, services: ['homes', 'offices', 'pressure', 'painting'], schedule: Array.from({ length: 7 }, (_, day) => ({ day, enabled: true, start: '08:00', end: '20:00' })) });
    await api('/provider/settings/location', owner.token, { street: 'Testowa 1', city, postalCode: index ? '31-001' : '00-001', radiusKm: 25, revision: 1 }, 'PUT');
    const variants = index ? [['krakow', 'homes', 'Oferta lokalna']] : [['homes', 'homes', 'Oferta A'], ['offices', 'offices', 'Oferta B'], ['paving', 'pressure', 'Oferta C'], ['roofs', 'pressure', 'Mycie dachów'], ['walls', 'painting', 'Oferta D'], ['tiles', 'painting', 'Malowanie dachówek']];
    for (const [key, category, title] of variants) {
      const input = { title, category, description: 'Izolowany test dopasowania katalogu K01.', priceMinor: 15000, durationMinutes: 60, status: 'draft', configuration: { ...defaultOfferConfiguration(), standardsAccepted: true, bufferEnabled: false, areaTiers: [{ minSquareMeters: 1, maxSquareMeters: 200, workers: 1 }] } };
      const offer = await api('/provider/services', owner.token, input); await api('/provider/services/' + offer.id, owner.token, { ...input, status: 'published', revision: offer.revision }, 'PUT'); fixture[key] = 'service-' + offer.id; profiles.push(fixture[key]);
    }
  }
  const catalogue = await api('/dashboard/board');
  const dbCatalogue = await fallback.exports.getBoardFromDb();
  for (const id of profiles) {
    const fromApi = catalogue.listings.find(row => row.id === id), fromDb = dbCatalogue.listings.find(row => row.id === id); assert.ok(fromApi); assert.ok(fromDb);
    assert.deepEqual({ category: fromApi.serviceCategory, metrics: fromApi.serviceMetrics }, { category: fromDb.serviceCategory, metrics: fromDb.serviceMetrics });
  }
  function fixtureMatches(rows, service, address) { return rows.filter(row => profiles.includes(row.id) && matchesCatalogueRequest(row, { service, address })).map(row => row.id).sort(); }
  for (const [service, address, keys] of [[labels.homes, 'Warszawa', ['homes']], [labels.offices, 'Warszawa', ['offices']], [labels.paving, 'Warszawa', ['paving']], [labels.roofs, 'Warszawa', ['roofs']], [labels.tiles, 'Warszawa', ['tiles']], [labels.homes, 'Kraków, Warszawska 1', ['krakow']], [labels.roofs, 'Kraków', []]]) {
    const expected = keys.map(key => fixture[key]).sort(); assert.deepEqual(fixtureMatches(catalogue.listings, service, address), expected); assert.deepEqual(fixtureMatches(dbCatalogue.listings, service, address), expected);
  }
  browser = await chromium.launch({ channel: 'chrome', headless: true }); const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', error => errors.push(error.message));
  const visible = async () => page.locator('[data-name="Ogłoszenie na tablicy"] a[href^="/profil-ogloszeniowy/"]').evaluateAll((links, ids) => links.map(link => new URL(link.href).pathname.split('/').pop()).filter(id => ids.includes(id)).sort(), profiles);
  async function expectKeys(keys) { await page.waitForFunction(({ profiles, expected }) => { const ids = [...document.querySelectorAll('[data-name="Ogłoszenie na tablicy"] a[href^="/profil-ogloszeniowy/"]')].map(link => new URL(link.href).pathname.split('/').pop()).filter(id => profiles.includes(id)).sort(); return JSON.stringify(ids) === JSON.stringify(expected); }, { profiles, expected: keys.map(key => fixture[key]).sort() }); assert.deepEqual(await visible(), keys.map(key => fixture[key]).sort()); }
  async function visit(service, address, extra = {}) { await page.goto('http://localhost:3000/tablica-ogloszen?' + new URLSearchParams({ service, area: '100', address, ...extra }), { waitUntil: 'networkidle' }); await page.locator('[data-board-results]').waitFor(); }
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' }); await page.locator('[data-service-trigger]').click(); await page.locator('[data-service-option]').filter({ hasText: 'Mieszkań i domów' }).first().click(); await page.locator('[data-area-input]').fill('100'); await page.locator('[data-location-input]').fill('Warszawa, Testowa 1'); await page.locator('[data-location-option="query"]').click(); await page.locator('[data-search-submit]').click(); await page.waitForURL('**/tablica-ogloszen?**'); await expectKeys(['homes']);
  for (const [service, address, keys] of [[labels.offices, 'Warszawa', ['offices']], [labels.paving, 'Warszawa', ['paving']], [labels.roofs, 'Warszawa', ['roofs']], [labels.walls, 'Warszawa', ['walls']], [labels.tiles, 'Warszawa', ['tiles']], [labels.homes, 'Kraków, Warszawska 1', ['krakow']], [labels.roofs, 'Kraków', []]]) { await visit(service, address); await expectKeys(keys); }
  await page.screenshot({ path: 'tmp/k01-no-results.png', animations: 'disabled' });
  await visit(labels.homes, 'Warszawa', { page: '99' }); await expectKeys(['homes']);
  await page.locator('[data-location-input]').fill('Kraków, Testowa 1'); await page.locator('[data-location-option="query"]').click(); await page.locator('[data-search-submit]').click(); await expectKeys(['krakow']); await page.waitForURL(url => url.searchParams.get('address') === 'Kraków, Testowa 1' && !url.searchParams.has('page'));
  await page.reload({ waitUntil: 'networkidle' }); await expectKeys(['krakow']);
  await visit(labels.offices, 'Warszawa'); await expectKeys(['offices']); await page.goBack({ waitUntil: 'networkidle' }); await expectKeys(['krakow']); await page.goForward({ waitUntil: 'networkidle' }); await expectKeys(['offices']);
  await page.locator('[data-service-trigger]').click(); await page.locator(`[data-service-option="${labels.homes}"]`).first().click(); await page.locator('[data-search-submit]').click(); await expectKeys(['homes']);
  await page.screenshot({ path: 'tmp/k01-homes-warsaw.png', animations: 'disabled' });
  await page.locator(`a[href^="/profil-ogloszeniowy/${fixture.homes}?"]`).click(); await page.waitForURL('**/profil-ogloszeniowy/**'); await page.getByLabel('Metraż', { exact: true }).waitFor();
  const destination = new URL(page.url()); assert.equal(destination.searchParams.get('area'), '100'); assert.equal(destination.searchParams.get('address'), 'Warszawa'); assert.equal(destination.searchParams.get('service'), labels.homes);
  assert.deepEqual(errors, []);
  fs.writeFileSync('tmp/k01-integration.json', JSON.stringify({ status: 'PASS', checks: ['API and PostgreSQL fallback expose identical categories and declared coverage', 'custom offer titles use their real source category', 'homes/offices/washing/painting and subtypes remain distinct', 'service and locality combine without street-name false positives', 'homepage search and live board search', 'empty results instead of unrelated providers', 'new search resets pagination', 'reload/back/forward restore filters', 'offer navigation retains service/area/address', 'no JavaScript errors'] }, null, 2));
  console.log('PASS: K01 catalogue filters, real API/DB fallback, homepage search, subtype/city isolation, navigation and reload.');
} catch(error) {
  const failedPage=browser?.contexts()[0]?.pages()[0]; if(failedPage) { await failedPage.screenshot({path:'tmp/k01-failure.png'}); fs.writeFileSync('tmp/k01-failure.txt',await failedPage.locator('body').innerText()); } throw error;
} finally {
  if (browser) await browser.close();
  await db.query('DELETE FROM board_listings WHERE id=ANY($1::text[])', [profiles]); await db.query('DELETE FROM provider_profiles WHERE id=ANY($1::text[])', [profiles]);
  await db.query('DELETE FROM provider_accounts WHERE id=ANY($1::uuid[])', [accounts]); await db.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]); await db.end(); if (globalThis.clingoFallbackPool) await globalThis.clingoFallbackPool.end();
} })().catch(error => { console.error(error); process.exitCode = 1; });

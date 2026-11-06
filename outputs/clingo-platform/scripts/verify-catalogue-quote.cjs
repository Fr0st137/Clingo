const { finishFixtureRegistration } = require('./test-registration.cjs');
const assert = require('node:assert/strict'), fs = require('node:fs'), { randomUUID } = require('node:crypto');
const { Client } = require('pg'), ts = require('typescript');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const bridge = require('../apps/api/dist/dashboard/review-bridge');
const fallback = { exports: {} };
new Function('module', 'exports', 'require', ts.transpileModule(fs.readFileSync('apps/web/lib/db-fallback.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(fallback, fallback.exports, name => name === '../../api/src/dashboard/review-bridge' ? bridge : require(name));
const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
const run = randomUUID(), email = `quote-${run}@example.test`;
const ids = ['legacy', 'cheaper-extras', 'area'].map(key => `quote-${key}-${run}`);
async function api(path, body, token) {
  const response = await fetch('http://localhost:4000' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await finishFixtureRegistration(path, await response.json()); assert.ok(response.ok, JSON.stringify(data)); return data;
}
(async () => {
  await db.connect(); let browser;
  try {
    for (const [index, id] of ids.entries()) {
      const addon = { id: 'oven-cleaning', label: 'Mycie piekarnika', priceValue: [24, 1, 12.34][index], price: 'Dodatek', description: 'Dodatek testowy', durationMinutes: 25 };
      const pricing = [{ id: 'single-62', label: 'Mieszkanie 62 m²', duration: '3 godziny 15 minut', priceValue: index ? 190 : 165, price: 'Cena', description: 'Wariant' }, { id: 'single-80', label: 'Mieszkanie 80 m²', duration: '4 godz.', priceValue: index ? 250 : 220, price: 'Cena', description: 'Wariant' }];
      await db.query(`INSERT INTO provider_profiles SELECT * FROM jsonb_populate_record(NULL::provider_profiles, (SELECT to_jsonb(p) || $1::jsonb FROM provider_profiles p WHERE id='paulina-jagielska'))`, [JSON.stringify({ id, account_id: null, provider: `K02 ${index} ${run}`, published: true, pricing: JSON.stringify(pricing), addOns: JSON.stringify([addon]), frequencies: JSON.stringify([{ id: 'once', label: 'Jednorazowo', discount: '0%', description: '' }, { id: 'weekly', label: 'Co tydzień', discount: '-8%', description: '' }]), metrics: JSON.stringify([{ id: 'location', label: 'Obszar', value: 'Warszawa' }]), tags: JSON.stringify(['Jednosesyjne']), area_pricing: index === 2 ? JSON.stringify({ rateMinor: 237, minutesPer100: 180, minimum: 15, maximum: 400 }) : null })]);
      await db.query(`INSERT INTO board_listings SELECT * FROM jsonb_populate_record(NULL::board_listings, (SELECT to_jsonb(b) || $1::jsonb FROM board_listings b WHERE id='paulina-jagielska'))`, [JSON.stringify({ id, provider: `K02 ${index} ${run}`, price: `${pricing[0].priceValue} zł`, orderIndex: -100 + index })]);
    }
    const customer = await api('/auth/register', { email, password: `Quote test ${run}`, firstName: 'Test', lastName: 'Wyceny' });
    const board = await api('/dashboard/board'), dbBoard = await fallback.exports.getBoardFromDb();
    for (const id of ids) {
      const apiRow = board.listings.find(row => row.id === id), dbRow = dbBoard.listings.find(row => row.id === id);
      assert.ok(apiRow && dbRow);
      for (const key of ['pricing', 'frequencies', 'addOns', 'areaPricing', 'tags']) assert.deepEqual(apiRow[key], dbRow[key], key);
    }
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const guest = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await guest.goto(`http://localhost:3000/profil-ogloszeniowy/${ids[0]}?area=62&address=Warszawa`, { waitUntil: 'networkidle' });
    assert.ok(await guest.getByRole('button', { name: 'Przejdź do zamówienia', exact: true }).isDisabled());
    await guest.getByLabel('Sposób udostępnienia lokalu', { exact: true }).selectOption('phone-contact');
    await guest.waitForFunction(() => new URL(location.href).searchParams.get('access') === 'phone-contact');
    await guest.reload({ waitUntil: 'networkidle' });
    assert.equal(await guest.getByLabel('Sposób udostępnienia lokalu', { exact: true }).inputValue(), 'phone-contact');
    await guest.getByRole('link', { name: 'Przejdź do zamówienia', exact: true }).click();
    await guest.waitForURL('**/logowanie?**');
    assert.equal(new URL(new URL(guest.url()).searchParams.get('next'), 'http://localhost:3000').searchParams.get('access'), 'phone-contact');
    await guest.close();
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([{ name: 'clingo-session', value: customer.token, url: 'http://localhost:3000', httpOnly: true }, { name: 'clingo-auth', value: '1', url: 'http://localhost:3000' }, { name: 'clingo-user-email', value: encodeURIComponent(email), url: 'http://localhost:3000' }]);
    const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message)); page.setDefaultTimeout(20000);
    async function visit(area) {
      await page.goto('http://localhost:3000/tablica-ogloszen?' + new URLSearchParams({ service: 'Sprzątanie obiektów · Mieszkań i domów', address: 'Warszawa, Testowa 1', area, addons: 'piekarnik:2' }), { waitUntil: 'networkidle' });
    }
    const card = id => page.locator('article').filter({ has: page.locator(`a[href^="/profil-ogloszeniowy/${id}?"]`) });
    for (const [area, prices] of [['62', ['213 zł', '192 zł', '171,62 zł']], ['75', ['268 zł', '252 zł', '202,43 zł']]]) {
      await visit(area);
      for (const [index, id] of ids.entries()) {
        await card(id).getByText(prices[index], { exact: true }).waitFor();
        const quote = await api('/dashboard/booking/quote', { providerId: id, pricingId: index === 2 ? `area-${area}` : area === '75' ? 'single-80' : 'single-62', frequencyId: 'once', addOns: [{ id: 'oven-cleaning', quantity: 2 }] });
        assert.equal(quote.summary.total, prices[index]);
      }
    }
    await visit('62');
    await page.getByRole('combobox').filter({ has: page.locator('option[value="price-asc"]') }).selectOption('price-asc');
    const sorted = (await page.locator('a[href^="/profil-ogloszeniowy/"]').evaluateAll(links => links.map(link => new URL(link.href).pathname.split('/').pop()))).filter(id => ids.includes(id));
    assert.deepEqual(sorted, [ids[2], ids[1], ids[0]]);
    await page.getByLabel('Cena do', { exact: true }).fill('200');
    await card(ids[0]).waitFor({ state: 'detached' }); await card(ids[1]).waitFor();
    await page.getByLabel('Cena do', { exact: true }).fill(''); await card(ids[0]).waitFor();
    await page.screenshot({ path: 'tmp/k02-board.png', animations: 'disabled' });
    await page.locator(`a[href^="/profil-ogloszeniowy/${ids[0]}?"]`).click();
    async function total(value) { await page.getByText('Suma', { exact: true }).locator('..').getByText(value, { exact: true }).waitFor(); }
    await total('213 zł');
    assert.ok(await page.getByRole('button', { name: 'Przejdź do zamówienia', exact: true }).isDisabled());
    await page.getByRole('button', { name: 'Zwiększ ilość: Mycie piekarnika', exact: true }).click(); await total('237 zł');
    await page.reload({ waitUntil: 'networkidle' }); await total('237 zł');
    await page.getByRole('button').filter({ has: page.getByText('Raz w tygodniu', { exact: true }) }).click(); await total('223,8 zł');
    await page.screenshot({ path: 'tmp/k02-offer.png', animations: 'disabled' });
    await page.getByLabel('Sposób udostępnienia lokalu', { exact: true }).selectOption('someone-present');
    const [availabilityResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/booking/availability') && r.request().method() === 'POST'),
      page.getByRole('link', { name: 'Przejdź do zamówienia', exact: true }).click()
    ]);
    assert.equal(new URL(page.url()).searchParams.get('access'), 'someone-present');
    const available = await availabilityResponse.json(); assert.equal(available.quote.totalValue, 223.8);
    const day = available.days.find(row => row.slots.length); assert.ok(day);
    const dayLabel = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' }).format(new Date(`${day.date}T12:00:00Z`));
    await page.getByRole('button', { name: `${dayLabel}, dostępny`, exact: true }).click();
    const slot = day.slots[0], hour = Number(slot.time.slice(0, 2));
    await page.getByRole('button', { name: hour < 12 ? 'Rano' : hour < 17 ? 'Południe' : 'Wieczór', exact: true }).click();
    await page.getByRole('button', { name: `Godzina ${slot.time}`, exact: true }).click();
    await page.getByRole('button', { name: 'Przejdź dalej', exact: true }).click();
    await page.getByRole('heading', { name: 'Dane kontaktowe', exact: true }).waitFor(); await total('223,8 zł');
    assert.equal(await page.getByLabel('Sposób udostępnienia lokalu', { exact: true }).inputValue(), 'someone-present');
    await page.getByLabel('Sposób udostępnienia lokalu', { exact: true }).selectOption('phone-contact');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.getByLabel('Sposób udostępnienia lokalu', { exact: true }).inputValue(), 'phone-contact');
    await page.getByLabel('Imię i nazwisko', { exact: true }).fill('Klient testu ceny');
    await page.getByLabel('Numer telefonu', { exact: true }).fill('500600700');
    await page.getByLabel('Adres', { exact: true }).fill('Warszawa, Testowa 1');
    await page.screenshot({ path: 'tmp/k02-summary.png', animations: 'disabled' });
    await page.getByRole('checkbox', { name: 'Potwierdzam dane i akceptuję warunki realizacji usługi.', exact: true }).check();
    const confirmedResponse = page.waitForResponse(r => r.url().includes('/api/booking/confirm') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Potwierdź i zamów', exact: true }).click();
    const response = await confirmedResponse, saved = await response.json(); assert.ok(response.ok(), JSON.stringify(saved)); assert.equal(saved.summary.total, '223,8 zł'); assert.equal(saved.bookingDetails.accessMethod, 'phone-contact');
    const persisted = (await db.query('SELECT summary, selected_options FROM orders WHERE user_email=$1', [email])).rows;
    assert.equal(persisted.length, 1); assert.equal(JSON.parse(persisted[0].summary).total, '223,8 zł');
    assert.equal(JSON.parse(persisted[0].selected_options).addOns[0].quantity, 3); assert.equal(JSON.parse(persisted[0].selected_options).frequencyId, 'weekly'); assert.equal(JSON.parse(persisted[0].selected_options).accessMethod, 'phone-contact');
    const fallbackOrder = await fallback.exports.getOrderFromDb(saved.id, email); assert.equal(fallbackOrder.bookingDetails.accessMethod, 'phone-contact');
    await page.waitForURL('**/zamowienie/potwierdzenie?**');
    await page.goto(`http://localhost:3000/zamowienia/szczegoly?id=${saved.id}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Sposób udostępnienia lokalu', exact: true }).waitFor();
    await page.getByText('Prośba o kontakt telefoniczny w celu ustalenia sposobu udostępnienia lokalu objętego usługą.', { exact: true }).waitFor();
    await page.screenshot({ path: 'tmp/k05-customer-details.png', fullPage: true });
    assert.deepEqual(errors, []);
    fs.writeFileSync('tmp/k05-single-integration.json', JSON.stringify({ status: 'PASS', checks: ['no default choice and checkout is disabled until an option is selected', 'guest choice survives reload and is included in the login return URL', 'choice reaches calendar and summary', 'summary can change and restore the choice after reload', 'confirmed order, database and DB fallback retain the chosen method', 'customer order details display the method', 'no JavaScript errors'] }, null, 2));
    fs.writeFileSync('tmp/k02-integration.json', JSON.stringify({ status: 'PASS', checks: ['legacy area tiers and new exact-area offers include every addon unit', 'API and DB fallback expose identical price data', 'sort and price filters use configured totals', 'profile quantity change and reload', 'weekly base discount preserves full addon prices', 'calendar and summary retain quote', 'confirmed order persists exact price, frequency and addon quantity', 'no JavaScript errors'] }, null, 2));
    console.log('PASS: K02 configured prices, API/DB fallback, filters/sorting, profile, reload, checkout and persisted order.');
  } catch (error) {
    console.error(error);
    const page = browser?.contexts()[0]?.pages()[0]; if (page) { await page.screenshot({ path: 'tmp/k02-failure.png' }); fs.writeFileSync('tmp/k02-failure.txt', await page.locator('body').innerText()); }
    throw error;
  } finally {
    if (browser) await browser.close();
    await db.query('DELETE FROM orders WHERE user_email=$1', [email]);
    await db.query('DELETE FROM board_listings WHERE id=ANY($1::text[])', [ids]);
    await db.query('DELETE FROM provider_profiles WHERE id=ANY($1::text[])', [ids]);
    await db.query('DELETE FROM auth_sessions WHERE email=$1', [email]);
    await db.query('DELETE FROM users WHERE email=$1', [email]);
    await db.end(); if (globalThis.clingoFallbackPool) await globalThis.clingoFallbackPool.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

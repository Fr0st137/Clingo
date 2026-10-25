const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  let account = 'options-qa';
  await page.route('**/api/provider/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path.endsWith('/me') ? { user: { name: 'Test', email: 'test@example.test' }, account: { id: account, name: 'Firma testowa', role: 'owner' } } : path.endsWith('/jobs') ? [{ id: 'job', offerId: 'offer', date, startMinute: 600, durationMinutes: 120, status: 'scheduled', clientName: 'Klient', serviceTitle: 'Sprzątanie mieszkania', employeeName: '', address: '' }] : path.endsWith('/services') ? [{ id: 'offer', title: 'Sprzątanie mieszkania', category: 'homes' }] : [] });
  });
  await page.goto('http://127.0.0.1:3108/');
  const trigger = page.getByRole('button', { name: 'Ustawienia kalendarza', exact: true });
  const panel = page.getByRole('dialog', { name: 'Ustawienia kalendarza', exact: true });
  await trigger.click(); await panel.waitFor();
  assert.equal((await panel.boundingBox()).width, 390);
  await panel.screenshot({ path: 'tmp/calendar-options-panel.png' });
  const assets = await panel.locator('img').evaluateAll(images => images.map(img => ({ src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0, w: img.getBoundingClientRect().width, h: img.getBoundingClientRect().height })));
  assert(assets.every(img => img.ok)); console.log(JSON.stringify(assets));
  await trigger.click(); await panel.waitFor({ state: 'hidden' });
  await trigger.click(); await panel.waitFor();
  await page.keyboard.press('Escape'); await panel.waitFor({ state: 'hidden' });
  assert(await trigger.evaluate(el => el === document.activeElement));
  await trigger.click(); await panel.waitFor();
  await page.getByLabel('Domyślny widok kalendarza', { exact: true }).selectOption('week');
  assert.equal(await page.getByRole('button', { name: 'Tydzień', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByLabel('Kolor: Mieszkań i domów', { exact: true }).fill('#ff8800');
  assert.match(await page.locator('.calendar-live-appointment').first().getAttribute('style'), /rgb\(255, 136, 0\)/);
  await page.reload(); await trigger.click(); await panel.waitFor();
  assert.equal(await page.getByLabel('Domyślny widok kalendarza', { exact: true }).inputValue(), 'week');
  assert.equal(await page.getByLabel('Kolor: Mieszkań i domów', { exact: true }).inputValue(), '#ff8800');
  await page.getByRole('heading', { name: 'Sprzątanie obiektów', exact: true }).waitFor();
  await page.locator('.view-switcher').click(); await panel.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Dodaj zdarzenie', exact: true }).click();
  await trigger.click(); await panel.waitFor();
  assert.equal(await page.getByRole('menu').count(), 0);
  await page.keyboard.press('Escape');
  account = 'other-account'; await page.reload(); await trigger.click(); await panel.waitFor();
  assert.equal(await page.getByLabel('Domyślny widok kalendarza', { exact: true }).inputValue(), 'day');
  await page.setViewportSize({ width: 390, height: 844 });
  const box = await panel.boundingBox();
  assert(box.x >= 0 && box.x + box.width <= 390);
  assert(box.y + box.height <= 844);
  assert(await panel.evaluate(el => el.scrollWidth <= el.clientWidth));
  await page.screenshot({ path: 'tmp/calendar-options-mobile.png' });
  await page.keyboard.press('Escape');
  for (const path of ['/calendar/week', '/calendar/day']) {
    await page.goto('http://127.0.0.1:3108' + path); await trigger.click(); await panel.waitFor(); await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: panel, assets, toggle, outside/Escape, focus, persisted account-specific view/colors, calendar color update, all views, mobile fit.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });


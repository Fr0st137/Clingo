const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 915 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/provider/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path.endsWith('/me') ? { user: { name: 'Test', email: 'test@example.test' }, account: { id: 'qa', name: 'Firma testowa', role: 'owner' } } : path.endsWith('/employees') ? [{ id: 'a', name: 'Paulina Jagielska' }, { id: 'b', name: 'Beata Kaszwabendzka' }] : [] });
  });
  async function open() {
    await page.getByRole('button', { name: 'Dodaj zdarzenie', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Nieobecność (urlop, choroba)', exact: true }).click();
    await page.getByRole('button', { name: 'Dodaj nieobecność (zablokuj termin)', exact: true }).click();
    await page.getByRole('button', { name: 'Paulina Jagielska', exact: true }).waitFor();
  }
  await page.goto('http://127.0.0.1:3108/');
  await open();
  const form = page.locator('.absence-form');
  assert.equal((await page.locator('.provider-modal-body').boundingBox()).width, 600);
  await page.screenshot({ path: 'tmp/absence-form-figma-after.png' });
  const icons = await form.locator('img').evaluateAll(images => images.map(img => ({ src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0, width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height })));
  assert(icons.every(img => img.ok && (img.src.endsWith('.svg') ? img.width === 14 && img.height === 14 : img.width === 55 && img.height === 55)));
  await page.getByLabel('Powód nieobecności', { exact: true }).selectOption('Urlop');
  await page.getByLabel('Wybierz datę początku — data', { exact: true }).fill('2026-10-25');
  await page.getByLabel('Wybierz datę końca — data', { exact: true }).fill('2026-10-24');
  await page.getByRole('button', { name: 'Dodaj nieobecność', exact: true }).click();
  assert.match(await form.getByRole('alert').innerText(), /Koniec nieobecności/);
  await page.getByLabel('Wybierz datę końca — data', { exact: true }).fill('2026-10-26');
  await page.getByRole('button', { name: 'Dodaj nieobecność', exact: true }).click();
  assert.match(await form.getByRole('alert').innerText(), /Wybierz co najmniej/);
  await page.getByRole('button', { name: 'Wszyscy Pracownicy', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Paulina Jagielska', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Beata Kaszwabendzka', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Paulina Jagielska', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: 'Beata Kaszwabendzka', exact: true }).getAttribute('aria-pressed'), 'false');
  await page.getByRole('button', { name: 'Dodaj nieobecność', exact: true }).click();
  assert.match(await form.getByRole('alert').innerText(), /Termin nie został zablokowany/);
  await page.getByRole('button', { name: 'Cofnij', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Dodaj nieobecność (zablokuj termin)', exact: true }).evaluate(el => el === document.activeElement));
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  assert(await form.evaluate(el => el.scrollWidth <= el.clientWidth));
  await page.getByRole('button', { name: 'Cofnij', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tmp/absence-form-mobile.png' });
  await page.getByRole('button', { name: 'Zamknij', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  console.log('OK: opening, local assets, dates, reason, employee selection, validation, back/focus, mobile scrolling, close.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });


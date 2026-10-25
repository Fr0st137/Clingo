const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 915 } });
  await page.route('**/api/provider/**', route => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith('/me') ? { user: { name: 'Test', email: 'test@example.test' }, account: { id: 'qa', name: 'Firma testowa', role: 'owner' } } : [] }));
  for (const path of ['/', '/calendar/week', '/calendar/day']) {
    await page.goto('http://127.0.0.1:3108' + path);
    const add = page.getByRole('button', { name: 'Dodaj zdarzenie', exact: true });
    await add.click();
    await page.getByRole('menuitem', { name: 'Nieobecność (urlop, choroba)', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Nieobecność (urlop, choroba, inne...)', exact: true });
    await dialog.waitFor();
    assert.equal(await dialog.locator('.order-type-choice').count(), 3);
    const geometry = await dialog.locator('.provider-modal-body').boundingBox();
    assert.equal(geometry.width, 600);
    assert.equal(geometry.height, 327);
    const icons = await dialog.locator('.order-type-choice img').evaluateAll(images => images.map(img => ({ ok: img.complete && img.naturalWidth > 0, width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height })));
    assert(icons.every(img => img.ok && img.width === 8.75 && img.height === 14));
    if (path === '/') await page.screenshot({ path: 'tmp/absence-figma-after.png' });
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert(await add.evaluate(el => el === document.activeElement));
    console.log(path, 'dialog size, icons, Escape, focus restoration OK');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Dodaj zdarzenie', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Nieobecność (urlop, choroba)', exact: true }).click();
  const box = await page.getByRole('dialog').boundingBox();
  assert(box.x >= 0 && box.x + box.width <= 390);
  await page.getByRole('button', { name: 'Zamknij', exact: true }).click();
  console.log('mobile fit and close OK');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });


const assert = require('node:assert/strict'), fs = require('node:fs');
const history = page => page.getByRole('dialog', { name: 'Historia zmian zamówienia', exact: true });
exports.before = async (page, planner) => {
  await planner.getByRole('button', { name: 'Historia zmian', exact: true }).click();
  await history(page).getByText('Brak zarejestrowanych zmian zamówienia.', { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  const original = await page.evaluate(() => { const key = Object.keys(sessionStorage).find(key => key.startsWith('clingo:manual-multi:')); return { key, value: sessionStorage.getItem(key) }; });
  await page.evaluate(original => { const draft = JSON.parse(original.value); draft.history = ['2025-11-08T08:47:00Z|Zmieniono cenę.']; draft.changeHistory = []; sessionStorage.setItem(original.key, JSON.stringify(draft)); }, original);
  await page.reload(); await planner.getByRole('heading', { name: 'Anita Kowalska', exact: true }).waitFor(); await planner.getByRole('button', { name: 'Historia zmian', exact: true }).click(); await history(page).getByText('Zmieniono cenę.', { exact: true }).waitFor(); await history(page).getByText('Brak zapisanych wcześniejszych wartości', { exact: true }).waitFor(); await page.keyboard.press('Escape');
  const fixture = [
    { at: '2025-11-11T10:32:00Z', changes: [{ type: 'Zmiana godziny końca zamówienia', before: '15:30', after: '15:45' }] },
    { at: '2025-11-10T16:16:00Z', changes: [{ type: 'Przełożenie terminu', before: '10.10.2025, 12:30 - 15:30', after: '10.10.2025, 12:30 - 15:30' }] },
    { at: '2025-11-08T08:47:00Z', changes: [{ type: 'Zmiana ceny', before: '196 zł', after: '165 zł' }] },
  ];
  await page.evaluate(({ original, fixture }) => { const draft = JSON.parse(original.value); draft.history = []; draft.changeHistory = fixture; sessionStorage.setItem(original.key, JSON.stringify(draft)); }, { original, fixture });
  await page.reload(); await planner.getByRole('heading', { name: 'Anita Kowalska', exact: true }).waitFor();
  await planner.getByRole('button', { name: 'Historia zmian', exact: true }).click();
  await history(page).locator('thead img').evaluate(img => img.decode());
  const bounds = await history(page).boundingBox(); assert.equal(bounds.width, 1177); assert.equal(bounds.height, 343);
  const icon = await history(page).locator('thead img').boundingBox(); assert.equal(icon.width, 16); assert.equal(icon.height, 16);
  assert.equal(await history(page).locator('tbody tr').count(), 3); await page.screenshot({ path: 'tmp/order-history-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await history(page).evaluate(node => node.scrollWidth <= node.clientWidth));
  await page.screenshot({ path: 'tmp/order-history-mobile.png' });
  assert.ok(await history(page).locator('.project-history-scroll').evaluate(node => { node.scrollLeft = node.scrollWidth; return node.scrollLeft > 0; }));
  await page.keyboard.press('Escape'); await page.evaluate(({ key, value }) => sessionStorage.setItem(key, value), original); await page.setViewportSize({ width: 1920, height: 911 });
  await page.reload(); await planner.getByRole('heading', { name: 'Anita Kowalska', exact: true }).waitFor();
};
exports.planned = async (page, planner) => {
  await planner.getByRole('button', { name: 'Historia zmian', exact: true }).click();
  assert.equal(await history(page).getByText('Dodanie sesji', { exact: true }).count(), 2);
  await history(page).getByText('487,5 zł', { exact: true }).waitFor(); await history(page).getByText('438,75 zł', { exact: true }).waitFor();
  await page.keyboard.press('Escape'); await page.reload(); await planner.getByRole('heading', { name: 'Anita Kowalska', exact: true }).waitFor();
  await planner.getByRole('button', { name: 'Historia zmian', exact: true }).click(); assert.equal(await history(page).getByText('Dodanie sesji', { exact: true }).count(), 2); await page.keyboard.press('Escape');
};
exports.after = async ({ page, owner, foreign, id, ok, request }) => {
  const path = `/provider/projects/manual/${id}`; let project = await ok(path, owner.token);
  assert.ok(project.history.some(event => event.changes?.some(change => change.type === 'Utworzenie zamówienia')));
  assert.ok(project.history.some(event => event.changes?.some(change => change.type === 'Dodanie sesji')));
  assert.ok(project.history.some(event => event.changes?.some(change => change.type === 'Zmiana tytułu notatki')));
  const previousLength = project.history.length;
  const body = { revision: project.revision, areaSquareMeters: 200, confirmOverplanned: true, sessions: project.sessions.map(({ id, date, startMinute, endMinute, employeeIds }, index) => ({ id, date, startMinute, endMinute: endMinute + (index === 0 ? 15 : 0), employeeIds })) };
  const responses = await Promise.all([request(path, owner.token, body, 'PUT'), request(path, owner.token, body, 'PUT')]); assert.deepEqual(responses.map(row => row.status).sort(), [200, 409]);
  project = await ok(path, owner.token); assert.equal(project.history.length, previousLength + 1);
  const end = project.history.at(-1).changes.find(change => change.type === 'Zmiana godziny końca zamówienia'); assert.ok(end); assert.match(end.before, /11:30$/); assert.match(end.after, /11:45$/);
  assert.equal((await request(path, foreign.token)).status, 404); assert.equal((await request(path)).status, 401);
  await page.getByRole('dialog', { name: 'Notatki i zdjęcia', exact: true }).getByRole('button', { name: 'Zamknij', exact: true }).click();
  await page.getByRole('dialog', { name: 'Szczegóły zamówienia — Anita Kowalska', exact: true }).getByRole('button', { name: 'Historia zmian', exact: true }).click();
  await history(page).getByText(end.before, { exact: true }).waitFor(); await history(page).getByText(end.after, { exact: true }).waitFor(); await page.keyboard.press('Escape');
  await page.goto(`http://localhost:3001/orders/multi-session?source=manual&project=${id}`); await page.getByRole('dialog', { name: 'Edytor projektu', exact: true }).getByRole('button', { name: 'Historia zmian', exact: true }).click(); await history(page).getByText(end.after, { exact: true }).waitFor(); await page.keyboard.press('Escape');
  const completed = await ok(`${path}/complete`, owner.token, { revision: project.revision, confirmCompletion: true }); assert.equal(completed.status, 'completed'); assert.equal(completed.history.at(-1).changes[0].type, 'Zakończenie zamówienia');
  assert.equal((await request(`${path}/complete`, owner.token, { revision: project.revision, confirmCompletion: true })).status, 409); assert.equal((await ok(path, owner.token)).history.length, completed.history.length);
  fs.writeFileSync('tmp/order-history-integration.json', JSON.stringify({ status: 'PASS', checks: ['Figma 1177×343 geometry and exact timeline asset', 'mobile horizontal table scrolling', 'real draft session/price changes survive reload', 'saved project before/after values', 'note edits retained in private history', 'concurrent stale save does not add history', 'calendar project history button', 'ownership and authentication', 'completion audit and retry safety'] }, null, 2));
  console.log('PASS: order history UI, draft persistence, server before/after audit, access boundaries and concurrent writes.');
};

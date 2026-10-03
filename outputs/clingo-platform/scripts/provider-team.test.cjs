const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');
const { ProviderService } = require('../apps/api/dist/provider/provider.service');
const { employeeInput, revisionInput } = require('../apps/api/dist/provider/provider.input');
const apiRequire = require('node:module').createRequire(resolve(__dirname, '../apps/api/package.json'));
const { UnauthorizedException } = apiRequire('@nestjs/common');

function loadTs(path, imports = {}) {
  const module = { exports: {} };
  new Function('module', 'exports', 'require', ts.transpileModule(readFileSync(resolve(__dirname, path), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText)(module, module.exports, name => imports[name] ?? require(name));
  return module.exports;
}
const client = loadTs('../apps/provider/lib/provider-client.ts');
const dates = loadTs('../apps/provider/lib/provider-schedule.ts', { './provider-client': client });
const draft = () => ({ ...client.newEmployee(), name: '  Jan Żak  ', email: 'JAN@example.test', phone: '+48 123 456 789' });
const status = code => error => error.getStatus() === code;

test('re-login restores local destinations and rejects external or looping redirects', () => {
  const origin = 'http://panel.test';
  for (const path of ['/', '/orders?status=active', '/employees/edit?id=abc', '/settings']) assert.equal(client.loginDestination(path, origin), path);
  for (const path of [null, '//foreign.test', '/\\foreign.test', '/\t/foreign.test', 'https://foreign.test', '/login']) assert.equal(client.loginDestination(path, origin), '/employees');
});

test('input preserves real contact data and normalizes name/email', () => {
  const result = employeeInput(draft());
  assert.equal(result.name, 'Jan Żak'); assert.equal(result.email, 'jan@example.test');
  assert.equal(result.schedule.length, 7); assert.equal(client.weekMinutes(result), 0);
});
test('rejects invalid, duplicate, missing or forged schedule fields', () => {
  for (const change of [
    { schedule: [] }, { services: ['homes', 'homes'] }, { services: ['fake'] },
    { accountId: 'someone-else' }, { role: 'admin' }, { showInCalendar: 'true' },
    { name: ' ' }, { phone: 'incorrect' }, { email: 'invalid' },
    { schedule: Array(7).fill({ day: 0, enabled: true, start: '08:00', end: '16:00' }) }
  ]) assert.throws(() => employeeInput({ ...draft(), ...change }), status(400));
  for (const [start, end] of [['24:00', '25:00'], ['16:00', '08:00'], ['08:00', '08:00'], ['', '10:00']]) {
    const input = draft(); input.schedule[0] = { ...input.schedule[0], enabled: true, start, end };
    assert.throws(() => employeeInput(input), status(400));
  }
  for (const value of [undefined, '1', 0, -1, 1.1]) assert.throws(() => revisionInput(value), status(400));
});

function setup(role = 'owner') {
  const rows = new Map(); let count = 0;
  const auth = { async sessionUser(token) { if (!token) throw new UnauthorizedException(); return { id: token, email: `${token}@example.test` }; } };
  const memberships = { async findOneBy({ userId }) { return userId === 'none' ? null : { accountId: userId === 'b' ? 'account-b' : 'account-a', role }; } };
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const employees = {
    create: value => ({ revision: 1, ...value }),
    async save(value) { const row = { ...value, id: `id-${++count}` }; rows.set(row.id, row); return { ...row }; },
    async find({ where }) { return [...rows.values()].filter(row => matches(row, where)); },
    async findOneBy(where) { const row = [...rows.values()].find(row => matches(row, where)); return row ? { ...row } : null; },
    async update(where, change) { const row = rows.get(where.id); if (!row || !matches(row, where)) return { affected: 0 }; rows.set(row.id, { ...row, ...change }); return { affected: 1 }; },
    async delete(where) { const row = rows.get(where.id); if (!row || !matches(row, where)) return { affected: 0 }; rows.delete(row.id); return { affected: 1 }; }
  };
  return new ProviderService(auth, memberships, employees);
}
test('requires a valid login, provider membership and management role', async () => {
  await assert.rejects(() => setup().list(), status(401));
  await assert.rejects(() => setup().list('none'), status(403));
  for (const action of [service => service.list('a'), service => service.create('a', draft()), service => service.update('a', 'id-1', draft()), service => service.remove('a', 'id-1', { revision: 1 })]) {
    await assert.rejects(() => action(setup('employee')), status(403));
  }
  assert.equal((await setup('admin').create('a', draft())).name, 'Jan Żak');
});
test('isolates all employee operations by provider account', async () => {
  const service = setup(); const employee = await service.create('a', draft());
  assert.equal((await service.list('a')).length, 1); assert.deepEqual(await service.list('b'), []);
  await assert.rejects(() => service.get('b', employee.id), status(404));
  await assert.rejects(() => service.update('b', employee.id, { ...draft(), revision: 1 }), status(404));
  await assert.rejects(() => service.remove('b', employee.id, { revision: 1 }), status(404));
  assert.equal((await service.get('a', employee.id)).revision, 1);
});
test('only one competing save wins; stale writes and deletes do not discard changes', async () => {
  const service = setup(); const employee = await service.create('a', draft());
  const results = await Promise.allSettled(['First', 'Second'].map(name => service.update('a', employee.id, { ...draft(), name, revision: 1 })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.getStatus(), 409);
  await assert.rejects(() => service.remove('a', employee.id, { revision: 1 }), status(409));
  assert.equal((await service.get('a', employee.id)).revision, 2);
  await service.remove('a', employee.id, { revision: 2 });
  await assert.rejects(() => service.get('a', employee.id), status(404));
});
test('schedule totals count minutes, disabled days, actual months and year boundaries', () => {
  const employee = draft(); employee.schedule[0] = { day: 1, enabled: true, start: '08:15', end: '16:45' };
  assert.equal(client.weekMinutes(employee), 510); assert.equal(client.hoursLabel(510), '8h 30min');
  assert.equal(dates.monthMinutes(employee, '2026-02-12'), 4 * 510);
  assert.deepEqual(dates.weekDates('2026-01-01'), ['2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']);
  assert.equal(dates.shiftDate('2026-03-29', 1), '2026-03-30');
  assert.equal(dates.shiftDate('2026-10-25', 1), '2026-10-26');
  assert.equal(client.normalized('Żak Łukasz'), 'zak lukasz');
});
test('CSV uses actual saved times and neutralizes spreadsheet formulas', () => {
  const employee = draft(); employee.name = '=HYPERLINK("bad")';
  const csv = dates.scheduleCsv([employee], ['2026-09-24']);
  assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"Wolne";"";"0"'));
});

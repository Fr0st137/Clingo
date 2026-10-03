const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const ts = require('typescript');
function loadTs(file) {
  const module = { exports: {} };
  new Function('module', 'exports', 'require', ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(module, module.exports, path => path.startsWith('.') ? loadTs(resolve(dirname(file), path + '.ts')) : require(path));
  return module.exports;
}
const { analyzeJobs, rangeDays, employeeKey, analyticsCsv, percentageChange } = loadTs(resolve(__dirname, '../apps/provider/lib/provider-analytics.ts'));
const filters = { start: '2026-09-01', end: '2026-09-30', offer: '', employee: '' };
const job = (id, changes = {}) => ({ id, date: '2026-09-01', status: 'completed', clientId: 'client', offerId: 'offer', employeeId: 'employee', employeeName: 'Anna', serviceTitle: 'Sprzątanie', priceMinor: 10001, durationMinutes: 90, startMinute: 480, ...changes });

test('inclusive date windows handle leap years, DST and invalid input', () => {
  assert.equal(rangeDays('2024-02-28', '2024-03-01'), 3);
  assert.equal(rangeDays('2026-03-28', '2026-03-30'), 3);
  for (const [start, end] of [['', '2026-01-01'], ['2026-02-29', '2026-03-01'], ['2026-04-31', '2026-05-01'], ['2026-01-02', '2026-01-01'], ['2024-01-01', '2025-01-01']]) assert.equal(rangeDays(start, end), 0);
  assert.equal(analyzeJobs([], { ...filters, start: '' }), null);
});
test('totals exclude cancelled and scheduled jobs and preserve integer cents', () => {
  const report = analyzeJobs([job('a'), job('b', { date: '2026-09-30', priceMinor: 19999, durationMinutes: 30 }), job('c', { status: 'cancelled' }), job('d', { status: 'scheduled' }), job('e', { date: '2026-10-01' }), job('f', { date: '2026-08-02', priceMinor: 15000 })], filters);
  assert.deepEqual(report.totals, { value: 30000, count: 2, hours: 2, average: 15000 });
  assert.equal(report.previousStart, '2026-08-02');
  assert.equal(report.previousEnd, '2026-08-31');
  assert.equal(report.previousTotals.value, 15000);
  assert.deepEqual(report.counts, { completed: 2, cancelled: 1, scheduled: 1 });
  assert.equal(report.series.reduce((sum, point) => sum + point.current.value, 0), 30000);
  assert.equal(report.series.reduce((sum, point) => sum + point.previous.value, 0), 15000);
  assert.equal(report.series.at(-1).end, filters.end);
});
test('service and employee filters apply to both periods and rankings use IDs', () => {
  const jobs = [job('a'), job('b', { offerId: 'other' }), job('c', { employeeId: 'other' }), job('d', { date: '2026-08-10' }), job('e', { date: '2026-08-10', offerId: 'other' })];
  const report = analyzeJobs(jobs, { ...filters, offer: 'offer', employee: 'employee' });
  assert.equal(report.totals.count, 1);
  assert.equal(report.previousTotals.count, 1);
  assert.equal(analyzeJobs(jobs, filters).services.length, 2);
  assert.equal(analyzeJobs(jobs, filters).employees.length, 2);
  const removed = job('x', { employeeId: null });
  assert.notEqual(employeeKey(removed), employeeKey(job('y', { employeeId: null, employeeName: '' })));
  assert.equal(analyzeJobs([removed, job('z')], { ...filters, employee: employeeKey(removed) }).totals.count, 1);
});
test('returning clients count prior or same-period completions, never future or cancelled work', () => {
  const jobs = [job('a'), job('b', { date: '2026-08-01' }), job('c', { clientId: 'new' }), job('d', { clientId: 'new', date: '2026-10-01' }), job('e', { clientId: 'new', status: 'cancelled' })];
  const report = analyzeJobs(jobs, filters);
  assert.equal(report.activeClients, 2);
  assert.equal(report.returning, 1);
  assert.equal(analyzeJobs([], filters).totals.value, 0);
  assert.equal(percentageChange(1, 0), 'Brak wartości bazowej');
  assert.equal(percentageChange(0, 0), 'Bez zmian');
  assert.equal(percentageChange(0, 100), '-100%');
});
test('CSV keeps Polish amounts, quotes and multiline text and neutralizes formulas', () => {
  const csv = analyticsCsv([job('a', { serviceTitle: ' =SUM(1;2)', employeeName: 'Anna "A"\nTest' })]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\' =SUM(1;2)"'));
  assert.ok(csv.includes('"Anna ""A""\nTest"'));
  assert.ok(csv.includes('"100,01"'));
  assert.ok(csv.includes('"Zakończone"'));
});

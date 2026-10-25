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
const { dashboardAnalytics, scheduleUsage } = loadTs(resolve(__dirname, '../apps/provider/lib/provider-analytics-dashboard.ts'));
const employee = { id: 'employee', name: 'Anna', schedule: Array.from({ length: 7 }, (_, day) => ({ day, enabled: true, start: '08:00', end: '16:00' })) };
const job = (id, values = {}) => ({ id, date: '2026-09-01', startMinute: 480, durationMinutes: 120, status: 'completed', offerId: 'offer', employeeId: 'employee', employeeName: 'Anna', clientId: 'client', serviceTitle: 'Sprzątanie', notes: '', priceMinor: 10000, ...values });
const filters = { start: '2026-09-01', end: '2026-09-01', offer: '', employee: '' };
test('utilization uses the union of bookings and subtracts employee absences without double counting', () => {
  const jobs = [job('a'), job('b', { startMinute: 540, status: 'scheduled' }), job('c', { durationMinutes: 480, status: 'cancelled' })];
  let usage = scheduleUsage(jobs, [employee], [], filters.start, filters.end);
  assert.equal(usage.booked, 180); assert.equal(usage.available, 480); assert.equal(usage.rate, 37.5);
  usage = scheduleUsage(jobs, [employee], [{ employeeIds: ['employee'], employees: [], start: '2026-09-01T10:00', end: '2026-09-01T12:00' }], filters.start, filters.end);
  assert.equal(usage.available, 360); assert.equal(usage.booked, 120); assert.ok(Math.abs(usage.rate - 100 / 3) < 1e-10);
  assert.equal(usage.cells[1][0].booked, 120); assert.equal(usage.cells[1][1].available, 0);
});
test('missing schedules, unassigned jobs and full-day absence never fabricate utilization', () => {
  assert.equal(scheduleUsage([job('a')], [], [], filters.start, filters.end).rate, null);
  assert.equal(scheduleUsage([job('a', { employeeId: null })], [employee], [], filters.start, filters.end).booked, 0);
  const usage = scheduleUsage([], [employee], [{ employeeIds: ['employee'], employees: [], start: '2026-10-24T00:00', end: '2026-10-26T00:00' }], '2026-10-25', '2026-10-25');
  assert.equal(usage.available, 0); assert.equal(usage.rate, null);
  assert.equal(scheduleUsage([], [employee], [], '2026-10-25', '2026-10-25').available, 480);
  assert.equal(scheduleUsage([], [employee], [], '', '2026-10-25').rate, null);
});
test('dashboard separates statuses, compares actual periods and counts ordered extras once per order', () => {
  const jobs = [job('a', { addOns: [{ id: 'windows', label: 'Mycie okien', quantity: 4 }] }), job('b', { status: 'cancelled', priceMinor: 30000 }), job('c', { status: 'scheduled', providerMessages: [{ type: 'rescheduled' }] }), job('d', { status: 'scheduled', clientId: 'other' }), job('e', { date: '2026-08-31', priceMinor: 5000 })];
  const report = dashboardAnalytics(jobs, filters, [employee], []);
  assert.equal(report.totals.value, 10000); assert.equal(report.previousTotals.value, 5000);
  assert.deepEqual(report.status, { completed: 1, cancelled: 1, rescheduled: 1, scheduled: 1 });
  assert.equal(report.cancellationRate, 25); assert.equal(report.lostValue, 30000);
  assert.equal(report.returning, 1); assert.equal(report.newClients, 0); assert.equal(report.addOns[0].count, 1);
  assert.equal(report.services[0].perHour, 5000); assert.equal(report.services[0].previousValue, 5000);
  assert.equal(report.staff[0].value, 10000);
  const filtered = dashboardAnalytics(jobs, { ...filters, offer: 'missing' }, [employee], []);
  assert.equal(filtered.totals.value, 0); assert.equal(filtered.activeClients, 0); assert.equal(filtered.cancellationRate, 0);
});


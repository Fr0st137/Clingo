const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
function load(file) {
  file = resolve(__dirname, '..', file);
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const context = { exports, require: name => {
    if (name === 'next/navigation') return { useRouter: () => ({}) };
    if (!name.startsWith('.')) return require(name);
    const target = resolve(dirname(file), name);
    return load(existsSync(`${target}.tsx`) ? `${target}.tsx` : `${target}.ts`);
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return exports;
}
const { CustomerOrderDetails } = load('apps/web/components/customer-order-details.tsx');
const { OrderRescheduleForm } = load('apps/web/components/order-reschedule-form.tsx');
const base = { id: 'saved-order', provider: 'Stepapp', logo: 'stepapp', mode: 'Wielosesyjne', status: 'Zaplanowane zlecenie', actions: ['Przełóż zlecenie', 'Odwołaj zlecenie'], address: 'Warszawa', dateLines: [], details: 'Sprzątanie', bookingDetails: { addOns: [], sessions: [
  { startsAt: '2099-11-15T13:15:00Z', endsAt: '2099-11-15T19:00:00Z', workers: 2 },
  { startsAt: '2099-11-13T07:45:00Z', endsAt: '2099-11-13T16:00:00Z', workers: 1 }
] }, summary: { duration: '14h', lines: [], total: '300 zł' } };
const render = order => renderToStaticMarkup(React.createElement(CustomerOrderDetails, { order }));
test('chronological timeline retains the saved session index in rescheduling links', () => {
  const html = render(base);
  assert.match(html, /5087:8185/);
  assert.ok(html.indexOf('13.11.2099') < html.indexOf('15.11.2099'));
  assert.match(html, /aria-label="Przełóż sesję 1"[^>]+href="[^"]+session=1"/);
  assert.match(html, /aria-label="Przełóż sesję 2"[^>]+href="[^"]+session=0"/);
  for (const text of ['8h 15min', '5h 45min', '08:45', '17:00', '1 pracownik', '2 pracowników', '300 zł']) assert.ok(html.includes(text));
  assert.doesNotMatch(html, />Przełóż zlecenie</);
});
test('past sessions and inactive orders do not offer session changes', () => {
  const past = { ...base, bookingDetails: { sessions: [{ startsAt: '2020-11-13T07:00:00Z', endsAt: '2020-11-13T08:00:00Z', workers: 1 }] } };
  assert.doesNotMatch(render(past), /\/zamowienia\/przeloz/);
  assert.doesNotMatch(render({ ...base, status: 'Odwołane zlecenie' }), /\/zamowienia\/przeloz/);
});
test('single-session details keep their existing design and action', () => {
  const html = render({ ...base, mode: 'Jednosesyjne', bookingDetails: { addOns: [] } });
  assert.match(html, /4981:8348/);
  assert.match(html, />Przełóż zlecenie</);
  assert.doesNotMatch(html, /Harmonogram sesji/);
});
test('session link opens the requested session and month in the rescheduling form', () => {
  const html = renderToStaticMarkup(React.createElement(OrderRescheduleForm, { order: base, initialSessionIndex: 1, loadAvailability: async () => ({ error: 'test' }), save: async () => ({ data: true }) }));
  assert.match(html, /value="1" selected=""/);
  assert.match(html, /listopad 2099/);
});

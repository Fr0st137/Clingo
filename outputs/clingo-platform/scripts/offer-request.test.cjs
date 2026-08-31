const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadSource(path, dependencies = {}) {
  const context = { exports: {}, require: (id) => {
    if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`);
    return dependencies[id];
  } };
  vm.runInNewContext(ts.transpileModule(readFileSync(resolve(__dirname, path), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText, context);
  return context.exports;
}
const coverage = loadSource('../apps/api/src/dashboard/service-area.ts');
const { offerRequestState, offerAddOnQuantities, pricingArea, requestPricing } = loadSource('../apps/web/lib/offer-request.ts', {
  '../../api/src/dashboard/service-area': coverage
});
const profile = {
  metrics: [{ id: 'location', label: 'Obsługiwany obszar', value: 'Warszawa' }],
  pricing: [{ id: 'single-62', label: 'Sprzątanie mieszkania 62m²' }, { id: 'single-80', label: 'Sprzątanie mieszkania 80 m²' }],
  addOns: [{ id: 'oven', selected: true }]
};

test('missing or invalid area and either missing field keep checkout unavailable', () => {
  for (const area of ['', ' ', '0', '-2', 'NaN', 'Infinity', 'not-an-area', '75']) {
    assert.equal(offerRequestState(profile, area, 'Warszawa, Testowa 1'), 'missing');
  }
  assert.equal(offerRequestState(profile, '62', ''), 'missing');
  assert.equal(offerRequestState(profile, '62', '  '), 'missing');
});

test('a supported locality restores checkout only with an available pricing area', () => {
  for (const address of ['Warszawa, Floriańska 48', '  WARSZAWA , Testowa 1 ', 'Testowa 1, 00-001 Warszawa', 'Testowa 1 00-001 Warszawa']) {
    assert.equal(offerRequestState(profile, '62', address), 'ready');
  }
  assert.equal(pricingArea(profile.pricing[1]), 80);
});

test('other cities and similarly named streets cannot activate checkout', () => {
  for (const address of ['Kraków, Floriańska 48', 'Warszawska 1, Kraków', 'Nowa Warszawa, Testowa 1', 'Warszawa Zachodnia, Testowa 1']) {
    assert.equal(offerRequestState(profile, '62', address), 'unsupported-location');
  }
});

test('coverage is provider-specific, accepts Polish names and never falls back to the office address', () => {
  const other = { ...profile, metrics: [{ id: 'location', label: 'Obsługiwany obszar', value: 'Łódź; Zgierz' }] };
  assert.equal(offerRequestState(other, '62', 'Lodz, Testowa 1'), 'ready');
  assert.equal(offerRequestState(other, '62', 'Zgierz, Testowa 1'), 'ready');
  assert.equal(offerRequestState(other, '62', 'Warszawa, Testowa 1'), 'unsupported-location');
  assert.equal(offerRequestState({ ...profile, metrics: [], location: 'Warszawa' }, '62', 'Warszawa, Testowa 1'), 'unknown-area');
});

test('only explicit, available add-ons are restored; demo selections do not alter the price', () => {
  assert.equal(Object.keys(offerAddOnQuantities(profile)).length, 0);
  assert.equal(offerAddOnQuantities(profile, 'oven:2').oven, 2);
  for (const value of ['oven:-1', 'oven:21', 'oven:1.5', 'missing:1']) {
    assert.equal(Object.keys(offerAddOnQuantities(profile, value)).length, 0);
  }
});

test('refresh and checkout preserve extended packages and correct mismatched fixed-area variants', () => {
  const pricing = [...profile.pricing, { id: 'extended', label: 'Sprzątanie rozszerzone' }];
  assert.equal(requestPricing(pricing, '80', 'extended').id, 'extended');
  assert.equal(requestPricing(pricing, '80', 'single-62').id, 'single-80');
  assert.equal(requestPricing(pricing, '62', 'missing').id, 'single-62');
});

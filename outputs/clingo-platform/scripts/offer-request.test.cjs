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
const { offerRequestState, offerAddOnQuantities, pricingArea, requestPricing, profilePricing, profileBookingMode } = loadSource('../apps/web/lib/offer-request.ts', {
  '../../api/src/dashboard/service-area': coverage,
  '../../api/src/dashboard/booking-policy': loadSource('../apps/api/src/dashboard/booking-policy.ts'),
  '../../api/src/dashboard/area-pricing': loadSource('../apps/api/src/dashboard/area-pricing.ts')
});

test('R02: catalogue/checkout mode follows selected area and timed extras, not a static profile tag', () => {
  const areaProfile = { tags: ['Jednosesyjne'], areaPricing: { rateMinor: 150, minutesPer100: 180, minimum: 15, maximum: 1000, maxSessionMinutes: 720 }, pricing: [], addOns: [{ id: 'ironing', durationMinutes: 30 }] };
  assert.equal(profileBookingMode(areaProfile, { pricingId: 'area-100' }), 'single');
  assert.equal(profileBookingMode(areaProfile, { pricingId: 'area-500' }), 'multi');
  assert.equal(profileBookingMode(areaProfile, { pricingId: 'area-400', addOns: [{ id: 'ironing', quantity: 1 }] }), 'multi');
  assert.equal(profileBookingMode(areaProfile, { pricingId: 'area-100', splitIntoSessions: true }), 'multi');
});
const profile = {
  metrics: [{ id: 'location', label: 'Obsługiwany obszar', value: 'Warszawa' }],
  pricing: [{ id: 'single-62', label: 'Sprzątanie mieszkania 62m²' }, { id: 'single-80', label: 'Sprzątanie mieszkania 80 m²' }],
  addOns: [{ id: 'oven', selected: true }]
};

test('published area pricing uses the exact requested area in preview and checkout', () => {
  const dynamic = { ...profile, areaPricing: { rateMinor: 237, minutesPer100: 180, minimum: 15, maximum: 400 } };
  const pricing = profilePricing(dynamic, '62,5', 'single-80');
  assert.equal(pricing.id, 'area-62.5');
  assert.equal(pricing.priceValue, 148.13);
  assert.equal(pricing.duration, '2 godz. 0 min');
  assert.equal(offerRequestState(dynamic, '62,5', 'Warszawa, Testowa 1'), 'ready');
  for (const area of ['14', '401', '-1', '0', 'NaN', '62.555']) {
    assert.equal(profilePricing(dynamic, area), undefined);
    assert.equal(offerRequestState(dynamic, area, 'Warszawa, Testowa 1'), 'missing');
  }
});

test('missing or invalid area and either missing field keep checkout unavailable', () => {
  for (const area of ['', ' ', '0', '-2', 'NaN', 'Infinity', 'not-an-area', '81']) {
    assert.equal(offerRequestState(profile, area, 'Warszawa, Testowa 1'), 'missing');
  }
  assert.equal(offerRequestState(profile, '62', ''), 'missing');
  assert.equal(offerRequestState(profile, '62', '  '), 'missing');
});

test('a supported locality restores checkout only with an available pricing area', () => {
  for (const address of ['Warszawa, Floriańska 48', '  WARSZAWA , Testowa 1 ', 'Testowa 1, 00-001 Warszawa', 'Testowa 1 00-001 Warszawa']) {
    assert.equal(offerRequestState(profile, '62', address), 'ready');
  }
  assert.equal(offerRequestState(profile, '60', 'Warszawa, Testowa 1'), 'ready');
  assert.equal(offerRequestState(profile, '75', 'Warszawa, Testowa 1'), 'ready');
  assert.equal(requestPricing(profile.pricing, '60').id, 'single-62');
  assert.equal(requestPricing(profile.pricing, '75').id, 'single-80');
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

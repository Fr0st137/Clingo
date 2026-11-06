const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const { resolve } = require('node:path');
const { quoteBooking } = require('../apps/api/dist/dashboard/booking');
const quoteRules = require('../apps/api/dist/dashboard/booking-quote');
function load(path, dependencies = {}) {
  const context = { exports: {}, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(resolve(__dirname, path), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.exports;
}
const addons = load('../apps/web/lib/add-on-selection.ts');
const request = load('../apps/web/lib/offer-request.ts', {
  './add-on-selection': addons,
  '../../api/src/dashboard/service-area': require('../apps/api/dist/dashboard/service-area'),
  '../../api/src/dashboard/booking-policy': require('../apps/api/dist/dashboard/booking-policy'),
  '../../api/src/dashboard/area-pricing': require('../apps/api/dist/dashboard/area-pricing')
});
const { quoteCatalogueListing } = load('../apps/web/lib/catalogue-quote.ts', {
  '../../api/src/dashboard/booking-quote': quoteRules, './offer-request': request, './add-on-selection': addons
});
const offer = {
  pricing: [{ id: '62', label: 'Mieszkanie 62 m²', priceValue: 165, duration: '3 godziny 15 minut' }, { id: '80', label: 'Mieszkanie 80 m²', priceValue: 220, duration: '4 godz.' }],
  frequencies: [{ id: 'once', label: 'Jednorazowo', discount: '0%' }, { id: 'weekly', label: 'Co tydzień', discount: '-8%' }],
  addOns: [{ id: 'oven-cleaning', label: 'Piekarnik', priceValue: 24, durationMinutes: 25 }]
};
test('K02: legacy offers include the selected area tier and every addon unit', () => {
  for (const [area, pricingId, expected] of [['62', '62', 213], ['75', '80', 268]]) {
    const quote = quoteCatalogueListing(offer, area, 'oven-cleaning:2');
    assert.equal(quote.totalValue, expected);
    assert.deepEqual(JSON.parse(JSON.stringify(quote)), quoteBooking(offer, { pricingId, frequencyId: 'once', addOns: [{ id: 'oven-cleaning', quantity: 2 }] }));
  }
  assert.equal(quoteCatalogueListing(offer, '81'), undefined);
  assert.equal(quoteCatalogueListing(offer, '62', 'unavailable:1'), undefined);
});
test('K02: exact-area pricing and decimal additions use server rounding', () => {
  const dynamic = { ...offer, areaPricing: { rateMinor: 237, minutesPer100: 180, minimum: 15, maximum: 400 }, addOns: [{ id: 'small', label: 'Dodatek', priceValue: 0.29, durationMinutes: 15 }] };
  const quote = quoteCatalogueListing(dynamic, '62,5', 'small:2');
  assert.equal(quote.totalValue, 148.71);
  assert.equal(quote.durationMinutes, 150);
  assert.deepEqual(JSON.parse(JSON.stringify(quote)), quoteBooking(dynamic, { pricingId: 'area-62.5', frequencyId: 'once', addOns: [{ id: 'small', quantity: 2 }] }));
  const weekly = quoteRules.calculateBookingQuote(dynamic, { pricingId: 'area-62.5', frequencyId: 'weekly', addOns: [{ id: 'small', quantity: 2 }] });
  assert.equal(weekly.baseValue, 136.28);
  assert.equal(weekly.totalValue, 136.86);
  for (const area of ['14', '401', '62.555']) assert.equal(quoteCatalogueListing(dynamic, area), undefined);
});
test('K02: addons can change session mode without applying a recurring discount to multi-session work', () => {
  const dynamic = { ...offer, areaPricing: { rateMinor: 150, minutesPer100: 180, minimum: 15, maximum: 1000, maxSessionMinutes: 180 } };
  assert.equal(quoteCatalogueListing(dynamic, '100').mode, 'single');
  assert.equal(quoteCatalogueListing(dynamic, '100', 'oven-cleaning:1').mode, 'multi');
  const multi = quoteRules.calculateBookingQuote(dynamic, { pricingId: 'area-100', frequencyId: 'weekly', addOns: [{ id: 'oven-cleaning', quantity: 1 }] });
  assert.equal(multi.frequencyId, 'once');
  assert.equal(multi.totalValue, 174);
});
test('K02: board and profile restore identical historical addon links and quantity limits', () => {
  for (const value of ['piekarnik:2', 'oven-cleaning:2', 'piekarnik:1,oven-cleaning:1', 'oven-cleaning', 'oven-cleaning:20,oven-cleaning:3']) {
    const fromBoard = quoteCatalogueListing(offer, '62', value);
    const fromProfile = request.offerAddOnQuantities(offer, value);
    assert.equal(fromBoard.addOns[0].quantity, fromProfile['oven-cleaning']);
    assert.equal(fromBoard.totalValue, 165 + 24 * fromProfile['oven-cleaning']);
  }
  for (const value of ['oven-cleaning:-1', 'oven-cleaning:21', 'oven-cleaning:1.5', 'oven-cleaning:NaN']) {
    assert.equal(quoteCatalogueListing(offer, '62', value).totalValue, 165);
    assert.equal(Object.keys(request.offerAddOnQuantities(offer, value)).length, 0);
  }
});

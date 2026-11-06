const { test } = require('node:test');
const assert = require('node:assert/strict');
const { areaPricingOption } = require('../apps/api/dist/dashboard/area-pricing');
const { quoteBooking, daySlots, warsawDate } = require('../apps/api/dist/dashboard/booking');
const { publishOffer } = require('../apps/api/dist/provider/provider-offer-publication');
const { defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const { ProviderProfileEntity } = require('../apps/api/dist/dashboard/provider-profile.entity');
const { BookingService } = require('../apps/api/dist/dashboard/booking.service');
const { bookingJobs } = require('../apps/api/dist/dashboard/booking-bridge');
const { addLocalDays, localDate } = require('../apps/api/dist/dashboard/booking');

const pricing = { rateMinor: 237, minutesPer100: 180, minimum: 15, maximum: 1000, workerTiers: [
  { minSquareMeters: 15, maxSquareMeters: 50, workers: 1 },
  { minSquareMeters: 51, maxSquareMeters: 150, workers: 2 },
  { minSquareMeters: 151, maxSquareMeters: null, workers: 3 }
] };
const offer = { areaPricing: pricing, frequencies: [{ id: 'once', label: 'Jednorazowo', discount: '0%' }], addOns: [{ id: 'ironing', label: 'Prasowanie', priceValue: 30, durationMinutes: 30 }] };

test('R01: workload is divided by the staffing tier, with prices independent of staff count', () => {
  for (const [area, workers, duration] of [[50, 1, '1 godz. 30 min'], [51, 2, '1 godz. 0 min'], [100, 2, '1 godz. 30 min'], [150, 2, '2 godz. 15 min'], [151, 3, '1 godz. 45 min'], [1000, 3, '10 godz. 0 min']]) {
    const result = areaPricingOption(pricing, `area-${area}`);
    assert.equal(result.estimatedWorkers, workers);
    assert.equal(result.duration, duration);
    assert.equal(result.priceValue, Math.round(area * 237) / 100);
  }
});

test('R01: fractional area chooses the next whole-metre staffing boundary without changing billed area', () => {
  const result = areaPricingOption(pricing, 'area-50.5');
  assert.equal(result.estimatedWorkers, 2);
  assert.equal(result.priceValue, 119.69);
  assert.equal(result.duration, '1 godz. 0 min');
  for (const id of ['area-14', 'area-1001', 'area-NaN']) assert.equal(areaPricingOption(pricing, id), undefined);
  assert.equal(areaPricingOption({ ...pricing, workerTiers: [] }, 'area-100'), undefined);
  assert.equal(areaPricingOption({ ...pricing, workerTiers: [{ minSquareMeters: 1, maxSquareMeters: null, workers: 0 }] }, 'area-100'), undefined);
});

test('R01: legacy area profiles without tiers retain the single-worker duration', () => {
  const { workerTiers, ...legacy } = pricing;
  assert.equal(areaPricingOption(legacy, 'area-100').duration, '3 godz. 0 min');
  assert.equal(areaPricingOption(legacy, 'area-100').estimatedWorkers, 1);
});

test('R01: quote and free slots use the same team duration, retaining existing extra duration and prices', () => {
  const selection = { pricingId: 'area-100', frequencyId: 'once', addOns: [{ id: 'ironing', quantity: 1 }] };
  const quote = quoteBooking(offer, selection);
  assert.equal(quote.estimatedWorkers, 2);
  assert.equal(quote.durationMinutes, 120);
  assert.equal(quote.totalValue, 267);
  const slots = daySlots('2026-11-02', quote.durationMinutes, [], { days: [1], startHour: 8, endHour: 10, bufferMinutes: 0, leadHours: 0 }, warsawDate('2026-11-01', '12:00'));
  assert.equal(slots.length, 1);
  assert.equal(slots[0].time, '08:00');
  assert.equal(Date.parse(slots[0].endsAt) - Date.parse(slots[0].startsAt), 120 * 60_000);
});

test('R01: publication preserves staffing tiers for every selected area', async () => {
  let profile;
  const manager = { findOneBy: async () => null, create: (_entity, row) => row, save: async (entity, row) => { if (entity === ProviderProfileEntity) profile = row; return row; } };
  const configuration = { ...defaultOfferConfiguration(), standardsAccepted: true };
  await publishOffer(manager, { id: 'offer', status: 'published', title: 'Sprzątanie', description: 'Zakres sprzątania', configuration }, { id: 'account', name: 'Zespół', location: { city: 'Warszawa' } });
  assert.deepEqual(profile.areaPricing.workerTiers, configuration.areaTiers);
  const quote = quoteBooking(profile, { pricingId: 'area-100', frequencyId: 'once' });
  assert.equal(quote.durationMinutes, 90);
  assert.equal(quote.estimatedWorkers, 2);
});

test('R01: reservation persists the duration and staffing estimate, keeping its snapshot after offer changes', async () => {
  let saved;
  const manager = {
    createQueryBuilder: () => ({ where() { return this; }, andWhere() { return this; }, getOne: async () => null }),
    create: (_entity, row) => row, save: async row => { saved = { ...row, id: 'booking' }; return saved; }
  };
  const service = new BookingService({ transaction: callback => callback(manager) });
  const current = { ...offer, id: 'profile', provider: 'Zespół', service: 'Sprzątanie', metrics: [{ id: 'location', label: 'Obszar', value: 'Warszawa' }], bookingSettings: { days: [0,1,2,3,4,5,6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 } };
  service.offer = async () => current; service.busy = async () => [];
  const date = addLocalDays(localDate(new Date()), 1), start = warsawDate(date, '08:00');
  await service.create({ providerId: 'profile', pricingId: 'area-100', frequencyId: 'once', addOns: [], startsAt: start.toISOString(), address: 'Testowa 1, Warszawa', contactName: 'Anna', accessMethod: 'someone-present', contactPhone: '500600700', requestId: '22222222-2222-4222-8222-222222222222', expectedTotal: 237 }, 'customer@example.test');
  assert.equal(saved.endsAt.getTime() - saved.startsAt.getTime(), 90 * 60_000);
  assert.equal(saved.selectedOptions.estimatedWorkers, 2);
  const revised = { ...current, areaPricing: { ...pricing, workerTiers: pricing.workerTiers.map(row => ({ ...row, workers: 1 })) } };
  assert.equal(quoteBooking(revised, { pricingId: 'area-100', frequencyId: 'once' }).durationMinutes, 180);
  const [job] = bookingJobs(saved);
  assert.equal(job.estimatedWorkers, 2); assert.equal(job.durationMinutes, 90); assert.equal(job.priceMinor, 23700);
});

test('R01: existing multi-session planning reports the same staffing assumption as the area quote', async () => {
  const service = new BookingService({});
  service.offer = async () => ({ ...offer, id: 'profile', tags: ['Wielosesyjne'], bookingSettings: { days: [0,1,2,3,4,5,6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 } });
  service.busy = async () => [];
  const result = await service.multiSchedule({ providerId: 'profile', pricingId: 'area-200', frequencyId: 'once', startsAt: warsawDate(addLocalDays(localDate(new Date()), 1), '08:00').toISOString() });
  assert.equal(result.quote.durationMinutes, 120);
  assert.equal(result.quote.estimatedWorkers, 3);
  assert.equal(result.sessions.reduce((sum, row) => sum + row.durationMinutes, 0), 120);
  assert.ok(result.sessions.every(row => row.workers === 3));
});

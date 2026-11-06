const { test } = require('node:test');
const assert = require('node:assert/strict');
const { quoteBooking, planBookingSessions, warsawDate, daySlots, localDate, addLocalDays } = require('../apps/api/dist/dashboard/booking');
const { BookingService } = require('../apps/api/dist/dashboard/booking.service');
const { publishOffer } = require('../apps/api/dist/provider/provider-offer-publication');
const { defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const { ProviderProfileEntity } = require('../apps/api/dist/dashboard/provider-profile.entity');
const { bookingJobs } = require('../apps/api/dist/dashboard/booking-bridge');

const hours = { days: [1,2,3,4,5,6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 };
const now = warsawDate('2026-11-01', '12:00');
const minutes = rows => rows.reduce((sum, row) => sum + (row.endsAt - row.startsAt) / 60_000, 0);
const areaPricing = { rateMinor: 150, minutesPer100: 180, minimum: 15, maximum: 1000, maxSessionMinutes: 720, workerTiers: [{ minSquareMeters: 15, maxSquareMeters: null, workers: 1 }] };
const offer = { id: 'profile', provider: 'Zespół', service: 'Sprzątanie', tags: ['Jednosesyjne'], areaPricing, bookingSettings: hours, metrics: [{ id: 'location', label: 'Obszar', value: 'Warszawa' }], frequencies: [{ id: 'once', label: 'Jednorazowo', discount: '0%' }, { id: 'weekly', label: 'Co tydzień', discount: '-20%' }], addOns: [{ id: 'ironing', label: 'Prasowanie', priceValue: 30, durationMinutes: 30 }] };

test('R02: publication retains the whole configured area, even when the minimum needs several days', async () => {
  let profile;
  const manager = { findOneBy: async () => null, create: (_entity, value) => value, save: async (entity, value) => { if (entity === ProviderProfileEntity) profile = value; return value; } };
  const configuration = { ...defaultOfferConfiguration(), standardsAccepted: true, areaTiers: [{ minSquareMeters: 500, maxSquareMeters: 1000, workers: 1 }] };
  await publishOffer(manager, { id: 'offer', status: 'published', title: 'Duże sprzątanie', description: 'Zakres usługi', configuration }, { id: 'account', name: 'Zespół', location: { city: 'Warszawa' } });
  assert.equal(profile.areaPricing.maximum, 1000);
  assert.deepEqual(profile.tags, ['Wielosesyjne']);
  const quote = quoteBooking(profile, { pricingId: 'area-1000', frequencyId: 'once' });
  assert.equal(quote.mode, 'multi'); assert.equal(quote.durationMinutes, 1800); assert.equal(quote.totalValue, 1500);
});

test('R02: mode follows area, staffing, extra duration and working day; multi-session projects use a single-job price', () => {
  assert.equal(quoteBooking(offer, { pricingId: 'area-400', frequencyId: 'once' }).mode, 'single');
  const quote = quoteBooking(offer, { pricingId: 'area-400', frequencyId: 'weekly', addOns: [{ id: 'ironing', quantity: 1 }] });
  assert.equal(quote.mode, 'multi'); assert.equal(quote.durationMinutes, 750); assert.equal(quote.frequencyId, 'once'); assert.equal(quote.totalValue, 630);
  assert.equal(quoteBooking({ ...offer, bookingSettings: { ...hours, endHour: 12 } }, { pricingId: 'area-200', frequencyId: 'once' }).mode, 'multi');
  assert.equal(quoteBooking({ ...offer, areaPricing: { ...areaPricing, workerTiers: [{ minSquareMeters: 15, maxSquareMeters: null, workers: 2 }] } }, { pricingId: 'area-400', frequencyId: 'once' }).mode, 'single');
});

test('R02: planning uses the selected late start and the next free day, preserving every required minute', () => {
  const rows = planBookingSessions(900, warsawDate('2026-11-02', '17:00'), [], hours, now);
  assert.equal(rows.length, 2); assert.equal(minutes(rows), 900);
  assert.equal(rows[0].endsAt.toISOString(), warsawDate('2026-11-02', '20:00').toISOString());
  assert.equal(rows[1].startsAt.toISOString(), warsawDate('2026-11-03', '08:00').toISOString());
  assert.equal(rows[1].endsAt.toISOString(), warsawDate('2026-11-03', '20:00').toISOString());
});

test('R02: fragmented windows respect existing bookings and buffers, rather than demanding a fixed-size session', () => {
  const work = { ...hours, endHour: 16, bufferMinutes: 15 };
  const busy = [{ startsAt: warsawDate('2026-11-02', '11:00'), endsAt: warsawDate('2026-11-02', '13:00') }];
  const rows = planBookingSessions(600, warsawDate('2026-11-02', '08:00'), busy, work, now);
  assert.equal(rows.length, 3); assert.equal(minutes(rows), 600);
  assert.equal(rows[0].endsAt.toISOString(), warsawDate('2026-11-02', '10:45').toISOString());
  assert.equal(rows[1].startsAt.toISOString(), warsawDate('2026-11-02', '13:15').toISOString());
  for (const row of rows) assert.ok(daySlots(localDate(row.startsAt), (row.endsAt - row.startsAt) / 60_000, busy, work, now).some(slot => slot.startsAt === row.startsAt.toISOString()));
});

test('R02: excluded days and customer hours replan the whole schedule; gaps and six-month horizon cannot be bypassed', () => {
  const work = { ...hours, days: [1,2,3,4,5], startHour: 10, endHour: 12 };
  const rows = planBookingSessions(300, warsawDate('2026-11-02', '10:00'), [], work, now, ['2026-11-03']);
  assert.deepEqual(rows.map(row => localDate(row.startsAt)), ['2026-11-02','2026-11-04','2026-11-05']);
  assert.equal(minutes(rows), 300);
  assert.equal(localDate(planBookingSessions(300, warsawDate('2026-11-02', '10:00'), [], work, now, ['2026-11-02'])[0].startsAt), '2026-11-03');
  assert.throws(() => planBookingSessions(300, warsawDate('2026-11-02', '10:00'), [], { ...work, days: [1] }, now));
  assert.throws(() => planBookingSessions(300, warsawDate('2027-05-02', '10:00'), [], work, now));
  assert.throws(() => planBookingSessions(300, warsawDate('2026-11-02', '10:07'), [], work, now));
});

test('R02: a project longer than the old seven-day duration limit can still fit the reservation horizon', () => {
  const rows = planBookingSessions(12000, warsawDate('2026-11-02', '08:00'), [], { ...hours, days: [0,1,2,3,4,5,6] }, now);
  assert.equal(minutes(rows), 12000); assert.equal(rows.length, 17);
});

test('R02: automatic scheduling and confirmation work for an area offer without a static multi-session tag', async () => {
  let saved;
  const manager = { createQueryBuilder: () => ({ where() { return this; }, andWhere() { return this; }, getOne: async () => null }), create: (_entity, value) => value, save: async value => { saved = { ...value, id: 'booking' }; return saved; } };
  const service = new BookingService({ transaction: callback => callback(manager) });
  service.offer = async () => offer; service.busy = async () => [];
  const start = warsawDate(addLocalDays(localDate(new Date()), 1), '17:00').toISOString();
  // All weekdays avoid making this test depend on the day it is run.
  offer.bookingSettings = { ...hours, days: [0,1,2,3,4,5,6] };
  const selection = { providerId: 'profile', pricingId: 'area-500', frequencyId: 'weekly', addOns: [] };
  const generated = await service.multiSchedule({ ...selection, startsAt: start });
  assert.equal(generated.quote.mode, 'multi'); assert.equal(generated.quote.frequencyId, 'once');
  const booking = { ...selection, requestId: '22222222-2222-4222-8222-222222222222', address: 'Testowa 1, Warszawa', contactName: 'Anna', accessMethod: 'someone-present', contactPhone: '500600700', expectedTotal: 750 };
  await assert.rejects(() => service.create({ ...booking, startsAt: start }, 'a@example.test'), /wymaga harmonogramu/);
  await service.create({ ...booking, sessions: generated.sessions }, 'a@example.test');
  assert.equal(saved.mode, 'Wielosesyjne'); assert.equal(bookingJobs(saved).length, generated.sessions.length);
  assert.equal(saved.selectedOptions.frequencyLabel, 'Jednorazowo');
  assert.equal(bookingJobs(saved).reduce((sum, job) => sum + job.priceMinor, 0), 75000);
  const collision = generated.sessions[1];
  service.busy = async () => [{ startsAt: new Date(collision.startsAt), endsAt: new Date(collision.endsAt) }];
  await assert.rejects(() => service.create({ ...booking, sessions: generated.sessions }, 'a@example.test'));
});

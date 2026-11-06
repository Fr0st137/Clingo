const { test } = require('node:test'), assert = require('node:assert/strict'), sharp = require('sharp');
const { prepareBookingPhotos } = require('../apps/api/dist/dashboard/booking-photos');
const { BookingService } = require('../apps/api/dist/dashboard/booking.service');
const { BookingPhotoEntity } = require('../apps/api/dist/dashboard/booking-photo.entity');
const { localDate, addLocalDays, warsawDate } = require('../apps/api/dist/dashboard/booking');
async function image() { return 'data:image/png;base64,' + (await sharp({ create: { width: 40, height: 30, channels: 3, background: '#4295c4' } }).png().toBuffer()).toString('base64'); }
test('K06: photos are decoded and re-encoded; original metadata and client IDs are not retained', async () => {
  const rows = await prepareBookingPhotos([{ dataUrl: await image() }]);
  assert.equal(rows.length, 1); assert.equal(rows[0].label, 'Zdjęcie obszaru objętego usługą 1');
  assert.match(rows[0].id, /^[a-f0-9-]{36}$/);
  const metadata = await sharp(rows[0].data).metadata(); assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, 40); assert.equal(metadata.exif, undefined);
});
test('K06: invalid lists, borrowed IDs, excess images, malformed and animated files are rejected', async () => {
  const valid = await image();
  for (const input of [null, {}, 'url', Array(11).fill({ dataUrl: valid }), [null], [{ id: 'borrowed' }], [{ dataUrl: valid, id: 'borrowed' }], [{ dataUrl: 'https://example.test/photo.png' }], [{ dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' }], [{ dataUrl: 'data:image/png;base64,aGVsbG8=' }], [{ dataUrl: 'data:image/png;base64,' + 'A'.repeat(220000) }]]) {
    await assert.rejects(prepareBookingPhotos(input), error => error.getStatus?.() === 400);
  }
  const frames = await Promise.all(['#ff0000', '#0000ff'].map(background => sharp({ create: { width: 10, height: 10, channels: 3, background } }).png().toBuffer()));
  const animation = await sharp(frames, { join: { animated: true } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  assert.equal((await sharp(animation).metadata()).pages, 2);
  await assert.rejects(prepareBookingPhotos([{ dataUrl: 'data:image/webp;base64,' + animation.toString('base64') }]), error => error.getStatus?.() === 400);
  assert.deepEqual(await prepareBookingPhotos(undefined), []); assert.deepEqual(await prepareBookingPhotos([]), []);
});
function fixture(required) {
  let saved, inserts = [];
  const manager = { createQueryBuilder: () => ({ where() { return this; }, andWhere() { return this; }, async getOne() { return null; } }), create: (_entity, value) => value, save: async value => saved = { ...value, id: '11111111-1111-4111-8111-111111111111' }, insert: async (entity, value) => inserts.push({ entity, value }) };
  const service = new BookingService({ transaction: callback => callback(manager) });
  service.offer = async () => ({ id: 'profile', provider: 'Firma', service: 'Mycie', requiresClientPhotos: required, tags: ['Jednosesyjne'], metrics: [{ id: 'location', label: 'Obszar', value: 'Warszawa' }], pricing: [{ id: 'base', label: 'Mycie', duration: '1 godz.', priceValue: 100 }], frequencies: [{ id: 'once', label: 'Jednorazowo', discount: '0%' }], addOns: [], bookingSettings: { days: [0,1,2,3,4,5,6], startHour: 8, endHour: 20, bufferMinutes: 0, leadHours: 0 } });
  service.busy = async () => [];
  const input = { providerId: 'profile', pricingId: 'base', frequencyId: 'once', startsAt: warsawDate(addLocalDays(localDate(new Date()), 1), '08:00').toISOString(), address: 'Testowa 1, Warszawa', contactName: 'Anna', contactPhone: '500600700', accessMethod: 'someone-present', requestId: '22222222-2222-4222-8222-222222222222' };
  return { service, input, saved: () => saved, inserts };
}
test('K06: current offer requirement is enforced before saving; optional and legacy bookings still work', async () => {
  const required = fixture(true);
  await assert.rejects(required.service.create(required.input, 'customer@example.test'), /co najmniej jedno zdjęcie/);
  assert.equal(required.saved(), undefined); assert.equal(required.inserts.length, 0);
  const optional = fixture(false); await optional.service.create(optional.input, 'customer@example.test');
  assert.deepEqual(optional.saved().selectedOptions.photos, []);
});
test('K06: order and image bytes are written using the same transaction; public details contain references only', async () => {
  const f = fixture(true); await f.service.create({ ...f.input, photos: [{ dataUrl: await image() }] }, 'customer@example.test');
  assert.equal(f.inserts.length, 1); assert.equal(f.inserts[0].entity, BookingPhotoEntity); assert.equal(f.inserts[0].value.orderId, f.saved().id);
  assert.deepEqual(f.saved().selectedOptions.photos, [{ id: f.inserts[0].value.id, label: 'Zdjęcie obszaru objętego usługą 1' }]);
  assert.ok(!JSON.stringify(f.saved()).includes('data:image'));
});

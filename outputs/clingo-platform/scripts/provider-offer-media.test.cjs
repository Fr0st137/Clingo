const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const sharp = createRequire(resolve(__dirname, '../apps/api/package.json'))('sharp');
const { offerConfiguration, defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const { ProviderOffersService } = require('../apps/api/dist/provider/provider-offers.service');

test('presentation rejects remote URLs, executable formats, excessive photos and oversized image payloads', () => {
  for (const presentation of [
    { banner: 'https://example.test/image.png', gallery: [] },
    { banner: 'data:image/svg+xml;base64,AAAA', gallery: [] },
    { banner: null, gallery: Array(11).fill('data:image/png;base64,AAAA') },
    { banner: 'data:image/png;base64,' + 'A'.repeat(220001), gallery: [] }
  ]) assert.throws(() => offerConfiguration({ ...defaultOfferConfiguration(), presentation }));
  assert.deepEqual(offerConfiguration(defaultOfferConfiguration()), defaultOfferConfiguration());
});
test('image save decodes the file, rejects corrupt bytes and retains valid photographs', async () => {
  const existing = { id: 'offer', accountId: 'account', revision: 1, status: 'draft', configuration: defaultOfferConfiguration() };
  let updates;
  const service = new ProviderOffersService({ sessionUser: async () => ({ id: 'owner' }) }, { findOneBy: async () => ({ accountId: 'account', role: 'owner' }) }, { findOneBy: async () => existing, update: async (_where, input) => { updates = input; return { affected: 1 }; } });
  const payload = { title: 'Sprzątanie', category: 'homes', description: 'Opis', priceMinor: 10000, durationMinutes: 180, status: 'draft', revision: 1, configuration: { ...defaultOfferConfiguration(), presentation: { banner: 'data:image/png;base64,AAAA', gallery: [] } } };
  await assert.rejects(service.update('session', 'offer', payload), error => error.getStatus() === 400);
  assert.equal(updates, undefined);
  const bytes = await sharp({ create: { width: 100, height: 80, channels: 3, background: '#aabbcc' } }).png().toBuffer();
  const image = 'data:image/png;base64,' + bytes.toString('base64');
  payload.configuration.presentation = { banner: image, gallery: [image] };
  const saved = await service.update('session', 'offer', payload);
  assert.equal(saved.configuration.presentation.banner, image);
  assert.equal(saved.configuration.presentation.gallery.length, 1);
  assert.equal(updates.revision, 2);
});

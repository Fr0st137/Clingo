const { test } = require('node:test');
const assert = require('node:assert/strict');
const { catalogueServiceType, matchesCatalogueRequest } = require('../apps/api/dist/dashboard/catalogue-search');
const coverage = value => [{ id: 'location', label: 'Obsługiwany obszar', value }];
const home = { service: 'Sprzątanie obiektów · Mieszkań i domów', serviceMetrics: coverage('Warszawa') };

test('catalogue accepts legacy Polish/ASCII service labels without confusing homes and offices', () => {
  assert.equal(matchesCatalogueRequest(home, { service: 'Sprzatanie obiektow - Mieszkan i domow' }), true);
  assert.equal(matchesCatalogueRequest(home, { service: 'Sprzątanie obiektów · Biur i lokali użytkowych' }), false);
  assert.equal(matchesCatalogueRequest({ service: 'Sprzatanie obiektow - Biur i lokali uzytkowych' }, { service: 'offices' }), true);
});
test('the source category classifies custom offer titles and cannot be overridden by a misleading title', () => {
  assert.equal(catalogueServiceType({ service: 'Oferta Super Clean', serviceCategory: 'offices' }), 'offices');
  assert.equal(catalogueServiceType({ service: 'Malowanie dachówek', serviceCategory: 'homes' }), 'homes');
  assert.equal(matchesCatalogueRequest({ service: 'Oferta Super Clean', serviceCategory: 'offices' }, { service: 'homes' }), false);
});
test('roof/facade/renovation services keep their specific identity and service family', () => {
  const roof = { service: 'Mycie dachów', serviceCategory: 'pressure' };
  assert.equal(matchesCatalogueRequest(roof, { service: 'Mycie ciśnieniowe · Dachów skośnych i płaskich' }), true);
  for (const service of ['Mycie ciśnieniowe · Kostki, chodników, tarasów', 'Mycie ciśnieniowe · Elewacji zewnętrznych', 'Malowanie powierzchni · Dachówek']) assert.equal(matchesCatalogueRequest(roof, { service }), false);
  assert.equal(matchesCatalogueRequest(home, { service: 'Sprzątanie obiektów · Po remoncie (Mieszkań i domów)' }), false);
  assert.equal(matchesCatalogueRequest({ service: 'Malowanie powierzchni', serviceCategory: 'painting' }, { service: 'Malowanie powierzchni · Dachówek' }), false);
});
test('an address matches declared coverage rather than a similarly named street or another city', () => {
  for (const address of ['Warszawa', 'Warszawa, Testowa 1', 'Testowa 1, 00-001 WARSZAWA', 'Testowa 1 00-001 Warszawa']) assert.equal(matchesCatalogueRequest(home, { address }), true);
  for (const address of ['Kraków, Warszawska 1', 'Warszawska 1, Kraków', 'Nowa Warszawa', 'Warszawa Zachodnia', 'Testowa 1']) assert.equal(matchesCatalogueRequest(home, { address }), false);
  assert.equal(matchesCatalogueRequest({ ...home, serviceMetrics: coverage('Łódź; Zgierz') }, { address: 'Lodz, Testowa 1' }), true);
});
test('service and locality must match together; missing metadata cannot pass a requested filter', () => {
  assert.equal(matchesCatalogueRequest(home, { service: 'homes', address: 'Warszawa' }), true);
  assert.equal(matchesCatalogueRequest(home, { service: 'offices', address: 'Warszawa' }), false);
  assert.equal(matchesCatalogueRequest(home, { service: 'homes', address: 'Kraków' }), false);
  assert.equal(matchesCatalogueRequest({ service: home.service }, { address: 'Warszawa' }), false);
  assert.equal(matchesCatalogueRequest({ service: 'Nieznana usługa' }, { service: 'homes' }), false);
  assert.equal(matchesCatalogueRequest(home, { service: 'all-services' }), false);
  assert.equal(matchesCatalogueRequest({}, {}), true);
});

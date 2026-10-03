const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const apiRequire = require('node:module').createRequire(resolve(__dirname, '../apps/api/package.json'));
const { UnauthorizedException } = apiRequire('@nestjs/common');
const { ProviderSettingsService } = require('../apps/api/dist/provider/provider-settings.service');
const { contactInput, notificationsInput, emptyNotifications } = require('../apps/api/dist/provider/provider-settings.input');

const profile = () => ({ name: 'Firma A', legalName: '', phone: '', contactName: '', contactPhone: '', contactEmail: '', revision: 1 });
const preferences = () => ({ ...emptyNotifications(), revision: 1 });
const status = code => error => error.getStatus() === code;
function setup(role = 'owner') {
  const rows = new Map(['a', 'b'].map(id => [id, { id, ...profile(), name: `Firma ${id}`, profileRevision: 1, notificationsRevision: 1, notifications: emptyNotifications() }]));
  const calls = [];
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const auth = {
    async sessionUser(token) { if (!token) throw new UnauthorizedException(); return { id: token, email: `${token}@example.test`, passwordHash: 'never-export', passwordSalt: 'never-export' }; },
    async changePassword(token, body) { calls.push({ token, body }); return { token: 'rotated', message: 'Zmieniono hasło.' }; }
  };
  const memberships = { async findOneBy({ userId }) { return userId === 'none' ? null : { accountId: userId, role }; } };
  const accounts = {
    async findOneBy({ id }) { return rows.has(id) ? structuredClone(rows.get(id)) : null; },
    async update(where, input) { const row = rows.get(where.id); if (!row || !matches(row, where)) return { affected: 0 }; rows.set(where.id, { ...row, ...input }); return { affected: 1 }; }
  };
  const employees = { async find({ where }) { return where.accountId === 'a' ? [{ id: 'employee-a', name: 'Pracownik A', accountId: 'a', email: 'worker@example.test', phone: '', services: ['homes'], schedule: [], showInCalendar: true, secret: 'never-export' }] : []; } };
  return { service: new ProviderSettingsService(auth, memberships, accounts, employees), rows, calls };
}
test('profile validation normalizes contacts, allows clearing optional fields and rejects forged properties', () => {
  const saved = contactInput({ ...profile(), name: ' Firma ', contactEmail: 'CONTACT@example.test', phone: '+48 123 456 789' });
  assert.equal(saved.name, 'Firma'); assert.equal(saved.contactEmail, 'contact@example.test');
  assert.equal(saved.legalName, '');
  for (const change of [{ name: '' }, { contactEmail: 'invalid' }, { phone: 'bad' }, { contactPhone: 'abc' }, { revision: '1' }, { role: 'owner' }, { accountId: 'b' }, { loginEmail: 'new@example.test' }, { legalName: 'a'.repeat(181) }, { contactName: 'control\ncharacter' }]) {
    assert.throws(() => contactInput({ ...profile(), ...change }), status(400));
  }
});
test('notification input requires explicit booleans for every channel and starts without assumed consent', () => {
  const initial = emptyNotifications();
  assert.ok(Object.values(initial).every(channel => Object.values(channel).every(value => value === false)));
  assert.notEqual(initial.email, initial.sms);
  assert.deepEqual(notificationsInput(preferences()).notifications, initial);
  for (const change of [{ email: {} }, { sms: null }, { revision: 0 }, { accountId: 'b' }, { email: { ...initial.email, marketing: 'true' } }, { sms: { ...initial.sms, extra: true } }]) {
    assert.throws(() => notificationsInput({ ...preferences(), ...change }), status(400));
  }
});
test('all settings operations require a valid session and owner/admin membership', async () => {
  const actions = [s => s.getProfile(), s => s.getNotifications(), s => s.saveProfile(undefined, profile()), s => s.saveNotifications(undefined, preferences()), s => s.password(undefined, {}), s => s.export()];
  for (const action of actions) await assert.rejects(() => action(setup().service), status(401));
  for (const role of ['employee', 'unknown']) {
    const { service, calls } = setup(role);
    for (const action of [() => service.getProfile('a'), () => service.getNotifications('a'), () => service.saveProfile('a', profile()), () => service.saveNotifications('a', preferences()), () => service.password('a', {}), () => service.export('a')]) await assert.rejects(action, status(403));
    assert.deepEqual(calls, []);
  }
  await assert.rejects(() => setup().service.getProfile('none'), status(403));
  assert.equal((await setup('admin').service.getProfile('a')).profile.name, 'Firma a');
});
test('profile edits update only the signed-in provider and return the account login email unchanged', async () => {
  const { service } = setup();
  const result = await service.saveProfile('a', { ...profile(), name: 'Nowa firma', contactEmail: 'other@example.test' });
  assert.equal(result.profile.revision, 2); assert.equal(result.loginEmail, 'a@example.test');
  assert.equal((await service.getProfile('a')).profile.name, 'Nowa firma');
  assert.equal((await service.getProfile('b')).profile.name, 'Firma b');
});
test('only one concurrent profile or notification save wins', async () => {
  const { service } = setup();
  for (const operation of [() => service.saveProfile('a', profile()), () => service.saveNotifications('a', preferences())]) {
    const results = await Promise.allSettled([operation(), operation()]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(results.find(result => result.status === 'rejected').reason.getStatus(), 409);
  }
});
test('profile and notification revisions are independent and cannot overwrite each other', async () => {
  const { service } = setup();
  const input = preferences(); input.email.created = true;
  await Promise.all([service.saveProfile('a', { ...profile(), name: 'Changed' }), service.saveNotifications('a', input)]);
  assert.equal((await service.getProfile('a')).profile.name, 'Changed');
  assert.equal((await service.getNotifications('a')).email.created, true);
  assert.equal((await service.getNotifications('b')).email.created, false);
});
test('export is restricted to own saved data and explicitly excludes credentials and extra entity fields', async () => {
  const { service } = setup();
  const a = await service.export('a');
  assert.equal(a.account.id, 'a'); assert.equal(a.employees[0].name, 'Pracownik A'); assert.equal(a.loginEmail, 'a@example.test');
  assert.equal(JSON.stringify(a).includes('never-export'), false);
  assert.deepEqual((await service.export('b')).employees, []);
  assert.deepEqual(Object.keys(a).sort(), ['account', 'employees', 'exportedAt', 'formatVersion', 'loginEmail', 'notifications']);
});
test('password change uses existing auth rotation only after provider access has been checked', async () => {
  const { service, calls } = setup();
  const input = { currentPassword: 'old password', newPassword: 'new long password', confirmPassword: 'new long password' };
  const result = await service.password('a', input);
  assert.equal(result.token, 'rotated'); assert.deepEqual(calls, [{ token: 'a', body: input }]);
});

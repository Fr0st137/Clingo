const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const apiRequire = require('node:module').createRequire(resolve(__dirname, '../apps/api/package.json'));
const { UnauthorizedException } = apiRequire('@nestjs/common');
const { ProviderClientsService } = require('../apps/api/dist/provider/provider-clients.service');
const { clientInput } = require('../apps/api/dist/provider/provider-clients.input');
const draft = () => ({ name: 'Łukasz Żak', email: '', phone: '', street: '', postalCode: '', city: '', notes: '' });
const status = code => error => error.getStatus() === code;
function setup(role = 'owner') {
  const rows = new Map();
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const repository = {
    create: input => ({ ...input, id: randomUUID() }),
    async save(row) { rows.set(row.id, structuredClone(row)); return structuredClone(row); },
    async find({ where }) { return [...rows.values()].filter(row => matches(row, where)).map(row => structuredClone(row)); },
    async findOneBy(where) { const row = [...rows.values()].find(row => matches(row, where)); return row ? structuredClone(row) : null; },
    async update(where, input) { const row = rows.get(where.id); if (!row || !matches(row, where)) return { affected: 0 }; rows.set(row.id, { ...row, ...input }); return { affected: 1 }; }
  };
  const service = new ProviderClientsService({ async sessionUser(token) { if (!token) throw new UnauthorizedException(); return { id: token }; } }, { async findOneBy({ userId }) { return userId === 'none' ? null : { accountId: userId, role }; } }, repository);
  return { service, rows };
}
test('client validation accepts multiline notes and clears optional fields without trusting account or revision on creation', () => {
  const input = clientInput({ ...draft(), name: ' Łukasz Żak ', email: 'CLIENT@example.test', notes: 'Pierwsza linia\nDruga linia' });
  assert.equal(input.name, 'Łukasz Żak'); assert.equal(input.email, 'client@example.test'); assert.equal(input.notes, 'Pierwsza linia\nDruga linia');
  for (const change of [{ name: '' }, { phone: '-------' }, { email: 'invalid' }, { street: 'x'.repeat(241) }, { city: 'x'.repeat(121) }, { notes: 'x'.repeat(2001) }, { notes: 'control\u0000' }, { postalCode: null }, { accountId: 'b' }, { revision: 1 }, { role: 'owner' }]) assert.throws(() => clientInput({ ...draft(), ...change }), status(400));
  for (const revision of [undefined, 0, '1', 1.5]) assert.throws(() => clientInput({ ...draft(), revision }, true), status(400));
});
test('every client operation requires session and provider owner/admin role', async () => {
  for (const token of [undefined, 'none']) {
    const { service } = setup();
    for (const action of [() => service.list(token), () => service.get(token, 'id'), () => service.create(token, draft()), () => service.update(token, 'id', { ...draft(), revision: 1 })]) await assert.rejects(action, status(token ? 403 : 401));
  }
  for (const role of ['employee', 'unknown']) {
    const { service } = setup(role);
    for (const action of [() => service.list('a'), () => service.get('a', 'id'), () => service.create('a', draft()), () => service.update('a', 'id', { ...draft(), revision: 1 })]) await assert.rejects(action, status(403));
  }
  assert.equal((await setup('admin').service.create('a', draft())).revision, 1);
});
test('client reads and writes are isolated by membership, with no foreign account fields returned', async () => {
  const { service, rows } = setup();
  const created = await service.create('a', { ...draft(), street: 'Testowa 12', postalCode: '00-001', city: 'Warszawa', notes: 'Własna notatka' });
  assert.equal(rows.get(created.id).accountId, 'a'); assert.equal(created.accountId, undefined);
  assert.equal((await service.list('a')).length, 1); assert.deepEqual(await service.list('b'), []);
  await assert.rejects(() => service.get('b', created.id), status(404));
  await assert.rejects(() => service.update('b', created.id, { ...draft(), revision: 1 }), status(404));
  assert.equal((await service.get('a', created.id)).notes, 'Własna notatka');
  await assert.rejects(() => service.update('a', created.id, { ...draft(), accountId: 'b', revision: 1 }), status(400));
  const saved = await service.update('a', created.id, { ...draft(), revision: 1 });
  assert.equal(saved.notes, ''); assert.equal(saved.street, ''); assert.equal(saved.revision, 2);
});
test('concurrent client edits cannot silently overwrite contact details or notes', async () => {
  const { service } = setup(); const created = await service.create('a', draft());
  const results = await Promise.allSettled(['First', 'Second'].map(notes => service.update('a', created.id, { ...draft(), notes, revision: 1 })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.getStatus(), 409);
  const winner = results.find(result => result.status === 'fulfilled').value;
  assert.deepEqual(await service.get('a', created.id), winner);
});

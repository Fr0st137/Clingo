const { test } = require('node:test'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { HttpException } = require('node:module').createRequire(require.resolve('../apps/api/package.json'))('@nestjs/common');
const { EmailVerificationService, verificationCodeHash } = require('../apps/api/dist/auth/email-verification.service');
const { EmailVerificationEntity } = require('../apps/api/dist/auth/email-verification.entity');
const { UserEntity } = require('../apps/api/dist/auth/user.entity');
const { EmailService } = require('../apps/api/dist/auth/email.service');
function fixture() {
  let user = { id: '11111111-1111-4111-8111-111111111111', email: 'isolated@example.test', emailVerified: false, emailVerificationRequired: true }, rows = [];
  const messages = [], counts = new Map(); let failMail = false;
  const manager = {
    async findOneBy(entity, where) { return structuredClone(entity === UserEntity ? user : rows.find(row => Object.entries(where).every(([key, value]) => row[key] === value)) ?? null); },
    async findOne(entity, options) { return this.findOneBy(entity, options.where); },
    create(_entity, value) { return value; },
    async delete(_entity, where) { rows = rows.filter(row => !Object.entries(where).every(([key, value]) => row[key] === value)); },
    async save(entity, value) { const row = value ?? entity; rows = rows.filter(old => old.tokenHash !== row.tokenHash); rows.push(structuredClone(row)); return row; },
    async update(_entity, _where, patch) { Object.assign(user, patch); }
  };
  const db = { manager, async transaction(action) { const snapshot = structuredClone({ user, rows }); try { return await action(manager); } catch (error) { ({ user, rows } = snapshot); throw error; } } };
  const service = new EmailVerificationService(db, { async activation(email, code) { if (failMail) throw Error('SMTP offline'); messages.push({ email, code }); } }, { async consume(scope, key, max) { const count = (counts.get(scope + key) ?? 0) + 1; counts.set(scope + key, count); if (count > max) throw new HttpException('Limit', 429); } });
  return { db, service, messages, issue: () => db.transaction(manager => service.issue(manager, user)), row: () => rows[0], user: () => user, failMail: () => { failMail = true; } };
}
test('K07: issuance stores keyed hashes only and exposes no full authentication session', async () => {
  const f = fixture(), result = await f.issue();
  assert.equal(result.verificationRequired, true); assert.equal(result.token, undefined); assert.match(result.verificationToken, /^[a-f0-9]{64}$/);
  assert.equal(f.row().tokenHash, createHash('sha256').update(result.verificationToken).digest('hex'));
  assert.equal(f.row().codeHash, verificationCodeHash(result.verificationToken, f.messages[0].code));
  assert.ok(!JSON.stringify(f.row()).includes(result.verificationToken)); assert.equal(f.user().emailVerified, false);
});
test('K07: wrong attempts persist, a correct code activates atomically and consumed challenges cannot be reused', async () => {
  const f = fixture(), result = await f.issue(), code = f.messages[0].code, wrong = code === '0000' ? '0001' : '0000';
  let sessions = 0;
  await assert.rejects(f.service.verify(result.verificationToken, wrong, async () => sessions++), error => error.getStatus() === 400);
  assert.equal(f.row().attempts, 1); assert.equal(sessions, 0);
  await f.service.verify(result.verificationToken, code, async (_manager, user) => { assert.equal(user.emailVerified, true); sessions++; return 'active'; });
  assert.equal(f.user().emailVerified, true); assert.equal(sessions, 1); assert.equal(f.row(), undefined);
  await assert.rejects(f.service.verify(result.verificationToken, code, async () => sessions++), error => error.getStatus() === 401);
  assert.equal(sessions, 1);
});
test('K07: expiry and resend cooldown are enforced; resending invalidates the previous code without resetting attempts', async () => {
  const f = fixture(), result = await f.issue(), first = f.messages[0].code;
  await assert.rejects(f.service.resend(result.verificationToken), error => error.getStatus() === 429);
  f.row().expiresAt = new Date(Date.now() - 1); f.row().resendAt = new Date(Date.now() - 1);
  await assert.rejects(f.service.verify(result.verificationToken, first, async () => {}), /wygasł/);
  f.row().attempts = 2;
  await f.service.resend(result.verificationToken); const second = f.messages[1].code;
  assert.notEqual(first, second); assert.equal(f.row().attempts, 2);
  await assert.rejects(f.service.verify(result.verificationToken, first, async () => {}), /Nieprawidłowy kod/);
});
test('K07: attempts cannot be reset by starting another challenge for the same account', async () => {
  const f = fixture(), result = await f.issue(), code = f.messages[0].code, wrong = code === '0000' ? '0001' : '0000';
  for (let i = 0; i < 5; i++) await assert.rejects(f.service.verify(result.verificationToken, wrong, async () => {}));
  f.row().resendAt = new Date(Date.now() - 1);
  const replacement = await f.issue();
  await assert.rejects(f.service.verify(replacement.verificationToken, f.messages[1].code, async () => {}), error => error.getStatus() === 429);
  assert.equal(f.user().emailVerified, false);
});
test('K07: SMTP failure rolls back issuance and resend; a missing SMTP configuration fails closed', async () => {
  const fresh = fixture(); fresh.failMail(); await assert.rejects(fresh.issue(), /SMTP offline/); assert.equal(fresh.row(), undefined); assert.equal(fresh.user().emailVerified, false);
  const f = fixture(), result = await f.issue(); f.row().resendAt = new Date(Date.now() - 1); const old = structuredClone(f.row()); f.failMail();
  await assert.rejects(f.service.resend(result.verificationToken), /SMTP offline/); assert.deepEqual(f.row(), old);
  await assert.rejects(new EmailService({ get() { return undefined; } }).activation('isolated@example.test', '1234'), error => error.getStatus() === 503);
});

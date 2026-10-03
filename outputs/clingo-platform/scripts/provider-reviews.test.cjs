const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const apiRequire = require('node:module').createRequire(resolve(__dirname, '../apps/api/package.json'));
const { UnauthorizedException } = apiRequire('@nestjs/common');
const { ProviderReviewsService } = require('../apps/api/dist/provider/provider-reviews.service');
const { reviewReportInput } = require('../apps/api/dist/provider/provider-reviews.input');
const status = code => error => error.getStatus() === code;

function setup(role = 'owner') {
  const id = randomUUID();
  const rows = new Map([[id, { id, accountId: 'a', authorName: 'Anna Nowak', serviceTitle: 'Sprzątanie mieszkania', rating: 5, content: 'Bardzo dobrze wykonana usługa.', helpfulCount: 2, reported: false, revision: 1, createdAt: new Date('2026-09-30T10:00:00Z') }]]);
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const repository = {
    async find({ where }) { return [...rows.values()].filter(row => matches(row, where)).map(row => structuredClone(row)); },
    async findOneBy(where) { const row = [...rows.values()].find(row => matches(row, where)); return row ? structuredClone(row) : null; },
    async update(where, input) { const row = rows.get(where.id); if (!row || !matches(row, where)) return { affected: 0 }; rows.set(row.id, { ...row, ...input }); return { affected: 1 }; }
  };
  const service = new ProviderReviewsService({ async sessionUser(token) { if (!token) throw new UnauthorizedException(); return { id: token }; } }, { async findOneBy({ userId }) { return userId === 'none' ? null : { accountId: userId, role }; } }, repository);
  return { service, rows, id };
}

test('review reports accept only a boolean and a positive revision', () => {
  assert.deepEqual(reviewReportInput({ reported: true, revision: 1 }), { reported: true, revision: 1 });
  for (const input of [{ reported: 'yes', revision: 1 }, { reported: true, revision: 0 }, { reported: true, revision: 1, accountId: 'b' }]) assert.throws(() => reviewReportInput(input), status(400));
});

test('reviews are private to one provider account', async () => {
  const { service, id } = setup();
  assert.equal((await service.list('a')).length, 1);
  assert.deepEqual(await service.list('b'), []);
  await assert.rejects(() => service.report('b', id, { reported: true, revision: 1 }), status(404));
  await assert.rejects(() => service.list(undefined), status(401));
  await assert.rejects(() => service.list('none'), status(403));
});

test('owners and admins can report a review with optimistic locking', async () => {
  for (const role of ['owner', 'admin']) {
    const { service, id } = setup(role);
    const saved = await service.report('a', id, { reported: true, revision: 1 });
    assert.equal(saved.reported, true); assert.equal(saved.revision, 2);
    await assert.rejects(() => service.report('a', id, { reported: false, revision: 1 }), status(409));
  }
  const employee = setup('employee');
  assert.equal((await employee.service.list('a')).length, 1);
  await assert.rejects(() => employee.service.report('a', employee.id, { reported: true, revision: 1 }), status(403));
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { multiOrderActionInput } = require('../apps/api/dist/provider/provider-multi-orders.input');

const status = code => error => error.getStatus() === code;

test('multi-session decisions accept only an explicit action and revision', () => {
  assert.deepEqual(multiOrderActionInput({ action: 'accept', revision: 1 }), { action: 'accept', revision: 1 });
  assert.deepEqual(multiOrderActionInput({ action: 'reject', revision: 12 }), { action: 'reject', revision: 12 });
  for (const value of [{ action: 'approve', revision: 1 }, { action: 'accept' }, { action: 'accept', revision: 0 }, { action: 'accept', revision: 1, accountId: 'forged' }, null]) {
    assert.throws(() => multiOrderActionInput(value), status(400));
  }
});

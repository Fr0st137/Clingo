const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(resolve(__dirname, '../apps/web/lib/pagination.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText, context);

const { paginate, paginationSequence } = context.exports;

test('board pagination shows exactly ten listings per page', () => {
  const listings = Array.from({ length: 23 }, (_, index) => index + 1);
  assert.deepEqual([...paginate(listings, 1).items], listings.slice(0, 10));
  assert.deepEqual([...paginate(listings, 2).items], listings.slice(10, 20));
  assert.deepEqual([...paginate(listings, 3).items], listings.slice(20));
  assert.equal(paginate(listings, 3).totalPages, 3);
});

test('page numbers reflect total results and clamp invalid pages', () => {
  assert.deepEqual([...paginationSequence(1, 9)], [1, 2, 3, 4, 5, 'ellipsis', 9]);
  assert.deepEqual([...paginationSequence(5, 9)], [1, 'ellipsis', 4, 5, 6, 'ellipsis', 9]);
  assert.equal(paginate(Array.from({ length: 11 }), 99).currentPage, 2);
  assert.equal(paginate([], 1).currentPage, 0);
});

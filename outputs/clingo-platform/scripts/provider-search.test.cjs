const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(resolve(__dirname, '../apps/web/lib/provider-search.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText, context);

const { normalizedProviderName, searchProviders } = context.exports;
const providers = [
  { id: 'czysty-dom', provider: 'Czysty Dom Sp. z o.o.' },
  { id: 'paulina-jagielska', provider: 'Paulina Jagielska' },
  { id: 'pawel-zak', provider: 'Paweł Żak' },
  { id: 'eko-czystosc', provider: 'Eko Czystość' }
];

test('search ignores case, Polish diacritics and punctuation', () => {
  assert.equal(normalizedProviderName('  EKO Czystość! '), 'eko czystosc');
  assert.deepEqual(searchProviders(providers, 'pawel zak').map(({ id }) => id), ['pawel-zak']);
});

test('all query words must occur in the provider name in any order', () => {
  assert.deepEqual(searchProviders(providers, 'jag paul').map(({ id }) => id), ['paulina-jagielska']);
  assert.deepEqual(searchProviders(providers, 'czysty eko'), []);
});

test('exact and prefix matches rank ahead of embedded matches', () => {
  const ranked = searchProviders([
    { id: 'one', provider: 'Firma Dom' },
    { id: 'two', provider: 'Dom' },
    { id: 'three', provider: 'Domowy Serwis' }
  ], 'dom');
  assert.deepEqual(ranked.map(({ id }) => id), ['two', 'three', 'one']);
});

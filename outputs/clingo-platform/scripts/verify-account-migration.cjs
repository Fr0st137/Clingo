const { Client } = require('pg');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
async function main() {
  const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
  const schema = 'account_migration_' + randomUUID().replaceAll('-', '');
  await db.connect();
  await db.query('BEGIN');
  try {
    await db.query(`CREATE SCHEMA ${schema}`);
    await db.query(`SET LOCAL search_path TO ${schema}, public`);
    for (const table of ['users', 'orders', 'provider_profiles']) await db.query(`CREATE TABLE ${table} (LIKE public.${table} INCLUDING ALL)`);
    await db.query('ALTER TABLE users DROP COLUMN notification_preferences');
    const sql = fs.readFileSync(path.join(__dirname, '../apps/api/src/database/migrations/20260831-customer-account.sql'), 'utf8').replace(/^BEGIN;$/m, '').replace(/^COMMIT;$/m, '');
    await db.query(sql);
    await db.query(sql); // Reapplication must be harmless.
    const rows = (await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema=$1', [schema])).rows;
    assert.equal(rows.length, 7);
    assert.equal((await db.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='users' AND column_name='notification_preferences'`, [schema])).rowCount, 1);
    console.log('PASS: additive account migration and safe reapplication in an isolated rolled-back schema.');
  } finally { await db.query('ROLLBACK'); await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

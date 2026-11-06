const { Client } = require('pg'), { readFileSync } = require('node:fs'), { resolve } = require('node:path');
const host = process.env.POSTGRES_HOST ?? '127.0.0.1';
if (!['127.0.0.1', 'localhost'].includes(host)) throw Error('This migration runner is for the local development database.');
(async () => {
  const db = new Client({ host, port: Number(process.env.POSTGRES_PORT ?? 55432), database: process.env.POSTGRES_DB ?? 'clingo', user: process.env.POSTGRES_USER ?? 'clingo', password: process.env.POSTGRES_PASSWORD ?? 'clingo' });
  await db.connect();
  try { await db.query(readFileSync(resolve(__dirname, '../apps/api/src/database/migrations/20261106-booking-photos.sql'), 'utf8')); console.log('PASS: booking photos schema ready.'); }
  finally { await db.end(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

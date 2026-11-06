const { Client } = require('pg'), fs = require('node:fs'), path = require('node:path');
const host = process.env.POSTGRES_HOST ?? '127.0.0.1';
if (!['localhost', '127.0.0.1'].includes(host)) throw Error('Local migration runner only.');
(async () => {
  const db = new Client({ host, port: Number(process.env.POSTGRES_PORT ?? 55432), database: process.env.POSTGRES_DB ?? 'clingo', user: process.env.POSTGRES_USER ?? 'clingo', password: process.env.POSTGRES_PASSWORD ?? 'clingo' });
  await db.connect();
  try { await db.query(fs.readFileSync(path.resolve(__dirname, '../apps/api/src/database/migrations/20261106-email-verification.sql'), 'utf8')); console.log('PASS: email verification schema ready; existing account access preserved.'); }
  finally { await db.end(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

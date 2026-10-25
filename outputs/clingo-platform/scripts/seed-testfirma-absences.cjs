// Additive, repeatable seed for the explicitly requested local test account.
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { Client } = createRequire(resolve(__dirname, '../apps/api/package.json'))('pg');
async function main() {
  const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo', connectionTimeoutMillis: 3000 });
  await db.connect();
  try {
    await db.query('BEGIN');
    const targets = await db.query('SELECT a.id FROM users u JOIN provider_memberships m ON m.user_id=u.id JOIN provider_accounts a ON a.id=m.account_id WHERE u.email=$1 AND a.name=$2 AND m.role=$3 FOR UPDATE OF a', ['kounterstrike6@gmail.com', 'testFirma', 'owner']);
    if (targets.rows.length !== 1) throw Error('Exact account ownership not verified.');
    const accountId = targets.rows[0].id;
    const employees = (await db.query('SELECT id,name FROM provider_employees WHERE account_id=$1 ORDER BY created_at,id', [accountId])).rows;
    if (!employees.length) throw Error('No employees in target company.');
    await db.query(readFileSync(resolve(__dirname, '../apps/api/src/database/migrations/20261025-provider-absences.sql'), 'utf8'));
    const samples = [
      ['ongoing', -1, '08:00', 1, '18:00', 'Choroba', [employees[0]]],
      ['holiday', 2, '08:00', 5, '18:00', 'Urlop', [employees[1] ?? employees[0]]],
      ['team-holiday', 7, '08:00', 9, '18:00', 'Urlop', employees.slice(0, 2)],
      ['other', 14, '12:30', 14, '16:30', 'Inne', [employees[2] ?? employees[0]]],
      ['next-month', 35, '08:00', 38, '18:00', 'Urlop', employees],
      ['past-holiday', -14, '08:00', -10, '18:00', 'Urlop', [employees[0]]],
      ['past-sick', -7, '08:00', -5, '18:00', 'Choroba', [employees[1] ?? employees[0]]],
      ['past-team', -3, '09:00', -2, '17:00', 'Inne', employees.slice(0, 2)]
    ];
    let added = 0;
    for (const [key, startDay, startTime, endDay, endTime, reason, selected] of samples) {
      const result = await db.query(`INSERT INTO provider_absences(id,account_id,employees,starts_at,ends_at,reason,notes,seed_key)
        VALUES($1,$2,$3,((now() AT TIME ZONE 'Europe/Warsaw')::date + $4::integer + $5::time) AT TIME ZONE 'Europe/Warsaw',
        ((now() AT TIME ZONE 'Europe/Warsaw')::date + $6::integer + $7::time) AT TIME ZONE 'Europe/Warsaw',$8,$9,$10)
        ON CONFLICT(account_id,seed_key) DO NOTHING`, [randomUUID(), accountId, JSON.stringify(selected), startDay, startTime, endDay, endTime, reason, '[DANE TESTOWE testFirma] Nieobecność do sprawdzania kalendarza.', `testfirma-absence-v1-${key}`]);
      added += result.rowCount;
    }
    const counts = (await db.query(`SELECT count(*)::int total,
      count(*) FILTER(WHERE starts_at<=now() AND ends_at>now())::int ongoing,
      count(*) FILTER(WHERE starts_at>now())::int upcoming,
      count(*) FILTER(WHERE ends_at<=now())::int completed
      FROM provider_absences WHERE account_id=$1 AND seed_key LIKE 'testfirma-absence-v1-%'`, [accountId])).rows[0];
    if (counts.total !== 8) throw Error('Expected eight seeded absences.');
    await db.query('COMMIT');
    console.log(JSON.stringify({ company: 'testFirma', added, ...counts }));
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

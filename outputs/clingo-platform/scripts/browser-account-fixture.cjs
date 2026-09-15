// Disposable local fixture for manual/browser smoke checks. Never changes an existing account.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const file = path.resolve(__dirname, '../../../work/browser-account-fixture.json');
async function main() {
  const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
  await db.connect();
  try {
    if (process.argv[2] === 'setup') {
      if (fs.existsSync(file)) throw new Error('Clean up the previous browser fixture first.');
      const run = randomUUID(); const email = `browser-${run}@example.test`; const password = `Browser test ${run}`;
      const result = await fetch('http://localhost:4000/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, firstName: 'Anna', lastName: 'Testowa' }) });
      if (!result.ok) throw new Error('Fixture registration failed.');
      const providerId = `browser-test-${run}`;
      fs.writeFileSync(file, JSON.stringify({ run, email, providerId }));
      await db.query(`INSERT INTO provider_profiles SELECT * FROM jsonb_populate_record(NULL::provider_profiles,
        (SELECT to_jsonb(p) || jsonb_build_object('id', $1::text, 'provider', 'Wykonawca testowy') FROM provider_profiles p WHERE id='paulina-jagielska'))`, [providerId]);
      await db.query(`INSERT INTO orders (user_email,provider_id,provider,status,mode,"serviceType",address) VALUES ($1,$2,'Wykonawca testowy','Wykonane zlecenie','Jednosesyjne','Sprzątanie testowe','Warszawa')`, [email, providerId]);
      console.log(JSON.stringify({ email, password, providerId }));
    } else {
      const fixture = JSON.parse(fs.readFileSync(file));
      if (!/^browser-[a-f0-9-]{36}@example\.test$/.test(fixture.email) || fixture.providerId !== `browser-test-${fixture.run}`) throw new Error('Not a browser test fixture.');
      if (process.argv[2] === 'check') {
        const user = (await db.query('SELECT first_name,city,street,notification_preferences FROM users WHERE email=$1', [fixture.email])).rows[0];
        const reviews = (await db.query('SELECT rating,content FROM customer_reviews WHERE provider_id=$1', [fixture.providerId])).rows;
        const favorites = (await db.query('SELECT COUNT(*)::int AS count FROM customer_favorites f JOIN users u ON u.id=f.user_id WHERE u.email=$1', [fixture.email])).rows[0].count;
        console.log(JSON.stringify({ user, reviews, favorites }));
      } else if (process.argv[2] === 'cleanup') {
        await db.query('DELETE FROM orders WHERE provider_id=$1', [fixture.providerId]);
        await db.query('DELETE FROM auth_sessions WHERE email=$1', [fixture.email]);
        await db.query('DELETE FROM users WHERE email=$1', [fixture.email]);
        await db.query('DELETE FROM provider_profiles WHERE id=$1', [fixture.providerId]);
        fs.unlinkSync(file); console.log('Removed only the disposable browser fixture.');
      }
    }
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

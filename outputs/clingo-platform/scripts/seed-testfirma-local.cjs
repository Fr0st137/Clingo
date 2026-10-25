// Explicit local maintenance requested by the owner; never run against a remote DB.
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { existsSync, statSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const apiRequire = createRequire(resolve(__dirname, '../apps/api/package.json'));
const { Client } = apiRequire('pg');
const { defaultOfferConfiguration } = require('../apps/api/dist/provider/provider-offers.input');
const email = 'kounterstrike6@gmail.com';
const backup = resolve(__dirname, '../tmp/backups/before-testfirma-reset-20261024.sql');
const marker = '[DANE TESTOWE testFirma]';

async function main() {
  if (!process.argv.includes('--confirmed-local-reset')) throw Error('Requires explicit --confirmed-local-reset and a local backup.');
  if (!existsSync(backup) || statSync(backup).size < 1000) throw Error('Missing database backup.');
  const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
  await db.connect();
  try {
    await db.query('BEGIN');
    const target = await db.query('SELECT u.id user_id,a.id account_id FROM users u JOIN provider_memberships m ON m.user_id=u.id JOIN provider_accounts a ON a.id=m.account_id WHERE u.email=$1 AND a.name=$2 AND m.role=$3 FOR UPDATE', [email, 'testFirma', 'owner']);
    if (target.rows.length !== 1) throw Error('The exact user/company ownership could not be verified.');
    const { account_id: accountId } = target.rows[0];
    const previous = Number((await db.query('SELECT count(*) FROM users WHERE email<>$1', [email])).rows[0].count);
    // Remove dependants before their RESTRICT-linked parent rows.
    await db.query('DELETE FROM orders WHERE user_email<>$1 OR provider_id IN (SELECT id FROM provider_profiles WHERE account_id IS NOT NULL AND account_id<>$2)', [email, accountId]);
    await db.query('DELETE FROM provider_profiles WHERE account_id IS NOT NULL AND account_id<>$1', [accountId]);
    await db.query('DELETE FROM provider_jobs WHERE account_id<>$1', [accountId]);
    await db.query('DELETE FROM provider_multi_orders WHERE account_id<>$1', [accountId]);
    await db.query('DELETE FROM provider_accounts WHERE id<>$1', [accountId]);
    await db.query('DELETE FROM auth_sessions WHERE email<>$1', [email]);
    await db.query('DELETE FROM users WHERE email<>$1', [email]);
    const seeded = await db.query('SELECT id FROM provider_jobs WHERE account_id=$1 AND notes LIKE $2', [accountId, marker + '%']);
    if (!seeded.rows.length) {
      const employeeIds = [];
      for (const [name, start, end] of [['Paulina Jagielska (test)', '08:00', '18:00'], ['Beata Kaszwabendzka (test)', '10:00', '20:00']]) {
        const id = randomUUID(); employeeIds.push({ id, name });
        const schedule = [1,2,3,4,5,6,0].map(day => ({ day, enabled: day !== 0, start, end }));
        await db.query('INSERT INTO provider_employees (id,account_id,name,email,phone,show_in_calendar,services,schedule) VALUES ($1,$2,$3,$4,$5,true,$6,$7)', [id,accountId,name,'','',JSON.stringify(['homes','offices']),JSON.stringify(schedule)]);
      }
      const offers = [];
      for (const [title,category,price,duration] of [['Sprzątanie mieszkań i domów (test)','homes',16500,195],['Sprzątanie biur (test)','offices',24000,240]]) {
        const id = randomUUID(); offers.push({ id, title, price, duration });
        await db.query('INSERT INTO provider_offers (id,account_id,title,category,description,price_minor,duration_minutes,status,configuration) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id,accountId,title,category,'Usługa testowa do podglądu zamówień.',price,duration,'draft',JSON.stringify(defaultOfferConfiguration())]);
      }
      const clients = [];
      for (const [index,name] of ['Anita Kowalska (test)','Kajetan Mrówczyński (test)','Elżbieta Nowak (test)','Michał Wiśniewski (test)'].entries()) {
        const id = randomUUID(), street = ['ul. Floriańska 48/16','ul. Długa 12/4','ul. Krótka 8/2','ul. Szkolna 3'][index];
        clients.push({ id, name, street });
        await db.query('INSERT INTO provider_clients (id,account_id,name,email,phone,street,postal_code,city,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id,accountId,name,`klient-${index+1}@example.test`,'',street,'00-001','Warszawa',marker]);
      }
      for (const [index,offset] of [0,1,2,3,4,-1,-2,-3].entries()) {
        const day = new Date('2026-10-24T12:00:00Z'); day.setUTCDate(day.getUTCDate()+offset);
        const client = clients[index % clients.length], offer = offers[index % offers.length], employee = employeeIds[index % employeeIds.length];
        await db.query('INSERT INTO provider_jobs (id,account_id,client_id,offer_id,employee_id,date,start_minute,duration_minutes,price_minor,status,notes,client_name,client_phone,client_email,address,service_title,employee_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)', [randomUUID(),accountId,client.id,offer.id,employee.id,day.toISOString().slice(0,10),index%2 ? 600 : 750,offer.duration,offer.price,index===7?'cancelled':offset<0?'completed':'scheduled',marker+' Przykładowa notatka do zamówienia.',client.name,'',`klient-${index%4+1}@example.test`,client.street+', 00-001 Warszawa',offer.title,employee.name]);
      }
      const contents = ['Usługa wykonana punktualnie, mieszkanie dokładnie posprzątane.','Dobry kontakt i sprawna realizacja zamówienia.','Biuro posprzątane zgodnie z ustalonym zakresem.','Bardzo staranne sprzątanie kuchni i łazienki.','Sprawna obsługa i elastyczne ustalenie godziny.'];
      for (const [index,content] of contents.entries()) await db.query('INSERT INTO provider_reviews (id,account_id,author_name,service_title,rating,content,helpful_count,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [randomUUID(),accountId,clients[index%4].name,offers[index%2].title,[5,5,4,5,4][index], '[Opinia testowa] '+content,index%3,new Date(Date.UTC(2026,9,23-index,12))]);
    }
    const counts = (await db.query('SELECT (SELECT count(*) FROM users) accounts,(SELECT count(*) FROM provider_employees WHERE account_id=$1) employees,(SELECT count(*) FROM provider_jobs WHERE account_id=$1) jobs,(SELECT count(*) FROM provider_reviews WHERE account_id=$1) reviews', [accountId])).rows[0];
    if (Number(counts.accounts) !== 1) throw Error('Unexpected remaining account count.');
    await db.query('COMMIT');
    console.log(JSON.stringify({ removedAccounts: previous, ...counts }));
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

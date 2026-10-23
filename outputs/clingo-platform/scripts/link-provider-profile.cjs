// Administrative, explicit ownership assignment. Never expose this operation as a public claim endpoint.
const { Client } = require('pg');
const args = process.argv.slice(2);
async function main() {
  const db = new Client({ host: process.env.POSTGRES_HOST || '127.0.0.1', port: Number(process.env.POSTGRES_PORT || 55432), database: process.env.POSTGRES_DB || 'clingo', user: process.env.POSTGRES_USER || 'clingo', password: process.env.POSTGRES_PASSWORD || 'clingo', connectionTimeoutMillis: 5000 });
  await db.connect();
  try {
    if (args.length === 1 && args[0] === '--list') {
      console.log('Public profiles:'); console.table((await db.query('SELECT id, provider, account_id FROM provider_profiles ORDER BY provider')).rows);
      console.log('Provider accounts:'); console.table((await db.query("SELECT a.id, a.name, u.email FROM provider_accounts a JOIN provider_memberships m ON m.account_id=a.id JOIN users u ON u.id=m.user_id WHERE m.role='owner' ORDER BY a.name")).rows);
      return;
    }
    if (args.length !== 4 || args[0] !== '--profile' || args[2] !== '--account' || !/^[a-f0-9-]{36}$/i.test(args[3]) || !args[1]) throw new Error('Usage: node scripts/link-provider-profile.cjs --list | --profile PUBLIC_PROFILE_ID --account VERIFIED_ACCOUNT_UUID');
    await db.query('BEGIN');
    const account = (await db.query('SELECT id, name FROM provider_accounts WHERE id=$1 FOR UPDATE', [args[3]])).rows[0];
    const profile = (await db.query('SELECT id, provider, account_id FROM provider_profiles WHERE id=$1 FOR UPDATE', [args[1]])).rows[0];
    if (!account || !profile) throw new Error('Account or profile not found.');
    if (profile.account_id && profile.account_id !== account.id) throw new Error('Profile already belongs to another account. Reassignment requires a separate ownership review.');
    await db.query('UPDATE provider_profiles SET account_id=$1 WHERE id=$2', [account.id, profile.id]);
    await db.query('COMMIT');
    console.log(`Linked ${profile.provider} (${profile.id}) to ${account.name} (${account.id}). Existing and future customer reservations are now visible in this account.`);
  } catch (error) { await db.query('ROLLBACK').catch(() => {}); throw error; }
  finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

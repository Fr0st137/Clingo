const {Client}=require('pg');const fs=require('node:fs');const assert=require('node:assert/strict');
async function main(){const db=new Client({host:process.env.POSTGRES_HOST||'127.0.0.1',port:Number(process.env.POSTGRES_PORT||55432),database:process.env.POSTGRES_DB||'clingo',user:process.env.POSTGRES_USER||'clingo',password:process.env.POSTGRES_PASSWORD||'clingo'});await db.connect();try{
 await db.query('BEGIN');await db.query('LOCK TABLE customer_reviews IN SHARE ROW EXCLUSIVE MODE');
 const select='SELECT order_id,user_id,provider_id,rating,content,images,created_at,updated_at FROM customer_reviews ORDER BY order_id',before=(await db.query(select)).rows;
 fs.mkdirSync('tmp/backups',{recursive:true});const backup=`tmp/backups/r12-reviews-${Date.now()}.json`;fs.writeFileSync(backup,JSON.stringify(before,null,2));
 const sql=fs.readFileSync('apps/api/src/database/migrations/20261027-review-bridge.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'');await db.query(sql);await db.query(sql);
 assert.deepEqual((await db.query(select)).rows,before);await db.query('COMMIT');const report={status:'PASS',schemaAppliedTwice:true,preservedReviews:before.length,backup};fs.writeFileSync('tmp/r12-migration.log',JSON.stringify(report,null,2));console.log(report);
}catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}}
main().catch(error=>{console.error(error);process.exitCode=1;});

const {Client}=require('pg');const fs=require('node:fs');const assert=require('node:assert/strict');
const {historicalEstimate}=require('../apps/api/dist/provider/project-work');
const config={host:process.env.POSTGRES_HOST||'127.0.0.1',port:Number(process.env.POSTGRES_PORT||55432),database:process.env.POSTGRES_DB||'clingo',user:process.env.POSTGRES_USER||'clingo',password:process.env.POSTGRES_PASSWORD||'clingo'};
async function main(){const db=new Client(config);await db.connect();try{
  await db.query('BEGIN');await db.query('LOCK TABLE orders,provider_profiles,provider_jobs,provider_multi_orders IN SHARE ROW EXCLUSIVE MODE');
  const publicRows=(await db.query(`SELECT o.id,o.selected_options,o.summary FROM orders o JOIN provider_profiles p ON p.id=o.provider_id WHERE o.mode='Wielosesyjne' AND o.user_email IS NOT NULL AND p.account_id IS NOT NULL`)).rows;
  const manual=(await db.query('SELECT id,sessions,area_square_meters FROM provider_multi_orders')).rows;
  const jobs=(await db.query('SELECT * FROM provider_jobs WHERE multi_order_id IS NOT NULL')).rows;
  fs.mkdirSync('tmp/backups',{recursive:true});const backup=`tmp/backups/r06-projects-${Date.now()}.json`;fs.writeFileSync(backup,JSON.stringify({publicRows,manual,jobs},null,2));
  const sql=fs.readFileSync('apps/api/src/database/migrations/20261027-project-editor.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'');
  await db.query(sql);await db.query(sql);let updatedPublic=0,updatedManual=0;
  for(const row of publicRows){const options=typeof row.selected_options==='string'?JSON.parse(row.selected_options):row.selected_options;if(!options?.sessions?.length)continue;
    const workers=options.estimatedWorkers||options.sessions[0].workers||1,total=options.sessions.reduce((sum,s)=>sum+(Date.parse(s.endsAt)-Date.parse(s.startsAt))/60000*workers,0);if(!Number.isFinite(total)||total<=0)continue;
    const area=/^area-\d+(?:\.\d{1,2})?$/.test(options.pricingId)?Number(options.pricingId.slice(5)):null;
    const summary=typeof row.summary==='string'?JSON.parse(row.summary):row.summary;const price=Math.round(Number((summary?.total||'0').replace(/\s/g,'').replace(',','.').replace(/[^\d.]/g,''))*100);
    const next={...options,projectEstimate:options.projectEstimate??historicalEstimate(area,total,workers),sessions:options.sessions.map((s,index)=>({...s,id:s.id??String(index+1),priceMinor:s.priceMinor??Math.floor(price/options.sessions.length)+(index<price%options.sessions.length?1:0)}))};
    if(JSON.stringify(next)!==JSON.stringify(options)){await db.query('UPDATE orders SET selected_options=$2 WHERE id=$1',[row.id,JSON.stringify(next)]);updatedPublic++;}
  }
  for(const row of manual){const sessions=row.sessions??[],total=sessions.reduce((sum,s)=>sum+s.durationMinutes*(s.employees?.length||1),0);if(!total)continue;
    const result=await db.query('UPDATE provider_multi_orders SET project_data=$2::jsonb WHERE id=$1 AND project_data IS NULL',[row.id,JSON.stringify({estimate:historicalEstimate(Number(row.area_square_meters)||null,total,sessions[0]?.employees?.length||1),history:[]})]);updatedManual+=result.rowCount;
  }
  await db.query(`UPDATE provider_jobs SET employees=jsonb_build_array(jsonb_build_object('id',employee_id::text,'name',employee_name)) WHERE multi_order_id IS NOT NULL AND employees IS NULL AND employee_id IS NOT NULL`);
  await db.query('UPDATE provider_jobs SET project_session_id=id::text WHERE multi_order_id IS NOT NULL AND project_session_id IS NULL');
  // Original clock times, crew counts and money in public orders must be unchanged.
  for(const row of publicRows){const current=(await db.query('SELECT selected_options,summary FROM orders WHERE id=$1',[row.id])).rows[0],before=JSON.parse(row.selected_options||'null'),after=JSON.parse(current.selected_options||'null');assert.deepEqual(current.summary,row.summary);for(let i=0;i<(before?.sessions?.length||0);i++){for(const key of ['startsAt','endsAt','workers','employees'])assert.deepEqual(after.sessions[i][key],before.sessions[i][key]);}}
  await db.query('COMMIT');const report={status:'PASS',schemaAppliedTwice:true,updatedPublic,updatedManual,backup};fs.writeFileSync('tmp/r06-migration.log',JSON.stringify(report,null,2));console.log(report);
}catch(error){await db.query('ROLLBACK');throw error;}finally{await db.end();}}
main().catch(error=>{console.error(error);process.exitCode=1;});

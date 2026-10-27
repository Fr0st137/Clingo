const {Client}=require('pg');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{const db=new Client({host:'127.0.0.1',port:55432,database:'clingo',user:'clingo',password:'clingo'});await db.connect();try{
  const snapshot=async()=>(await db.query(`SELECT count(*)::integer AS count,md5(string_agg(id::text || COALESCE(selected_options,''),'' ORDER BY id)) AS checksum FROM orders`)).rows[0];
  const before=await snapshot();const sql=fs.readFileSync('apps/api/src/database/migrations/20261027-provider-staffing-limit.sql','utf8');await db.query(sql);await db.query(sql);assert.deepEqual(await snapshot(),before);
  const result={status:'PASS',migration:'20261027-provider-staffing-limit.sql',appliedTwice:true,ordersUnchanged:before};fs.writeFileSync('tmp/r04-migration.log',JSON.stringify(result,null,2));console.log(result);
}finally{await db.end();}})().catch(error=>{console.error(error);process.exitCode=1;});

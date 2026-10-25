const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { resolve, dirname } = require('node:path');
const { readFileSync } = require('node:fs');
const { Client } = createRequire(resolve('outputs/clingo-platform/apps/api/package.json'))('pg');
const ts = createRequire(resolve('outputs/clingo-platform/apps/provider/package.json'))('typescript');
const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
function loadTs(file) { const module = { exports: {} }; new Function('module','exports','require',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports,path=>path.startsWith('.')?loadTs(resolve(dirname(file),path+'.ts')):require(path));return module.exports; }
(async () => {
  const db = new Client({ host: '127.0.0.1', port: 55432, database: 'clingo', user: 'clingo', password: 'clingo' });
  await db.connect(); let browser;
  try {
    const account = (await db.query('SELECT a.id FROM provider_accounts a JOIN provider_memberships m ON m.account_id=a.id JOIN users u ON u.id=m.user_id WHERE u.email=$1 AND a.name=$2', ['kounterstrike6@gmail.com','testFirma'])).rows;
    assert.equal(account.length,1); const id=account[0].id;
    const jobs = (await db.query(`SELECT id,client_id "clientId",offer_id "offerId",employee_id "employeeId",date::text,date::text "startsAt",start_minute "startMinute",duration_minutes "durationMinutes",price_minor "priceMinor",status,notes,client_name "clientName",employee_name "employeeName",service_title "serviceTitle" FROM provider_jobs WHERE account_id=$1`, [id])).rows;
    const employees = (await db.query('SELECT id,name,schedule FROM provider_employees WHERE account_id=$1',[id])).rows;
    const absences = (await db.query(`SELECT (SELECT jsonb_agg(e->>'id') FROM jsonb_array_elements(employees) e) "employeeIds",(SELECT jsonb_agg(e->>'name') FROM jsonb_array_elements(employees) e) employees,to_char(starts_at AT TIME ZONE 'Europe/Warsaw','YYYY-MM-DD"T"HH24:MI') start,to_char(ends_at AT TIME ZONE 'Europe/Warsaw','YYYY-MM-DD"T"HH24:MI') "end" FROM provider_absences WHERE account_id=$1 AND cancelled=false`,[id])).rows;
    const { dashboardAnalytics } = loadTs(resolve('outputs/clingo-platform/apps/provider/lib/provider-analytics-dashboard.ts'));
    const { warsawToday,shiftDate } = loadTs(resolve('outputs/clingo-platform/apps/provider/lib/provider-schedule.ts'));
    const end = warsawToday(), start=shiftDate(end,-29);
    const report=dashboardAnalytics(jobs,{start,end,offer:'',employee:''},employees,absences);
    const expected=jobs.filter(row=>row.date>=start&&row.date<=end&&row.status==='completed').reduce((sum,row)=>sum+row.priceMinor,0);
    assert.equal(report.totals.value,expected);
    assert(report.usage.rate===null||report.usage.rate>=0&&report.usage.rate<=100);
    browser=await chromium.launch({headless:true,channel:'chrome'});
    const page=await browser.newPage({viewport:{width:1920,height:1000}});
    await page.route('**/api/provider/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path.endsWith('/me')?{user:{name:'Test',email:'kounterstrike6@gmail.com'},account:{id,name:'testFirma',role:'owner'}}:path.endsWith('/employees')?employees:path.endsWith('/absences')?absences:path.endsWith('/jobs')?jobs:[]});});
    await page.goto('http://127.0.0.1:3108/analytics');
    await page.locator('.analytics-kpi').first().waitFor();
    assert.equal(await page.locator('.analytics-kpi').count(),6);
    const money = new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(expected/100);
    assert.equal(await page.locator('.analytics-kpi').first().locator('strong').innerText(), money);
    await page.locator('.analytics-content').screenshot({path:'tmp/analytics-testfirma-live.png'});
    const icons=await page.locator('.analytics-content img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),ok:img.complete&&img.naturalWidth>0,w:img.getBoundingClientRect().width,h:img.getBoundingClientRect().height})));
    assert(icons.every(img=>img.ok));
    console.log(JSON.stringify({company:'testFirma',orders:jobs.length,employees:employees.length,absences:absences.length,completed:report.totals.count,valueMinor:expected,utilization:report.usage.rate,localIcons:icons}));
    console.log('PASS: read-only verification against persisted company data, dashboard totals and all local assets.');
  } finally { if(browser)await browser.close();await db.end(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

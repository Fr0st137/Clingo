const {readFileSync}=require('node:fs');
const {resolve,dirname}=require('node:path');
const ts=require('typescript');
function loadTs(file){const m={exports:{}};new Function('module','exports','require',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports,p=>p.startsWith('.')?loadTs(resolve(dirname(file),p+'.ts')):require(p));return m.exports;}
const {dashboardAnalytics}=loadTs(resolve('apps/provider/lib/provider-analytics-dashboard.ts'));
const job=(id,extra={})=>({id,date:'2026-09-01',startMinute:480,durationMinutes:60,status:'completed',offerId:'offer',employeeId:null,employeeName:'',clientId:'customer:a@example.com',serviceTitle:'Sprzątanie',notes:'',priceMinor:10000,...extra});
const filters={start:'2026-09-01',end:'2026-09-30',offer:'',employee:''};
const sessions=dashboardAnalytics([job('booking:one:1',{source:'booking',bookingId:'one',sessionIndex:1,sessionCount:2,addOns:[{id:'windows',label:'Okna',quantity:1}]}),job('booking:one:2',{source:'booking',bookingId:'one',sessionIndex:2,sessionCount:2,date:'2026-09-02',addOns:[{id:'windows',label:'Okna',quantity:1}]})],filters,[],[]);
const split=dashboardAnalytics([job('manual',{clientId:'client-uuid',offerId:'offer-uuid',clientEmail:'a@example.com'}),job('booking:one:1',{clientId:'customer:a@example.com',offerId:'profile:profile-uuid',clientEmail:'a@example.com'})],filters,[],[]);
console.log(JSON.stringify({singleBookingWithTwoSessions:{ordersKpi:sessions.totals.count,extraOrdersCount:sessions.addOns[0].count,rebookedCustomers:sessions.rebooked,staffRowsWithoutEmployees:sessions.staff.length},sameServiceAndEmailFromTwoSources:{serviceRows:split.services.length,activeClients:split.activeClients,returning:split.returning}},null,2));

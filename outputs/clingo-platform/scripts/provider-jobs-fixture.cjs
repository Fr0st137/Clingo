// Isolated in-memory repositories for service unit tests and disposable browser QA.
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const apiRequire = require('node:module').createRequire(resolve(__dirname,'../apps/api/package.json'));
const { UnauthorizedException } = apiRequire('@nestjs/common');
const { ProviderJobsService } = require('../apps/api/dist/provider/provider-jobs.service');
const { ProviderAccountEntity, ProviderEmployeeEntity } = require('../apps/api/dist/provider/provider.entity');
const { ProviderClientEntity } = require('../apps/api/dist/provider/provider-clients.entity');
const { ProviderOfferEntity } = require('../apps/api/dist/provider/provider-offers.entity');
const { ProviderJobEntity } = require('../apps/api/dist/provider/provider-jobs.entity');
function setup(role='owner') {
 const ids={clientA:randomUUID(),clientB:randomUUID(),offerA:randomUUID(),offerB:randomUUID(),employeeA:randomUUID(),employeeB:randomUUID()};
 const rows=new Map();
 const clients=new Map([[ids.clientA,{id:ids.clientA,accountId:'a',name:'Klient QA',phone:'+48 123 456 789',email:'client@example.test',street:'Testowa 12',postalCode:'00-001',city:'Warszawa'}],[ids.clientB,{id:ids.clientB,accountId:'b',name:'Obcy klient'}]]);
 const offers=new Map([[ids.offerA,{id:ids.offerA,accountId:'a',title:'Sprzątanie QA',status:'draft',category:'homes',description:'',priceMinor:14990,durationMinutes:90,revision:1}],[ids.offerB,{id:ids.offerB,accountId:'b',title:'Obca usługa',status:'draft'}]]);
 const employees=new Map([[ids.employeeA,{id:ids.employeeA,accountId:'a',name:'Pracownik QA'}],[ids.employeeB,{id:ids.employeeB,accountId:'b',name:'Obcy pracownik'}]]);
 const tables=new Map([[ProviderJobEntity,rows],[ProviderClientEntity,clients],[ProviderOfferEntity,offers],[ProviderEmployeeEntity,employees],[ProviderAccountEntity,new Map([['a',{id:'a'}],['b',{id:'b'}]])]]);
 const matches=(row,where)=>Object.entries(where).every(([key,value])=>row[key]===value);
 const manager={
  async findOne(entity,{where,lock}) { if(entity===ProviderAccountEntity && lock?.mode!=='pessimistic_write')throw new Error('Account writes must acquire the database row lock');return this.findOneBy(entity,where); },
  async findOneBy(entity,where){const row=[...tables.get(entity).values()].find(row=>matches(row,where));return row?structuredClone(row):null;},
  async find(entity,{where}){return [...tables.get(entity).values()].filter(row=>matches(row,where)).map(row=>structuredClone(row));},
  create(entity,input){return{id:input.id??randomUUID(),...input};},
  async save(entity,row){tables.get(entity).set(row.id,structuredClone(row));return structuredClone(row);}
 };
 let queue=Promise.resolve();
 const repository={find:options=>manager.find(ProviderJobEntity,options),findOneBy:where=>manager.findOneBy(ProviderJobEntity,where),manager:{transaction(fn){const result=queue.then(()=>fn(manager));queue=result.catch(()=>{});return result;}}};
 const service=new ProviderJobsService({async sessionUser(token){if(!token)throw new UnauthorizedException();return{id:token};}},{async findOneBy({userId}){return userId==='none'?null:{accountId:userId,role};}},repository);
 const draft=()=>({clientId:ids.clientA,offerId:ids.offerA,employeeId:ids.employeeA,date:'2020-01-06',startMinute:540,durationMinutes:90,priceMinor:14990,notes:'',status:'scheduled'});
 return {service,ids,rows,clients,offers,employees,draft};
}
module.exports={setup};

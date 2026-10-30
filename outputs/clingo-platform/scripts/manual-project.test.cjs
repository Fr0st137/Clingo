const {test}=require('node:test');const assert=require('node:assert/strict');
const {manualProjectPricing}=require('../apps/api/dist/provider/manual-project-pricing');
const {manualProjectInput}=require('../apps/api/dist/provider/manual-project.input');
const {defaultOfferConfiguration}=require('../apps/api/dist/provider/provider-offers.input');
const config={...defaultOfferConfiguration(),areaTiers:[{minSquareMeters:1,maxSquareMeters:null,workers:2}]};
const input={areaSquareMeters:200,quantities:{windows:4,oven:1},positions:[{id:'custom',title:'Własna',quantity:'3',price:'12,50'}],discount:{mode:'percent',value:'10'}};
test('own project price includes exact area, configured additions, custom rows and one discount',()=>{
 const quote=manualProjectPricing(config,input);assert.equal(quote.base,30000);assert.equal(quote.subtotal,48750);assert.equal(quote.total,43875);assert.equal(quote.discountMinor,4875);assert.equal(quote.estimate.requiredWorkMinutes,360);
 const fractional=manualProjectPricing(config,{...input,areaSquareMeters:.29,quantities:{},positions:[],discount:{mode:'percent',value:'0'}});assert.equal(fractional.base,44);assert.equal(fractional.estimate.requiredWorkMinutes,.522);
});
test('half-hour additions use the same worker workload as published offers, while custom rows have no invented duration',()=>{
 const quote=manualProjectPricing(config,{...input,quantities:{ironing:2},discount:{mode:'amount',value:'1,25'}});assert.equal(quote.estimate.fixedWorkMinutes,120);assert.equal(quote.estimate.requiredWorkMinutes,480);assert.equal(quote.total,manualProjectPricing(config,{...input,quantities:{ironing:2},discount:{mode:'percent',value:'0'}}).total-125);
});
test('own project rejects fabricated addons, quantities, prices, partial positions and over-discounting',()=>{
 for(const patch of [{quantities:{fake:1}},{quantities:{windows:1.5}},{quantities:{windows:101}},{quantities:{windows:-1}},{areaSquareMeters:1.001},{areaSquareMeters:Infinity},{areaSquareMeters:'100'},{basePriceMinor:0},{basePriceMinor:10000001},{discount:{mode:'percent',value:'100'}},{discount:{mode:'percent',value:'-1'}},{discount:{mode:'amount',value:'999999'}},{positions:[{id:'a',title:'',quantity:'1',price:'1'}]},{positions:[{id:'a',title:'X',quantity:'0',price:'1'}]},{positions:[{id:'a',title:'X',quantity:'1',price:'1,001'}]}])assert.throws(()=>manualProjectPricing(config,{...input,...patch}));
});
test('own project request bounds the plan and rejects ownership, money and role overrides',()=>{
 const id='11111111-1111-4111-8111-111111111111',body={...input,requestId:id,clientId:id,offerId:id,offerRevision:1,address:'Testowa 1, Warszawa',notes:'Notatka\nDruga linia',sessions:[{},{}]};
 assert.equal(manualProjectInput(body).notes,'Notatka\nDruga linia');
 for(const patch of [{accountId:id},{priceMinor:1},{status:'accepted'},{sessions:[{}]},{sessions:Array(187).fill({})},{offerRevision:0},{confirmUnderstaffing:'true'},{positions:[null]},{notes:'\u0000'},{discount:{mode:'percent',value:'0',total:1}}])assert.throws(()=>manualProjectInput({...body,...patch}),error=>error.getStatus()===400);
});

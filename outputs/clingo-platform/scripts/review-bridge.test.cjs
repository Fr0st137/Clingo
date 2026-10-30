const {test}=require('node:test');const assert=require('node:assert/strict');
const {ratingFromTotals,withPublicReviews,publicReviewView,providerReviewView}=require('../apps/api/dist/dashboard/review-bridge');
const profile={rating:5,reviewsCount:99,reviews:[{id:'seed',author:'Przykład',content:'Przykład',rating:5,date:'2026'}],metrics:[{id:'rating',label:'Ocena',value:'5'}],overview:[{id:'reviews',label:'Opinie',value:'99'}]};
const row={id:'order',source:'customer',author_name:'Anna N.',service_title:'Sprzątanie',rating:3,content:'Rzeczywista opinia',helpful_count:0,reported:true,revision:2,created_at:'2026-10-27T10:00:00Z',updated_at:'2026-10-28T10:00:00Z',images:[{id:'photo',label:'Efekt usługi',url:'ignored'}]};
test('linked company ratings use shared real votes without adding catalogue seed counts',()=>{
 assert.deepEqual(ratingFromTotals(profile,{count:2,sum:9,company:true}),{rating:4.5,reviews:2});assert.deepEqual(ratingFromTotals(profile,{count:0,sum:0,company:true}),{rating:0,reviews:0});
 assert.deepEqual(ratingFromTotals({rating:4,reviewsCount:2},{count:1,sum:1,company:false}),{rating:3,reviews:3});
 const result=withPublicReviews(profile,[row],true);assert.equal(result.rating,3);assert.equal(result.reviewsCount,1);assert.equal(result.reviews.length,1);assert.equal(result.overview[0].value,'1');assert.equal(result.metrics[0].value,'3');assert.equal(profile.reviewsCount,99);
 assert.equal(withPublicReviews(profile,[row],false).reviews.length,2);
});
test('public and provider views share content but separate photos and private reporting metadata',()=>{
 const publicView=publicReviewView(row),privateView=providerReviewView(row);assert.equal(publicView.content,privateView.content);assert.equal(publicView.reported,undefined);assert.equal(publicView.images[0].url,'/api/review-images/photo');assert.equal(privateView.images[0].url,'/api/provider-review-images/order/photo');
 assert.equal(privateView.revision,2);assert.equal(publicReviewView({...row,source:'legacy',author_name:'Anna Nowak'}).author,'Anna N.');assert.equal(publicReviewView({...row,source:'legacy',author_name:'private@example.test'}).author,'Klient');
});

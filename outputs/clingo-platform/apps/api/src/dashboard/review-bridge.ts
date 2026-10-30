// Shared by API and the catalogue's database fallback. No framework dependencies.
const customerSelect = `SELECT r.order_id AS id, 'customer'::text AS source,
  concat(COALESCE(NULLIF(u.first_name,''),'Klient'),CASE WHEN COALESCE(u.last_name,'')<>'' THEN ' '||left(u.last_name,1)||'.' ELSE '' END) AS author_name,
  o."serviceType" AS service_title,r.rating,r.content,0::integer AS helpful_count,
  r.provider_reported AS reported,r.revision,r.created_at,r.updated_at,r.images
  FROM customer_reviews r JOIN provider_profiles p ON p.id=r.provider_id
  JOIN orders o ON o.id=r.order_id JOIN users u ON u.id=r.user_id`;
export const ACCOUNT_REVIEWS_SQL = `SELECT * FROM (
  SELECT id,'legacy'::text AS source,author_name,service_title,rating,content,helpful_count,reported,revision,created_at,created_at AS updated_at,'[]'::jsonb AS images
  FROM provider_reviews WHERE account_id=$1
  UNION ALL ${customerSelect} WHERE p.account_id=$1
) reviews ORDER BY created_at DESC,id ASC,source ASC`;
export const PROFILE_REVIEWS_SQL = `${customerSelect} WHERE p.id=$1 ORDER BY r.created_at DESC,r.order_id ASC`;
export const CUSTOMER_REVIEW_FOR_ACCOUNT_SQL = `${customerSelect} WHERE p.account_id=$1 AND r.order_id=$2`;
export const ACCOUNT_REVIEW_SUMMARY_SQL = `SELECT COUNT(*)::integer AS count,AVG(rating)::float AS average FROM (
  SELECT rating FROM provider_reviews WHERE account_id=$1
  UNION ALL SELECT r.rating FROM customer_reviews r JOIN provider_profiles p ON p.id=r.provider_id WHERE p.account_id=$1
) votes`;
export const RATING_TOTALS_SQL = `WITH targets AS (SELECT id,account_id FROM provider_profiles WHERE id=ANY($1::varchar[])),
  accounts AS (SELECT DISTINCT account_id FROM targets WHERE account_id IS NOT NULL),
  company_votes AS (
    SELECT r.account_id,r.rating FROM provider_reviews r JOIN accounts a ON a.account_id=r.account_id
    UNION ALL SELECT p.account_id,r.rating FROM customer_reviews r JOIN provider_profiles p ON p.id=r.provider_id JOIN accounts a ON a.account_id=p.account_id
  ), company_totals AS (SELECT account_id,COUNT(*) AS count,SUM(rating) AS sum FROM company_votes GROUP BY account_id),
  independent_totals AS (SELECT r.provider_id,COUNT(*) AS count,SUM(r.rating) AS sum FROM customer_reviews r JOIN targets p ON p.id=r.provider_id WHERE p.account_id IS NULL GROUP BY r.provider_id)
  SELECT p.id,p.account_id IS NOT NULL AS company,
    COALESCE(CASE WHEN p.account_id IS NOT NULL THEN c.count ELSE i.count END,0) AS count,
    COALESCE(CASE WHEN p.account_id IS NOT NULL THEN c.sum ELSE i.sum END,0) AS sum
  FROM targets p LEFT JOIN company_totals c ON c.account_id=p.account_id LEFT JOIN independent_totals i ON i.provider_id=p.id`;

export type RatingExtra = { count:number;sum:number;company?:boolean };
export function ratingTotalsMap(rows:Array<{id:string;count:number|string;sum:number|string;company?:boolean}>) {
  return new Map<string,RatingExtra>(rows.map(row=>[row.id,{count:Number(row.count),sum:Number(row.sum),company:row.company}]));
}
export function ratingFromTotals(provider:{rating:number|string;reviewsCount:number},extra?:RatingExtra) {
  const base=extra?.company?0:provider.reviewsCount,count=base+(extra?.count??0);
  return {rating:count?Math.round((Number(provider.rating)*base+(extra?.sum??0))/count*10)/10:0,reviews:count};
}
export type AccountReviewRow = {id:string;source:"customer"|"legacy";author_name:string;service_title:string;rating:number;content:string;helpful_count:number;reported:boolean;revision:number;created_at:Date|string;updated_at:Date|string;images:Array<{id:string;label:string;url:string}>};
export function providerReviewView(row:AccountReviewRow) {
  return {id:row.id,source:row.source,authorName:row.author_name,serviceTitle:row.service_title,rating:Number(row.rating),content:row.content,
    helpfulCount:Number(row.helpful_count),reported:row.reported,revision:row.revision,createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString(),
    images:row.images.map(image=>({id:image.id,label:image.label,url:`/api/provider-review-images/${row.id}/${image.id}`}))};
}
export function publicReviewView(row:AccountReviewRow) {
  const parts=row.author_name.trim().split(/\s+/),author=row.source==="customer"?row.author_name:row.author_name.includes('@')?"Klient":[parts[0]||"Klient",parts.length>1?`${parts.at(-1)![0]}.`:""].filter(Boolean).join(' ');
  return {id:row.source==="legacy"?`legacy:${row.id}`:row.id,author,content:row.content,rating:Number(row.rating),date:new Date(row.updated_at).toLocaleDateString("pl-PL",{day:"numeric",month:"short",year:"numeric",timeZone:"Europe/Warsaw"}),images:row.images.map(image=>({id:image.id,label:image.label,url:`/api/review-images/${image.id}`}))};
}
export function withPublicReviews<T extends {rating:number|string;reviewsCount:number;reviews:Array<{id:string;author:string;content:string;date:string;rating:number;images?:Array<{id:string;label:string;url:string}>}>;metrics:Array<{id:string;label:string;value:string}>;overview?:Array<{id:string;label:string;value:string}>|null}>(profile:T,rows:AccountReviewRow[],company:boolean) {
  const score=ratingFromTotals(profile,{count:rows.length,sum:rows.reduce((sum,row)=>sum+Number(row.rating),0),company});
  return {...profile,rating:score.rating,reviewsCount:score.reviews,
    metrics:profile.metrics.map(metric=>metric.id==="rating"?{...metric,value:String(score.rating)}:metric),
    overview:profile.overview?.map(metric=>metric.id==="rating"?{...metric,value:String(score.rating)}:metric.id==="reviews"?{...metric,value:String(score.reviews)}:metric),
    reviews:[...rows.map(publicReviewView),...(company?[]:profile.reviews)]};
}

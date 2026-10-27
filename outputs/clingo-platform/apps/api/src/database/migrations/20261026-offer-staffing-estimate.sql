-- Attach the staffing tiers to existing profiles published from a saved offer.
-- This changes estimates for new reservations only; existing orders retain their dates.
BEGIN;
UPDATE provider_profiles AS profile
SET area_pricing = (profile.area_pricing::jsonb || jsonb_build_object('workerTiers', offer.configuration::jsonb -> 'areaTiers'))::text
FROM provider_offers AS offer
WHERE profile.id = 'service-' || offer.id::text
  AND profile.account_id = offer.account_id
  AND profile.area_pricing IS NOT NULL
  AND jsonb_typeof(offer.configuration::jsonb -> 'areaTiers') = 'array'
  AND jsonb_array_length(offer.configuration::jsonb -> 'areaTiers') > 0
  AND (profile.area_pricing::jsonb -> 'workerTiers') IS DISTINCT FROM (offer.configuration::jsonb -> 'areaTiers');
COMMIT;

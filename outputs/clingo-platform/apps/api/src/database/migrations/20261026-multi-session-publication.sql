-- Restore the configured area range; session length no longer hides large jobs.
-- Run after 20261026-offer-staffing-estimate.sql. Existing orders are untouched.
BEGIN;
UPDATE provider_profiles AS profile
SET area_pricing = (profile.area_pricing::jsonb || jsonb_build_object(
  'minimum', (offer.configuration::jsonb -> 'areaTiers' -> 0 ->> 'minSquareMeters')::integer,
  'maximum', COALESCE((offer.configuration::jsonb -> 'areaTiers' -> -1 ->> 'maxSquareMeters')::integer, 10000),
  'workerTiers', offer.configuration::jsonb -> 'areaTiers',
  'maxSessionMinutes', 720
))::text
FROM provider_offers AS offer
WHERE profile.id = 'service-' || offer.id::text
  AND profile.account_id = offer.account_id
  AND profile.area_pricing IS NOT NULL
  AND jsonb_typeof(offer.configuration::jsonb -> 'areaTiers') = 'array'
  AND jsonb_array_length(offer.configuration::jsonb -> 'areaTiers') > 0;
COMMIT;

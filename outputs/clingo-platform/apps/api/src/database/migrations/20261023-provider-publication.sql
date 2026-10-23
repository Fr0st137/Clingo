BEGIN;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS area_pricing text;
COMMIT;

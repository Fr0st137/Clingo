BEGIN;
CREATE TABLE IF NOT EXISTS provider_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL,
  category varchar(20) NOT NULL CHECK (category IN ('homes','offices','pressure','painting')),
  description varchar(2000) NOT NULL,
  price_minor integer NOT NULL CHECK (price_minor BETWEEN 1 AND 10000000),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 1440),
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','archived')),
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_offers_account_idx ON provider_offers(account_id);
ALTER TABLE provider_accounts ADD COLUMN IF NOT EXISTS location jsonb NOT NULL DEFAULT '{"street":"","postalCode":"","city":"","radiusKm":0}'::jsonb;
ALTER TABLE provider_accounts ADD COLUMN IF NOT EXISTS location_revision integer NOT NULL DEFAULT 1;
COMMIT;

BEGIN;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS provider_reported boolean NOT NULL DEFAULT false;
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
COMMIT;

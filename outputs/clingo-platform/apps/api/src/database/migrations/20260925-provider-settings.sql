BEGIN;
ALTER TABLE provider_accounts
  ADD COLUMN IF NOT EXISTS legal_name varchar(180) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone varchar(40) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_name varchar(180) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone varchar(40) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_email varchar(320) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_revision integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notifications jsonb NOT NULL DEFAULT '{"email":{"created":false,"changed":false,"cancelled":false,"marketing":false},"sms":{"created":false,"changed":false,"cancelled":false,"marketing":false}}'::jsonb,
  ADD COLUMN IF NOT EXISTS notifications_revision integer NOT NULL DEFAULT 1;
COMMIT;

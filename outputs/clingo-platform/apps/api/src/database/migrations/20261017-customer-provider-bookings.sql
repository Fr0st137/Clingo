BEGIN;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS provider_profiles_account_idx ON provider_profiles(account_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'provider_profiles'::regclass AND conname = 'provider_profiles_account_fk') THEN
    ALTER TABLE provider_profiles ADD CONSTRAINT provider_profiles_account_fk FOREIGN KEY (account_id) REFERENCES provider_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;
COMMIT;

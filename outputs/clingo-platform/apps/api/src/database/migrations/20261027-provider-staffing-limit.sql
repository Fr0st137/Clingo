BEGIN;
ALTER TABLE provider_accounts ADD COLUMN IF NOT EXISTS staffing_mode varchar(10) NOT NULL DEFAULT 'team';
ALTER TABLE provider_accounts ADD COLUMN IF NOT EXISTS declared_staff integer;
ALTER TABLE provider_accounts ADD COLUMN IF NOT EXISTS staffing_revision integer NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='provider_accounts_staffing_mode_check' AND conrelid='provider_accounts'::regclass) THEN
    ALTER TABLE provider_accounts ADD CONSTRAINT provider_accounts_staffing_mode_check CHECK (staffing_mode IN ('solo','team'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='provider_accounts_declared_staff_check' AND conrelid='provider_accounts'::regclass) THEN
    ALTER TABLE provider_accounts ADD CONSTRAINT provider_accounts_declared_staff_check CHECK (declared_staff BETWEEN 1 AND 50);
  END IF;
END $$;
COMMIT;

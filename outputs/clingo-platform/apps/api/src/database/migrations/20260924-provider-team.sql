BEGIN;
CREATE TABLE IF NOT EXISTS provider_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS provider_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK (role IN ('owner', 'admin', 'employee'))
);
CREATE TABLE IF NOT EXISTS provider_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  email varchar(320) NOT NULL,
  phone varchar(40) NOT NULL,
  show_in_calendar boolean NOT NULL DEFAULT true,
  services jsonb NOT NULL,
  schedule jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_employees_account_idx ON provider_employees(account_id);
COMMIT;

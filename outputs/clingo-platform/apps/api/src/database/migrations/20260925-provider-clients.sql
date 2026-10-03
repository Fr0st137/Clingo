BEGIN;
CREATE TABLE IF NOT EXISTS provider_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  email varchar(320) NOT NULL,
  phone varchar(40) NOT NULL,
  street varchar(240) NOT NULL,
  postal_code varchar(20) NOT NULL,
  city varchar(120) NOT NULL,
  notes varchar(2000) NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS provider_clients_account_idx ON provider_clients(account_id);
COMMIT;

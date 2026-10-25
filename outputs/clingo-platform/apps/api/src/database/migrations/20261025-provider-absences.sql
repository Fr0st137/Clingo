CREATE TABLE IF NOT EXISTS provider_absences (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  number integer GENERATED ALWAYS AS IDENTITY UNIQUE,
  employees jsonb NOT NULL CHECK (jsonb_typeof(employees) = 'array' AND jsonb_array_length(employees) > 0),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  reason varchar(40) NOT NULL,
  notes varchar(2000) NOT NULL DEFAULT '',
  seed_key varchar(100),
  cancelled boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, seed_key)
);
CREATE INDEX IF NOT EXISTS provider_absences_account_dates_idx ON provider_absences(account_id, starts_at, ends_at);

BEGIN;
CREATE TABLE IF NOT EXISTS provider_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
 client_id uuid NOT NULL REFERENCES provider_clients(id) ON DELETE RESTRICT,
 offer_id uuid NOT NULL REFERENCES provider_offers(id) ON DELETE RESTRICT,
 employee_id uuid REFERENCES provider_employees(id) ON DELETE SET NULL,
 date date NOT NULL,
 start_minute integer NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
 duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 1440),
 price_minor integer NOT NULL CHECK (price_minor BETWEEN 1 AND 10000000),
 status varchar(20) NOT NULL CHECK (status IN ('scheduled','completed','cancelled')),
 notes varchar(2000) NOT NULL,
 client_name varchar(180) NOT NULL,
 client_phone varchar(40) NOT NULL,
 client_email varchar(320) NOT NULL,
 address varchar(420) NOT NULL,
 service_title varchar(180) NOT NULL,
 employee_name varchar(180) NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (start_minute + duration_minutes <= 1440)
);
CREATE INDEX IF NOT EXISTS provider_jobs_account_date_idx ON provider_jobs(account_id,date);
COMMIT;

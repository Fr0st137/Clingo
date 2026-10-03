CREATE TABLE IF NOT EXISTS provider_multi_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES provider_clients(id) ON DELETE RESTRICT,
  offer_id uuid NOT NULL REFERENCES provider_offers(id) ON DELETE RESTRICT,
  client_name varchar(180) NOT NULL,
  service_title varchar(180) NOT NULL,
  service_detail varchar(180) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  area_square_meters integer NOT NULL,
  add_on_count integer NOT NULL DEFAULT 0,
  total_price_minor integer NOT NULL,
  external boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'pending',
  sessions jsonb NOT NULL,
  notes varchar(2000) NOT NULL DEFAULT '',
  revision integer NOT NULL DEFAULT 1,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_multi_order_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  CONSTRAINT provider_multi_order_dates CHECK (end_date >= start_date),
  CONSTRAINT provider_multi_order_area CHECK (area_square_meters > 0),
  CONSTRAINT provider_multi_order_add_ons CHECK (add_on_count >= 0),
  CONSTRAINT provider_multi_order_price CHECK (total_price_minor > 0),
  CONSTRAINT provider_multi_order_sessions CHECK (jsonb_typeof(sessions) = 'array' AND jsonb_array_length(sessions) BETWEEN 2 AND 31)
);

CREATE INDEX IF NOT EXISTS provider_multi_orders_account_start_idx ON provider_multi_orders(account_id, start_date);

ALTER TABLE provider_jobs ADD COLUMN IF NOT EXISTS multi_order_id uuid;
ALTER TABLE provider_jobs ADD COLUMN IF NOT EXISTS session_index integer;
ALTER TABLE provider_jobs ADD COLUMN IF NOT EXISTS session_count integer;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_jobs_multi_order_fk') THEN
    ALTER TABLE provider_jobs ADD CONSTRAINT provider_jobs_multi_order_fk FOREIGN KEY (multi_order_id) REFERENCES provider_multi_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS provider_jobs_multi_order_session_idx ON provider_jobs(multi_order_id, session_index);

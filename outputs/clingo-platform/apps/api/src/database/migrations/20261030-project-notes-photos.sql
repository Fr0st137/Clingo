BEGIN;
CREATE TABLE IF NOT EXISTS provider_project_photos (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES provider_multi_orders(id) ON DELETE CASCADE,
  position integer NOT NULL,
  data bytea NOT NULL
);
CREATE INDEX IF NOT EXISTS provider_project_photos_project_idx ON provider_project_photos(account_id, project_id);
COMMIT;

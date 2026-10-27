BEGIN;
ALTER TABLE provider_jobs ADD COLUMN IF NOT EXISTS employees jsonb;
ALTER TABLE provider_jobs ADD COLUMN IF NOT EXISTS project_session_id varchar(100);
ALTER TABLE provider_multi_orders ADD COLUMN IF NOT EXISTS project_data jsonb;
ALTER TABLE provider_multi_orders ALTER COLUMN area_square_meters TYPE numeric(12,2) USING area_square_meters::numeric(12,2);
CREATE UNIQUE INDEX IF NOT EXISTS provider_jobs_project_session_idx ON provider_jobs(multi_order_id,project_session_id) WHERE project_session_id IS NOT NULL;
COMMIT;

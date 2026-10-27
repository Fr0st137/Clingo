BEGIN;
ALTER TABLE provider_multi_orders DROP CONSTRAINT IF EXISTS provider_multi_order_status;
ALTER TABLE provider_multi_orders ADD CONSTRAINT provider_multi_order_status CHECK (status IN ('pending','accepted','rejected','completed'));
COMMIT;

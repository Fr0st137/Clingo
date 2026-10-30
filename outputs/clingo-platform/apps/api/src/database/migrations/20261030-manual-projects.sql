BEGIN;
-- R06 permits a project to retain one session after editing; new multi-session
-- projects require at least two sessions in the API. Existing data is preserved.
ALTER TABLE provider_multi_orders DROP CONSTRAINT IF EXISTS provider_multi_order_sessions;
ALTER TABLE provider_multi_orders ADD CONSTRAINT provider_multi_order_sessions
  CHECK (jsonb_typeof(sessions) = 'array' AND jsonb_array_length(sessions) BETWEEN 1 AND 186);
COMMIT;

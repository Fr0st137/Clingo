BEGIN;
CREATE TABLE IF NOT EXISTS booking_photos (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  data bytea NOT NULL
);
CREATE INDEX IF NOT EXISTS booking_photos_order_idx ON booking_photos(order_id);
COMMIT;

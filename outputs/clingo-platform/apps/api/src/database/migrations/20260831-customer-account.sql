-- Additive migration for environments with TYPEORM_SYNC=false. Back up first.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"email":true,"sms":false}'::jsonb;
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key varchar(64) PRIMARY KEY, count integer NOT NULL, "resetsAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_expiry_idx ON auth_rate_limits("resetsAt");
CREATE TABLE IF NOT EXISTS customer_favorites (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id varchar NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, provider_id)
);
CREATE TABLE IF NOT EXISTS customer_reviews (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id varchar NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CONSTRAINT customer_review_rating CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL CONSTRAINT customer_review_content CHECK (char_length(content) BETWEEN 1 AND 1000),
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_reviews_user_idx ON customer_reviews(user_id);
CREATE INDEX IF NOT EXISTS customer_reviews_provider_idx ON customer_reviews(provider_id);
CREATE TABLE IF NOT EXISTS customer_review_images (
  id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES customer_reviews(order_id) ON DELETE CASCADE, data bytea NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_review_images_order_idx ON customer_review_images(order_id);
COMMIT;

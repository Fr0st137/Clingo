CREATE TABLE IF NOT EXISTS provider_reviews (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
  author_name varchar(180) NOT NULL,
  service_title varchar(180) NOT NULL,
  rating smallint NOT NULL CONSTRAINT provider_review_rating CHECK (rating BETWEEN 1 AND 5),
  content varchar(2000) NOT NULL,
  helpful_count integer NOT NULL DEFAULT 0 CONSTRAINT provider_review_helpful_count CHECK (helpful_count >= 0),
  reported boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_reviews_account_created_idx ON provider_reviews(account_id, created_at DESC);

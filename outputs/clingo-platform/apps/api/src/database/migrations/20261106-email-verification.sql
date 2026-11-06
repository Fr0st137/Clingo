BEGIN;
-- Existing accounts retain access without claiming that their email was verified.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_required boolean NOT NULL DEFAULT false;
ALTER TABLE users ALTER COLUMN email_verification_required SET DEFAULT true;
CREATE TABLE IF NOT EXISTS email_verifications (
  token_hash varchar(64) PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code_hash varchar(64) NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  resend_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);
COMMIT;

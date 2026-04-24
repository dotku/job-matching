-- Candidate profile (one row per student)
CREATE TABLE IF NOT EXISTS candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     text UNIQUE,                 -- Auth0 sub when authenticated, else null
  email           text UNIQUE NOT NULL,
  full_name       text NOT NULL,
  resume_url      text NOT NULL,
  linkedin_url    text NOT NULL,
  target_roles    text,
  target_locations text,
  graduation_year text,
  work_authorization text,
  notes           text,
  tier            text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Backfill for existing tables
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';
ALTER TABLE candidates
  DROP CONSTRAINT IF EXISTS candidates_tier_check;
ALTER TABLE candidates
  ADD CONSTRAINT candidates_tier_check CHECK (tier IN ('free', 'pro'));

-- Stripe billing fields
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;

-- Encrypted browser cookies the candidate pastes so the worker can
-- authenticate to Greenhouse/Lever/Ashby as them. Ciphertext format is
-- JSON: { v: 1, iv: <hex>, tag: <hex>, ct: <base64> }. Plaintext is a
-- JSON array of Playwright-compatible Cookie objects.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS auto_apply_cookies_enc text;

-- Phone extracted from resume (E.164). Informational only — email is the
-- identity anchor (it's what actually gets submitted to employer portals).
-- Phone is NOT UNIQUE: shared numbers (family, mis-extracted) shouldn't
-- block legitimate signups.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE candidates
  DROP CONSTRAINT IF EXISTS candidates_phone_key;

-- Column holds the R2 object key (not a URL). Renamed from resume_url.
-- Old public-URL approach has been replaced with per-request signed URLs.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE candidates RENAME COLUMN resume_url TO resume_key;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS candidates_email_idx ON candidates (lower(email));
CREATE INDEX IF NOT EXISTS candidates_phone_idx ON candidates (phone);

-- Saved internship listings, queued for (eventual) auto-submission
CREATE TABLE IF NOT EXISTS saved_listings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  listing_id    text NOT NULL,                 -- SimplifyJobs listing id
  company_name  text NOT NULL,
  title         text NOT NULL,
  url           text NOT NULL,
  category      text,
  locations     jsonb,
  sponsorship   text,
  status        text NOT NULL DEFAULT 'queued',  -- queued | submitted | failed | skipped
  status_note   text,
  saved_at      timestamptz NOT NULL DEFAULT now(),
  submitted_at  timestamptz,
  UNIQUE (candidate_id, listing_id)
);

CREATE INDEX IF NOT EXISTS saved_listings_candidate_idx
  ON saved_listings (candidate_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS saved_listings_status_idx
  ON saved_listings (status, saved_at);

-- Q&A registry for custom questions the worker had to answer on behalf of
-- the candidate (e.g. "Why are you interested in this role?"). Every LLM-
-- generated answer is recorded so the user can review, override, and have
-- the override used on future matching questions.
CREATE TABLE IF NOT EXISTS submission_answers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_listing_id  uuid NOT NULL REFERENCES saved_listings(id) ON DELETE CASCADE,
  candidate_id      uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  question          text NOT NULL,
  generated_answer  text NOT NULL,
  final_answer      text NOT NULL,
  user_override     text,
  question_type     text,                    -- 'short' | 'long' | 'select' | 'yes_no'
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submission_answers_listing_idx
  ON submission_answers (saved_listing_id);
CREATE INDEX IF NOT EXISTS submission_answers_question_lookup_idx
  ON submission_answers (candidate_id, lower(question));

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS candidates_set_updated_at ON candidates;
CREATE TRIGGER candidates_set_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS submission_answers_set_updated_at ON submission_answers;
CREATE TRIGGER submission_answers_set_updated_at
  BEFORE UPDATE ON submission_answers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

-- LLM credits balance, in micro-cents (1 micro-cent = $10^-8). A $0.10
-- starter is 10,000,000 micro-cents; at Gemini Flash-Lite prices that is
-- roughly 2,000 email-match calls. Deducted on every non-BYOK LLM call.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS llm_credits_micro_cents bigint NOT NULL DEFAULT 10000000;

-- BYOK: candidate-supplied API key so all LLM calls route through their
-- account instead of ours (and bypass credit deduction). All three providers
-- expose OpenAI-compatible /chat/completions so we share one fetch path.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS byok_provider text;
ALTER TABLE candidates
  DROP CONSTRAINT IF EXISTS candidates_byok_provider_check;
ALTER TABLE candidates
  ADD CONSTRAINT candidates_byok_provider_check
  CHECK (byok_provider IS NULL OR byok_provider IN ('cerebras', 'openai', 'gemini', 'openrouter'));
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS byok_api_key_enc text;
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS byok_model text;

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

-- Application outcome lifecycle. Independent of `status` (which tracks the
-- submit pipeline). Only meaningful once status='submitted'. Updated from
-- email parsing, manual edits, or future ATS APIs — see outcome_source.
ALTER TABLE saved_listings
  ADD COLUMN IF NOT EXISTS outcome text NOT NULL DEFAULT 'pending';
ALTER TABLE saved_listings
  DROP CONSTRAINT IF EXISTS saved_listings_outcome_check;
ALTER TABLE saved_listings
  ADD CONSTRAINT saved_listings_outcome_check CHECK (outcome IN (
    'pending',       -- submitted, no signal yet
    'confirmed',     -- ATS confirmation email received
    'rejected',      -- explicit rejection
    'screening',     -- OA, take-home, or recruiter screen
    'interviewing',  -- onsite/phone interview scheduled or done
    'offer',         -- offer extended, not yet decided
    'accepted',      -- candidate accepted
    'declined',      -- candidate declined
    'ghosted'        -- silence beyond timeout window
  ));

ALTER TABLE saved_listings
  ADD COLUMN IF NOT EXISTS outcome_note text;
ALTER TABLE saved_listings
  ADD COLUMN IF NOT EXISTS outcome_updated_at timestamptz;
ALTER TABLE saved_listings
  ADD COLUMN IF NOT EXISTS outcome_source text;
ALTER TABLE saved_listings
  DROP CONSTRAINT IF EXISTS saved_listings_outcome_source_check;
ALTER TABLE saved_listings
  ADD CONSTRAINT saved_listings_outcome_source_check CHECK (
    outcome_source IS NULL OR outcome_source IN ('email','manual','ats_api','timeout')
  );

-- Submit failure detail — captured by the worker when Playwright detects a
-- non-success page. failure_screenshot_key references R2.
ALTER TABLE saved_listings
  ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE saved_listings
  ADD COLUMN IF NOT EXISTS failure_screenshot_key text;
ALTER TABLE saved_listings
  ADD COLUMN IF NOT EXISTS attempt_count int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS saved_listings_outcome_idx
  ON saved_listings (candidate_id, outcome, outcome_updated_at DESC);

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

-- Per-call LLM usage log. Written on every LLM call regardless of BYOK so
-- we retain full telemetry; credit deduction happens only when byok=false.
-- cost_micro_cents uses 10^-8 USD units (matches candidates.llm_credits_micro_cents).
CREATE TABLE IF NOT EXISTS llm_usage (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id      uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  kind              text NOT NULL,
  provider          text NOT NULL,
  model             text NOT NULL,
  input_tokens      integer NOT NULL DEFAULT 0,
  output_tokens     integer NOT NULL DEFAULT 0,
  cost_micro_cents  bigint NOT NULL DEFAULT 0,
  byok              boolean NOT NULL DEFAULT false,
  context_ref       text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS llm_usage_candidate_idx
  ON llm_usage (candidate_id, created_at DESC);

-- Multiple BYOK keys per candidate. At most one row per candidate is
-- active at a time (enforced by the partial unique index below) — that's
-- the key our LLM router hands to the provider. Users can store a Gemini
-- + OpenAI + Cerebras key and toggle which is active without re-pasting.
CREATE TABLE IF NOT EXISTS candidate_byok_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  model           text NOT NULL,
  api_key_enc     text NOT NULL,
  label           text,
  is_active       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE candidate_byok_keys
  DROP CONSTRAINT IF EXISTS candidate_byok_keys_provider_check;
ALTER TABLE candidate_byok_keys
  ADD CONSTRAINT candidate_byok_keys_provider_check
  CHECK (provider IN ('cerebras', 'openai', 'gemini', 'openrouter'));

CREATE UNIQUE INDEX IF NOT EXISTS candidate_byok_keys_one_active_idx
  ON candidate_byok_keys (candidate_id) WHERE is_active;

CREATE INDEX IF NOT EXISTS candidate_byok_keys_candidate_idx
  ON candidate_byok_keys (candidate_id, created_at DESC);

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

-- ────────────────────────────────────────────────────────────────────
-- Outreach pipeline: Apollo → Gmail SMTP, daily-capped to 20/candidate
-- ────────────────────────────────────────────────────────────────────

-- Contacts sourced from Apollo's People Search. One row per Apollo person,
-- shared across candidates (sourced_for tracks who pulled them).
CREATE TABLE IF NOT EXISTS apollo_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apollo_id     text UNIQUE,
  full_name     text,
  first_name    text,
  last_name     text,
  email         text,
  title         text,
  company       text,
  linkedin_url  text,
  location      text,
  raw           jsonb,
  sourced_for   uuid REFERENCES candidates(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'new',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS apollo_contacts_status_idx ON apollo_contacts(status);
CREATE INDEX IF NOT EXISTS apollo_contacts_sourced_for_idx ON apollo_contacts(sourced_for);

-- Every send attempt (success or fail). Used for the daily cap and audit.
CREATE TABLE IF NOT EXISTS outreach_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  contact_id   uuid REFERENCES apollo_contacts(id) ON DELETE SET NULL,
  to_email     text NOT NULL,
  subject      text,
  body_text    text,
  body_html    text,
  status       text NOT NULL DEFAULT 'sent',
  error        text,
  message_id   text,
  sent_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outreach_log_sent_at_idx ON outreach_log(sent_at);
CREATE INDEX IF NOT EXISTS outreach_log_candidate_idx ON outreach_log(candidate_id);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_log_no_double_send
  ON outreach_log(candidate_id, contact_id) WHERE status = 'sent';

-- Per-candidate outreach config. The cron looks up the candidate's row to
-- find their cap and pause flag.
CREATE TABLE IF NOT EXISTS outreach_settings (
  candidate_id     uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  daily_cap        int  NOT NULL DEFAULT 20,
  paused           boolean NOT NULL DEFAULT false,
  template_subject text,
  template_body    text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Track which sends were LLM-personalized (GitHub Models) vs template fallback.
ALTER TABLE outreach_log
  ADD COLUMN IF NOT EXISTS personalized boolean NOT NULL DEFAULT false;

#!/usr/bin/env node
// Seeds (or refreshes) the candidate row + outreach_settings for Chenhan Wu.
// Idempotent — safe to re-run.

import { Pool } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const candidate = {
  email: "chenhanwu2006@gmail.com",
  full_name: "Chenhan Wu",
  linkedin_url: "https://www.linkedin.com/in/chenhan-wu-433540405/",
  target_roles:
    "Software Engineer Intern, Data Science Intern, ML Intern, Backend Engineer Intern (Summer 2026)",
  target_locations: "United States",
};

const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();
try {
  // Use email as identity anchor. resume_url is NOT NULL so seed with empty
  // string — candidate uploads a PDF via /apply to fill it in.
  const candidateRows = await client.query(
    `
    INSERT INTO candidates (email, full_name, resume_url, linkedin_url, target_roles, target_locations)
    VALUES ($1, $2, '', $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      linkedin_url = EXCLUDED.linkedin_url,
      target_roles = EXCLUDED.target_roles,
      target_locations = EXCLUDED.target_locations
    RETURNING id, email, full_name, resume_url, linkedin_url
  `,
    [
      candidate.email,
      candidate.full_name,
      candidate.linkedin_url,
      candidate.target_roles,
      candidate.target_locations,
    ],
  );
  const row = candidateRows.rows[0];
  console.log("✓ candidate:", row.id, row.email);
  if (!row.resume_url) {
    console.log(
      "  ⚠ resume_url is empty — upload a PDF via /apply so the outreach email can link to it.",
    );
  }

  await client.query(
    `
    INSERT INTO outreach_settings (candidate_id, daily_cap, paused)
    VALUES ($1, 20, false)
    ON CONFLICT (candidate_id) DO UPDATE SET
      updated_at = now()
  `,
    [row.id],
  );
  console.log("✓ outreach_settings: daily_cap=20, paused=false");

  console.log("\nNext:");
  console.log("  pnpm run migrate                              # ensure outreach tables exist");
  console.log("  curl -X POST localhost:3000/api/apollo/sync   # source contacts (needs APOLLO_API_KEY)");
  console.log("  curl localhost:3000/api/cron/send-outreach    # dry-run today's batch");
} catch (err) {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}

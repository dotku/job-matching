#!/usr/bin/env node
// Apply db/schema.sql to the database pointed to by DATABASE_URL.
// schema.sql is written in an idempotent style (IF NOT EXISTS, DROP IF EXISTS,
// DO $$ blocks) so re-running on a settled DB is a no-op.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Pool } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, "..", "db", "schema.sql");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("[migrate] DATABASE_URL not set — skipping.");
  process.exit(0);
}

const schema = readFileSync(schemaPath, "utf8");
const pool = new Pool({ connectionString: databaseUrl });

try {
  const client = await pool.connect();

  try {
    await client.query(schema);
    console.log("[migrate] ✓ schema applied");
  } finally {
    client.release();
  }
} catch (err) {
  console.error(
    "[migrate] ✗",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
} finally {
  await pool.end();
}

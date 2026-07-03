import { neon } from "@neondatabase/serverless";

// Backed by Vercel Postgres (Neon). Connect a database in the Vercel
// dashboard's Storage tab and it will inject DATABASE_URL (or POSTGRES_URL)
// automatically. For local dev, run `vercel env pull .env.development.local`
// to pull the same connection string down.

function getSql() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL/POSTGRES_URL — connect a Postgres database in Vercel's Storage tab, or run `vercel env pull .env.development.local` for local dev."
    );
  }
  return neon(connectionString);
}

let tableEnsured = false;
async function ensureTable(sql) {
  if (tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      gender TEXT,
      age_range TEXT,
      goal TEXT,
      pod_size TEXT,
      willingness_to_pay TEXT,
      source TEXT,
      email TEXT NOT NULL,
      user_agent TEXT,
      referrer TEXT
    )
  `;
  // ALTER for tables created before willingness_to_pay existed.
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS willingness_to_pay TEXT`;
  tableEnsured = true;
}

function toSubmission(row) {
  return {
    id: row.id,
    submittedAt:
      row.submitted_at instanceof Date
        ? row.submitted_at.toISOString()
        : row.submitted_at,
    gender: row.gender,
    ageRange: row.age_range,
    goal: row.goal,
    podSize: row.pod_size,
    willingnessToPay: row.willingness_to_pay,
    source: row.source,
    email: row.email,
    userAgent: row.user_agent,
    referrer: row.referrer,
  };
}

export async function getSubmissions() {
  const sql = getSql();
  await ensureTable(sql);
  const rows = await sql`SELECT * FROM submissions ORDER BY submitted_at ASC`;
  return rows.map(toSubmission);
}

export async function appendSubmission(submission) {
  const sql = getSql();
  await ensureTable(sql);
  const {
    gender,
    ageRange,
    goal,
    podSize,
    willingnessToPay,
    source,
    email,
    userAgent,
    referrer,
  } = submission;
  const rows = await sql`
    INSERT INTO submissions
      (gender, age_range, goal, pod_size, willingness_to_pay, source, email, user_agent, referrer)
    VALUES
      (${gender}, ${ageRange}, ${goal}, ${podSize}, ${willingnessToPay}, ${source}, ${email}, ${userAgent}, ${referrer})
    RETURNING *
  `;
  return toSubmission(rows[0]);
}

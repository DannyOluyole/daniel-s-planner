import { promises as fs } from "fs";
import path from "path";

// NOTE on Vercel: this writes to the local filesystem, which works for
// `next dev` and for a single long-lived `next start` process, but Vercel's
// serverless functions have a read-only filesystem except for `/tmp`, and
// `/tmp` is not shared across invocations or persisted between deploys.
// Before deploying this app to Vercel, swap this module's read/write calls
// for a real store (e.g. Vercel Postgres, Vercel KV, or Supabase) — the
// function signatures below (`getSubmissions`, `appendSubmission`) are kept
// deliberately small so that swap only touches this one file.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function getSubmissions() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function appendSubmission(submission) {
  await ensureFile();
  const all = await getSubmissions();
  const record = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    ...submission,
  };
  all.push(record);
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
  return record;
}

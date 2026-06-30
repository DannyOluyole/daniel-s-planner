import { NextResponse } from "next/server";
import { appendSubmission } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { gender, ageRange, goal, podSize, source, email } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }

  const record = await appendSubmission({
    gender: gender ?? null,
    ageRange: ageRange ?? null,
    goal: goal ?? null,
    podSize: podSize ?? null,
    source: source ?? null,
    email,
    userAgent: request.headers.get("user-agent") ?? null,
    referrer: request.headers.get("referer") ?? null,
  });

  return NextResponse.json({ ok: true, id: record.id });
}

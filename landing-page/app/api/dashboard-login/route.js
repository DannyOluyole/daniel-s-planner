import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const password = body?.password ?? "";
  const expected = process.env.DASHBOARD_PASSWORD || "podlaunch";

  if (password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("pod_dashboard_auth", expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return NextResponse.json({ ok: true });
}

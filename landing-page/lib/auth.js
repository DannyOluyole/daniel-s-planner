import { cookies } from "next/headers";

export async function isDashboardAuthed() {
  const cookieStore = await cookies();
  const expected = process.env.DASHBOARD_PASSWORD || "podlaunch";
  const value = cookieStore.get("pod_dashboard_auth")?.value;
  return value === expected;
}

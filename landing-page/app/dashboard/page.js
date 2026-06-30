import { redirect } from "next/navigation";
import { isDashboardAuthed } from "@/lib/auth";
import { getSubmissions } from "@/lib/store";
import LogoutButton from "./LogoutButton";

function countBy(list, key) {
  const counts = {};
  for (const item of list) {
    const value = item[key] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export default async function DashboardPage() {
  const authed = await isDashboardAuthed();
  if (!authed) {
    redirect("/dashboard/login");
  }

  const submissions = await getSubmissions();
  const sorted = [...submissions].reverse();

  const bySource = countBy(submissions, "source");
  const byGender = countBy(submissions, "gender");
  const byGoal = countBy(submissions, "goal");

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Signup dashboard</h1>
            <p className="mt-1 text-sm text-pod-ink/60">
              {submissions.length} total submission
              {submissions.length === 1 ? "" : "s"}
            </p>
          </div>
          <LogoutButton />
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="By traffic source" rows={bySource} />
          <StatCard title="By gender" rows={byGender} />
          <StatCard title="By goal" rows={byGoal} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">All submissions</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm shadow-black/5">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-pod-ink/50">
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Age range</th>
                  <th className="px-4 py-3">Goal</th>
                  <th className="px-4 py-3">Pod size</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-pod-ink/50">
                      No submissions yet — share the signup link to start
                      collecting data.
                    </td>
                  </tr>
                )}
                {sorted.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-pod-ink/70">
                      {new Date(s.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3">{s.gender || "—"}</td>
                    <td className="px-4 py-3">{s.ageRange || "—"}</td>
                    <td className="px-4 py-3">{s.goal || "—"}</td>
                    <td className="px-4 py-3">{s.podSize || "—"}</td>
                    <td className="px-4 py-3">{s.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, rows }) {
  const total = rows.reduce((sum, [, count]) => sum + count, 0) || 1;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm shadow-black/5">
      <h3 className="text-sm font-semibold text-pod-ink/70">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && (
          <p className="text-sm text-pod-ink/40">No data yet</p>
        )}
        {rows.map(([label, count]) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className="w-24 truncate">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-pod-cloud">
              <div
                className="h-full rounded-full bg-pod-teal"
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right tabular-nums text-pod-ink/60">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-black/5"
      >
        <h1 className="font-display text-2xl font-bold text-pod-ink">
          Dashboard login
        </h1>
        <p className="mt-2 text-sm text-pod-ink/60">
          Internal use only — enter the password to view signups.
        </p>

        <label className="mt-6 block text-sm font-medium text-pod-ink/80">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-pod-cloud px-4 py-3 text-base outline-none focus:border-pod-coral focus:ring-2 focus:ring-pod-coral/30"
          />
        </label>

        {error && (
          <p className="mt-3 text-sm font-medium text-pod-ember">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-pod-coral px-6 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}

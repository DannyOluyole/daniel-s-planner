"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/dashboard-logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-pod-ink/70 transition hover:bg-black/5"
    >
      Log out
    </button>
  );
}

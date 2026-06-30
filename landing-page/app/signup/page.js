import { Suspense } from "react";
import Link from "next/link";
import SignupForm from "./SignupForm";

export const metadata = {
  title: "Join Pod — Get Early Access",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-pod-ink px-4 py-10">
      <Link
        href="/"
        className="mb-6 text-sm font-medium text-white/60 hover:text-white"
      >
        ← Back to Pod
      </Link>
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}

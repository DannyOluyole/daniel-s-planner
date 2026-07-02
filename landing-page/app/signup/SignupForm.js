"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const STEPS = ["gender", "age", "goal", "podSize", "email"];

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const AGE_OPTIONS = ["13–17", "18–24", "25–34", "35–44", "45+"];
const GOAL_OPTIONS = [
  "Lose weight",
  "Build muscle",
  "Eat healthier with friends",
  "Just here to roast my friends' meals",
];
const POD_SIZE_OPTIONS = ["Just me + 1 friend", "3–5 friends", "6–8 friends (full squad)"];

export default function SignupForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get("utm_source") || searchParams.get("source") || "direct";

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    gender: "",
    ageRange: "",
    goal: "",
    podSize: "",
    email: "",
  });
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [error, setError] = useState("");

  const step = STEPS[stepIndex];
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  function selectAndAdvance(field, value) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!answers.email || !/^\S+@\S+\.\S+$/.test(answers.email)) {
      setError("Enter a valid email so we can send you the invite.");
      return;
    }
    setError("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, source }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Lead");
      }
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-black/5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pod-yellow text-3xl">
          🎉
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">
          You&apos;re on the list!
        </h2>
        <p className="mt-2 text-pod-ink/70">
          We&apos;ll email you the second your Pod can squad up. Go tag the
          friends you want in your Pod — you&apos;ll need them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-pod-cloud">
        <div
          className="h-full rounded-full bg-pod-coral transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 min-h-[260px]">
        {step === "gender" && (
          <Question
            title="Quick one to start — how do you identify?"
            options={GENDER_OPTIONS}
            onSelect={(v) => selectAndAdvance("gender", v)}
            selected={answers.gender}
          />
        )}

        {step === "age" && (
          <Question
            title="How old are you?"
            options={AGE_OPTIONS}
            onSelect={(v) => selectAndAdvance("ageRange", v)}
            selected={answers.ageRange}
            onBack={goBack}
          />
        )}

        {step === "goal" && (
          <Question
            title="What's your main goal?"
            options={GOAL_OPTIONS}
            onSelect={(v) => selectAndAdvance("goal", v)}
            selected={answers.goal}
            onBack={goBack}
          />
        )}

        {step === "podSize" && (
          <Question
            title="How big is your friend group going to be?"
            options={POD_SIZE_OPTIONS}
            onSelect={(v) => selectAndAdvance("podSize", v)}
            selected={answers.podSize}
            onBack={goBack}
          />
        )}

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="flex h-full flex-col">
            <button
              type="button"
              onClick={goBack}
              className="mb-4 self-start text-sm font-medium text-pod-ink/50 hover:text-pod-ink"
            >
              ← Back
            </button>
            <h3 className="font-display text-xl font-bold">
              Last thing — where should we send your invite?
            </h3>
            <p className="mt-1 text-sm text-pod-ink/60">
              We&apos;ll email you the moment Pod opens up in your area.
            </p>
            <input
              type="email"
              required
              autoFocus
              placeholder="you@email.com"
              value={answers.email}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, email: e.target.value }))
              }
              className="mt-5 w-full rounded-xl border border-black/10 bg-pod-cloud px-4 py-3 text-base outline-none focus:border-pod-coral focus:ring-2 focus:ring-pod-coral/30"
            />
            {error && (
              <p className="mt-2 text-sm font-medium text-pod-ember">{error}</p>
            )}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-5 w-full rounded-full bg-pod-coral px-6 py-3.5 text-base font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {status === "submitting" ? "Joining…" : "Get my invite 🔥"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Question({ title, options, onSelect, selected, onBack }) {
  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm font-medium text-pod-ink/50 hover:text-pod-ink"
        >
          ← Back
        </button>
      )}
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <div className="mt-5 grid grid-cols-1 gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-xl border px-4 py-3.5 text-left text-base font-medium transition ${
              selected === option
                ? "border-pod-coral bg-pod-coral/10"
                : "border-black/10 bg-pod-cloud hover:border-pod-teal/50 hover:bg-pod-teal/5"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

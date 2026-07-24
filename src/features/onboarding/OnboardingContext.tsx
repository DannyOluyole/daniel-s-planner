import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
  resetOnboarding,
} from "./onboardingStorage";

interface OnboardingContextValue {
  ready: boolean;
  onboarded: boolean;
  complete: () => Promise<void>;
  replay: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    hasCompletedOnboarding().then((done) => {
      setOnboarded(done);
      setReady(true);
    });
  }, []);

  const complete = async () => {
    await markOnboardingComplete();
    setOnboarded(true);
  };

  // Clears the persisted flag AND flips state immediately, so whatever is
  // gating the main nav (see Root in App.tsx) re-renders into onboarding
  // right away — no relaunch required.
  const replay = async () => {
    await resetOnboarding();
    setOnboarded(false);
  };

  const value = useMemo(
    () => ({ ready, onboarded, complete, replay }),
    [ready, onboarded]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "checkpoint:tempted-apps";

/**
 * Which apps the user says tempt them — captured once at onboarding
 * (see PauseRuleForm). Local-only, same persistence pattern as
 * useBigPurchaseThreshold. There's no OS-level way for this app to
 * actually intercept another app opening (Apple's Screen Time APIs are
 * parental-control-only, Android's Accessibility Service overlay approach
 * is a Play Store policy risk) — this is a personalization signal for
 * copy (e.g. Night Pause naming a specific app), never real interception.
 */
export function useTemptedApps() {
  const [apps, setAppsState] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored != null) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setAppsState(parsed.filter((x): x is string => typeof x === "string"));
        } catch {
          // Corrupt value — ignore, keep the empty default.
        }
      }
      setReady(true);
    })();
  }, []);

  const setApps = useCallback((next: string[]) => {
    setAppsState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
      // Non-fatal — preference just won't persist across app restarts.
    });
  }, []);

  const reset = useCallback(async () => {
    setAppsState([]);
    await AsyncStorage.removeItem(KEY);
  }, []);

  return { apps, ready, setApps, reset };
}

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SpendingDecision } from "@domain/entities/MoneyState";
import { TemptationWindow, detectPeakTemptationWindow } from "@domain/money/nightPause";

const ENABLED_KEY = "checkpoint:night-pause-enabled";
const WINDOW_KEY = "checkpoint:night-pause-window";
const PROMPTED_KEY = "checkpoint:night-pause-prompted";

/**
 * Local-only preference (same pattern as useBigPurchaseThreshold): whether
 * Night Pause is on, and the weekday/hour window it applies to. The
 * one-time "we've noticed something" prompt is also tracked here rather
 * than a new Supabase table — it's a preference, not an achievement, so it
 * doesn't need cross-device sync or the shown_milestones-style table.
 */
export function useNightPause(decisions: SpendingDecision[]) {
  const [enabled, setEnabledState] = useState(false);
  const [window, setWindowState] = useState<TemptationWindow | null>(null);
  const [prompted, setPromptedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedEnabled, storedWindow, storedPrompted] = await Promise.all([
        AsyncStorage.getItem(ENABLED_KEY),
        AsyncStorage.getItem(WINDOW_KEY),
        AsyncStorage.getItem(PROMPTED_KEY),
      ]);
      if (storedEnabled != null) setEnabledState(storedEnabled === "true");
      if (storedWindow != null) {
        try {
          const parsed = JSON.parse(storedWindow);
          if (parsed && typeof parsed.weekday === "number") setWindowState(parsed);
        } catch {
          // Corrupt value — ignore, keep the null default.
        }
      }
      if (storedPrompted != null) setPromptedState(storedPrompted === "true");
      setReady(true);
    })();
  }, []);

  // Only surfaces once — before the first accept/decline, and only when
  // there's a real detected pattern to show.
  const detected = ready && !prompted ? detectPeakTemptationWindow(decisions) : null;

  const accept = useCallback((next: TemptationWindow) => {
    setEnabledState(true);
    setWindowState(next);
    setPromptedState(true);
    AsyncStorage.multiSet([
      [ENABLED_KEY, "true"],
      [WINDOW_KEY, JSON.stringify(next)],
      [PROMPTED_KEY, "true"],
    ]).catch(() => {});
  }, []);

  const decline = useCallback(() => {
    setPromptedState(true);
    AsyncStorage.setItem(PROMPTED_KEY, "true").catch(() => {});
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    AsyncStorage.setItem(ENABLED_KEY, String(next)).catch(() => {});
  }, []);

  const reset = useCallback(async () => {
    setEnabledState(false);
    setWindowState(null);
    setPromptedState(false);
    await Promise.all([
      AsyncStorage.removeItem(ENABLED_KEY),
      AsyncStorage.removeItem(WINDOW_KEY),
      AsyncStorage.removeItem(PROMPTED_KEY),
    ]);
  }, []);

  return { enabled, window, detected, ready, accept, decline, setEnabled, reset };
}

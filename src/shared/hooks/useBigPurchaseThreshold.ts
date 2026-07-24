import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ENABLED_KEY = "checkpoint:big-purchase-enabled";
const THRESHOLD_KEY = "checkpoint:big-purchase-threshold-cents";
// $200 — the brief's own suggested starting point, not a claim about what
// counts as "big" for any particular person.
const DEFAULT_THRESHOLD_CENTS = 20000;

/**
 * A user-set line where Decision Mode adds reflection prompts ("still want
 * this in a week?") on top of its usual quick summary — not to gate or
 * guilt, just to slow down the moments that are actually worth slowing
 * down for. Local-only preference, same persistence pattern as theme.
 */
export function useBigPurchaseThreshold() {
  const [enabled, setEnabledState] = useState(true);
  const [thresholdCents, setThresholdCentsState] = useState(DEFAULT_THRESHOLD_CENTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedEnabled, storedThreshold] = await Promise.all([
        AsyncStorage.getItem(ENABLED_KEY),
        AsyncStorage.getItem(THRESHOLD_KEY),
      ]);
      if (storedEnabled != null) setEnabledState(storedEnabled === "true");
      if (storedThreshold != null) {
        const n = parseInt(storedThreshold, 10);
        if (!Number.isNaN(n) && n > 0) setThresholdCentsState(n);
      }
      setReady(true);
    })();
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    AsyncStorage.setItem(ENABLED_KEY, String(next)).catch(() => {
      // Non-fatal — preference just won't persist across app restarts.
    });
  }, []);

  const setThresholdCents = useCallback((next: number) => {
    setThresholdCentsState(next);
    AsyncStorage.setItem(THRESHOLD_KEY, String(next)).catch(() => {});
  }, []);

  return { enabled, thresholdCents, ready, setEnabled, setThresholdCents };
}

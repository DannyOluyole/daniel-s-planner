import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PauseIntensity } from "@domain/money/frictionTier";

const KEY = "checkpoint:pause-intensity";
const DEFAULT_INTENSITY: PauseIntensity = "standard";
const VALID: readonly PauseIntensity[] = ["gentle", "standard", "strong", "strict"];

/**
 * How aggressively Decision Mode's pause should escalate — local-only
 * preference, same persistence pattern as useBigPurchaseThreshold. Standard
 * is the default so a user who never opens this Settings card sees the
 * exact behavior the app always had.
 */
export function usePauseIntensity() {
  const [intensity, setIntensityState] = useState<PauseIntensity>(DEFAULT_INTENSITY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(KEY);
      if (stored != null && (VALID as string[]).includes(stored)) {
        setIntensityState(stored as PauseIntensity);
      }
      setReady(true);
    })();
  }, []);

  const setIntensity = useCallback((next: PauseIntensity) => {
    setIntensityState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {
      // Non-fatal — preference just won't persist across app restarts.
    });
  }, []);

  const reset = useCallback(async () => {
    setIntensityState(DEFAULT_INTENSITY);
    await AsyncStorage.removeItem(KEY);
  }, []);

  return { intensity, ready, setIntensity, reset };
}

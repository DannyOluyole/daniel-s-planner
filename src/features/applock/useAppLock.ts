import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const ENABLED_KEY = "checkpoint:app-lock-enabled";
// How long the app can sit backgrounded before the next foreground requires
// unlocking again — long enough that switching to another app to copy a
// confirmation code doesn't lock you out, short enough that leaving the
// phone on a table actually protects something.
const IDLE_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * Idle-timeout app lock: requires Face ID/fingerprint/device passcode after
 * the app has been backgrounded past IDLE_THRESHOLD_MS, not on every open.
 * On by default — unlike most preferences in this app, this one defaults
 * to protecting real financial data rather than staying out of the way,
 * matching what a finance app's users actually expect.
 *
 * Deliberately uses the OS's own biometric/passcode prompt
 * (authenticateAsync's built-in device-passcode fallback) rather than a
 * custom PIN screen — reuses security the platform already hardened
 * instead of reinventing it, and a device with no lock method configured
 * at all simply has nothing to require.
 */
export function useAppLock() {
  const [enabled, setEnabledState] = useState(true);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(true);
  const [canUseLock, setCanUseLock] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const [storedEnabled, hasHardware, isEnrolled] = await Promise.all([
        AsyncStorage.getItem(ENABLED_KEY),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      const nextEnabled = storedEnabled == null ? true : storedEnabled === "true";
      // isEnrolledAsync covers biometrics only; a device can still have a
      // passcode/PIN/pattern set with no biometric enrolled, which
      // authenticateAsync's device-fallback handles fine — hasHardware
      // alone is enough to know there's *some* prompt worth showing.
      const usable = hasHardware || isEnrolled;
      setEnabledState(nextEnabled);
      setCanUseLock(usable);
      setLocked(nextEnabled && usable);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const handleChange = (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        backgroundedAt.current = Date.now();
        return;
      }
      if (next !== "active") return;
      const since = backgroundedAt.current;
      backgroundedAt.current = null;
      if (since && enabled && canUseLock && Date.now() - since >= IDLE_THRESHOLD_MS) {
        setLocked(true);
      }
    };
    const subscription = AppState.addEventListener("change", handleChange);
    return () => subscription.remove();
  }, [enabled, canUseLock]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    if (!next) setLocked(false);
    AsyncStorage.setItem(ENABLED_KEY, String(next)).catch(() => {
      // Non-fatal — preference just won't persist across app restarts.
    });
  }, []);

  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Pause Money",
    });
    if (result.success) setLocked(false);
    return result.success;
  }, []);

  return { enabled, ready, locked, canUseLock, setEnabled, unlock };
}

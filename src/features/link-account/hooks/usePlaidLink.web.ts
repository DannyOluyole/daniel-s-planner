import { useCallback, useState } from "react";

type Phase = "idle" | "fetchingToken" | "linking" | "exchanging" | "syncing" | "done" | "error";

/**
 * Web variant: react-native-plaid-link-sdk is a native module (its import
 * crashes react-native-web at module load), so bank linking is only offered
 * in the iOS/Android apps. Same hook shape as the native implementation.
 */
export function usePlaidLink(_userId: string | null) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError("Bank linking uses the native Plaid SDK — open the iOS or Android app to connect.");
    setPhase("error");
  }, []);

  return { connect, phase, error };
}

import { useCallback, useState } from "react";

export type VoiceInputStatus = "idle" | "listening" | "unsupported" | "error";

/**
 * Native default: speech-to-text needs a real native module (there's no
 * built-in RN API for it), which this project doesn't bundle yet. Rather
 * than silently do nothing, it reports itself as unsupported so the UI can
 * fall back to the typed form — see useVoiceInput.web.ts for the real
 * implementation, which runs today in the browser preview via the Web
 * Speech API.
 */
export function useVoiceInput() {
  const [status] = useState<VoiceInputStatus>("unsupported");
  const [transcript] = useState("");
  const [error] = useState<string | null>(
    "Voice input needs the native app build on this device — type it in below for now."
  );

  const start = useCallback(() => {}, []);
  const stop = useCallback(() => {}, []);

  return { status, transcript, error, start, stop, supported: false };
}

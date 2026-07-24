import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceInputStatus = "idle" | "listening" | "unsupported" | "error";

// The Web Speech API isn't part of TypeScript's DOM lib (it's non-standard),
// so these are hand-declared for just the surface this hook touches.
interface MinimalSpeechRecognitionResult {
  0: { transcript: string };
}
interface MinimalSpeechRecognitionEvent {
  results: ArrayLike<MinimalSpeechRecognitionResult>;
}
interface MinimalSpeechRecognitionErrorEvent {
  error: string;
}
interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
  onerror: ((event: MinimalSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Web implementation via the browser's built-in Web Speech API — no
 * install, works today in Chrome/Edge. Safari and Firefox don't support
 * SpeechRecognition, so `supported` reflects that and the caller should
 * fall back to the typed form.
 */
export function useVoiceInput() {
  const Ctor = getRecognitionCtor();
  const supported = Ctor != null;
  const [status, setStatus] = useState<VoiceInputStatus>(supported ? "idle" : "unsupported");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(
    supported ? null : "Voice input isn't supported in this browser — try Chrome, or type it in below."
  );
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const start = useCallback(() => {
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    setTranscript("");
    setError(null);

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
      }
      setTranscript(combined);
    };
    recognition.onerror = (event) => {
      setStatus("error");
      setError(
        event.error === "not-allowed"
          ? "Microphone access was blocked — check your browser's site settings."
          : "Didn't catch that. Try again, or type it in below."
      );
    };
    recognition.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
  }, [Ctor]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  return { status, transcript, error, start, stop, supported };
}

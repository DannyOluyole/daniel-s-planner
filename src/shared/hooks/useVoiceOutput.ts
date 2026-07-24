import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import type { Voice } from "expo-speech";

// Names of voices that are known to sound natural rather than synthetic,
// checked as substrings, case-insensitively. Covers the common "good" voice
// on each platform: Chrome/Android (Google), iOS/macOS (Siri voices),
// Windows/Edge (the newer neural voices, not the classic SAPI ones).
const PREFERRED_NAME_HINTS = [
  "neural", "natural", "premium", "enhanced",
  "google us english", "google uk english",
  "samantha", "ava", "nicky", "aria", "jenny",
];
// Known low-quality/robotic voices to actively avoid when something better
// is on offer (still used as a last resort if nothing else matches).
const AVOID_NAME_HINTS = ["compact", "novelty", "zarvox", "trinoids", "bahh"];

function scoreVoice(voice: Voice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (voice.quality === Speech.VoiceQuality.Enhanced) score += 3;
  if (PREFERRED_NAME_HINTS.some((h) => name.includes(h))) score += 2;
  if (AVOID_NAME_HINTS.some((h) => name.includes(h))) score -= 4;
  if (voice.language?.toLowerCase() === "en-us") score += 1;
  return score;
}

async function pickBestVoice(): Promise<string | undefined> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const english = voices.filter((v) => v.language?.toLowerCase().startsWith("en"));
    const pool = english.length > 0 ? english : voices;
    if (pool.length === 0) return undefined;
    const best = pool.reduce((a, b) => (scoreVoice(b) > scoreVoice(a) ? b : a));
    return best.identifier;
  } catch {
    // getAvailableVoicesAsync isn't implemented on every platform — falling
    // back to the system default voice is a fine, quiet failure here.
    return undefined;
  }
}

/**
 * Reads text aloud. expo-speech runs on iOS, Android, and web (via the
 * browser's SpeechSynthesis API) from a single implementation, so this
 * doesn't need a platform split the way voice *input* does.
 *
 * The default voice/rate on most platforms reads like a screen reader —
 * this picks the least robotic voice available and slows down slightly,
 * which is most of what separates "an app talking at you" from "read
 * naturally."
 */
export function useVoiceOutput() {
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);
  const voiceId = useRef<string | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    pickBestVoice().then((id) => {
      if (mounted.current) voiceId.current = id;
    });
    return () => {
      mounted.current = false;
      Speech.stop();
    };
  }, []);

  const speak = useCallback((text: string) => {
    const onFinished = () => {
      if (mounted.current) setSpeaking(false);
    };
    Speech.stop();
    setSpeaking(true);
    Speech.speak(text, {
      voice: voiceId.current,
      rate: 0.93,
      pitch: 1.02,
      onDone: onFinished,
      onStopped: onFinished,
      onError: onFinished,
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}

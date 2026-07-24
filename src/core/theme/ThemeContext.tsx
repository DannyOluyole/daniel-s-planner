import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedScheme = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  scheme: ResolvedScheme;
  setPreference: (pref: ThemePreference) => void;
  ready: boolean;
}

const STORAGE_KEY = "checkpoint:theme-preference";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreferenceState(stored);
      }
      setReady(true);
    });
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {
      // Non-fatal — preference just won't persist across app restarts.
    });
  };

  const scheme: ResolvedScheme = preference === "system" ? systemScheme : preference;

  const value = useMemo(
    () => ({ preference, scheme, setPreference, ready }),
    [preference, scheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * App-wide replacement for RN's useColorScheme. Every themed component
 * should read from here, not from react-native directly, so the in-app
 * toggle actually takes effect regardless of the device setting.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

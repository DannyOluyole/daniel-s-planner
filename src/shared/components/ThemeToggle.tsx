import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme, ThemePreference } from "@core/theme/ThemeContext";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/**
 * A single segmented control. Lives on the Settings screen but is a shared
 * primitive in case another surface (e.g. onboarding) wants it later.
 */
export function ThemeToggle() {
  const { preference, setPreference, scheme } = useTheme();
  const dark = scheme === "dark";

  return (
    <View
      className={`flex-row rounded-xl2 p-1 border ${
        dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
      }`}
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setPreference(opt.value)}
            className={`flex-1 items-center py-2.5 rounded-xl2 ${
              active ? "bg-checkpoint" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                active ? "text-white" : dark ? "text-ink-faint" : "text-ink-soft"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

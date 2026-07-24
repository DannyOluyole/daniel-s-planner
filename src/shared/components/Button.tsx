import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@core/theme/ThemeContext";

type Intent = "primary" | "quiet" | "ghost";

interface ButtonProps {
  label: string;
  onPress: () => void;
  intent?: Intent;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
}

/**
 * Three intents cover every CTA in the app:
 *  - primary: "Continue" — the deep checkpoint green, filled
 *  - quiet:   "Pause" — outlined, unhurried
 *  - ghost:   "Not right now" — text-only, lowest emphasis
 */
export function Button({
  label,
  onPress,
  intent = "primary",
  loading = false,
  disabled = false,
  haptic = true,
}: ButtonProps) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const base = "flex-row items-center justify-center rounded-xl2 py-4 px-6";

  const styles: Record<Intent, string> = {
    primary: "bg-checkpoint",
    quiet: `border ${dark ? "border-hairline-dark" : "border-hairline"} bg-transparent`,
    ghost: "bg-transparent",
  };

  const textStyles: Record<Intent, string> = {
    primary: "font-bold text-base",
    quiet: dark ? "text-ink-dark font-medium text-base" : "text-ink font-medium text-base",
    ghost: dark ? "text-ink-faint font-medium text-sm" : "text-ink-soft font-medium text-sm",
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={`${base} ${styles[intent]} ${disabled ? "opacity-40" : ""}`}
      style={
        intent === "primary"
          ? {
              shadowColor: "#12B76A",
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
            }
          : undefined
      }
    >
      {loading ? (
        <ActivityIndicator color={intent === "primary" ? "#04180E" : "#12B76A"} />
      ) : (
        <Text
          className={textStyles[intent]}
          style={intent === "primary" ? { color: "#04180E" } : undefined}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

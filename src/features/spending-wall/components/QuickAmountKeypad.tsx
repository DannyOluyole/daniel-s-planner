import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

/**
 * On-screen numeric entry for the amount — the doc's "standing in line at
 * Starbucks" scenario doesn't have 45 seconds to spare for the OS keyboard
 * to slide up and a text field to focus. Tap digits directly instead.
 */
export function QuickAmountKeypad({ value, onChange }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  const press = (key: string) => {
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "." && value.includes(".")) return;
    const decimals = value.split(".")[1];
    if (decimals && decimals.length >= 2) return;
    if (value.length >= 7) return;
    onChange(value + key);
  };

  return (
    <View className="flex-row flex-wrap">
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => press(key)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={key === "back" ? "Delete" : key}
          style={{ width: "33.33%" }}
          className="items-center justify-center py-4"
        >
          <Text className={`text-2xl font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
            {key === "back" ? "⌫" : key}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

import React from "react";
import { View, TextInput } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

/**
 * The app's first search/filter surface — no prior pattern existed to
 * reuse, so this is deliberately plain (a bordered TextInput matching
 * AuthScreen's input styling) rather than introducing a new visual style
 * for a one-off.
 */
export function SearchInput({ value, onChangeText, placeholder }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  return (
    <View
      className={`rounded-xl2 border px-4 py-3 ${
        dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
      }`}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9CA5"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        className={`text-base ${dark ? "text-ink-dark" : "text-ink"}`}
      />
    </View>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { colors } from "@core/theme/tokens";

interface Props {
  score: number;
  label: string;
}

/**
 * One glance, one number — the doc's ask: "Users immediately understand."
 * Color follows the score itself rather than a separate tone flag, so it
 * can't drift out of sync with the number it's describing.
 */
export function AlignmentScore({ score, label }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const tone = score >= 60 ? colors.checkpoint : colors.caution;

  return (
    <View className="items-center mt-6">
      <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
        Financial Alignment
      </Text>
      <Text className="text-[44px] font-extrabold mt-2" style={{ color: tone }}>
        {score}%
      </Text>
      <Text className={`text-sm font-medium mt-1.5 ${dark ? "text-ink-dark" : "text-ink"}`}>{label}</Text>
    </View>
  );
}

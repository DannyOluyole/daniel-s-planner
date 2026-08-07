import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { colors } from "@core/theme/tokens";
import { Copy } from "@core/copy/strings";
import { InfoModal } from "@shared/components/InfoModal";

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
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <View className="items-center mt-6">
      <Pressable
        onPress={() => setExplainerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`What is ${Copy.spendingWall.financialAlignmentLabel}?`}
        className="flex-row items-center gap-1"
        hitSlop={8}
      >
        <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {Copy.spendingWall.financialAlignmentLabel}
        </Text>
        <Text className={`text-caption ${dark ? "text-ink-faint" : "text-ink-faint"}`}>ⓘ</Text>
      </Pressable>
      <Text className="text-[44px] font-extrabold mt-2" style={{ color: tone }}>
        {score}%
      </Text>
      <Text className={`text-sm font-medium mt-1.5 ${dark ? "text-ink-dark" : "text-ink"}`}>{label}</Text>

      <InfoModal
        visible={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        title={Copy.spendingWall.financialAlignmentExplainerTitle}
      >
        <Text className={dark ? "text-ink-dark" : "text-ink"}>{Copy.spendingWall.financialAlignmentExplainerBody}</Text>
      </InfoModal>
    </View>
  );
}

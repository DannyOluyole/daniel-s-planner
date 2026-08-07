import React, { useState } from "react";
import { useTheme } from "@core/theme/ThemeContext";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card } from "@shared/components/Card";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { colors } from "@core/theme/tokens";
import { InfoModal } from "@shared/components/InfoModal";

interface AvailableCardProps {
  availableCents: number;
  /** Overrides the default "Available today" caption — used when browsing
   * a month other than the current one, where "today" doesn't apply. */
  label?: string;
  /** Overrides the default "Safe to Spend today" subtitle. */
  subtitle?: string;
}

export function AvailableCard({ availableCents, label, subtitle }: AvailableCardProps) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [explainerOpen, setExplainerOpen] = useState(false);

  const body = (
    <>
      <Pressable
        onPress={() => setExplainerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`What is ${Copy.safeToSpend}?`}
        className="flex-row items-center gap-1"
        hitSlop={8}
      >
        <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-dark/60" : "text-ink-faint"}`}>
          {label ?? Copy.home.availableLabel}
        </Text>
        <Text className={`text-caption ${dark ? "text-ink-dark/60" : "text-ink-faint"}`}>ⓘ</Text>
      </Pressable>
      <View className="mt-2 flex-row items-baseline">
        <Text
          className={`text-[40px] font-extrabold -tracking-wide ${dark ? "text-ink-dark" : "text-ink"}`}
        >
          {money(availableCents)}
        </Text>
      </View>
      <Text className={`mt-1 text-sm ${dark ? "text-ink-dark/60" : "text-ink-soft"}`}>
        {subtitle ?? `${Copy.safeToSpend} today`}
      </Text>

      <InfoModal
        visible={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        title={Copy.home.safeToSpendExplainerTitle}
      >
        <Text className={dark ? "text-ink-dark" : "text-ink"}>{Copy.home.safeToSpendExplainerBody}</Text>
      </InfoModal>
    </>
  );

  if (dark) {
    return (
      <LinearGradient
        colors={["#123324", colors.canvasDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={{
          borderRadius: 28,
          padding: 20,
          borderWidth: 1,
          borderColor: "#1D3A2C",
        }}
      >
        {body}
      </LinearGradient>
    );
  }

  return <Card raised>{body}</Card>;
}

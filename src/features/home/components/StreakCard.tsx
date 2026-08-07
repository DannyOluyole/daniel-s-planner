import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { colors } from "@core/theme/tokens";

interface Props {
  weeks: number;
}

/**
 * Rewards the habit Decision Mode is actually trying to build — pausing
 * before a purchase — not a generic "opened the app" streak. A week with no
 * shopping temptation at all doesn't break it (see computeWeeksProtectedStreak);
 * only a week where every logged decision went straight to "continued" does.
 */
export function StreakCard({ weeks }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const active = weeks > 0;

  return (
    <View
      className={`mt-3 rounded-xl2 border p-4 flex-row items-center gap-3 ${
        dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
      }`}
    >
      <Text style={{ fontSize: 28 }}>{active ? "🔥" : "〰️"}</Text>
      <View className="flex-1">
        <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {Copy.home.streakLabel}
        </Text>
        <View className="flex-row items-baseline mt-0.5">
          {active && (
            <Text className="text-2xl font-extrabold mr-1.5" style={{ color: colors.checkpoint }}>
              {weeks}
            </Text>
          )}
          <Text className={`text-sm ${dark ? "text-ink-dark" : "text-ink"}`}>
            {active ? Copy.home.streakBodyActive(weeks) : Copy.home.streakBodyEmpty}
          </Text>
        </View>
      </View>
    </View>
  );
}

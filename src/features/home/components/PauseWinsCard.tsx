import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { colors } from "@core/theme/tokens";
import { money } from "@domain/entities/MoneyState";
import { PauseWins, PauseLevel } from "@domain/money/pauseWins";

interface Props {
  wins: PauseWins;
  level: PauseLevel;
}

/**
 * Rewards pausing itself, not just money saved (the doc's core reframe) —
 * "Look what you accomplished," not a running tally of restraint. Weekly
 * and lifetime sit side by side so a quiet week doesn't erase the bigger
 * picture, and the level line reinforces identity ("I'm someone who
 * pauses") rather than a points/XP number.
 */
export function PauseWinsCard({ wins, level }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const hasAnyLifetime = wins.lifetime.pauses > 0;

  return (
    <View
      className={`mt-3 rounded-xl2 border p-4 ${dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"}`}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${Copy.pauseWins.title}: ${Copy.pauseWins.pausesLabel(wins.lifetime.pauses)}, ${money(
        wins.lifetime.moneyKeptCents
      )} kept lifetime`}
    >
      <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
        {Copy.pauseWins.title}
      </Text>

      {hasAnyLifetime ? (
        <>
          <View className="flex-row mt-2 gap-3">
            <View className="flex-1">
              <Text className={`text-caption ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {Copy.pauseWins.weeklyLabel}
              </Text>
              <Text className={`text-base font-semibold mt-0.5 ${dark ? "text-ink-dark" : "text-ink"}`}>
                {Copy.pauseWins.pausesLabel(wins.weekly.pauses)}
              </Text>
              <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                {Copy.pauseWins.skippedLabel(wins.weekly.skipped)} · {Copy.pauseWins.keptLabel(money(wins.weekly.moneyKeptCents))}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-caption ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {Copy.pauseWins.lifetimeLabel}
              </Text>
              <Text className="text-base font-semibold mt-0.5" style={{ color: colors.checkpoint }}>
                {Copy.pauseWins.pausesLabel(wins.lifetime.pauses)}
              </Text>
              <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                {Copy.pauseWins.keptLabel(money(wins.lifetime.moneyKeptCents))}
              </Text>
            </View>
          </View>

          <Text className={`text-xs mt-3 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
            {Copy.pauseWins.intentionalRateLabel(wins.lifetime.intentionalRate)}
          </Text>

          {(level.name || level.nextName) && (
            <View className={`mt-3 pt-3 border-t ${dark ? "border-hairline-dark" : "border-hairline"}`}>
              {level.name && (
                <Text className="text-sm font-semibold" style={{ color: colors.checkpoint }}>
                  {level.name}
                </Text>
              )}
              {level.nextAt != null && level.nextName != null && (
                <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                  {Copy.pauseWins.levelProgressLabel(level.nextAt - level.pauses, level.nextName)}
                </Text>
              )}
            </View>
          )}
        </>
      ) : (
        <Text className={`text-sm mt-2 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {Copy.pauseWins.emptyBody}
        </Text>
      )}
    </View>
  );
}

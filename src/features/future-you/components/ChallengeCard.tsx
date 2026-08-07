import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { colors } from "@core/theme/tokens";
import { Button } from "@shared/components/Button";
import { Challenge } from "@domain/entities/Challenge";
import { SpendingDecision } from "@domain/entities/MoneyState";
import { computeChallengeProgress } from "@domain/money/challengeProgress";

interface Props {
  challenges: Challenge[];
  decisions: SpendingDecision[];
  onStart: () => void;
  onRemove: (id: string) => void;
}

/**
 * v1 supports one challenge at a time, one type (No-Spend Week) — the list
 * is still plural in the data model so a second concurrent challenge or a
 * second type is additive later, not a schema change.
 */
export function ChallengeCard({ challenges, decisions, onStart, onRemove }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const active = challenges[0] ?? null;
  const progress = active ? computeChallengeProgress(active, decisions) : null;

  return (
    <View
      className={`mt-4 rounded-xl2 border p-5 ${dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"}`}
    >
      <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.challenges.sectionTitle}
      </Text>

      {!active && (
        <>
          <Text className={`text-base mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
            {Copy.challenges.noSpendWeekName}
          </Text>
          <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
            {Copy.challenges.noSpendWeekDescription}
          </Text>
          <Button label={Copy.challenges.startCta} intent="quiet" onPress={onStart} />
        </>
      )}

      {active && progress && (
        <>
          <Text className={`text-base font-medium mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
            {Copy.challenges.noSpendWeekName}
          </Text>
          <Text
            className="text-sm mb-3"
            style={{ color: progress.failed ? colors.caution : progress.completed ? colors.checkpoint : undefined }}
          >
            <Text className={dark ? "text-ink-faint" : "text-ink-soft"}>
              {progress.failed
                ? Copy.challenges.failed
                : progress.completed
                ? Copy.challenges.completed
                : Copy.challenges.inProgress(progress.daysElapsed, progress.daysTotal)}
            </Text>
          </Text>
          <Button
            label={progress.failed || progress.completed ? Copy.challenges.startCta : Copy.challenges.cancelCta}
            intent="quiet"
            onPress={() => (progress.failed || progress.completed ? onStart() : onRemove(active.id))}
          />
        </>
      )}
    </View>
  );
}

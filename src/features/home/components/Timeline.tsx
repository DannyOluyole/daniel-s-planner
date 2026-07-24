import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { SpendingDecision, DecisionOutcome } from "@domain/entities/MoneyState";
import { Transaction } from "@domain/entities/Transaction";
import { humanizeCategory } from "@domain/money/humanizeCategory";

interface Props {
  decisions: SpendingDecision[];
  transactions: Transaction[];
}

interface TimelineEntry {
  id: string;
  name: string;
  amountCents: number;
  at: Date;
  outcome?: DecisionOutcome;
  sub?: string;
}

const OUTCOME_LABEL: Record<DecisionOutcome, string> = {
  continued: Copy.home.timelineBought,
  paused: Copy.home.timelineSaved,
  reconsidered: Copy.home.timelineCancelled,
};

function dayLabel(date: Date, now: Date): string {
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(date, now)) return Copy.home.timelineToday;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return Copy.home.timelineYesterday;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function Timeline({ decisions, transactions }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  const entries: TimelineEntry[] = [
    ...decisions.map((d) => ({
      id: `d-${d.id}`,
      name: d.merchant,
      amountCents: d.amountCents,
      at: new Date(d.decidedAt),
      outcome: d.outcome,
    })),
    ...transactions.map((t) => ({
      id: `t-${t.id}`,
      name: t.merchantName,
      amountCents: t.amountCents,
      at: (() => {
        const [y, m, day] = t.transactedAt.split("-").map(Number);
        return new Date(y, m - 1, day);
      })(),
      sub: humanizeCategory(t.category),
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  if (entries.length === 0) {
    return (
      <Text className={`text-sm ${dark ? "text-ink-faint" : "text-ink-faint"}`}>{Copy.home.timelineEmpty}</Text>
    );
  }

  const now = new Date();
  let lastLabel: string | null = null;

  return (
    <View>
      {entries.slice(0, 30).map((entry) => {
        const label = dayLabel(entry.at, now);
        const showLabel = label !== lastLabel;
        lastLabel = label;
        const isCredit = entry.amountCents < 0;

        return (
          <View key={entry.id}>
            {showLabel && (
              <Text
                className={`mt-4 mb-1 text-caption uppercase tracking-wide ${
                  dark ? "text-ink-faint" : "text-ink-faint"
                }`}
              >
                {label}
              </Text>
            )}
            <View
              className={`flex-row items-center justify-between py-2.5 border-b ${
                dark ? "border-hairline-dark" : "border-hairline"
              }`}
            >
              <View className="flex-1 pr-3">
                <Text className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
                  {entry.name}
                </Text>
                {(entry.outcome || entry.sub) && (
                  <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                    {entry.outcome ? OUTCOME_LABEL[entry.outcome] : entry.sub}
                  </Text>
                )}
              </View>
              <Text
                className="text-base font-semibold"
                style={{ color: isCredit ? "#12B76A" : dark ? "#EDF7F2" : "#12211B" }}
              >
                {isCredit ? "+" : ""}
                {money(Math.abs(entry.amountCents))}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

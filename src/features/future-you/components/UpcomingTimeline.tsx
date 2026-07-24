import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Card } from "@shared/components/Card";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { FinancialTimeline } from "@domain/money/financialTimeline";

interface Props {
  timeline: FinancialTimeline;
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayLabel(dateKey: string, now: Date): string {
  const date = parseDateKey(dateKey);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(date, now)) return "Today";
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** The forward-looking sibling of Home's Timeline feed — that one replays
 * decisions and bank activity already behind you, this one projects
 * scheduled income and bills ahead, so a shortfall is visible before it
 * happens instead of after. */
export function UpcomingTimeline({ timeline }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const now = new Date();

  if (timeline.events.length === 0) {
    return (
      <Card className="mt-4">
        <Text className={`text-headline mb-2 ${dark ? "text-ink-dark" : "text-ink"}`}>
          {Copy.futureYouScreen.aheadTitle}
        </Text>
        <Text className={`text-sm ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {Copy.futureYouScreen.aheadEmpty}
        </Text>
      </Card>
    );
  }

  const shortfall = timeline.lowestBalanceDate && timeline.lowestBalanceCents < 0;

  return (
    <Card className="mt-4">
      <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.futureYouScreen.aheadTitle}
      </Text>
      <Text className={`text-sm mb-3 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
        {Copy.futureYouScreen.aheadSubtitle}
      </Text>

      {timeline.lowestBalanceDate && (
        <Text className={`text-sm font-medium mb-3 ${shortfall ? "text-signal-caution" : dark ? "text-ink-dark" : "text-ink"}`}>
          {shortfall
            ? Copy.futureYouScreen.aheadShortfallWarning(
                money(Math.abs(timeline.lowestBalanceCents)),
                dayLabel(timeline.lowestBalanceDate, now)
              )
            : Copy.futureYouScreen.aheadLowPoint(
                money(timeline.lowestBalanceCents),
                dayLabel(timeline.lowestBalanceDate, now)
              )}
        </Text>
      )}

      {timeline.events.map((event, i) => {
        const isCredit = event.amountCents > 0;
        const balance = timeline.runningBalances[i];
        return (
          <View
            key={`${event.date}-${event.kind}-${i}`}
            className={`flex-row items-center justify-between py-2.5 border-b ${
              dark ? "border-hairline-dark" : "border-hairline"
            }`}
          >
            <View className="flex-1 pr-3">
              <Text className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
                {event.label}
              </Text>
              <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {dayLabel(event.date, now)}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-base font-semibold"
                style={{ color: isCredit ? "#12B76A" : dark ? "#EDF7F2" : "#12211B" }}
              >
                {isCredit ? "+" : "-"}
                {money(Math.abs(event.amountCents))}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${
                  balance < 0 ? "text-signal-caution" : dark ? "text-ink-faint" : "text-ink-faint"
                }`}
              >
                {money(balance)}
              </Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

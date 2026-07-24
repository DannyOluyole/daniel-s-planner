import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@core/theme/ThemeContext";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Screen } from "@shared/components/Screen";
import { Button } from "@shared/components/Button";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { useCommitments } from "@shared/hooks/useCommitments";
import { useIncome } from "@shared/hooks/useIncome";
import { useDecisions } from "@shared/hooks/useDecisions";
import { useAuth } from "@core/auth/AuthContext";
import { summarizeCategoryImpact, sumContinuedThisMonth, summarizeIntentThisMonth } from "@domain/money/categoryImpact";
import { sumActiveDuringMonth } from "@domain/money/activeDuringMonth";
import { topCategoryThisWeek } from "@domain/money/weeklyInsight";
import { detectCategoryTrends } from "@domain/money/insightsEngine";
import { buildFinancialTimeline, computeSafeSpendingDays } from "@domain/money/financialTimeline";
import { computeFinancialConfidence } from "@domain/money/financialConfidence";
import { AvailableCard } from "./components/AvailableCard";
import { FinancialConfidenceCard } from "./components/FinancialConfidenceCard";
import { Timeline } from "./components/Timeline";
import { useCheckpoint } from "@shared/hooks/useCheckpoint";
import { useSavingsGoals } from "@shared/hooks/useSavingsGoals";
import { useBankConnectionStatus } from "@features/link-account/hooks/useBankConnectionStatus";
import { useTransactions } from "@features/link-account/hooks/useTransactions";
import type { HomeScreenProps } from "@app/Navigation";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * A quick daily read, not a management console: what's safe to spend right
 * now, whether anything's running hot, and what's happened lately. Adding
 * or editing income/bills/goals is a deliberate step forward from here
 * (see ManageMoneyScreen and FutureYouScreen), not inline on this scroll.
 */
export function HomeScreen({ navigation }: HomeScreenProps) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { commitments, loading: commitmentsLoading } = useCommitments(userId);
  const { income, loading: incomeLoading } = useIncome(userId);
  const { decisions, loading: decisionsLoading, refresh: refreshDecisions } = useDecisions(userId, 200);
  const { goals } = useSavingsGoals(userId);
  const { status: bankStatus, refresh: refreshBankStatus } = useBankConnectionStatus(userId);
  const { state: bankState, refresh: refreshBankState } = useCheckpoint(userId);
  const { transactions, refresh: refreshTransactions } = useTransactions(userId);
  const isBankLinked = bankStatus === "linked";

  useFocusEffect(
    useCallback(() => {
      refreshDecisions();
      refreshBankStatus();
      refreshBankState();
      refreshTransactions();
    }, [refreshDecisions, refreshBankStatus, refreshBankState, refreshTransactions])
  );

  const today = new Date();
  const activeCommitments = commitments.filter((c) => !c.removedAt);
  const variable = activeCommitments.filter((c) => c.type === "variable");
  const totalIncome = sumActiveDuringMonth(income, today);
  const protectedCents = sumActiveDuringMonth(commitments, today);
  const spentThisMonth = sumContinuedThisMonth(decisions);
  const locallyComputedAvailableCents = totalIncome - protectedCents - spentThisMonth;
  // Once a bank is linked, the hero number reflects the real synced balance
  // (the same one Decision Mode itself checks against) rather than the
  // locally-tracked projection.
  const availableCents = isBankLinked && bankState ? bankState.availableCents : locallyComputedAvailableCents;
  const timeline = buildFinancialTimeline(availableCents, income, commitments, null, today);
  const safeSpendingDays = computeSafeSpendingDays(availableCents, timeline, today);
  const weeklyInsight = topCategoryThisWeek(decisions);
  const topTrend = detectCategoryTrends(decisions)[0] ?? null;
  const investingSpend =
    summarizeIntentThisMonth(decisions).find((i) => i.intent === "Investing in myself")?.spentCents ?? 0;
  const anyCategoryOverBudget = variable.some(
    (c) => (summarizeCategoryImpact(activeCommitments, decisions, c.category, 0)?.overBy ?? 0) > 0
  );
  const confidence = computeFinancialConfidence(availableCents, goals, anyCategoryOverBudget, timeline.causesShortfall);
  const homeStatus = availableCents < 0
    ? Copy.home.statusOverAvailable
    : anyCategoryOverBudget
    ? Copy.home.statusCategoryOver
    : Copy.home.statusOnTrack;

  const loading = commitmentsLoading || incomeLoading || decisionsLoading;

  return (
    <Screen>
      <View className="mt-4 mb-1">
        <Text className={`text-caption uppercase tracking-widest ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {getGreeting()}
        </Text>
        <Text className={`mt-1 text-title font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
          {homeStatus}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#12B76A" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
          <AvailableCard availableCents={availableCents} />

          {safeSpendingDays.daysUntilPayday != null && (
            <Text className={`mt-2 text-sm text-center ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
              {safeSpendingDays.dailyAllowanceCents != null
                ? Copy.home.safeSpendingDaysWithAllowance(
                    safeSpendingDays.daysUntilPayday,
                    money(safeSpendingDays.dailyAllowanceCents)
                  )
                : Copy.home.safeSpendingDaysOnly(safeSpendingDays.daysUntilPayday)}
            </Text>
          )}

          <View className="mt-4">
            <Button
              label={`Open ${Copy.checkpoint}`}
              onPress={() => navigation.navigate("NewDecision")}
            />
          </View>

          <View className="mt-6 flex-row gap-3">
            <View
              className={`flex-1 rounded-xl2 border p-3 ${
                dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
              }`}
            >
              <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {Copy.home.comingInSummaryLabel}
              </Text>
              <Text className={`mt-1 text-lg font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
                {money(totalIncome)}
              </Text>
            </View>
            <View
              className={`flex-1 rounded-xl2 border p-3 ${
                dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
              }`}
            >
              <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {Copy.home.protectedLabel}
              </Text>
              <Text className={`mt-1 text-lg font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
                {money(protectedCents)}
              </Text>
            </View>
          </View>

          <FinancialConfidenceCard score={confidence.score} label={confidence.label} checks={confidence.checks} />

          {investingSpend > 0 && (
            <View
              className={`mt-3 rounded-xl2 border p-3 ${
                dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
              }`}
            >
              <Text className={`text-sm ${dark ? "text-ink-dark" : "text-ink"}`}>
                {Copy.home.investingInYourself(money(investingSpend))}
              </Text>
            </View>
          )}

          {(weeklyInsight || topTrend) && (
            <View
              className={`mt-3 rounded-xl2 border p-3 ${
                dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
              }`}
            >
              <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {Copy.home.weeklyInsightLabel}
              </Text>
              {weeklyInsight && (
                <Text className={`mt-1 text-sm ${dark ? "text-ink-dark" : "text-ink"}`}>
                  {Copy.home.weeklyInsight(
                    money(weeklyInsight.spentCents),
                    weeklyInsight.category,
                    weeklyInsight.count
                  )}
                </Text>
              )}
              {topTrend && (
                <Text
                  className={`mt-1 text-sm ${
                    topTrend.direction === "up" ? "text-signal-caution" : dark ? "text-ink-dark" : "text-ink"
                  }`}
                >
                  {topTrend.direction === "up"
                    ? Copy.home.trendUp(topTrend.category, topTrend.percentChange)
                    : Copy.home.trendDown(topTrend.category, topTrend.percentChange)}
                </Text>
              )}
            </View>
          )}

          <View className="mt-4">
            <Button
              label="Manage income & bills"
              intent="quiet"
              onPress={() => navigation.navigate("ManageMoney")}
            />
          </View>

          <Text className={`mt-7 mb-2 text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.home.timelineTitle}
          </Text>
          <Timeline decisions={decisions} transactions={isBankLinked ? transactions : []} />
          <View className="mb-4" />
        </ScrollView>
      )}
    </Screen>
  );
}

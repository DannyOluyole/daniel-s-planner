import React, { useState } from "react";
import { useTheme } from "@core/theme/ThemeContext";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Button } from "@shared/components/Button";
import { Copy } from "@core/copy/strings";
import { useCommitments } from "@shared/hooks/useCommitments";
import { useIncome } from "@shared/hooks/useIncome";
import { useDecisions } from "@shared/hooks/useDecisions";
import { useAuth } from "@core/auth/AuthContext";
import { summarizeCategoryImpact } from "@domain/money/categoryImpact";
import { wasActiveDuringMonth } from "@domain/money/activeDuringMonth";
import { money } from "@domain/entities/MoneyState";
import { Category } from "@domain/money/parsePurchaseSpeech";
import { IncomeFrequency } from "@domain/entities/Income";
import { IncomeRow } from "./components/IncomeRow";
import { AddIncomeForm } from "./components/AddIncomeForm";
import { CommitmentRow } from "./components/CommitmentRow";
import { AddCommitmentForm } from "./components/AddCommitmentForm";

type AddingSection = "income" | "fixed" | "variable" | "debt" | null;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Where income, bills, and habits actually get added or edited — pulled off
 * Home's main scroll so Home can stay a quick daily read instead of a
 * management console. Month browsing lives here rather than on Home: seeing
 * what was true in a past or future month is an upkeep question, not
 * something worth a control on the daily-glance screen.
 */
export function ManageMoneyScreen() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { commitments, loading: commitmentsLoading, addCommitment, removeCommitment } = useCommitments(userId);
  const { income, loading: incomeLoading, addIncome, removeIncome } = useIncome(userId);
  const { decisions, loading: decisionsLoading } = useDecisions(userId, 200);
  const [addingSection, setAddingSection] = useState<AddingSection>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  const today = startOfMonth(new Date());
  const isCurrentMonth = isSameMonth(selectedMonth, today);
  const monthLabel = formatMonth(selectedMonth);

  const visibleCommitments = isCurrentMonth
    ? commitments.filter((c) => !c.removedAt)
    : commitments.filter((c) => wasActiveDuringMonth(c, selectedMonth));
  const visibleIncome = isCurrentMonth
    ? income.filter((i) => !i.removedAt)
    : income.filter((i) => wasActiveDuringMonth(i, selectedMonth));

  const fixed = visibleCommitments.filter((c) => c.type === "fixed");
  const variable = visibleCommitments.filter((c) => c.type === "variable");
  const debt = visibleCommitments.filter((c) => c.type === "debt");

  const goToPreviousMonth = () =>
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));

  const handleAddCommitment = async (
    type: "fixed" | "variable" | "debt",
    name: string,
    amountCents: number,
    category?: Category,
    dayOfMonth?: number
  ) => {
    await addCommitment({ name, type, amountCents, category, dayOfMonth });
    setAddingSection(null);
  };

  const handleAddIncome = async (
    name: string,
    amountCents: number,
    frequency?: IncomeFrequency,
    dayOfMonth?: number,
    anchorDate?: string
  ) => {
    await addIncome({ name, amountCents, frequency, dayOfMonth, anchorDate });
    setAddingSection(null);
  };

  const loading = commitmentsLoading || incomeLoading || decisionsLoading;
  const sectionTitleClass = `mt-7 mb-2 text-caption uppercase tracking-wide ${
    dark ? "text-ink-faint" : "text-ink-faint"
  }`;
  const emptyClass = `text-sm ${dark ? "text-ink-faint" : "text-ink-faint"}`;

  return (
    <Screen>
      <BackHeader title="Income & bills" subtitle="What's recurring, and what's protected each month." />

      <View className="mt-4 mb-2 flex-row items-center justify-between">
        <Pressable onPress={goToPreviousMonth} hitSlop={10} accessibilityRole="button" accessibilityLabel="Previous month">
          <Text className={`text-lg ${dark ? "text-ink-faint" : "text-ink-soft"}`}>‹</Text>
        </Pressable>
        <Text className={`text-sm font-medium ${dark ? "text-ink-dark" : "text-ink"}`}>{monthLabel}</Text>
        <Pressable onPress={goToNextMonth} hitSlop={10} accessibilityRole="button" accessibilityLabel="Next month">
          <Text className={`text-lg ${dark ? "text-ink-faint" : "text-ink-soft"}`}>›</Text>
        </Pressable>
      </View>
      {!isCurrentMonth && (
        <Pressable onPress={() => setSelectedMonth(today)} className="items-center mb-2">
          <Text className="text-xs text-checkpoint">{Copy.home.jumpToTodayCta}</Text>
        </Pressable>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#12B76A" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="mt-2">
          <Text className={`mt-1 mb-2 text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.home.comingInSectionTitle}
          </Text>
          {visibleIncome.length === 0 && addingSection !== "income" && (
            <Text className={emptyClass}>{Copy.home.emptyIncome}</Text>
          )}
          {visibleIncome.map((i) => (
            <IncomeRow key={i.id} income={i} onRemove={() => removeIncome(i.id)} readOnly={!isCurrentMonth} />
          ))}
          {isCurrentMonth &&
            (addingSection === "income" ? (
              <AddIncomeForm onSubmit={handleAddIncome} onCancel={() => setAddingSection(null)} />
            ) : (
              <View className="mt-3">
                <Button label={Copy.home.addIncomeCta} intent="quiet" onPress={() => setAddingSection("income")} />
              </View>
            ))}

          <Text className={sectionTitleClass}>{Copy.commitmentsScreen.fixedSectionTitle}</Text>
          {fixed.length === 0 && addingSection !== "fixed" && <Text className={emptyClass}>{Copy.commitmentsScreen.emptyFixed}</Text>}
          {fixed.map((c) => (
            <CommitmentRow key={c.id} commitment={c} onRemove={() => removeCommitment(c.id)} readOnly={!isCurrentMonth} />
          ))}
          {isCurrentMonth &&
            (addingSection === "fixed" ? (
              <AddCommitmentForm
                type="fixed"
                onSubmit={(name, amt, _cat, day) => handleAddCommitment("fixed", name, amt, undefined, day)}
                onCancel={() => setAddingSection(null)}
              />
            ) : (
              <View className="mt-3">
                <Button
                  label={Copy.commitmentsScreen.addFixedCta}
                  intent="quiet"
                  onPress={() => setAddingSection("fixed")}
                />
              </View>
            ))}

          <Text className={sectionTitleClass}>{Copy.commitmentsScreen.variableSectionTitle}</Text>
          {variable.length === 0 && addingSection !== "variable" && (
            <Text className={emptyClass}>{Copy.commitmentsScreen.emptyVariable}</Text>
          )}
          {variable.map((c) => {
            const impact = summarizeCategoryImpact(visibleCommitments, decisions, c.category, 0, selectedMonth);
            const monthPhrase = isCurrentMonth ? "this month" : `in ${monthLabel}`;
            const subLabel = impact
              ? impact.overBy > 0
                ? Copy.home.spentOverBy(money(impact.spentAfterCents), money(impact.overBy), monthPhrase)
                : Copy.home.spentSoFar(money(impact.spentAfterCents), monthPhrase)
              : undefined;
            return (
              <CommitmentRow
                key={c.id}
                commitment={c}
                onRemove={() => removeCommitment(c.id)}
                subLabel={subLabel}
                subLabelCaution={!!impact && impact.overBy > 0}
                readOnly={!isCurrentMonth}
              />
            );
          })}
          {isCurrentMonth &&
            (addingSection === "variable" ? (
              <AddCommitmentForm
                type="variable"
                onSubmit={(name, amt, cat, day) => handleAddCommitment("variable", name, amt, cat, day)}
                onCancel={() => setAddingSection(null)}
              />
            ) : (
              <View className="mt-3">
                <Button
                  label={Copy.commitmentsScreen.addVariableCta}
                  intent="quiet"
                  onPress={() => setAddingSection("variable")}
                />
              </View>
            ))}

          <Text className={sectionTitleClass}>{Copy.home.debtSectionTitle}</Text>
          {debt.length === 0 && addingSection !== "debt" && <Text className={emptyClass}>{Copy.home.emptyDebt}</Text>}
          {debt.map((c) => (
            <CommitmentRow key={c.id} commitment={c} onRemove={() => removeCommitment(c.id)} readOnly={!isCurrentMonth} />
          ))}
          {isCurrentMonth &&
            (addingSection === "debt" ? (
              <AddCommitmentForm
                type="debt"
                onSubmit={(name, amt, _cat, day) => handleAddCommitment("debt", name, amt, undefined, day)}
                onCancel={() => setAddingSection(null)}
              />
            ) : (
              <View className="mt-3">
                <Button label={Copy.home.addDebtCta} intent="quiet" onPress={() => setAddingSection("debt")} />
              </View>
            ))}
          <View className="mb-6" />
        </ScrollView>
      )}
    </Screen>
  );
}

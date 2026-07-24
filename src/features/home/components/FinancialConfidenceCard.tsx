import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { colors } from "@core/theme/tokens";
import { FinancialConfidenceChecks } from "@domain/money/financialConfidence";

interface Props {
  score: number;
  label: string;
  checks: FinancialConfidenceChecks;
}

function ChecklistRow({ ok, label, dark }: { ok: boolean; label: string; dark: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text style={{ color: ok ? colors.checkpoint : colors.caution, fontSize: 13, fontWeight: "700" }}>
        {ok ? "✓" : "✕"}
      </Text>
      <Text className={`text-xs ${dark ? "text-ink-faint" : "text-ink-soft"}`}>{label}</Text>
    </View>
  );
}

/**
 * A whole-month checklist score, not a per-purchase one — Decision Mode
 * already has its own Financial Alignment Score for "is this purchase okay
 * right now." This one answers "am I currently living within the plan I
 * set up," built from real signals the app already tracks (the Financial
 * Timeline's shortfall check, each savings goal's threshold, category
 * budgets) — never from debt or a credit bureau.
 */
export function FinancialConfidenceCard({ score, label, checks }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const tone = score >= 60 ? colors.checkpoint : colors.caution;

  return (
    <View
      className={`mt-3 rounded-xl2 border p-4 ${
        dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
      }`}
    >
      <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
        {Copy.home.confidenceLabel}
      </Text>
      <View className="flex-row items-baseline mt-1">
        <Text className="text-3xl font-extrabold" style={{ color: tone }}>
          {score}
        </Text>
        <Text className={`ml-1 text-base ${dark ? "text-ink-faint" : "text-ink-faint"}`}>/100</Text>
      </View>
      <Text className={`mt-1 text-sm ${dark ? "text-ink-dark" : "text-ink"}`}>{label}</Text>

      <View className="mt-3 gap-1.5">
        <ChecklistRow ok={checks.billsCovered} label={Copy.home.confidenceBillsCovered} dark={dark} />
        <ChecklistRow ok={checks.savingsOnTrack} label={Copy.home.confidenceSavingsOnTrack} dark={dark} />
        <ChecklistRow ok={checks.spendingWithinBudget} label={Copy.home.confidenceSpendingWithinBudget} dark={dark} />
      </View>
    </View>
  );
}

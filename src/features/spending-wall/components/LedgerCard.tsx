import React, { useState } from "react";
import { Platform, View, Text, Pressable } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { colors } from "@core/theme/tokens";
import { money } from "@domain/entities/MoneyState";
import { Copy } from "@core/copy/strings";
import { InfoModal } from "@shared/components/InfoModal";
import { CategoryBudgetImpact } from "@domain/money/categoryImpact";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

interface RowProps {
  label: string;
  value: string;
  tone?: "pos" | "warn" | "default";
  onPress?: () => void;
  accessibilityLabel?: string;
  suffix?: React.ReactNode;
  dark: boolean;
}

function Row({ label, value, tone = "default", onPress, accessibilityLabel, suffix, dark }: RowProps) {
  const valueColor =
    tone === "pos" ? colors.checkpointBright : tone === "warn" ? colors.caution : dark ? colors.inkDark : colors.ink;
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? accessibilityLabel : undefined}
      className="flex-row items-center justify-between py-2.5"
      style={{ borderBottomWidth: 1, borderStyle: "dashed", borderColor: dark ? colors.hairlineDark : colors.hairline }}
    >
      <View className="flex-row items-center gap-1">
        <Text
          style={{ fontFamily: MONO }}
          className={`text-[10px] uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}
        >
          {label}
        </Text>
        {suffix}
      </View>
      <Text style={{ fontFamily: MONO, color: valueColor }} className="text-[13px] font-semibold">
        {value}
      </Text>
    </Wrapper>
  );
}

interface Props {
  beforeCents: number;
  afterCents: number;
  concern: boolean;
  safeDays: number | null;
  score: number;
  headline: string;
  futureSelfNote: string | null;
  categoryImpact: CategoryBudgetImpact | null;
  goalName: string | null;
  goalDipCents: number;
}

/**
 * A dense, scannable statement — every fact as its own row instead of one
 * narrative sentence. Matches "Ledger" from the layout concept gallery: the
 * user picked this over the score-hero/gauge/minimal-verdict alternatives.
 */
export function LedgerCard({
  beforeCents,
  afterCents,
  concern,
  safeDays,
  score,
  headline,
  futureSelfNote,
  categoryImpact,
  goalName,
  goalDipCents,
}: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);

  return (
    <View
      className={`w-full rounded-xl2 border p-4 ${
        dark ? "border-hairline-dark bg-surface-dark" : "border-hairline bg-surface"
      }`}
      style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: dark ? colors.hairlineDark : colors.hairline }}
    >
      <Row label={Copy.spendingWall.ledgerAvailableNowLabel} value={money(beforeCents)} dark={dark} />
      <Row
        label={Copy.spendingWall.ledgerAfterPurchaseLabel}
        value={money(afterCents)}
        tone={concern ? "warn" : "pos"}
        dark={dark}
      />
      {safeDays != null && (
        <Row
          label={Copy.spendingWall.ledgerSafeDaysLabel}
          value={Copy.spendingWall.ledgerSafeDaysValue(safeDays)}
          dark={dark}
        />
      )}
      <Row
        label={Copy.spendingWall.financialAlignmentLabel}
        value={`${score}%`}
        tone={score >= 60 ? "pos" : "warn"}
        dark={dark}
        onPress={() => setScoreInfoOpen(true)}
        accessibilityLabel={`What is ${Copy.spendingWall.financialAlignmentLabel}?`}
        suffix={<Text className={`text-[10px] ${dark ? "text-ink-faint" : "text-ink-faint"}`}>ⓘ</Text>}
      />
      {categoryImpact && (
        <Row
          label={Copy.spendingWall.ledgerCategoryLabel(categoryImpact.category)}
          value={`${money(categoryImpact.spentAfterCents)} / ${money(categoryImpact.budgetCents)}`}
          tone={categoryImpact.overBy > 0 ? "warn" : "default"}
          dark={dark}
        />
      )}
      {goalName && goalDipCents > 0 && (
        <Row
          label={Copy.spendingWall.ledgerGoalImpactLabel(goalName)}
          value={`-${money(goalDipCents)}`}
          tone="warn"
          dark={dark}
        />
      )}

      <Text className={`mt-3.5 text-center text-[12px] leading-5 ${dark ? "text-ink-soft" : "text-ink-soft"}`}>
        {headline}
      </Text>
      {futureSelfNote && (
        <Text
          className={`mt-2 text-center text-[11px] italic leading-5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}
        >
          Future You says: {futureSelfNote}
        </Text>
      )}

      <InfoModal
        visible={scoreInfoOpen}
        onClose={() => setScoreInfoOpen(false)}
        title={Copy.spendingWall.financialAlignmentExplainerTitle}
      >
        <Text className={dark ? "text-ink-dark" : "text-ink"}>{Copy.spendingWall.financialAlignmentExplainerBody}</Text>
      </InfoModal>
    </View>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@core/theme/ThemeContext";
import { View, Text, Pressable, ScrollView } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Screen } from "@shared/components/Screen";
import { Card } from "@shared/components/Card";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { useCheckpoint } from "@shared/hooks/useCheckpoint";
import { useSavingsGoals } from "@shared/hooks/useSavingsGoals";
import { useCommitments } from "@shared/hooks/useCommitments";
import { useIncome } from "@shared/hooks/useIncome";
import { useDecisions } from "@shared/hooks/useDecisions";
import { useVoiceOutput } from "@shared/hooks/useVoiceOutput";
import { useBigPurchaseThreshold } from "@shared/hooks/useBigPurchaseThreshold";
import { usePauseIntensity } from "@shared/hooks/usePauseIntensity";
import { useNightPause } from "@shared/hooks/useNightPause";
import { isWithinTemptationWindow } from "@domain/money/nightPause";
import { useFutureVision } from "@shared/hooks/useFutureVision";
import { useAuth } from "@core/auth/AuthContext";
import { motion } from "@core/theme/tokens";
import { computeWallVerdict, selectDippedGoal } from "@domain/money/applyPurchase";
import { buildWallSpokenSummary } from "@domain/money/parsePurchaseSpeech";
import { summarizeCategoryImpact } from "@domain/money/categoryImpact";
import { buildDecisionNarrative } from "@domain/money/decisionNarrative";
import { buildFinancialTimeline, computeSafeSpendingDays } from "@domain/money/financialTimeline";
import { findRelevantPauseReason, findRegrettedPurchaseWarning } from "@domain/money/decisionJournal";
import { determineFrictionTier, FRICTION_PAUSE_MS } from "@domain/money/frictionTier";
import { LedgerCard } from "./components/LedgerCard";
import { DecisionActions } from "./components/DecisionActions";
import { PauseReasonPicker } from "./components/PauseReasonPicker";
import { DecisionGate } from "./components/DecisionGate";
import { VaultDoorOverlay } from "./components/VaultDoorOverlay";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/Navigation";
import { DecisionOutcome } from "@domain/entities/MoneyState";
import { refreshCheckpointWidget } from "@features/widget/widgetTaskHandler";

type Props = NativeStackScreenProps<RootStackParamList, "SpendingWall">;

export function SpendingWallScreen({ route, navigation }: Props) {
  const { amountCents, merchant, category, intent } = route.params;
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { state, recordDecision } = useCheckpoint(user?.id ?? null);
  const { goals } = useSavingsGoals(user?.id ?? null);
  const { commitments } = useCommitments(user?.id ?? null);
  const { income } = useIncome(user?.id ?? null);
  const { decisions } = useDecisions(user?.id ?? null, 200);
  const { speak, stop: stopSpeaking, speaking } = useVoiceOutput();
  const { enabled: bigPurchaseEnabled, thresholdCents: bigPurchaseThresholdCents } = useBigPurchaseThreshold();
  const { intensity: pauseIntensity } = usePauseIntensity();
  const nightPause = useNightPause(decisions);
  const baseFrictionTier = determineFrictionTier(amountCents, bigPurchaseEnabled, bigPurchaseThresholdCents, pauseIntensity);
  // Night Pause only ever escalates — a decision already at "big" or
  // "reflection" on its own merits never gets downgraded just because it
  // falls outside the detected window.
  const nightPauseActive =
    nightPause.enabled && nightPause.window != null && isWithinTemptationWindow(nightPause.window);
  const frictionTier = nightPauseActive && baseFrictionTier === "normal" ? "big" : baseFrictionTier;
  const isBigPurchase = frictionTier !== "normal";
  const { vision } = useFutureVision(user?.id ?? null);

  const [continueEnabled, setContinueEnabled] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [decideError, setDecideError] = useState<string | null>(null);
  // Pause/reconsider stop here for an optional reason before actually
  // recording — "continued" never does, there's nothing to explain.
  const [pendingOutcome, setPendingOutcome] = useState<DecisionOutcome | null>(null);
  const openedAt = useRef(Date.now());

  // Crossing into Decision Mode should feel like arriving somewhere
  // deliberate, not just another screen push — a soft settle rather than a
  // plain fade.
  const entryProgress = useSharedValue(0);
  useEffect(() => {
    entryProgress.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [entryProgress]);
  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [
      { scale: 0.96 + entryProgress.value * 0.04 },
      { translateY: (1 - entryProgress.value) * 14 },
    ],
  }));

  const dippedGoal = state ? selectDippedGoal(goals, state.availableCents - amountCents) : null;
  const verdict = state
    ? computeWallVerdict(state, amountCents, dippedGoal?.targetCents ?? null)
    : null;
  const timeline = state
    ? buildFinancialTimeline(state.availableCents, income, commitments, { name: merchant, amountCents })
    : null;
  // Built without the hypothetical purchase — computeDaysUntilSafeToSpend
  // (inside buildDecisionNarrative) needs this to answer "wait N days",
  // trying the purchase against every future day rather than just today.
  const baselineTimeline = state
    ? buildFinancialTimeline(state.availableCents, income, commitments, null)
    : null;
  const narrative = verdict
    ? buildDecisionNarrative(verdict, amountCents, dippedGoal, timeline, vision, baselineTimeline)
    : null;
  // Same "is this actually a concern" check buildDecisionNarrative makes
  // internally to pick its headline branch — recomputed here so the ledger's
  // After-purchase/goal rows can share the same red/green read as the
  // headline they sit next to, without buildDecisionNarrative needing to
  // expose its internal branch choice.
  const concern = Boolean(timeline?.causesShortfall) || verdict?.tone === "warn";
  const safeDays =
    verdict && timeline ? computeSafeSpendingDays(verdict.afterCents, timeline).daysUntilPayday : null;

  const categoryImpact = summarizeCategoryImpact(commitments, decisions, category, amountCents);
  const pauseReasonMatch = findRelevantPauseReason(decisions, merchant, category);
  const pauseReasonCallbackText = pauseReasonMatch
    ? pauseReasonMatch.matchedOn === "merchant"
      ? Copy.pauseReasonCallback.merchantLabel(pauseReasonMatch.merchant, pauseReasonMatch.reason)
      : Copy.pauseReasonCallback.categoryLabel(category ?? pauseReasonMatch.merchant, pauseReasonMatch.reason)
    : null;
  const regretMatch = findRegrettedPurchaseWarning(decisions, merchant, category);
  const regretCallbackText = regretMatch
    ? regretMatch.matchedOn === "merchant"
      ? Copy.decisionMemoryCallback.merchantLabel(regretMatch.merchant)
      : Copy.decisionMemoryCallback.categoryLabel(category ?? regretMatch.merchant)
    : null;

  const handleReadAloud = () => {
    if (speaking) {
      stopSpeaking();
      return;
    }
    if (!verdict || !narrative) return;
    speak(
      buildWallSpokenSummary(
        merchant,
        amountCents,
        verdict,
        narrative.headline,
        narrative.score,
        categoryImpact,
        narrative.futureSelfNote,
        pauseReasonCallbackText
      )
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => setContinueEnabled(true), FRICTION_PAUSE_MS[pauseIntensity][frictionTier]);
    return () => clearTimeout(timer);
  }, [frictionTier, pauseIntensity]);

  const handleDecide = async (outcome: DecisionOutcome, pauseReason?: string) => {
    if (lifted) return; // already mid-decision — ignore a second tap during the lift beat
    const pauseDurationMs = Date.now() - openedAt.current;
    setDecideError(null);

    // Only "continued" is actually passing through the gate — pausing or
    // reconsidering is stepping back, not lifting a barrier, so those skip
    // the beat and leave immediately.
    if (outcome === "continued") {
      setLifted(true);
      await new Promise((resolve) => setTimeout(resolve, motion.gateLift));
    }

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("That's taking too long — check your connection and try again.")), 15000)
      );
      await Promise.race([
        recordDecision({ amountCents, merchant, category, intent }, outcome, pauseDurationMs, pauseReason),
        timeout,
      ]);
      refreshCheckpointWidget();
      // The reward beat, not a silent pop — every outcome (including
      // "continued") gets an acknowledgement; that screen's own Done button
      // does the popToTop() that used to happen right here.
      navigation.replace("DecisionRecorded", { outcome, amountCents, merchant });
    } catch (e) {
      setDecideError((e as Error).message ?? "Something went wrong. Try again.");
      setLifted(false);
      setPendingOutcome(null);
    }
  };

  // "Continue" records immediately — pause/reconsider stop at the reason
  // picker first (see PauseReasonPicker below), so only those two set
  // pendingOutcome rather than deciding right away.
  const handleOutcomeSelected = (outcome: DecisionOutcome) => {
    if (outcome === "continued") {
      handleDecide(outcome);
    } else {
      setPendingOutcome(outcome);
    }
  };

  return (
    <Screen>
      <Animated.View style={entryStyle} className="flex-1">
        <View className="mt-4 items-center">
          <Text
            className={`text-micro uppercase tracking-widest ${
              dark ? "text-ink-faint" : "text-ink-faint"
            }`}
          >
            {Copy.spendingWall.title}
          </Text>
          <Text
            className={`mt-3 text-caption uppercase tracking-widest ${
              dark ? "text-ink-faint" : "text-ink-faint"
            }`}
          >
            {Copy.spendingWall.prompt}
          </Text>
          <Text
            className={`mt-2 text-title font-semibold text-center ${
              dark ? "text-ink-dark" : "text-ink"
            }`}
          >
            {Copy.spendingWall.question}
          </Text>
          <Text className={`mt-2 text-base ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
            {merchant} · {money(amountCents)}
          </Text>
          <DecisionGate lifted={lifted} tier={frictionTier} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 }}
        >
          {narrative && verdict && (
            <View className="w-full" style={{ borderRadius: 28, overflow: "hidden" }}>
              <LedgerCard
                beforeCents={verdict.beforeCents}
                afterCents={verdict.afterCents}
                concern={concern}
                safeDays={safeDays}
                score={narrative.score}
                headline={narrative.headline}
                futureSelfNote={narrative.futureSelfNote}
                categoryImpact={categoryImpact}
                goalName={dippedGoal?.name ?? null}
                goalDipCents={verdict.dipsIntoGoalBy}
              />
              <VaultDoorOverlay lifted={lifted} />
            </View>
          )}

          {pauseReasonCallbackText && (
            <Card raised className="mt-4 w-full">
              <Text className={`text-sm text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
                {pauseReasonCallbackText}
              </Text>
            </Card>
          )}

          {regretCallbackText && (
            <Card raised className="mt-4 w-full">
              <Text className={`text-sm text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
                {regretCallbackText}
              </Text>
            </Card>
          )}

          {isBigPurchase && (
            <Card raised className="mt-4 w-full">
              <Text className={`text-sm font-medium mb-2 ${dark ? "text-ink-dark" : "text-ink"}`}>
                {Copy.spendingWall.bigPurchaseTitle}
              </Text>
              <View className="gap-1.5">
                {Copy.spendingWall.bigPurchaseQuestions.map((question) => (
                  <Text key={question} className={`text-sm ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                    · {question}
                  </Text>
                ))}
              </View>
            </Card>
          )}

          {categoryImpact && (
            <Card raised className="mt-4 w-full">
              <View className="flex-row justify-between mb-2">
                <Text className={`text-sm ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                  {Copy.spendingWall.categoryBudgetLabel(categoryImpact.category)}
                </Text>
                <Text
                  className={`text-sm font-medium ${
                    categoryImpact.overBy > 0 ? "text-signal-caution" : dark ? "text-ink-dark" : "text-ink"
                  }`}
                >
                  {money(categoryImpact.spentAfterCents)} / {money(categoryImpact.budgetCents)}
                </Text>
              </View>
              <Text
                className={`text-sm ${
                  categoryImpact.overBy > 0 ? "text-signal-caution" : "text-checkpoint"
                }`}
              >
                {categoryImpact.overBy > 0
                  ? Copy.spendingWall.categoryBudgetOverMessage(
                      money(categoryImpact.spentAfterCents),
                      money(categoryImpact.budgetCents),
                      money(categoryImpact.overBy)
                    )
                  : Copy.spendingWall.categoryBudgetOkMessage(
                      money(categoryImpact.spentAfterCents),
                      money(categoryImpact.budgetCents)
                    )}
              </Text>
            </Card>
          )}
        </ScrollView>

        <View className="mb-6 mt-3">
          {pendingOutcome ? (
            <PauseReasonPicker
              onConfirm={(reason) => handleDecide(pendingOutcome, reason ?? undefined)}
            />
          ) : (
            <>
              {verdict && (
                // Deliberately in this section's normal document flow, not the
                // flex-1 centered block above — that block's content can grow
                // taller than its allotted space, and an overflowing sibling
                // silently overlapped (and ate clicks for) the buttons below.
                <Pressable
                  onPress={handleReadAloud}
                  accessibilityRole="button"
                  accessibilityLabel={speaking ? Copy.spendingWall.stopReadingCta : Copy.spendingWall.readAloudCta}
                  className="mb-3 items-center"
                >
                  <Text className={`text-sm font-medium ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                    {speaking ? Copy.spendingWall.stopReadingCta : Copy.spendingWall.readAloudCta}
                  </Text>
                </Pressable>
              )}
              {!continueEnabled && (
                <Text
                  className={`mb-3 text-center text-xs ${
                    dark ? "text-ink-faint" : "text-ink-faint"
                  }`}
                >
                  {frictionTier === "reflection" ? Copy.spendingWall.reflectionPauseHint : Copy.spendingWall.pauseHint}
                </Text>
              )}
              {decideError && (
                <Text className="mb-3 text-center text-sm text-signal-caution">{decideError}</Text>
              )}
              <DecisionActions onDecide={handleOutcomeSelected} continueEnabled={continueEnabled} />
            </>
          )}
        </View>
      </Animated.View>
    </Screen>
  );
}

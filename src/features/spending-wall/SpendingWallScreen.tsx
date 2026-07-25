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
import { useFutureVision } from "@shared/hooks/useFutureVision";
import { useAuth } from "@core/auth/AuthContext";
import { motion } from "@core/theme/tokens";
import { computeWallVerdict, selectDippedGoal } from "@domain/money/applyPurchase";
import { buildWallSpokenSummary } from "@domain/money/parsePurchaseSpeech";
import { summarizeCategoryImpact } from "@domain/money/categoryImpact";
import { buildDecisionNarrative } from "@domain/money/decisionNarrative";
import { buildFinancialTimeline } from "@domain/money/financialTimeline";
import { findRelevantPauseReason } from "@domain/money/decisionJournal";
import { SafeToSpendMeter } from "./components/SafeToSpendMeter";
import { AlignmentScore } from "./components/AlignmentScore";
import { DecisionActions } from "./components/DecisionActions";
import { PauseReasonPicker } from "./components/PauseReasonPicker";
import { GateBackdrop } from "./components/GateBackdrop";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/Navigation";
import { DecisionOutcome } from "@domain/entities/MoneyState";
import { refreshCheckpointWidget } from "@features/widget/widgetTaskHandler";

type Props = NativeStackScreenProps<RootStackParamList, "SpendingWall">;

// The deliberate beat before "Continue" unlocks. Long enough to interrupt
// autopilot, short enough not to feel punitive.
const MIN_PAUSE_MS = 2200;
// A longer beat for Big Purchase Mode — there are more questions worth
// actually reading here, not just a longer wait for its own sake.
const BIG_PURCHASE_MIN_PAUSE_MS = 4500;

export function SpendingWallScreen({ route, navigation }: Props) {
  const { amountCents, merchant, category } = route.params;
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
  const isBigPurchase = bigPurchaseEnabled && amountCents >= bigPurchaseThresholdCents;
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
  const narrative = verdict ? buildDecisionNarrative(verdict, amountCents, dippedGoal, timeline, vision) : null;

  const categoryImpact = summarizeCategoryImpact(commitments, decisions, category, amountCents);
  const pauseReasonMatch = findRelevantPauseReason(decisions, merchant, category);
  const pauseReasonCallbackText = pauseReasonMatch
    ? pauseReasonMatch.matchedOn === "merchant"
      ? Copy.pauseReasonCallback.merchantLabel(pauseReasonMatch.merchant, pauseReasonMatch.reason)
      : Copy.pauseReasonCallback.categoryLabel(category ?? pauseReasonMatch.merchant, pauseReasonMatch.reason)
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
    const timer = setTimeout(
      () => setContinueEnabled(true),
      isBigPurchase ? BIG_PURCHASE_MIN_PAUSE_MS : MIN_PAUSE_MS
    );
    return () => clearTimeout(timer);
  }, [isBigPurchase]);

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
        recordDecision({ amountCents, merchant, category }, outcome, pauseDurationMs, pauseReason),
        timeout,
      ]);
      refreshCheckpointWidget();
      // Pop past NewDecision too — after deciding, the purchase form is done.
      navigation.popToTop();
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
        <GateBackdrop lifted={lifted} />

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
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 }}
        >
          <SafeToSpendMeter
            availableCents={state?.availableCents ?? 0}
            amountCents={amountCents}
          />
          <Text
            className={`mt-6 text-sm text-center px-8 ${
              dark ? "text-ink-faint" : "text-ink-soft"
            }`}
          >
            {Copy.spendingWall.futureYouNote(money(amountCents))}
          </Text>

          {narrative && (
            <Card raised className="mt-6 w-full items-center">
              <Text
                className={`text-base font-medium text-center ${dark ? "text-ink-dark" : "text-ink"}`}
              >
                {narrative.headline}
              </Text>
              <AlignmentScore score={narrative.score} label={narrative.scoreLabel} />
              {narrative.futureSelfNote && (
                <Text
                  className={`mt-3 text-sm text-center italic ${dark ? "text-ink-faint" : "text-ink-soft"}`}
                >
                  Future You says: {narrative.futureSelfNote}
                </Text>
              )}
            </Card>
          )}

          {pauseReasonCallbackText && (
            <Card raised className="mt-4 w-full">
              <Text className={`text-sm text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
                {pauseReasonCallbackText}
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
                <Pressable onPress={handleReadAloud} accessibilityRole="button" className="mb-3 items-center">
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
                  {Copy.spendingWall.pauseHint}
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

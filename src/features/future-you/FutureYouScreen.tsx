import React, { useState } from "react";
import { useTheme } from "@core/theme/ThemeContext";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Card } from "@shared/components/Card";
import { Button } from "@shared/components/Button";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { useCheckpoint } from "@shared/hooks/useCheckpoint";
import { useMoneyStateHistory } from "@shared/hooks/useMoneyStateHistory";
import { useSavingsGoals } from "@shared/hooks/useSavingsGoals";
import { useIncome } from "@shared/hooks/useIncome";
import { useCommitments } from "@shared/hooks/useCommitments";
import { useAuth } from "@core/auth/AuthContext";
import { useFutureVision } from "@shared/hooks/useFutureVision";
import { useDecisions } from "@shared/hooks/useDecisions";
import { useChallenges } from "@shared/hooks/useChallenges";
import { buildChallengeWindow } from "@domain/money/challengeProgress";
import { ChallengeCard } from "./components/ChallengeCard";
import { SavingsGoalForm } from "@features/onboarding/components/SavingsGoalForm";
import { FutureVisionForm } from "@features/onboarding/components/FutureVisionForm";
import { buildFinancialTimeline } from "@domain/money/financialTimeline";
import { computeFutureYouProjection } from "@domain/money/futureYouProjection";
import { UpcomingTimeline } from "./components/UpcomingTimeline";
import { WhatIfCard } from "./components/WhatIfCard";

/** null = not editing; "new" = adding a goal; a goal id = editing that goal. */
type EditingTarget = string | "new" | null;

export function FutureYouScreen() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { user } = useAuth();
  const { state } = useCheckpoint(user?.id ?? null);
  const { history } = useMoneyStateHistory(user?.id ?? null);
  const { goals, addGoal, updateGoal, removeGoal } = useSavingsGoals(user?.id ?? null);
  const { income } = useIncome(user?.id ?? null);
  const { commitments } = useCommitments(user?.id ?? null);
  const { vision, setVision } = useFutureVision(user?.id ?? null);
  const { decisions } = useDecisions(user?.id ?? null, 200);
  const { challenges, startChallenge, removeChallenge } = useChallenges(user?.id ?? null);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [editingVision, setEditingVision] = useState(false);

  const projection = computeFutureYouProjection(history);
  const timeline = state ? buildFinancialTimeline(state.availableCents, income, commitments, null) : null;
  const editingGoal = editing && editing !== "new" ? goals.find((g) => g.id === editing) : undefined;

  return (
    <Screen>
      <BackHeader title={Copy.futureYouScreen.title} subtitle={Copy.futureYouScreen.subtitle} />

      <ScrollView showsVerticalScrollIndicator={false} className="mt-2">
        <Card raised className="mt-4">
          <Text className={`text-caption uppercase tracking-wide ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {projection ? Copy.futureYouScreen.projectionLabel : Copy.home.futureYouLabel}
          </Text>
          <Text className={`mt-2 text-4xl font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
            {money(projection ? projection.projectedCents : state?.futureYouCents ?? 0)}
          </Text>
          {!projection && (
            <Text className={`mt-2 text-xs ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
              {Copy.futureYouScreen.notEnoughHistoryNote}
            </Text>
          )}
        </Card>

        <Card className="mt-4">
          {editingVision ? (
            <FutureVisionForm
              initialText={vision ?? undefined}
              submitLabel={Copy.futureVisionStep.saveCta}
              skipLabel="Cancel"
              onSubmit={async (text) => {
                await setVision(text);
                setEditingVision(false);
              }}
              onSkip={() => setEditingVision(false)}
            />
          ) : (
            <>
              <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
                {Copy.futureYouScreen.visionSectionTitle}
              </Text>
              <Text
                className={`text-base mb-3 ${
                  vision ? (dark ? "text-ink-dark" : "text-ink") : dark ? "text-ink-faint" : "text-ink-soft"
                }`}
              >
                {vision ?? Copy.futureYouScreen.visionEmpty}
              </Text>
              <Button
                label={vision ? Copy.futureVisionStep.editCta : Copy.futureYouScreen.addVisionCta}
                intent="quiet"
                onPress={() => setEditingVision(true)}
              />
            </>
          )}
        </Card>

        <Card className="mt-4">
          {editing ? (
            <SavingsGoalForm
              initialName={editingGoal?.name}
              initialTargetCents={editingGoal?.targetCents}
              submitLabel="Save goal"
              onSubmit={async (input) => {
                if (editingGoal) {
                  await updateGoal(editingGoal.id, input);
                } else {
                  await addGoal(input);
                }
                setEditing(null);
              }}
              onSkip={() => setEditing(null)}
            />
          ) : (
            <>
              <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
                {Copy.futureYouScreen.goalsSectionTitle}
              </Text>
              {goals.length === 0 ? (
                <Text className={`text-base mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
                  {Copy.futureYouScreen.noGoalLabel}
                </Text>
              ) : (
                <View className="mt-2 mb-2">
                  {goals.map((g) => (
                    <View
                      key={g.id}
                      className={`flex-row items-center justify-between py-3 border-b ${
                        dark ? "border-hairline-dark" : "border-hairline"
                      }`}
                    >
                      <Pressable className="flex-1 pr-3" onPress={() => setEditing(g.id)}>
                        <Text className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
                          {g.name}
                        </Text>
                      </Pressable>
                      <Text className={`text-base font-semibold mr-3 ${dark ? "text-ink-dark" : "text-ink"}`}>
                        {money(g.targetCents)}
                      </Text>
                      <Pressable
                        onPress={() => removeGoal(g.id)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`${Copy.futureYouScreen.removeGoalCta} ${g.name}`}
                      >
                        <Text className="text-xs text-signal-caution">{Copy.futureYouScreen.removeGoalCta}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              <Button label={Copy.futureYouScreen.addGoalCta} intent="quiet" onPress={() => setEditing("new")} />
            </>
          )}
        </Card>

        <ChallengeCard
          challenges={challenges}
          decisions={decisions}
          onStart={() => startChallenge({ type: "no_spend_week", ...buildChallengeWindow(7) })}
          onRemove={removeChallenge}
        />

        {timeline && <UpcomingTimeline timeline={timeline} />}

        {state && (
          <Card className="mt-4">
            <WhatIfCard availableCents={state.availableCents} income={income} commitments={commitments} />
          </Card>
        )}
        <View className="mb-4" />
      </ScrollView>
    </Screen>
  );
}

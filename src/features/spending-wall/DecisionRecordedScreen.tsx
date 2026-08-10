import React from "react";
import { useTheme } from "@core/theme/ThemeContext";
import { View, Text } from "react-native";
import { Screen } from "@shared/components/Screen";
import { Button } from "@shared/components/Button";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "DecisionRecorded">;

/**
 * The reward beat the habit loop needs (Trigger → Pause → Decide → Reward)
 * that recording a decision never had before — SpendingWallScreen used to
 * pop straight back to Home in silence for every outcome. "Continued" gets
 * the same positive framing as pausing/reconsidering, deliberately never a
 * dollar figure framed as a loss — the goal is intentional decisions, not
 * maximizing money saved.
 */
export function DecisionRecordedScreen({ route, navigation }: Props) {
  const { outcome, amountCents } = route.params;
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  const { title, body } =
    outcome === "continued"
      ? { title: Copy.decisionRecorded.continuedTitle, body: Copy.decisionRecorded.continuedBody }
      : outcome === "reconsidered"
      ? {
          title: Copy.decisionRecorded.reconsideredTitle,
          body: Copy.decisionRecorded.reconsideredBody(money(amountCents)),
        }
      : {
          title: Copy.decisionRecorded.pausedTitle,
          body: Copy.decisionRecorded.pausedBody(money(amountCents)),
        };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-4">
        <Text className={`text-display font-bold text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
          {title}
        </Text>
        <Text className={`mt-4 text-base text-center leading-6 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {body}
        </Text>
      </View>
      <View className="mb-6">
        <Button label={Copy.decisionRecorded.doneCta} onPress={() => navigation.popToTop()} />
      </View>
    </Screen>
  );
}

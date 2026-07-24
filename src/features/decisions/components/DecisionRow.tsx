import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { money, SpendingDecision } from "@domain/entities/MoneyState";

interface Props {
  decision: SpendingDecision;
}

const outcomeDotColor: Record<SpendingDecision["outcome"], string> = {
  continued: "bg-checkpoint",
  paused: "bg-signal-pause",
  reconsidered: "bg-signal-caution",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DecisionRow({ decision }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  return (
    <View
      className={`flex-row items-center justify-between py-4 border-b ${
        dark ? "border-hairline-dark" : "border-hairline"
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-2 h-2 rounded-full mr-3 ${outcomeDotColor[decision.outcome]}`} />
        <View className="flex-1">
          <Text
            className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`}
            numberOfLines={1}
          >
            {decision.merchant}
          </Text>
          <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.outcomeLabel[decision.outcome]} · {formatDate(decision.decidedAt)}
          </Text>
          {decision.pauseReason && (
            <Text
              className={`text-xs mt-0.5 italic ${dark ? "text-ink-faint" : "text-ink-faint"}`}
              numberOfLines={1}
            >
              "{decision.pauseReason}"
            </Text>
          )}
        </View>
      </View>
      <Text className={`text-base font-semibold ml-3 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {money(decision.amountCents)}
      </Text>
    </View>
  );
}

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { money, SpendingDecision } from "@domain/entities/MoneyState";

interface Props {
  decision: SpendingDecision;
  /** Only ever called for "continued" decisions — see the render guard
   * below. Toggles the current regretted state. */
  onToggleRegret?: (decision: SpendingDecision) => void;
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

export function DecisionRow({ decision, onToggleRegret }: Props) {
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
            {decision.intent ? ` · ${decision.intent}` : ""}
          </Text>
          {decision.pauseReason && (
            <Text
              className={`text-xs mt-0.5 italic ${dark ? "text-ink-faint" : "text-ink-faint"}`}
              numberOfLines={1}
            >
              "{decision.pauseReason}"
            </Text>
          )}
          {/* Regret only makes sense for a purchase actually gone through
              with — pausing/reconsidering already has its own reason. */}
          {decision.outcome === "continued" && onToggleRegret && (
            <Pressable
              onPress={() => onToggleRegret(decision)}
              hitSlop={6}
              className="mt-1 self-start"
              accessibilityRole="button"
              accessibilityLabel={`${
                decision.regretted ? Copy.decisionsScreen.unmarkRegrettedCta : Copy.decisionsScreen.markRegrettedCta
              } — ${decision.merchant}`}
              accessibilityState={{ selected: decision.regretted }}
            >
              <Text
                className={`text-xs font-medium ${
                  decision.regretted ? "text-signal-caution" : dark ? "text-ink-faint" : "text-ink-faint"
                }`}
              >
                {decision.regretted ? `${Copy.decisionsScreen.regrettedLabel} · ${Copy.decisionsScreen.unmarkRegrettedCta}` : Copy.decisionsScreen.markRegrettedCta}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text className={`text-base font-semibold ml-3 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {money(decision.amountCents)}
      </Text>
    </View>
  );
}

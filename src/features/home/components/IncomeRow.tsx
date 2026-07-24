import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { Income } from "@domain/entities/Income";

interface Props {
  income: Income;
  onRemove: () => void;
  /** True when browsing a past/future month — history isn't editable. */
  readOnly?: boolean;
}

function frequencyLabel(income: Income): string | null {
  if (income.frequency === "biweekly") return "Every 2 weeks";
  if (income.frequency === "weekly") return "Weekly";
  return null; // monthly is the default read — not worth a sublabel
}

export function IncomeRow({ income, onRemove, readOnly }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const sublabel = frequencyLabel(income);

  return (
    <View
      className={`flex-row items-center justify-between py-3 border-b ${
        dark ? "border-hairline-dark" : "border-hairline"
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
          {income.name}
        </Text>
        {sublabel && (
          <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>{sublabel}</Text>
        )}
      </View>
      <Text className={`text-base font-semibold mr-3 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {money(income.amountCents)}
      </Text>
      {!readOnly && (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`${Copy.commitmentsScreen.removeCta} ${income.name}`}
        >
          <Text className="text-xs text-signal-caution">{Copy.commitmentsScreen.removeCta}</Text>
        </Pressable>
      )}
    </View>
  );
}

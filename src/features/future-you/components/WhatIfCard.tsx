import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { Income } from "@domain/entities/Income";
import { Commitment } from "@domain/entities/Commitment";
import { buildWhatIfOutcome } from "@domain/money/whatIf";

interface Props {
  availableCents: number;
  income: Income[];
  commitments: Commitment[];
}

type Direction = "save" | "spend";

/**
 * "What if I saved/spent $X more a month?" — a small, self-contained
 * simulator over the existing Financial Timeline engine (see
 * domain/money/whatIf.ts). Deliberately scoped to a monthly cash-flow
 * change, not full life-event simulation.
 */
export function WhatIfCard({ availableCents, income, commitments }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<Direction>("save");
  const [headline, setHeadline] = useState<string | null>(null);

  const handleSee = () => {
    const dollars = parseFloat(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) return;
    const cents = Math.round(dollars * 100);
    const monthlyChangeCents = direction === "save" ? cents : -cents;
    const outcome = buildWhatIfOutcome(monthlyChangeCents, availableCents, income, commitments);
    setHeadline(outcome.headline);
  };

  const inputClass = `rounded-xl2 border px-4 py-3 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  return (
    <View>
      <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.whatIfEngine.title}
      </Text>
      <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
        {Copy.whatIfEngine.subtitle}
      </Text>

      <View className="flex-row gap-2 mb-3">
        <Pressable
          onPress={() => {
            setDirection("save");
            setHeadline(null);
          }}
          className={`flex-1 items-center rounded-full border py-2 ${
            direction === "save" ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
          }`}
        >
          <Text
            className={
              direction === "save" ? "text-white text-sm font-medium" : `text-sm ${dark ? "text-ink-dark" : "text-ink"}`
            }
          >
            {Copy.whatIfEngine.saveMoreCta}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setDirection("spend");
            setHeadline(null);
          }}
          className={`flex-1 items-center rounded-full border py-2 ${
            direction === "spend" ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
          }`}
        >
          <Text
            className={
              direction === "spend"
                ? "text-white text-sm font-medium"
                : `text-sm ${dark ? "text-ink-dark" : "text-ink"}`
            }
          >
            {Copy.whatIfEngine.spendMoreCta}
          </Text>
        </Pressable>
      </View>

      <TextInput
        className={inputClass}
        placeholder={Copy.whatIfEngine.amountPlaceholder}
        placeholderTextColor="#9A9CA5"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={(t) => {
          setAmount(t);
          setHeadline(null);
        }}
      />

      <View className="mt-3">
        <Button label={Copy.whatIfEngine.seeCta} intent="quiet" onPress={handleSee} disabled={!amount} />
      </View>

      {headline && <Text className={`mt-3 text-sm ${dark ? "text-ink-dark" : "text-ink"}`}>{headline}</Text>}
    </View>
  );
}

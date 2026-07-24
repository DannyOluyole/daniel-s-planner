import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { SavingsGoalInput } from "@domain/entities/SavingsGoal";

interface Props {
  initialName?: string;
  initialTargetCents?: number;
  submitLabel: string;
  onSubmit: (input: SavingsGoalInput) => Promise<void> | void;
  onSkip?: () => void;
}

/**
 * The form behind setting/editing a savings goal — used right after
 * onboarding (first-run) and again from Future You (editing later). Not
 * wrapped in <Screen>: callers own their own layout.
 */
export function SavingsGoalForm({ initialName, initialTargetCents, submitLabel, onSubmit, onSkip }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [name, setName] = useState(initialName ?? "Cushion");
  const [amount, setAmount] = useState(
    initialTargetCents != null ? String(initialTargetCents / 100) : ""
  );
  const [saving, setSaving] = useState(false);

  const targetCents = Math.round((parseFloat(amount) || 0) * 100);
  const canSubmit = name.trim().length > 0 && targetCents > 0;

  const inputClass = `rounded-xl2 border px-4 py-3.5 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), targetCents });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text className={`text-title font-semibold mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.savingsGoalStep.title}
      </Text>
      <Text className={`text-base mb-6 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
        {Copy.savingsGoalStep.subtitle}
      </Text>

      <View className="gap-3">
        <TextInput
          className={inputClass}
          placeholder={Copy.savingsGoalStep.namePlaceholder}
          placeholderTextColor="#9A9CA5"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          className={inputClass}
          placeholder={Copy.savingsGoalStep.amountPlaceholder}
          placeholderTextColor="#9A9CA5"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <View className="mt-6 gap-3">
        <Button label={submitLabel} onPress={handleSubmit} loading={saving} disabled={!canSubmit} />
        {onSkip && <Button label={Copy.savingsGoalStep.skipCta} intent="ghost" onPress={onSkip} />}
      </View>
    </View>
  );
}

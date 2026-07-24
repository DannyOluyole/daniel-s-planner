import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { IncomeFrequency } from "@domain/entities/Income";

interface Props {
  onSubmit: (
    name: string,
    amountCents: number,
    frequency?: IncomeFrequency,
    dayOfMonth?: number,
    anchorDate?: string
  ) => Promise<void>;
  onCancel: () => void;
}

const FREQUENCIES: { value: IncomeFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "weekly", label: "Weekly" },
];

const ANCHOR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function AddIncomeForm({ onSubmit, onCancel }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<IncomeFrequency>("monthly");
  const [day, setDay] = useState("");
  const [anchorDate, setAnchorDate] = useState("");
  const [saving, setSaving] = useState(false);

  const amountCents = Math.round((parseFloat(amount) || 0) * 100);
  const dayOfMonth = (() => {
    const n = parseInt(day, 10);
    return n >= 1 && n <= 31 ? n : undefined;
  })();
  const isMonthly = frequency === "monthly";
  const anchorDateValid = ANCHOR_DATE_PATTERN.test(anchorDate.trim());
  // A biweekly/weekly item with no valid anchor would silently fall back to
  // monthly treatment in the Financial Timeline — require one up front
  // instead of letting that surprise show up later.
  const canSave = name.trim().length > 0 && amountCents > 0 && (isMonthly || anchorDateValid);

  const inputClass = `rounded-xl2 border px-4 py-3 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit(
        name.trim(),
        amountCents,
        frequency,
        isMonthly ? dayOfMonth : undefined,
        isMonthly ? undefined : anchorDate.trim()
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-3 mt-3">
      <TextInput
        className={inputClass}
        placeholder={Copy.home.incomeNamePlaceholder}
        placeholderTextColor="#9A9CA5"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className={inputClass}
        placeholder={Copy.commitmentsScreen.amountPlaceholder}
        placeholderTextColor="#9A9CA5"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <View className="flex-row gap-2">
        {FREQUENCIES.map((f) => {
          const active = f.value === frequency;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFrequency(f.value)}
              className={`flex-1 items-center rounded-full border px-2 py-2 ${
                active ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
              }`}
            >
              <Text className={active ? "text-white text-xs font-medium" : `text-xs ${dark ? "text-ink-dark" : "text-ink"}`}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isMonthly ? (
        <TextInput
          className={inputClass}
          placeholder={Copy.commitmentsScreen.dayOfMonthPlaceholder}
          placeholderTextColor="#9A9CA5"
          keyboardType="number-pad"
          maxLength={2}
          value={day}
          onChangeText={setDay}
        />
      ) : (
        <TextInput
          className={inputClass}
          placeholder={Copy.home.incomeAnchorDatePlaceholder}
          placeholderTextColor="#9A9CA5"
          value={anchorDate}
          onChangeText={setAnchorDate}
        />
      )}

      <View className="flex-row gap-2 mt-1">
        <View className="flex-1">
          <Button label={Copy.commitmentsScreen.saveCta} onPress={handleSave} loading={saving} disabled={!canSave} />
        </View>
        <View className="flex-1">
          <Button label={Copy.commitmentsScreen.cancelCta} intent="ghost" onPress={onCancel} />
        </View>
      </View>
    </View>
  );
}

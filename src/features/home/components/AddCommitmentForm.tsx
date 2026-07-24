import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { CATEGORIES, Category } from "@domain/money/parsePurchaseSpeech";
import { CommitmentType } from "@domain/entities/Commitment";

interface Props {
  type: CommitmentType;
  onSubmit: (name: string, amountCents: number, category?: Category, dayOfMonth?: number) => Promise<void>;
  onCancel: () => void;
}

/** Variable budgets skip "Other" — it wouldn't ever match a purchase's category. */
const BUDGETABLE_CATEGORIES = CATEGORIES.filter((c) => c !== "Other");

export function AddCommitmentForm({ type, onSubmit, onCancel }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [category, setCategory] = useState<Category>(BUDGETABLE_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

  const amountCents = Math.round((parseFloat(amount) || 0) * 100);
  const dayOfMonth = (() => {
    const n = parseInt(day, 10);
    return n >= 1 && n <= 31 ? n : undefined;
  })();
  const canSave = name.trim().length > 0 && amountCents > 0;

  const inputClass = `rounded-xl2 border px-4 py-3 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit(name.trim(), amountCents, type === "variable" ? category : undefined, dayOfMonth);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-3 mt-3">
      <TextInput
        className={inputClass}
        placeholder={Copy.commitmentsScreen.namePlaceholder}
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
      <TextInput
        className={inputClass}
        placeholder={Copy.commitmentsScreen.dayOfMonthPlaceholder}
        placeholderTextColor="#9A9CA5"
        keyboardType="number-pad"
        maxLength={2}
        value={day}
        onChangeText={setDay}
      />
      {type === "variable" && (
        <View>
          <Text className={`mb-2 text-xs ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.commitmentsScreen.categoryLabel}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BUDGETABLE_CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1.5 ${
                    active ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
                  }`}
                >
                  <Text
                    className={
                      active ? "text-white text-xs font-medium" : dark ? "text-ink-dark text-xs" : "text-ink text-xs"
                    }
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
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

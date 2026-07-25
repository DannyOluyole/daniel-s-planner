import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";

interface Props {
  initialText?: string;
  submitLabel?: string;
  /** Overrides the skip button's label — e.g. "Cancel" when editing an
   * existing vision rather than skipping it during onboarding. */
  skipLabel?: string;
  onSubmit: (text: string) => Promise<void> | void;
  onSkip?: () => void;
}

/**
 * The "Future Self" concept — a short, open-ended answer to "what does
 * financial freedom look like to you," used right after onboarding and
 * again from Future You (editing later). Deliberately free text, not a
 * dollar target — this is meant to be a reason, not a number.
 */
export function FutureVisionForm({ initialText, submitLabel, skipLabel, onSubmit, onSkip }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [text, setText] = useState(initialText ?? "");
  const [saving, setSaving] = useState(false);

  const canSubmit = text.trim().length > 0;

  const inputClass = `rounded-xl2 border px-4 py-3.5 text-base ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(text.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text className={`text-title font-semibold mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.futureVisionStep.title}
      </Text>
      <Text className={`text-base mb-6 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
        {Copy.futureVisionStep.subtitle}
      </Text>

      <TextInput
        className={inputClass}
        placeholder={Copy.futureVisionStep.placeholder}
        placeholderTextColor="#9A9CA5"
        value={text}
        onChangeText={setText}
        autoFocus
      />

      <View className="mt-6 gap-3">
        <Button
          label={submitLabel ?? Copy.futureVisionStep.saveCta}
          onPress={handleSubmit}
          loading={saving}
          disabled={!canSubmit}
        />
        {onSkip && <Button label={skipLabel ?? Copy.futureVisionStep.skipCta} intent="ghost" onPress={onSkip} />}
      </View>
    </View>
  );
}

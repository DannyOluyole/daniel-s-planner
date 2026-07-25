import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";

interface Props {
  /** Called with the picked reason, or null if the user skipped. */
  onConfirm: (reason: string | null) => void;
}

// Sentinel for the "Something else…" chip — never shown to the user, just
// distinguishes "typing a custom reason" from "picked a canned one" in state.
const CUSTOM = "__custom__";

/**
 * Shown right after a Pause/Reconsider — the "Decision Journal" concept.
 * Mostly a fixed set of chips, not free text (picking one is a single tap,
 * and the whole point is that this never feels like a chore) — but a
 * "Something else…" escape hatch reveals a text field for whenever none of
 * the presets actually match.
 */
export function PauseReasonPicker({ onConfirm }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  const isCustom = selected === CUSTOM;
  const finalReason = isCustom ? customText.trim() : selected;
  const canConfirm = Boolean(finalReason);

  const inputClass = `rounded-xl2 border px-4 py-3 text-sm ${
    dark ? "border-hairline-dark bg-surface-dark text-ink-dark" : "border-hairline bg-surface text-ink"
  }`;

  return (
    <View>
      <Text className={`mb-1 text-sm font-medium text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.pauseReasonStep.title}
      </Text>
      <Text className={`mb-3 text-xs text-center ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
        {Copy.pauseReasonStep.subtitle}
      </Text>
      <View className="mb-4 flex-row flex-wrap justify-center gap-2">
        {Copy.pauseReasonStep.reasons.map((reason) => {
          const active = reason === selected;
          return (
            <Pressable
              key={reason}
              onPress={() => setSelected(active ? null : reason)}
              className={`rounded-full border px-3 py-2 ${
                active ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
              }`}
            >
              <Text
                className={
                  active ? "text-xs font-medium text-white" : `text-xs ${dark ? "text-ink-dark" : "text-ink"}`
                }
              >
                {reason}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setSelected(isCustom ? null : CUSTOM)}
          className={`rounded-full border px-3 py-2 ${
            isCustom ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
          }`}
        >
          <Text className={isCustom ? "text-xs font-medium text-white" : `text-xs ${dark ? "text-ink-dark" : "text-ink"}`}>
            {Copy.pauseReasonStep.somethingElseCta}
          </Text>
        </Pressable>
      </View>
      {isCustom && (
        <TextInput
          className={`mb-4 ${inputClass}`}
          placeholder={Copy.pauseReasonStep.somethingElsePlaceholder}
          placeholderTextColor="#9A9CA5"
          value={customText}
          onChangeText={setCustomText}
          autoFocus
        />
      )}
      <View className="gap-3">
        <Button
          label={Copy.pauseReasonStep.confirmCta}
          intent="primary"
          disabled={!canConfirm}
          onPress={() => onConfirm(finalReason)}
        />
        <Button label={Copy.pauseReasonStep.skipCta} intent="ghost" onPress={() => onConfirm(null)} />
      </View>
    </View>
  );
}

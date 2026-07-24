import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";

interface Props {
  /** Called with the picked reason, or null if the user skipped. */
  onConfirm: (reason: string | null) => void;
}

/**
 * Shown right after a Pause/Reconsider — the "Decision Journal" concept.
 * Deliberately a fixed set of chips, not free text: picking one is a single
 * tap, and the whole point is that this never feels like a chore.
 */
export function PauseReasonPicker({ onConfirm }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [selected, setSelected] = useState<string | null>(null);

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
      </View>
      <View className="gap-3">
        <Button
          label={Copy.pauseReasonStep.confirmCta}
          intent="primary"
          disabled={!selected}
          onPress={() => onConfirm(selected)}
        />
        <Button label={Copy.pauseReasonStep.skipCta} intent="ghost" onPress={() => onConfirm(null)} />
      </View>
    </View>
  );
}

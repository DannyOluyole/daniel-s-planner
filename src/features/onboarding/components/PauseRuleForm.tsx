import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";

interface ThresholdOption {
  label: string;
  /** null = "every purchase" — no dollar floor at all. */
  cents: number | null;
}

const THRESHOLD_OPTIONS: ThresholdOption[] = [
  { label: "Over $25", cents: 2500 },
  { label: "Over $50", cents: 5000 },
  { label: "Over $100", cents: 10000 },
  { label: "Every purchase", cents: null },
];

interface Props {
  onSubmit: (apps: string[], thresholdCents: number | null) => void;
  onSkip: () => void;
}

/**
 * The habit-loop doc's "first Pause Rule" — two small questions (which
 * apps tempt you, what should trigger a pause) that give a new user
 * something to act on immediately, rather than a blank slate. Combined
 * onto one screen rather than the doc's two, matching this app's existing
 * one-form-per-onboarding-step convention.
 */
export function PauseRuleForm({ onSubmit, onSkip }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  // $50 as the default selection — same figure useBigPurchaseThreshold
  // already ships as its own default, so a user who skips this step and
  // one who picks "$50" here land in the same place.
  const [threshold, setThreshold] = useState<ThresholdOption>(THRESHOLD_OPTIONS[1]);

  const toggleApp = (app: string) => {
    setSelectedApps((prev) => (prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]));
  };

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 ${
      active ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
    }`;
  const chipTextClass = (active: boolean) =>
    active ? "text-white text-xs font-medium" : `text-xs ${dark ? "text-ink-dark" : "text-ink"}`;

  return (
    <View>
      <Text className={`text-title font-semibold mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.onboardingPauseRule.appsTitle}
      </Text>
      <Text className={`text-base mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
        {Copy.onboardingPauseRule.appsSubtitle}
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-8">
        {Copy.onboardingPauseRule.appOptions.map((app) => {
          const active = selectedApps.includes(app);
          return (
            <Pressable
              key={app}
              onPress={() => toggleApp(app)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={chipClass(active)}
            >
              <Text className={chipTextClass(active)}>{app}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text className={`text-title font-semibold mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.onboardingPauseRule.thresholdTitle}
      </Text>
      <Text className={`text-base mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
        {Copy.onboardingPauseRule.thresholdSubtitle}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {THRESHOLD_OPTIONS.map((option) => {
          const active = option.label === threshold.label;
          return (
            <Pressable
              key={option.label}
              onPress={() => setThreshold(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={chipClass(active)}
            >
              <Text className={chipTextClass(active)}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-8 gap-3">
        <Button
          label={Copy.onboardingPauseRule.continueCta}
          onPress={() => onSubmit(selectedApps, threshold.cents)}
        />
        <Button label={Copy.onboardingPauseRule.skipCta} intent="ghost" onPress={onSkip} />
      </View>
    </View>
  );
}

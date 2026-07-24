import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { OnboardingSlide } from "@features/onboarding/slides";

interface Props {
  slide: OnboardingSlide;
}

export function OnboardingSlideView({ slide }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  // Read live, not captured once at module load — a frozen Dimensions.get()
  // snapshot can be stale (or wrong) depending on exactly when the native
  // bridge reports window size during a real device's cold start, which is
  // exactly what made paging unreliable on-device but not in the web preview.
  const { width } = useWindowDimensions();

  return (
    <View style={{ width }} className="px-8 items-center justify-center flex-1">
      <View
        className={`w-16 h-16 rounded-full mb-8 items-center justify-center ${
          dark ? "bg-checkpoint-soft/10" : "bg-checkpoint-soft"
        }`}
      >
        <View className="w-6 h-6 rounded-full bg-checkpoint" />
      </View>
      <Text
        className={`text-caption uppercase tracking-widest mb-3 ${
          dark ? "text-ink-faint" : "text-ink-faint"
        }`}
      >
        {slide.eyebrow}
      </Text>
      <Text
        className={`text-title font-semibold text-center mb-3 ${
          dark ? "text-ink-dark" : "text-ink"
        }`}
      >
        {slide.title}
      </Text>
      <Text
        className={`text-base text-center leading-6 ${
          dark ? "text-ink-faint" : "text-ink-soft"
        }`}
      >
        {slide.body}
      </Text>
    </View>
  );
}

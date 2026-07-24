import React from "react";
import { View } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";

interface Props {
  count: number;
  activeIndex: number;
}

export function OnboardingDots({ count, activeIndex }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  return (
    <View className="flex-row justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${i === activeIndex ? "w-6 bg-checkpoint" : "w-1.5"} ${
            i === activeIndex ? "" : dark ? "bg-hairline-dark" : "bg-hairline"
          }`}
        />
      ))}
    </View>
  );
}

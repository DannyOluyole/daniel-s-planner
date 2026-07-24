import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@core/theme/ThemeContext";

interface Props {
  title: string;
  subtitle?: string;
}

/**
 * Header for pushed screens (Future You, Settings, Decisions, Link Account).
 * The stack navigator runs with headerShown: false everywhere so the app can
 * draw its own calm, unboxed titles — this fills in the one thing that loses
 * you: a way back to whatever screen pushed you here.
 */
export function BackHeader({ title, subtitle }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const navigation = useNavigation();

  return (
    <View className="mt-4 mb-6">
      <Pressable
        onPress={() => {
          // A deep link (widget tap, notification, browser extension) can
          // land here with no screen behind it in the stack — goBack()
          // throws in that case, so fall back to Home instead of a dead end.
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate("Home" as never);
        }}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="flex-row items-center mb-3 -ml-1"
      >
        <Text className={`text-xl ${dark ? "text-ink-faint" : "text-ink-soft"}`}>‹</Text>
        <Text className={`ml-1 text-sm ${dark ? "text-ink-faint" : "text-ink-soft"}`}>Back</Text>
      </Pressable>
      <Text className={`text-display font-semibold ${dark ? "text-ink-dark" : "text-ink"}`}>
        {title}
      </Text>
      {subtitle && (
        <Text className={`mt-1 text-base ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

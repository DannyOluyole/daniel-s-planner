import React from "react";
import { View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@core/theme/ThemeContext";

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  padded?: boolean;
}

/**
 * Base screen container. Keeps the calm canvas background and consistent
 * horizontal rhythm so individual screens never fuss with SafeAreaView.
 */
export function Screen({ children, padded = true, className, ...rest }: ScreenProps) {
  const { scheme } = useTheme();
  return (
    <SafeAreaView
      className={`flex-1 ${scheme === "dark" ? "bg-canvas-dark" : "bg-canvas"}`}
    >
      <View className={padded ? "flex-1 px-5" : "flex-1"} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

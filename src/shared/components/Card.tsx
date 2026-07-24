import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  raised?: boolean;
}

/**
 * The single surface primitive used across Checkpoint. Deliberately quiet:
 * soft radius, hairline border instead of heavy shadow, generous padding.
 */
export function Card({ children, raised = false, className, ...rest }: CardProps) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const bg = raised
    ? dark
      ? "bg-surface-raisedDark"
      : "bg-surface-raised"
    : dark
    ? "bg-surface-dark"
    : "bg-surface";
  const border = dark ? "border-hairline-dark" : "border-hairline";

  return (
    <View
      className={`rounded-xl2 border ${border} ${bg} p-5 ${className ?? ""}`}
      {...rest}
    >
      {children}
    </View>
  );
}

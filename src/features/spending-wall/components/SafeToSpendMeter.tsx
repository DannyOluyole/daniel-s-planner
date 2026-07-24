import React from "react";
import { useTheme } from "@core/theme/ThemeContext";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { money } from "@domain/entities/MoneyState";
import { colors } from "@core/theme/tokens";
import { Copy } from "@core/copy/strings";

interface Props {
  availableCents: number;
  amountCents: number;
  size?: number;
}

/**
 * A single calm ring — not a dashboard. Shows how much of "Safe to Spend"
 * this decision would use, without alarm colors or hard stops.
 */
export function SafeToSpendMeter({ availableCents, amountCents, size = 180 }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const ratio = availableCents > 0 ? Math.min(amountCents / availableCents, 1) : 1;
  const remainingRatio = 1 - ratio;
  const dashOffset = circumference * ratio;
  // At ratio ~1 the arc's drawn length is ~0, but strokeLinecap="round" still
  // paints its end-cap as a visible dot right at the 12-o'clock start point —
  // directly over the label text. Skip the arc rather than show a stray dot.
  const showRemainingArc = remainingRatio > 0.01;

  const remainingAfter = availableCents - amountCents;

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={dark ? colors.hairlineDark : colors.hairline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {showRemainingArc && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.checkpoint}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashOffset}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className={`text-xs ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          {Copy.spendingWall.safeToSpendLabel}
        </Text>
        <Text className={`text-2xl font-semibold mt-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          {money(Math.max(remainingAfter, 0))}
        </Text>
        <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
          after this
        </Text>
      </View>
    </View>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { money } from "@domain/entities/MoneyState";
import { DollarJobSegment } from "@domain/money/dollarJobs";

interface Props {
  segments: DollarJobSegment[];
}

// Cycles for however many named commitments exist — "Free" always gets its
// own fixed, muted color below since it's unallocated, not another job.
const SEGMENT_COLORS = ["#2F5D50", "#4A6B58", "#8FA99B", "#E8A33D", "#C97B4A", "#5B7A8C"];
const FREE_COLOR = "#9AA5A0";

function colorFor(segment: DollarJobSegment, index: number): string {
  return segment.name === "Free" ? FREE_COLOR : SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

/**
 * "Every dollar gets a job" — Protected's lump sum broken into named,
 * proportionally-sized segments (Rent, Phone bill, ...) plus a trailing
 * "Free" segment for what's left, instead of one number that hides where
 * it's actually going.
 */
export function DollarJobsBar({ segments }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const total = segments.reduce((sum, s) => sum + s.amountCents, 0);
  if (total <= 0) return null;

  return (
    <View className="mt-3">
      <View className="flex-row rounded-full overflow-hidden" style={{ height: 14 }}>
        {segments.map((s, i) => (
          <View
            key={s.name}
            style={{ flex: Math.max(s.amountCents, 1), backgroundColor: colorFor(s, i) }}
          />
        ))}
      </View>
      <View className="mt-3 gap-1.5">
        {segments.map((s, i) => (
          <View key={s.name} className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View
                className="w-2.5 h-2.5 rounded-full mr-2"
                style={{ backgroundColor: colorFor(s, i) }}
              />
              <Text className={`text-sm ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
                {s.name}
              </Text>
            </View>
            <Text className={`text-sm font-medium ${dark ? "text-ink-dark" : "text-ink"}`}>
              {money(s.amountCents)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

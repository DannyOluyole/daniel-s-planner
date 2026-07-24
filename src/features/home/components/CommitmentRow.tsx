import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";
import { money } from "@domain/entities/MoneyState";
import { Commitment } from "@domain/entities/Commitment";

interface Props {
  commitment: Commitment;
  onRemove: () => void;
  /** For variable commitments: "$X spent this month" / "$X spent — over by $Y". */
  subLabel?: string;
  subLabelCaution?: boolean;
  /** True when browsing a past/future month — history isn't editable. */
  readOnly?: boolean;
}

const CATEGORY_CHIP: Record<string, { bg: string; fg: string; bgLight: string; fgLight: string }> = {
  Dining: { bg: "#3A2418", fg: "#F0A868", bgLight: "#FBE3D5", fgLight: "#A8461F" },
  Groceries: { bg: "#1F3A2D", fg: "#7FE6A8", bgLight: "#D6F5E4", fgLight: "#0A6B3F" },
  Shopping: { bg: "#242A3E", fg: "#9AA3F0", bgLight: "#E1E4FB", fgLight: "#3A47C2" },
  Entertainment: { bg: "#3A1F35", fg: "#E88AD6", bgLight: "#FBE3F2", fgLight: "#A8246B" },
  Transport: { bg: "#2A2418", fg: "#E8B85A", bgLight: "#FBEFD5", fgLight: "#A87B1F" },
  Coffee: { bg: "#2E2013", fg: "#D9A066", bgLight: "#F5E6D3", fgLight: "#8A5A21" },
  Books: { bg: "#1E2A3A", fg: "#7FB3E6", bgLight: "#DCEBFB", fgLight: "#1F5FA8" },
  Courses: { bg: "#241E3A", fg: "#B08AE8", bgLight: "#EAE1FB", fgLight: "#6B2FA8" },
  Gym: { bg: "#1E3A24", fg: "#7FE68F", bgLight: "#DCFBE1", fgLight: "#1F8A3A" },
  Rent: { bg: "#3A241E", fg: "#E68F7F", bgLight: "#FBE1DC", fgLight: "#A83A1F" },
  Utilities: { bg: "#1E323A", fg: "#7FCDE6", bgLight: "#DCF3FB", fgLight: "#1F7A8A" },
  Insurance: { bg: "#2A2A1E", fg: "#D6D97F", bgLight: "#F6F7DC", fgLight: "#7A7D1F" },
  Other: { bg: "#232A27", fg: "#8FA99B", bgLight: "#EFF6F1", fgLight: "#4A6B58" },
};

export function CommitmentRow({ commitment, onRemove, subLabel, subLabelCaution, readOnly }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const chip = CATEGORY_CHIP[commitment.category ?? "Other"] ?? CATEGORY_CHIP.Other;
  const initial = (commitment.category ?? commitment.name).trim().charAt(0).toUpperCase();

  return (
    <View
      className={`flex-row items-center py-3 border-b ${
        dark ? "border-hairline-dark" : "border-hairline"
      }`}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: dark ? chip.bg : chip.bgLight }}
      >
        <Text className="text-xs font-bold" style={{ color: dark ? chip.fg : chip.fgLight }}>
          {initial}
        </Text>
      </View>
      <View className="flex-1 pr-3">
        <Text className={`text-base font-medium ${dark ? "text-ink-dark" : "text-ink"}`} numberOfLines={1}>
          {commitment.name}
        </Text>
        {commitment.category && (
          <Text className={`text-xs mt-0.5 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {commitment.category}
          </Text>
        )}
        {subLabel && (
          <Text className={`text-xs mt-0.5 ${subLabelCaution ? "text-signal-caution" : dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {subLabel}
          </Text>
        )}
      </View>
      <Text className={`text-base font-semibold mr-3 ${dark ? "text-ink-dark" : "text-ink"}`}>
        {money(commitment.amountCents)}
      </Text>
      {!readOnly && (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`${Copy.commitmentsScreen.removeCta} ${commitment.name}`}
        >
          <Text className="text-xs text-signal-caution">{Copy.commitmentsScreen.removeCta}</Text>
        </Pressable>
      )}
    </View>
  );
}

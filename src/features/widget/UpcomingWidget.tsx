import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface Props {
  /** e.g. "Rent · Jul 25" — the next scheduled income or bill. Null when
   * there's nothing scheduled to show. */
  eventLabel: string | null;
  /** e.g. "+$2,400" (income) or "-$1,500" (bill). Null alongside eventLabel. */
  amountLabel: string | null;
}

/**
 * A second widget size/variant alongside CheckpointWidget's Safe-to-Spend —
 * this one surfaces the single next scheduled item from the Financial
 * Timeline instead of today's balance, so a bill or payday a few days out
 * is visible without opening the app. Tapping it opens Future You's "What's
 * ahead" section, where the full projection lives, rather than Decision
 * Mode — this widget isn't about starting a purchase.
 */
export function UpcomingWidget({ eventLabel, amountLabel }: Props) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "checkpoint://future-you" }}
      style={{
        height: "match_parent",
        width: "match_parent",
        alignItems: "flex-start",
        justifyContent: "center",
        backgroundGradient: {
          from: "#123324",
          to: "#0D1210",
          orientation: "TL_BR",
        },
        borderRadius: 24,
        padding: 16,
      }}
    >
      <TextWidget
        text="WHAT'S AHEAD"
        style={{
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.5,
          color: "#7FE6A8",
        }}
      />
      <TextWidget
        text={eventLabel ?? "Nothing scheduled"}
        style={{
          marginTop: 8,
          fontSize: 16,
          fontWeight: "600",
          color: "#EDF7F2",
        }}
      />
      {amountLabel && (
        <TextWidget
          text={amountLabel}
          style={{
            marginTop: 2,
            fontSize: 24,
            fontWeight: "800",
            color: "#7FE6A8",
          }}
        />
      )}
    </FlexWidget>
  );
}

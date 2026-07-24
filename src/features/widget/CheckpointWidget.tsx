import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface Props {
  /** Formatted currency string, e.g. "$428". Pass null while loading. */
  availableLabel: string | null;
}

/**
 * The lock-screen / home-screen widget face. Tapping anywhere on it opens
 * Decision Mode directly (checkpoint://decision) — the same one-tap entry
 * point as the deep link used by the browser extension and any future
 * Action Button / Quick Settings shortcut.
 */
export function CheckpointWidget({ availableLabel }: Props) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "checkpoint://decision" }}
      style={{
        height: "match_parent",
        width: "match_parent",
        alignItems: "center",
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
        text="SAFE TO SPEND"
        style={{
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.5,
          color: "#7FE6A8",
        }}
      />
      <TextWidget
        text={availableLabel ?? "…"}
        style={{
          marginTop: 6,
          fontSize: 32,
          fontWeight: "800",
          color: "#EDF7F2",
        }}
      />
    </FlexWidget>
  );
}

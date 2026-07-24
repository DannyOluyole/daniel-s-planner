import React from "react";
import { View } from "react-native";
import { Button } from "@shared/components/Button";
import { Copy } from "@core/copy/strings";
import { DecisionOutcome } from "@domain/entities/MoneyState";

interface Props {
  onDecide: (outcome: DecisionOutcome) => void;
  continueEnabled: boolean;
}

/**
 * The three ways a Checkpoint can resolve. "Continue" is intentionally
 * disabled until the mandatory pause beat elapses, upstream in
 * SpendingWallScreen — this component only renders the resulting state.
 */
export function DecisionActions({ onDecide, continueEnabled }: Props) {
  return (
    <View className="gap-3">
      <Button
        label={Copy.spendingWall.continueLabel}
        intent="primary"
        disabled={!continueEnabled}
        onPress={() => onDecide("continued")}
      />
      <Button
        label={Copy.spendingWall.pauseLabel}
        intent="quiet"
        onPress={() => onDecide("paused")}
      />
      <Button
        label={Copy.spendingWall.reconsiderLabel}
        intent="ghost"
        onPress={() => onDecide("reconsidered")}
      />
    </View>
  );
}

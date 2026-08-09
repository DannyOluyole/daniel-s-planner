import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { colors, motion } from "@core/theme/tokens";
import { FrictionTier } from "@domain/money/frictionTier";

const STRIPE = 26;

// Intensity scales with how much a purchase actually matters — same amber
// stripe, no alarm-red, but a "big" or "reflection" purchase should feel
// like a heavier barrier than a coffee, not an identical faint texture
// regardless of stakes. Mirrors FRICTION_PAUSE_MS's escalation shape.
const RESTING_OPACITY: Record<FrictionTier, number> = {
  normal: 0.07,
  big: 0.13,
  reflection: 0.2,
};
const LIFTED_OPACITY: Record<FrictionTier, number> = {
  normal: 0.4,
  big: 0.55,
  reflection: 0.7,
};

interface Props {
  /** True once the user has confirmed — the backdrop briefly brightens,
   * the same beat a real gate arm makes when you're cleared through. */
  lifted: boolean;
  /** Drives resting/lifted intensity — see determineFrictionTier. */
  tier: FrictionTier;
}

/**
 * The hazard-stripe gate motif, filling the whole screen behind Decision
 * Mode's content instead of a single banner — so the Wall always feels like
 * standing at the barrier, not just glancing at a label up top. Kept faint
 * at rest so it reads as ambient texture, not noise, then brightens on
 * lift as a payoff right before navigating away.
 */
export function GateBackdrop({ lifted, tier }: Props) {
  const opacity = useSharedValue(RESTING_OPACITY[tier]);

  useEffect(() => {
    opacity.value = withTiming(lifted ? LIFTED_OPACITY[tier] : RESTING_OPACITY[tier], {
      duration: motion.gateLift,
      easing: Easing.out(Easing.cubic),
    });
  }, [lifted, tier, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="gateBackdropStripes" patternUnits="userSpaceOnUse" width={STRIPE} height={STRIPE} patternTransform="rotate(45)">
            <Rect width={STRIPE / 2} height={STRIPE} fill={colors.gate} />
            <Rect x={STRIPE / 2} width={STRIPE / 2} height={STRIPE} fill={colors.ink} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#gateBackdropStripes)" />
      </Svg>
    </Animated.View>
  );
}

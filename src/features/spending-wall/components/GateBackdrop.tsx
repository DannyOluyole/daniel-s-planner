import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { colors, motion } from "@core/theme/tokens";

const STRIPE = 26;
const RESTING_OPACITY = 0.07;
const LIFTED_OPACITY = 0.4;

interface Props {
  /** True once the user has confirmed — the backdrop briefly brightens,
   * the same beat a real gate arm makes when you're cleared through. */
  lifted: boolean;
}

/**
 * The hazard-stripe gate motif, filling the whole screen behind Decision
 * Mode's content instead of a single banner — so the Wall always feels like
 * standing at the barrier, not just glancing at a label up top. Kept faint
 * at rest so it reads as ambient texture, not noise, then brightens on
 * lift as a payoff right before navigating away.
 */
export function GateBackdrop({ lifted }: Props) {
  const opacity = useSharedValue(RESTING_OPACITY);

  useEffect(() => {
    opacity.value = withTiming(lifted ? LIFTED_OPACITY : RESTING_OPACITY, {
      duration: motion.gateLift,
      easing: Easing.out(Easing.cubic),
    });
  }, [lifted, opacity]);

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

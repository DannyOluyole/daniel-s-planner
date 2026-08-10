import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle, Rect as SvgRect } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { colors, motion } from "@core/theme/tokens";
import { FrictionTier } from "@domain/money/frictionTier";

const WHEEL_SIZE = 40;
const WHEEL_ROTATION_DEG = 200;

interface Props {
  /** True once the user has confirmed — the wheel turns and its hub lights
   * up, the same beat that kicks off the door panels parting on the
   * narrative card below (see VaultDoorOverlay). */
  lifted: boolean;
  /** Reserved for a future per-tier variant — currently every tier plays
   * identically. */
  tier: FrictionTier;
}

/**
 * A real foreground element, not a faint backdrop layer — a wheel handle
 * sitting in the normal content flow between the merchant/amount line and
 * the scroll content. Always fully visible; an earlier full-screen ambient
 * version of this (see git history) rendered behind the opaque narrative
 * card on real devices, making it invisible regardless of opacity — this
 * can't have that problem since it isn't positioned behind anything.
 * Matches the reference concept mockup exactly: grey spokes at rest, hub
 * turns checkpoint-green on lift.
 */
export function DecisionGate({ lifted }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(lifted ? 1 : 0, {
      duration: motion.gateLift,
      easing: Easing.out(Easing.cubic),
    });
  }, [lifted, progress]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, WHEEL_ROTATION_DEG])}deg` }],
  }));

  const hubFill = lifted ? colors.checkpoint : colors.inkFaint;

  return (
    <View className="items-center mt-3 mb-1">
      <Animated.View style={wheelStyle}>
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox="0 0 52 52">
          <Circle cx={26} cy={26} r={22} fill="none" stroke={colors.hairlineDark} strokeWidth={2} />
          <SvgRect x={24} y={6} width={4} height={40} rx={2} fill={colors.inkFaint} />
          <SvgRect x={24} y={6} width={4} height={40} rx={2} fill={colors.inkFaint} transform="rotate(45 26 26)" />
          <SvgRect x={24} y={6} width={4} height={40} rx={2} fill={colors.inkFaint} transform="rotate(90 26 26)" />
          <SvgRect x={24} y={6} width={4} height={40} rx={2} fill={colors.inkFaint} transform="rotate(135 26 26)" />
          <Circle cx={26} cy={26} r={5} fill={hubFill} />
        </Svg>
      </Animated.View>
    </View>
  );
}

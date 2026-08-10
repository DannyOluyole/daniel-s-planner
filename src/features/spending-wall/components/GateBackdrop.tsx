import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
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

const WHEEL_SIZE = 64;
const WHEEL_ROTATION_DEG = 200;
const SEAM_GAP_PX = 6;
// Pinned in the header area (below the eyebrow/prompt text, above the
// merchant/amount line) — the one part of the screen never covered by an
// opaque Card. Centering it on the whole screen instead put it directly
// behind the narrative card's solid background, making it invisible
// regardless of opacity.
const WHEEL_TOP_OFFSET = 96;

// Intensity scales with how much a purchase actually matters — same amber
// seam, no alarm-red, but a "big" or "reflection" purchase should feel
// like a heavier barrier than a coffee, not an identical faint texture
// regardless of stakes. Mirrors FRICTION_PAUSE_MS's escalation shape.
// Deliberately visible rather than barely-there — an earlier faint version
// (0.07 resting) was indistinguishable from no gate at all in practice.
const RESTING_OPACITY: Record<FrictionTier, number> = {
  normal: 0.5,
  big: 0.62,
  reflection: 0.78,
};
const LIFTED_OPACITY: Record<FrictionTier, number> = {
  normal: 0.72,
  big: 0.82,
  reflection: 0.94,
};

interface Props {
  /** True once the user has confirmed — the backdrop briefly brightens and
   * the doors part, the same beat a real vault gives when you're cleared
   * through. Purely ambient: never covers the narrative card or score,
   * which stay visible the whole time regardless of this state. */
  lifted: boolean;
  /** Drives resting/lifted intensity — see determineFrictionTier. */
  tier: FrictionTier;
}

/**
 * A vault motif — a wheel handle on a seam between two door panels, filling
 * the whole screen behind Decision Mode's content instead of a single
 * banner, so the Wall always feels like standing at the vault, not just
 * glancing at a label up top. Genuinely visible, not just ambient texture —
 * on lift the wheel turns and the doors part slightly as a payoff right
 * before navigating away. Never blocks or delays reading the actual
 * decision — the narrative/score sit in an opaque card above this backdrop
 * and are always fully visible regardless of this component's state.
 */
export function GateBackdrop({ lifted, tier }: Props) {
  const opacity = useSharedValue(RESTING_OPACITY[tier]);
  const progress = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(lifted ? LIFTED_OPACITY[tier] : RESTING_OPACITY[tier], {
      duration: motion.gateLift,
      easing: Easing.out(Easing.cubic),
    });
    progress.value = withTiming(lifted ? 1 : 0, {
      duration: motion.gateLift,
      easing: Easing.out(Easing.cubic),
    });
  }, [lifted, tier, opacity, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, WHEEL_ROTATION_DEG])}deg` }],
  }));
  const leftPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, -SEAM_GAP_PX]) }],
  }));
  const rightPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, SEAM_GAP_PX]) }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]} pointerEvents="none">
      <Animated.View style={[styles.panel, styles.panelLeft, leftPanelStyle]} />
      <Animated.View style={[styles.panel, styles.panelRight, rightPanelStyle]} />
      <View style={styles.seam} />
      <View style={styles.wheelWrap}>
        <Animated.View style={wheelStyle}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox="0 0 64 64">
            <Circle cx={32} cy={32} r={26} fill="none" stroke={colors.ink} strokeWidth={2} />
            <SvgRect x={29} y={6} width={6} height={52} rx={3} fill={colors.gate} />
            <SvgRect x={29} y={6} width={6} height={52} rx={3} fill={colors.gate} transform="rotate(60 32 32)" />
            <SvgRect x={29} y={6} width={6} height={52} rx={3} fill={colors.gate} transform="rotate(120 32 32)" />
            <Circle cx={32} cy={32} r={7} fill={colors.gate} />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "49.5%",
    backgroundColor: colors.ink,
  },
  panelLeft: { left: 0 },
  panelRight: { right: 0 },
  seam: {
    position: "absolute",
    left: "49.3%",
    top: 0,
    bottom: 0,
    width: "1.4%",
    backgroundColor: colors.gate,
  },
  wheelWrap: {
    position: "absolute",
    top: WHEEL_TOP_OFFSET,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

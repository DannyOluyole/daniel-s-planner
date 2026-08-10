import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { colors, motion } from "@core/theme/tokens";

// Large enough to clear any realistic card width, sliding fully off-screen
// rather than just out of the card's bounds.
const SLIDE_DISTANCE = 400;
const CLOSE_MS = Math.round(motion.gateLift * 0.45);
const REOPEN_MS = motion.gateLift - CLOSE_MS;

interface Props {
  lifted: boolean;
}

/**
 * Two panels that sit open (off to the sides, card fully visible) at rest —
 * the score/headline are never hidden before a decision is made. On
 * Continue, they play a quick close-then-reopen flourish alongside the
 * wheel turning, purely as a payoff after the choice is already committed,
 * never as something the user has to wait through to see the verdict.
 */
export function VaultDoorOverlay({ lifted }: Props) {
  // 1 = open (panels parted, content visible) — the resting state.
  const progress = useSharedValue(1);

  useEffect(() => {
    if (lifted) {
      progress.value = withSequence(
        withTiming(0, { duration: CLOSE_MS, easing: Easing.inOut(Easing.cubic) }),
        withTiming(1, { duration: REOPEN_MS, easing: Easing.out(Easing.cubic) })
      );
    } else {
      progress.value = 1;
    }
  }, [lifted, progress]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, -SLIDE_DISTANCE]) }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, SLIDE_DISTANCE]) }],
  }));

  return (
    <>
      <Animated.View style={[styles.panel, styles.left, leftStyle]} pointerEvents="none">
        <LinearGradient
          colors={["#23302A", colors.surfaceDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View style={[styles.panel, styles.right, rightStyle]} pointerEvents="none">
        <LinearGradient
          colors={["#23302A", colors.surfaceDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "51%",
    zIndex: 3,
  },
  left: { left: 0, borderRightWidth: 1, borderRightColor: colors.hairlineDark },
  right: { right: 0, borderLeftWidth: 1, borderLeftColor: colors.hairlineDark },
});

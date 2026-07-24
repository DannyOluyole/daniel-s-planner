import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { colors } from "@core/theme/tokens";
import { Copy } from "@core/copy/strings";

interface Props {
  onEnter: () => void;
}

const RING_SIZE = 120;
const ENTER_DURATION = 380;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The front door, shown once per app session before Home — not a
 * dashboard, a threshold. Tapping the ring is a small, deliberate arrival
 * moment rather than just another screen transition.
 */
export function PortalScreen({ onEnter }: Props) {
  const [entering, setEntering] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    scale.value = withTiming(1.7, { duration: ENTER_DURATION, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: ENTER_DURATION, easing: Easing.out(Easing.cubic) });
    setTimeout(onEnter, ENTER_DURATION);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#09090B", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.inkFaint, fontSize: 11, letterSpacing: 4, marginBottom: 18 }}>
        {getGreeting().toUpperCase()}
      </Text>
      <Text
        style={{
          color: "#E5E5E5",
          fontSize: 16,
          fontWeight: "500",
          marginBottom: 44,
          textAlign: "center",
          paddingHorizontal: 40,
        }}
      >
        {Copy.portal.prompt}
      </Text>
      <Pressable
        onPress={handleEnter}
        accessibilityRole="button"
        accessibilityLabel={`Enter ${Copy.checkpoint}`}
        hitSlop={20}
      >
        <Animated.View
          style={[
            {
              width: RING_SIZE,
              height: RING_SIZE,
              borderRadius: RING_SIZE / 2,
              borderWidth: 1.5,
              borderColor: colors.checkpointBright,
              // iOS gets a soft colored glow via the shadow* props. Android's
              // `elevation` doesn't support colored shadows (it's a flat
              // gray/black shadow) and, without an explicit backgroundColor
              // on this view, renders its clip as a faceted polygon instead
              // of a circle — so we skip elevation entirely on Android.
              shadowColor: colors.checkpointBright,
              shadowOpacity: 0.6,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            },
            ringStyle,
          ]}
        />
      </Pressable>
      <Text
        style={{
          color: colors.checkpointBright,
          fontSize: 12,
          letterSpacing: 3,
          fontWeight: "700",
          marginTop: 32,
        }}
      >
        {`Enter ${Copy.checkpoint}`.toUpperCase()}
      </Text>
    </View>
  );
}

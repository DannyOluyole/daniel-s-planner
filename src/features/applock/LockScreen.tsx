import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Button } from "@shared/components/Button";
import { useTheme } from "@core/theme/ThemeContext";
import { Copy } from "@core/copy/strings";

interface Props {
  onUnlock: () => Promise<boolean>;
}

/**
 * Shown in place of the whole app once useAppLock decides it's time to
 * re-authenticate. Triggers the OS prompt immediately on mount so most
 * people never see this screen linger — it's the fallback for when that
 * prompt gets dismissed or fails, with a manual retry.
 */
export function LockScreen({ onUnlock }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const [failed, setFailed] = useState(false);

  const attempt = async () => {
    setFailed(false);
    const success = await onUnlock();
    if (!success) setFailed(true);
  };

  useEffect(() => {
    attempt();
    // Only ever auto-triggers once, on mount — after that it's a manual
    // retry, so a repeatedly-cancelled prompt doesn't loop forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      className={`flex-1 items-center justify-center px-8 ${dark ? "bg-canvas-dark" : "bg-canvas"}`}
    >
      <Text className={`text-title font-semibold text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
        {Copy.appLock.title}
      </Text>
      <Text
        className={`mt-2 text-sm text-center ${dark ? "text-ink-faint" : "text-ink-soft"}`}
      >
        {failed ? Copy.appLock.failedNote : Copy.appLock.subtitle}
      </Text>
      <View className="mt-6 w-full max-w-xs">
        <Button label={Copy.appLock.unlockCta} onPress={attempt} />
      </View>
    </View>
  );
}

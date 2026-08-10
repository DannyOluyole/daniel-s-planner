import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@core/theme/ThemeContext";
import { InfoModal } from "@shared/components/InfoModal";
import { Button } from "@shared/components/Button";
import { Copy } from "@core/copy/strings";
import { TemptationWindow } from "@domain/money/nightPause";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatHour(hour: number): string {
  const normalized = hour % 24;
  const period = normalized >= 12 ? "PM" : "AM";
  const twelve = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${twelve} ${period}`;
}

export function formatTemptationWindow(window: TemptationWindow): { dayName: string; timeRange: string } {
  return {
    dayName: WEEKDAY_NAMES[window.weekday],
    timeRange: `${formatHour(window.startHour)}–${formatHour(window.endHour)}`,
  };
}

interface Props {
  window: TemptationWindow;
  temptedApp: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * The habit-loop doc's "we've noticed something" moment — surfaced once
 * (see useNightPause's `prompted` flag) via the shared InfoModal. The
 * modal's own built-in dismiss button doubles as "not now": accepting is a
 * distinct action inside the body, declining is just closing it.
 */
export function NightPausePrompt({ window, temptedApp, onAccept, onDecline }: Props) {
  const { scheme } = useTheme();
  const dark = scheme === "dark";
  const { dayName, timeRange } = formatTemptationWindow(window);

  return (
    <InfoModal visible onClose={onDecline} title={Copy.nightPause.promptTitle}>
      <Text className={dark ? "text-ink-dark" : "text-ink"}>
        {temptedApp
          ? Copy.nightPause.promptBodyWithApp(dayName, timeRange, temptedApp)
          : Copy.nightPause.promptBody(dayName, timeRange)}
      </Text>
      <View className="mt-4">
        <Button label={Copy.nightPause.acceptCta} onPress={onAccept} />
      </View>
    </InfoModal>
  );
}

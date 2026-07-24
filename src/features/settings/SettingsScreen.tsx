import React, { useState } from "react";
import { View, Text, ScrollView, Switch, Pressable, TextInput } from "react-native";
import { Screen } from "@shared/components/Screen";
import { BackHeader } from "@shared/components/BackHeader";
import { Card } from "@shared/components/Card";
import { Button } from "@shared/components/Button";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { useTheme } from "@core/theme/ThemeContext";
import { useOnboarding } from "@features/onboarding/OnboardingContext";
import { useAuth } from "@core/auth/AuthContext";
import { useCheckInReminder } from "@shared/hooks/useCheckInReminder";
import { useBigPurchaseThreshold } from "@shared/hooks/useBigPurchaseThreshold";
import { Copy } from "@core/copy/strings";
import { colors } from "@core/theme/tokens";
import type { SettingsStackScreenProps } from "@app/Navigation";

type Props = SettingsStackScreenProps<"SettingsHome">;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatDayList(days: number[]): string {
  if (days.length === 0) return "no days";
  if (days.length === 7) return "every day";
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS_FULL[d])
    .join(", ");
}

export function SettingsScreen({ navigation }: Props) {
  const { scheme } = useTheme();
  const { replay } = useOnboarding();
  const { user, signOut } = useAuth();
  const reminder = useCheckInReminder(user?.id ?? null);
  const bigPurchase = useBigPurchaseThreshold();
  const [thresholdInput, setThresholdInput] = useState<string | null>(null);
  const dark = scheme === "dark";

  const displayedThreshold = thresholdInput ?? String(bigPurchase.thresholdCents / 100);
  const commitThreshold = () => {
    const dollars = parseFloat(thresholdInput ?? "");
    if (!Number.isNaN(dollars) && dollars > 0) {
      bigPurchase.setThresholdCents(Math.round(dollars * 100));
    }
    setThresholdInput(null);
  };

  return (
    <Screen>
      <BackHeader title="Settings" />

      <ScrollView showsVerticalScrollIndicator={false}>
      <Card>
        <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          Account
        </Text>
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {user?.email ?? "Signed in"}
        </Text>
        <Button label="Sign out" intent="quiet" onPress={signOut} />
      </Card>

      <Card className="mt-4">
        <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          Bank connection
        </Text>
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          Manage the bank account Checkpoint reads balances from.
        </Text>
        <Button
          label="Connect your bank"
          intent="quiet"
          onPress={() => navigation.navigate("LinkAccount")}
        />
      </Card>

      <Card className="mt-4">
        <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          Appearance
        </Text>
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          Checkpoint stays calm in either light or dark. System follows your device.
        </Text>
        <ThemeToggle />
      </Card>

      <Card className="mt-4">
        <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          {Copy.reminders.cardTitle}
        </Text>
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {Copy.reminders.cardSubtitle}
        </Text>
        {reminder.supported ? (
          <>
            <View className="flex-row items-center justify-between">
              <Text className={`text-base ${dark ? "text-ink-dark" : "text-ink"}`}>
                {Copy.reminders.toggleLabel}
              </Text>
              <Switch
                value={reminder.status === "on"}
                onValueChange={reminder.toggle}
                trackColor={{ true: colors.checkpointBright, false: undefined }}
              />
            </View>

            {(reminder.status === "on" || reminder.status === "off") && (
              <View className="mt-4">
                <Text className={`text-caption uppercase tracking-wide mb-2 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                  {Copy.reminders.dayLabel}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {DAY_LABELS.map((label, day) => {
                    const active = reminder.schedule.days.includes(day);
                    return (
                      <Pressable
                        key={label}
                        onPress={() => {
                          const days = active
                            ? reminder.schedule.days.filter((d) => d !== day)
                            : [...reminder.schedule.days, day];
                          reminder.setSchedule({ ...reminder.schedule, days });
                        }}
                        className={`rounded-full border px-3 py-1.5 ${
                          active ? "bg-checkpoint border-checkpoint" : dark ? "border-hairline-dark" : "border-hairline"
                        }`}
                      >
                        <Text className={active ? "text-white text-xs font-medium" : `text-xs ${dark ? "text-ink-dark" : "text-ink"}`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text className={`text-caption uppercase tracking-wide mt-5 mb-2 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                  {Copy.reminders.timeLabel}
                </Text>
                <View className="flex-row items-center gap-3">
                  <Text className={`text-xs w-14 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>Hour</Text>
                  <Pressable
                    onPress={() =>
                      reminder.setSchedule({ ...reminder.schedule, hour: (reminder.schedule.hour + 23) % 24 })
                    }
                    hitSlop={10}
                    className={`w-9 h-9 rounded-full border items-center justify-center ${dark ? "border-hairline-dark" : "border-hairline"}`}
                  >
                    <Text className={`text-lg ${dark ? "text-ink-dark" : "text-ink"}`}>−</Text>
                  </Pressable>
                  <Text className={`text-base font-medium w-24 text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
                    {formatTime(reminder.schedule.hour, reminder.schedule.minute)}
                  </Text>
                  <Pressable
                    onPress={() =>
                      reminder.setSchedule({ ...reminder.schedule, hour: (reminder.schedule.hour + 1) % 24 })
                    }
                    hitSlop={10}
                    className={`w-9 h-9 rounded-full border items-center justify-center ${dark ? "border-hairline-dark" : "border-hairline"}`}
                  >
                    <Text className={`text-lg ${dark ? "text-ink-dark" : "text-ink"}`}>+</Text>
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-3 mt-3">
                  <Text className={`text-xs w-14 ${dark ? "text-ink-faint" : "text-ink-faint"}`}>Minute</Text>
                  <Pressable
                    onPress={() =>
                      reminder.setSchedule({ ...reminder.schedule, minute: (reminder.schedule.minute + 55) % 60 })
                    }
                    hitSlop={10}
                    className={`w-9 h-9 rounded-full border items-center justify-center ${dark ? "border-hairline-dark" : "border-hairline"}`}
                  >
                    <Text className={`text-lg ${dark ? "text-ink-dark" : "text-ink"}`}>−</Text>
                  </Pressable>
                  <Text className={`text-base font-medium w-24 text-center ${dark ? "text-ink-dark" : "text-ink"}`}>
                    :{reminder.schedule.minute.toString().padStart(2, "0")}
                  </Text>
                  <Pressable
                    onPress={() =>
                      reminder.setSchedule({ ...reminder.schedule, minute: (reminder.schedule.minute + 5) % 60 })
                    }
                    hitSlop={10}
                    className={`w-9 h-9 rounded-full border items-center justify-center ${dark ? "border-hairline-dark" : "border-hairline"}`}
                  >
                    <Text className={`text-lg ${dark ? "text-ink-dark" : "text-ink"}`}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {reminder.status === "on" && (
              <Text className={`mt-4 text-xs ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
                {Copy.reminders.scheduledNote(formatDayList(reminder.schedule.days), formatTime(reminder.schedule.hour, reminder.schedule.minute))}
              </Text>
            )}
            {reminder.status === "denied" && (
              <Text className="mt-2 text-xs text-signal-caution">
                {Copy.reminders.permissionDeniedNote}
              </Text>
            )}

            <View className="mt-4">
              <Button label="Send a test notification" intent="quiet" onPress={reminder.sendTest} />
            </View>
          </>
        ) : (
          <Text className={`text-xs ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
            {Copy.reminders.webUnsupportedNote}
          </Text>
        )}
      </Card>

      <Card className="mt-4">
        <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          {Copy.bigPurchaseMode.cardTitle}
        </Text>
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {Copy.bigPurchaseMode.cardSubtitle}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className={`text-base ${dark ? "text-ink-dark" : "text-ink"}`}>
            {Copy.bigPurchaseMode.toggleLabel}
          </Text>
          <Switch
            value={bigPurchase.enabled}
            onValueChange={bigPurchase.setEnabled}
            trackColor={{ true: colors.checkpointBright, false: undefined }}
          />
        </View>
        {bigPurchase.enabled && (
          <View className="mt-4 flex-row items-center justify-between">
            <Text className={`text-sm ${dark ? "text-ink-faint" : "text-ink-faint"}`}>
              {Copy.bigPurchaseMode.thresholdLabel}
            </Text>
            <View className="flex-row items-center">
              <Text className={`text-base mr-1 ${dark ? "text-ink-dark" : "text-ink"}`}>$</Text>
              <TextInput
                className={`text-base text-right w-20 py-1 ${dark ? "text-ink-dark" : "text-ink"}`}
                keyboardType="decimal-pad"
                value={displayedThreshold}
                onChangeText={setThresholdInput}
                onBlur={commitThreshold}
              />
            </View>
          </View>
        )}
      </Card>

      <Card className="mt-4">
        <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          {Copy.places.title}
        </Text>
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          {Copy.places.subtitle}
        </Text>
        <Button
          label={Copy.places.title}
          intent="quiet"
          onPress={() => navigation.navigate("WatchedPlaces")}
        />
      </Card>

      <Card className="mt-4 mb-6">
        <Text className={`text-headline mb-1 ${dark ? "text-ink-dark" : "text-ink"}`}>
          Introduction
        </Text>
        <Text className={`text-sm mb-4 ${dark ? "text-ink-faint" : "text-ink-soft"}`}>
          Replay the walkthrough of Available, Protected, Checkpoint, and Future You.
        </Text>
        <Button label="Replay intro" intent="quiet" onPress={replay} />
      </Card>
      </ScrollView>
    </Screen>
  );
}

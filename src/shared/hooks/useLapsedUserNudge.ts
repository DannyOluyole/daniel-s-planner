import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Copy } from "@core/copy/strings";

const LAST_OPENED_KEY = "checkpoint:last-opened";
const WINBACK_NOTIFICATION_ID = "checkpoint:winback";
const WINBACK_DAYS = 14;
const DAY_SECONDS = 24 * 60 * 60;

async function rescheduleWinback() {
  await Notifications.cancelScheduledNotificationAsync(WINBACK_NOTIFICATION_ID);

  // Never requests permission itself — only schedules if something else
  // (the check-in toggle) already secured it, so this doesn't add its own
  // separate permission prompt on every app open.
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.scheduleNotificationAsync({
    identifier: WINBACK_NOTIFICATION_ID,
    content: {
      title: Copy.reminders.winbackTitle,
      body: Copy.reminders.winbackBody,
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "checkpoint-alerts" } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: WINBACK_DAYS * DAY_SECONDS,
    },
  });
}

/**
 * A single honest "we miss you" nudge, not notification spam: cancels and
 * reschedules itself ~14 days out every time the app foregrounds, so it
 * only actually fires if the app genuinely isn't reopened before then. No
 * settings screen — this is meant to be quietly always-on, mirroring the
 * "not a notification-spam, one honest nudge" framing it was scoped with.
 */
export function useLapsedUserNudge() {
  const initialized = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const onForeground = () => {
      AsyncStorage.setItem(LAST_OPENED_KEY, new Date().toISOString()).catch(() => {});
      rescheduleWinback().catch(() => {});
    };

    if (!initialized.current) {
      initialized.current = true;
      onForeground();
    }

    const handleChange = (next: AppStateStatus) => {
      if (next === "active") onForeground();
    };
    const subscription = AppState.addEventListener("change", handleChange);
    return () => subscription.remove();
  }, []);
}

import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Copy } from "@core/copy/strings";
import { bankLinkRepository } from "@data/repositories";
import { money } from "@domain/entities/MoneyState";
import { humanizeCategory } from "@domain/money/humanizeCategory";
import {
  highestSpendingWeekday,
  topCategoryThisWeekFromTransactions,
  detectCategoryTrendsFromTransactions,
} from "@domain/money/weeklySpendInsight";

const NOTIFICATION_ID_PREFIX = "checkpoint:checkin-reminder";
const STATUS_KEY = "checkpoint:checkin-reminder-status";
const SCHEDULE_KEY = "checkpoint:checkin-schedule";
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export type ReminderStatus = "off" | "on" | "unsupported" | "denied";

export interface CheckInSchedule {
  /** 0 = Sunday .. 6 = Saturday. One notification gets scheduled per day. */
  days: number[];
  hour: number;
  minute: number;
}

// Friday 6pm — a reasonable default, but the user can pick any combination.
const DEFAULT_SCHEDULE: CheckInSchedule = { days: [5], hour: 18, minute: 0 };
// Enough history to read a real weekday spending pattern, not just this week.
const HISTORY_LIMIT = 200;

function notificationId(day: number): string {
  return `${NOTIFICATION_ID_PREFIX}-${day}`;
}

/**
 * Builds the check-in body from real synced transactions when there's
 * enough history to say something true — a real weekly digest combining
 * this week's top category, a genuine 30-day trend (not just a snapshot),
 * and the historically busiest spending day — falling back to a generic
 * line otherwise (no bank linked yet, or too little history for any signal).
 */
async function buildReminderBody(userId: string): Promise<string> {
  try {
    const transactions = await bankLinkRepository.getTransactions(userId, HISTORY_LIMIT);
    const topCategory = topCategoryThisWeekFromTransactions(transactions);
    const topTrend = detectCategoryTrendsFromTransactions(transactions)[0] ?? null;
    const busiestDay = highestSpendingWeekday(transactions);

    const parts: string[] = [];
    if (topCategory) {
      const label = humanizeCategory(topCategory.category) ?? topCategory.category;
      parts.push(`You've spent ${money(topCategory.spentCents)} on ${label} this week.`);
    }
    if (topTrend) {
      const label = humanizeCategory(topTrend.category) ?? topTrend.category;
      parts.push(
        topTrend.direction === "up"
          ? `${label} is up ${topTrend.percentChange}% over the last 30 days.`
          : `${label} is down ${Math.abs(topTrend.percentChange)}% over the last 30 days.`
      );
    }
    if (busiestDay) {
      parts.push(`${busiestDay}s tend to be your highest-spending day.`);
    }
    return parts.length > 0 ? parts.join(" ") : Copy.reminders.fridayNotificationBody;
  } catch {
    return Copy.reminders.fridayNotificationBody;
  }
}

/**
 * Recurring check-ins on whichever days/time the user picks, whose body is
 * recomputed from real synced transactions each time this hook mounts
 * (app/Settings open) — expo-notifications' repeating trigger can't carry
 * dynamic content on its own, so this keeps the scheduled notifications'
 * text fresh by rescheduling with newly computed content rather than
 * relying on a background task. Each selected day gets its own scheduled
 * notification (expo-notifications only supports one weekday per trigger),
 * so enabling three days schedules three notifications under one on/off
 * toggle.
 */
export function useCheckInReminder(userId: string | null) {
  const supported = Platform.OS !== "web";
  const [status, setStatus] = useState<ReminderStatus>(supported ? "off" : "unsupported");
  const [schedule, setScheduleState] = useState<CheckInSchedule>(DEFAULT_SCHEDULE);

  const scheduleNotifications = useCallback(
    async (sched: CheckInSchedule) => {
      // Cancel every possible day's notification first — simplest way to
      // guarantee a stale day from a previous selection never lingers.
      await Promise.all(ALL_DAYS.map((day) => Notifications.cancelScheduledNotificationAsync(notificationId(day))));

      if (sched.days.length === 0) return;
      const body = userId ? await buildReminderBody(userId) : Copy.reminders.fridayNotificationBody;
      await Promise.all(
        sched.days.map((day) =>
          Notifications.scheduleNotificationAsync({
            identifier: notificationId(day),
            content: {
              title: Copy.reminders.fridayNotificationTitle,
              body,
              sound: "default",
              ...(Platform.OS === "android" ? { channelId: "checkpoint-alerts" } : null),
            },
            // expo-notifications' weekday is 1-indexed from Sunday.
            trigger: { weekday: day + 1, hour: sched.hour, minute: sched.minute, repeats: true },
          })
        )
      );
    },
    [userId]
  );

  useEffect(() => {
    if (!supported) return;
    (async () => {
      const [storedStatus, storedSchedule] = await Promise.all([
        AsyncStorage.getItem(STATUS_KEY),
        AsyncStorage.getItem(SCHEDULE_KEY),
      ]);
      const sched: CheckInSchedule = storedSchedule ? JSON.parse(storedSchedule) : DEFAULT_SCHEDULE;
      setScheduleState(sched);
      if (storedStatus === "on") {
        setStatus("on");
        // Refresh the scheduled content with what's true right now.
        if (userId) await scheduleNotifications(sched);
      }
    })();
  }, [supported, userId, scheduleNotifications]);

  const enable = useCallback(async () => {
    if (!supported) return;
    const { status: permission } = await Notifications.requestPermissionsAsync();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }
    await scheduleNotifications(schedule);
    await AsyncStorage.setItem(STATUS_KEY, "on");
    setStatus("on");
  }, [supported, schedule, scheduleNotifications]);

  // Fires immediately rather than waiting on the real schedule — lets
  // someone confirm the sound/channel actually works right after changing
  // notification settings, instead of waiting until the next real check-in.
  const sendTest = useCallback(async () => {
    if (!supported) return;
    const { status: permission } = await Notifications.requestPermissionsAsync();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }
    const body = userId ? await buildReminderBody(userId) : Copy.reminders.fridayNotificationBody;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: Copy.reminders.fridayNotificationTitle,
        body,
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "checkpoint-alerts" } : null),
      },
      trigger: null,
    });
  }, [supported, userId]);

  const disable = useCallback(async () => {
    if (!supported) return;
    await Promise.all(ALL_DAYS.map((day) => Notifications.cancelScheduledNotificationAsync(notificationId(day))));
    await AsyncStorage.removeItem(STATUS_KEY);
    setStatus("off");
  }, [supported]);

  const toggle = useCallback(() => {
    return status === "on" ? disable() : enable();
  }, [status, enable, disable]);

  const setSchedule = useCallback(
    async (next: CheckInSchedule) => {
      setScheduleState(next);
      await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(next));
      if (status === "on") await scheduleNotifications(next);
    },
    [status, scheduleNotifications]
  );

  return { status, supported, toggle, schedule, setSchedule, sendTest };
}

import React from "react";
import { Platform } from "react-native";
import { registerWidgetTaskHandler, requestWidgetUpdate, WidgetTaskHandlerProps } from "react-native-android-widget";
import { CheckpointWidget } from "./CheckpointWidget";
import { UpcomingWidget } from "./UpcomingWidget";
import { supabase, supabaseConfigured } from "@core/config/supabase";
import { checkpointRepository } from "@data/repositories";
import { money } from "@domain/entities/MoneyState";
import { buildFinancialTimeline } from "@domain/money/financialTimeline";

export const WIDGET_NAME = "CheckpointWidget";
export const UPCOMING_WIDGET_NAME = "UpcomingWidget";

/**
 * Runs in a headless JS context, separate from the app's normal React tree
 * — no AuthContext/ThemeContext available, so this talks to Supabase and
 * the repository layer directly.
 */
async function getSignedInUserId(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function getAvailableLabel(): Promise<string> {
  const userId = await getSignedInUserId();
  if (!supabaseConfigured) return "Open app";
  if (!userId) return "Sign in";

  try {
    const state = await checkpointRepository.getMoneyState(userId);
    return money(state.availableCents);
  } catch {
    return "—";
  }
}

/** The single next scheduled income or bill from the Financial Timeline —
 * balance itself doesn't matter here, only which event comes first. */
async function getUpcomingInfo(): Promise<{ eventLabel: string | null; amountLabel: string | null }> {
  const userId = await getSignedInUserId();
  if (!userId) return { eventLabel: null, amountLabel: null };

  try {
    const [income, commitments] = await Promise.all([
      checkpointRepository.getIncome(userId),
      checkpointRepository.getCommitments(userId),
    ]);
    const timeline = buildFinancialTimeline(0, income, commitments, null, new Date());
    const next = timeline.events[0];
    if (!next) return { eventLabel: null, amountLabel: null };

    const [y, m, d] = next.date.split("-").map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isIncome = next.amountCents > 0;
    return {
      eventLabel: `${next.label} · ${dateLabel}`,
      amountLabel: `${isIncome ? "+" : "-"}${money(Math.abs(next.amountCents))}`,
    };
  } catch {
    return { eventLabel: null, amountLabel: null };
  }
}

async function checkpointWidgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetName } = props.widgetInfo;
  if (widgetName !== WIDGET_NAME && widgetName !== UPCOMING_WIDGET_NAME) return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      if (widgetName === WIDGET_NAME) {
        const availableLabel = await getAvailableLabel();
        props.renderWidget(<CheckpointWidget availableLabel={availableLabel} />);
      } else {
        const { eventLabel, amountLabel } = await getUpcomingInfo();
        props.renderWidget(<UpcomingWidget eventLabel={eventLabel} amountLabel={amountLabel} />);
      }
      break;
    }
    // "OPEN_URI" click actions are handled natively by the library itself —
    // nothing to do here for WIDGET_CLICK.
    case "WIDGET_CLICK":
    case "WIDGET_DELETED":
    default:
      break;
  }
}

export function setupCheckpointWidget() {
  registerWidgetTaskHandler(checkpointWidgetTaskHandler);
}

/**
 * Pushes fresh data to both widgets right away, instead of waiting for
 * Android's next periodic update (minimum 30 minutes). Call this after
 * anything that changes the synced balance or the upcoming schedule — a
 * Decision Mode outcome, a bank sync completing, or an income/bill edit.
 */
export async function refreshCheckpointWidget() {
  if (Platform.OS !== "android") return;
  const [availableLabel, upcoming] = await Promise.all([getAvailableLabel(), getUpcomingInfo()]);
  await Promise.all([
    requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => <CheckpointWidget availableLabel={availableLabel} />,
    }),
    requestWidgetUpdate({
      widgetName: UPCOMING_WIDGET_NAME,
      renderWidget: () => <UpcomingWidget eventLabel={upcoming.eventLabel} amountLabel={upcoming.amountLabel} />,
    }),
  ]);
}

import { useCallback, useEffect, useState } from "react";
import { checkpointRepository } from "@data/repositories";
import { Copy } from "@core/copy/strings";
import { SavingsGoal } from "@domain/entities/SavingsGoal";
import { SpendingDecision } from "@domain/entities/MoneyState";
import {
  MilestoneKey,
  detectFirstGoalReached,
  detectFirstProtectedDecision,
  detect30DaysOfUse,
} from "@domain/money/milestones";

export interface MilestoneEvent {
  key: MilestoneKey;
  title: string;
  body: string;
}

interface Params {
  userId: string | null;
  userCreatedAt: string | undefined;
  goals: SavingsGoal[];
  decisions: SpendingDecision[];
  availableCents: number;
}

/**
 * Surfaces at most one not-yet-shown milestone per check — Home/Decisions
 * re-run this on focus, so if more than one becomes true between checks,
 * the rest simply surface on the next pass rather than stacking modals.
 */
export function useMilestones({ userId, userCreatedAt, goals, decisions, availableCents }: Params) {
  const [pending, setPending] = useState<MilestoneEvent | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const shown = await checkpointRepository.getShownMilestones(userId);
      if (cancelled) return;

      const goalReached = detectFirstGoalReached(goals, availableCents);
      if (goalReached && !shown.includes("first_goal_reached")) {
        setPending({
          key: "first_goal_reached",
          title: Copy.milestones.firstGoalReachedTitle,
          body: Copy.milestones.firstGoalReachedBody(goalReached.name),
        });
        return;
      }

      const firstProtected = detectFirstProtectedDecision(decisions);
      if (firstProtected && !shown.includes("first_protected_decision")) {
        setPending({
          key: "first_protected_decision",
          title: Copy.milestones.firstProtectedTitle,
          body: Copy.milestones.firstProtectedBody,
        });
        return;
      }

      if (detect30DaysOfUse(userCreatedAt) && !shown.includes("30_days_of_use")) {
        setPending({
          key: "30_days_of_use",
          title: Copy.milestones.thirtyDaysTitle,
          body: Copy.milestones.thirtyDaysBody,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, userCreatedAt, goals, decisions, availableCents]);

  const dismiss = useCallback(async () => {
    if (!userId || !pending) return;
    await checkpointRepository.markMilestoneShown(userId, pending.key);
    setPending(null);
  }, [userId, pending]);

  return { pending, dismiss };
}

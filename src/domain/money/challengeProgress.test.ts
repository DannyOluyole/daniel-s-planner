import { computeChallengeProgress, buildChallengeWindow } from "./challengeProgress";
import { Challenge } from "@domain/entities/Challenge";
import { SpendingDecision } from "@domain/entities/MoneyState";

function makeChallenge(overrides: Partial<Challenge>): Challenge {
  return {
    id: "ch-1",
    userId: "u1",
    type: "no_spend_week",
    startsAt: "2026-07-01",
    endsAt: "2026-07-08",
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeDecision(overrides: Partial<SpendingDecision>): SpendingDecision {
  return {
    id: "dec-1",
    amountCents: 5000,
    merchant: "Some Store",
    outcome: "paused",
    pauseDurationMs: 5000,
    decidedAt: "2026-07-03T12:00:00.000Z",
    ...overrides,
  };
}

describe("computeChallengeProgress", () => {
  it("is in-progress and not failed with no decisions in the window", () => {
    const now = new Date(2026, 6, 4); // July 4, mid-window
    const progress = computeChallengeProgress(makeChallenge({}), [], now);
    expect(progress.failed).toBe(false);
    expect(progress.completed).toBe(false);
    expect(progress.daysElapsed).toBe(3);
    expect(progress.daysTotal).toBe(7);
  });

  it("fails the moment a 'continued' decision lands inside the window", () => {
    const now = new Date(2026, 6, 4);
    const decisions = [makeDecision({ outcome: "continued", decidedAt: "2026-07-03T12:00:00.000Z" })];
    const progress = computeChallengeProgress(makeChallenge({}), decisions, now);
    expect(progress.failed).toBe(true);
    expect(progress.completed).toBe(false);
  });

  it("ignores paused/reconsidered decisions inside the window", () => {
    const now = new Date(2026, 6, 4);
    const decisions = [
      makeDecision({ outcome: "paused", decidedAt: "2026-07-03T12:00:00.000Z" }),
      makeDecision({ outcome: "reconsidered", decidedAt: "2026-07-02T12:00:00.000Z" }),
    ];
    expect(computeChallengeProgress(makeChallenge({}), decisions, now).failed).toBe(false);
  });

  it("ignores a 'continued' decision outside the window", () => {
    const now = new Date(2026, 6, 4);
    const decisions = [makeDecision({ outcome: "continued", decidedAt: "2026-06-15T12:00:00.000Z" })];
    expect(computeChallengeProgress(makeChallenge({}), decisions, now).failed).toBe(false);
  });

  it("completes once the window has fully elapsed without failing", () => {
    const now = new Date(2026, 6, 10); // after endsAt
    const progress = computeChallengeProgress(makeChallenge({}), [], now);
    expect(progress.completed).toBe(true);
    expect(progress.failed).toBe(false);
  });

  it("does not report completed if the window elapsed but a decision failed it", () => {
    const now = new Date(2026, 6, 10);
    const decisions = [makeDecision({ outcome: "continued", decidedAt: "2026-07-05T12:00:00.000Z" })];
    const progress = computeChallengeProgress(makeChallenge({}), decisions, now);
    expect(progress.failed).toBe(true);
    expect(progress.completed).toBe(false);
  });
});

describe("buildChallengeWindow", () => {
  it("builds a window of the given length starting today", () => {
    const now = new Date(2026, 6, 1);
    const window = buildChallengeWindow(7, now);
    expect(window.startsAt).toBe("2026-07-01");
    expect(window.endsAt).toBe("2026-07-08");
  });
});

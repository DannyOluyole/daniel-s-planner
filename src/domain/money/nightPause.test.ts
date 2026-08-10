import { detectPeakTemptationWindow, isWithinTemptationWindow } from "./nightPause";
import { SpendingDecision } from "@domain/entities/MoneyState";

function makeDecision(overrides: Partial<SpendingDecision>): SpendingDecision {
  return {
    id: "dec-1",
    amountCents: 5000,
    merchant: "Some Store",
    outcome: "continued",
    pauseDurationMs: 5000,
    decidedAt: "2026-07-10T12:00:00.000Z",
    ...overrides,
  };
}

// A Friday at 22:00 local time.
function fridayNight(id: string, hour = 22): SpendingDecision {
  const d = new Date(2026, 6, 10, hour, 0, 0); // Friday, July 10, 2026
  return makeDecision({ id, decidedAt: d.toISOString() });
}

// A Monday at 09:00 local time — a different weekday+block entirely.
function mondayMorning(id: string): SpendingDecision {
  const d = new Date(2026, 6, 6, 9, 0, 0); // Monday, July 6, 2026
  return makeDecision({ id, decidedAt: d.toISOString() });
}

describe("detectPeakTemptationWindow", () => {
  it("returns null with too little history", () => {
    const decisions = [fridayNight("d1"), fridayNight("d2")];
    expect(detectPeakTemptationWindow(decisions)).toBeNull();
  });

  it("returns null when there's enough history but no clear repeated peak", () => {
    const decisions = [
      fridayNight("d1"),
      mondayMorning("d2"),
      makeDecision({ id: "d3", decidedAt: new Date(2026, 6, 7, 15, 0, 0).toISOString() }),
      makeDecision({ id: "d4", decidedAt: new Date(2026, 6, 8, 3, 0, 0).toISOString() }),
      makeDecision({ id: "d5", decidedAt: new Date(2026, 6, 9, 11, 0, 0).toISOString() }),
    ];
    expect(detectPeakTemptationWindow(decisions)).toBeNull();
  });

  it("finds a real repeated weekday + 3-hour block", () => {
    const decisions = [
      fridayNight("d1", 21),
      fridayNight("d2", 22),
      fridayNight("d3", 23),
      mondayMorning("d4"),
      mondayMorning("d5"),
    ];
    expect(detectPeakTemptationWindow(decisions)).toEqual({ weekday: 5, startHour: 21, endHour: 24 });
  });
});

describe("isWithinTemptationWindow", () => {
  const window = { weekday: 5, startHour: 21, endHour: 24 };

  it("is true inside the window on the right weekday", () => {
    expect(isWithinTemptationWindow(window, new Date(2026, 6, 10, 22, 0, 0))).toBe(true);
  });

  it("is false outside the hour range on the right weekday", () => {
    expect(isWithinTemptationWindow(window, new Date(2026, 6, 10, 15, 0, 0))).toBe(false);
  });

  it("is false on a different weekday, even at the same hour", () => {
    expect(isWithinTemptationWindow(window, new Date(2026, 6, 6, 22, 0, 0))).toBe(false);
  });
});

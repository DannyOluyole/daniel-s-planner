import { wasActiveDuringMonth, sumActiveDuringMonth } from "./activeDuringMonth";

const june = new Date("2026-06-15T00:00:00.000Z");
const july = new Date("2026-07-15T00:00:00.000Z");

describe("wasActiveDuringMonth", () => {
  it("is active when created before the month and never removed", () => {
    const item = { createdAt: "2026-05-01T00:00:00.000Z" };
    expect(wasActiveDuringMonth(item, june)).toBe(true);
  });

  it("is not active when created after the month ends", () => {
    const item = { createdAt: "2026-07-18T00:00:00.000Z" };
    expect(wasActiveDuringMonth(item, june)).toBe(false);
  });

  it("is active in the month it was created", () => {
    const item = { createdAt: "2026-06-01T00:00:00.000Z" };
    expect(wasActiveDuringMonth(item, june)).toBe(true);
  });

  it("is not active in a month before it existed even if later removed", () => {
    // Noon UTC, not midnight — a midnight-UTC boundary timestamp can land on
    // the previous calendar day in negative-UTC-offset timezones, which is
    // exactly the ambiguity this function has to be correct about; the test
    // fixture itself needs to be unambiguous.
    const item = { createdAt: "2026-07-01T12:00:00.000Z", removedAt: "2026-07-20T12:00:00.000Z" };
    expect(wasActiveDuringMonth(item, june)).toBe(false);
  });

  it("is not active in a month after it was removed", () => {
    const item = { createdAt: "2026-01-01T00:00:00.000Z", removedAt: "2026-06-01T00:00:00.000Z" };
    expect(wasActiveDuringMonth(item, july)).toBe(false);
  });

  it("is still active in the month it was removed", () => {
    const item = { createdAt: "2026-01-01T00:00:00.000Z", removedAt: "2026-06-20T00:00:00.000Z" };
    expect(wasActiveDuringMonth(item, june)).toBe(true);
  });

  it("stays active in past months even when removed much later", () => {
    const item = { createdAt: "2026-01-01T00:00:00.000Z", removedAt: "2026-09-01T00:00:00.000Z" };
    expect(wasActiveDuringMonth(item, june)).toBe(true);
  });
});

describe("sumActiveDuringMonth", () => {
  const items = [
    { createdAt: "2026-01-01T00:00:00.000Z", amountCents: 30000 }, // active always
    { createdAt: "2026-07-01T12:00:00.000Z", amountCents: 15000 }, // starts in July
    { createdAt: "2026-01-01T00:00:00.000Z", removedAt: "2026-05-01T00:00:00.000Z", amountCents: 6000 }, // ended before June
  ];

  it("only sums items active during June", () => {
    expect(sumActiveDuringMonth(items, june)).toBe(30000);
  });

  it("only sums items active during July", () => {
    expect(sumActiveDuringMonth(items, july)).toBe(45000);
  });
});

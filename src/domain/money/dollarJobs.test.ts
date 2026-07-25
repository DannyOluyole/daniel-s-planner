import { buildDollarJobSegments } from "./dollarJobs";
import { Commitment } from "@domain/entities/Commitment";

function makeCommitment(overrides: Partial<Commitment>): Commitment {
  return {
    id: "c1",
    userId: "u1",
    name: "Rent",
    type: "fixed",
    amountCents: 150000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildDollarJobSegments", () => {
  it("includes fixed and debt commitments, in order, plus a Free segment", () => {
    const commitments = [
      makeCommitment({ name: "Rent", type: "fixed", amountCents: 150000 }),
      makeCommitment({ name: "Car loan", type: "debt", amountCents: 30000 }),
    ];
    const segments = buildDollarJobSegments(commitments, 20000);
    expect(segments).toEqual([
      { name: "Rent", amountCents: 150000 },
      { name: "Car loan", amountCents: 30000 },
      { name: "Free", amountCents: 20000 },
    ]);
  });

  it("excludes variable commitments — they have no single monthly amount", () => {
    const commitments = [
      makeCommitment({ name: "Rent", type: "fixed", amountCents: 150000 }),
      makeCommitment({ name: "Groceries budget", type: "variable", category: "Groceries", amountCents: 40000 }),
    ];
    const segments = buildDollarJobSegments(commitments, 0);
    expect(segments).toEqual([{ name: "Rent", amountCents: 150000 }]);
  });

  it("excludes removed commitments", () => {
    const commitments = [
      makeCommitment({ name: "Old subscription", removedAt: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(buildDollarJobSegments(commitments, 0)).toEqual([]);
  });

  it("omits the Free segment when available is zero or negative", () => {
    const commitments = [makeCommitment({})];
    expect(buildDollarJobSegments(commitments, 0)).toEqual([{ name: "Rent", amountCents: 150000 }]);
    expect(buildDollarJobSegments(commitments, -500)).toEqual([{ name: "Rent", amountCents: 150000 }]);
  });

  it("returns an empty list when there's nothing protected and nothing free", () => {
    expect(buildDollarJobSegments([], 0)).toEqual([]);
  });
});

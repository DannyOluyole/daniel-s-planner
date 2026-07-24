import { MoneyState, SpendingDecision } from "@domain/entities/MoneyState";
import { SavingsGoal } from "@domain/entities/SavingsGoal";
import { Commitment } from "@domain/entities/Commitment";
import { Income } from "@domain/entities/Income";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const initialMoneyState: MoneyState = {
  availableCents: 41200,
  protectedCents: 58800,
  futureYouCents: 15000,
  asOf: new Date().toISOString(),
};

export const initialSavingsGoals: SavingsGoal[] = [
  {
    id: "local-goal",
    userId: "local-demo-user",
    name: "Cushion",
    targetCents: 30000,
    createdAt: daysAgo(30),
  },
];

// Sums to 58800 cents — matches initialMoneyState.protectedCents so the
// demo's numbers agree with each other before any edits. Once the local
// repository derives protectedCents from this list, that's no longer a
// coincidence to maintain by hand — see LocalCheckpointRepository.
export const initialCommitments: Commitment[] = [
  {
    id: "local-commitment-rent",
    userId: "local-demo-user",
    name: "Rent share",
    type: "fixed",
    amountCents: 30000,
    createdAt: daysAgo(30),
  },
  {
    id: "local-commitment-phone",
    userId: "local-demo-user",
    name: "Phone bill",
    type: "fixed",
    amountCents: 6000,
    createdAt: daysAgo(30),
  },
  {
    id: "local-commitment-groceries",
    userId: "local-demo-user",
    name: "Groceries budget",
    type: "variable",
    category: "Groceries",
    amountCents: 15000,
    createdAt: daysAgo(30),
  },
  {
    id: "local-commitment-dining",
    userId: "local-demo-user",
    name: "Dining budget",
    type: "variable",
    category: "Dining",
    amountCents: 7800,
    createdAt: daysAgo(30),
  },
];

export const initialIncome: Income[] = [
  {
    id: "local-income-paycheck",
    userId: "local-demo-user",
    name: "Paycheck",
    amountCents: 240000,
    createdAt: daysAgo(30),
  },
];

export const initialDecisions: SpendingDecision[] = [
  {
    id: "local-seed-1",
    amountCents: 11800,
    merchant: "Groceries",
    category: "Groceries",
    outcome: "continued",
    pauseDurationMs: 2400,
    decidedAt: daysAgo(1),
  },
  {
    id: "local-seed-2",
    amountCents: 1500,
    merchant: "Netflix",
    category: "Entertainment",
    outcome: "continued",
    pauseDurationMs: 2300,
    decidedAt: daysAgo(3),
  },
  {
    id: "local-seed-3",
    amountCents: 6000,
    merchant: "Gas station",
    category: "Transport",
    outcome: "continued",
    pauseDurationMs: 2500,
    decidedAt: daysAgo(5),
  },
  {
    id: "local-seed-4",
    amountCents: 8500,
    merchant: "New sneakers",
    category: "Shopping",
    outcome: "reconsidered",
    pauseDurationMs: 3100,
    decidedAt: daysAgo(6),
  },
  {
    id: "local-seed-5",
    amountCents: 3500,
    merchant: "Coffee run",
    category: "Dining",
    outcome: "continued",
    pauseDurationMs: 2200,
    decidedAt: daysAgo(8),
  },
];

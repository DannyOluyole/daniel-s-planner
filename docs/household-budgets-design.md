# Household / Shared Budgets — Design Only

**Status: not built.** This document exists to scope the work before it's attempted, not to
describe something in the codebase today. It was written after the user explicitly chose
"design only, no implementation this round" over building an MVP, given that this is a real
security/data-model change, not a UI addition — a second person gaining access to someone's
income, spending decisions, and goals deserves its own dedicated planning and implementation
pass, not something rushed alongside a batch of smaller features.

## Why this is sized differently from every other feature in this batch

Every one of the app's 9 user-data tables (`money_states`, `spending_decisions`,
`savings_goals`, `plaid_items`, `commitments`, `income`, `plaid_transactions`,
`watched_places`, `future_visions`) enforces exactly one Row Level Security policy, and it's
always the same shape:

```sql
create policy "own <table>" on <table>
  for all using (auth.uid() = user_id);
```

There is no membership/household indirection anywhere in the schema. Every table's ownership
model is a direct, 1:1 `user_id` column checked against `auth.uid()`. That means "household
budgets" isn't an additive feature — it requires deciding, per table, whether to rewrite its
RLS policy to check household membership instead of (or in addition to) direct ownership, and
building the membership infrastructure that check depends on.

## Proposed schema

```sql
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households not null,
  user_id uuid references auth.users not null,
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

alter table households enable row level security;
alter table household_members enable row level security;

create policy "members can see their household" on households
  for select using (
    exists (select 1 from household_members m where m.household_id = id and m.user_id = auth.uid())
  );

create policy "members can see their membership rows" on household_members
  for select using (auth.uid() = user_id or household_id in (
    select household_id from household_members where user_id = auth.uid()
  ));
```

## Which existing tables become shared vs. stay personal

This is a **product decision**, flagged here rather than silently assumed, because it changes
what a household member can actually see about their partner:

- **Likely shared**: `commitments`, `income` — a household's bills and paychecks are the
  natural shared surface; this is what "budgeting together" usually means.
- **Likely stays personal**: `spending_decisions` (an individual behavior log — pausing,
  reconsidering, regret-marking is personal reflection, not something to share by default),
  `future_visions` (a personal aspiration, explicitly framed as "what does financial freedom
  look like to *you*" in the app's own copy).
- **Needs a decision either way**: `savings_goals` (could go either way — a shared "Trip to
  Japan" goal is a genuinely common use case, but a personal "just for me" goal shouldn't be
  forced into visibility), `money_states`/`plaid_items`/`plaid_transactions` (sharing a bank
  balance is a much bigger trust step than sharing bills — likely needs its own explicit
  opt-in separate from joining a household at all).

None of this should be assumed before building — confirm with the user which tables shift
before writing the RLS rewrite.

## RLS rework approach

For each table that becomes shared, the existing policy:

```sql
for all using (auth.uid() = user_id)
```

becomes something like:

```sql
for all using (
  auth.uid() = user_id
  or user_id in (
    select m2.user_id from household_members m1
    join household_members m2 on m1.household_id = m2.household_id
    where m1.user_id = auth.uid()
  )
)
```

i.e. "it's mine, or it belongs to someone in my household." This needs to be written and
tested per table, not as one blanket change — `commitments` and `income` might get this
treatment while `spending_decisions` keeps its current owner-only policy unchanged.

## Invite flow (rough sketch, not final)

1. User A creates a household (or the app auto-creates one on first invite sent).
2. User A generates an invite — simplest version is a short code or link, not a full email
   invite system, to keep v1 scoped.
3. User B enters the code, which inserts a `household_members` row for them.
4. Both users' relevant screens (Home, Future You, wherever shared commitments/income show up)
   need a household-vs-personal toggle or a merged view — another real UI decision, not just a
   backend one.
5. Leaving/removing a member: delete the `household_members` row; their own data reverts to
   being visible only to them (the RLS policy above naturally handles this — no membership row
   means no shared access).

## What this needs before it's built

- Explicit confirmation from the user on which tables shift to shared, per the "likely
  shared/personal/needs a decision" breakdown above.
- A real RLS rewrite plan reviewed table-by-table, not applied in one pass — a mistake here
  leaks one person's financial data to someone who shouldn't see it, which is a much worse
  failure mode than a UI bug.
- UI work for the invite flow and the shared/personal view toggle, which doesn't exist in any
  form today.
- Its own dedicated implementation session — this is explicitly out of scope for the current
  feature batch.

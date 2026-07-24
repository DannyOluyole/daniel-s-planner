-- Core Checkpoint schema: MoneyState snapshots + decision log.
-- Paste into the Supabase SQL editor for a fresh project.

create table money_states (
  user_id uuid references auth.users not null,
  available_cents integer not null,
  protected_cents integer not null,
  future_you_cents integer not null,
  as_of timestamptz not null default now(),
  primary key (user_id, as_of)
);

create table spending_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount_cents integer not null,
  merchant text not null,
  category text,
  outcome text not null check (outcome in ('continued', 'paused', 'reconsidered')),
  pause_duration_ms integer not null,
  decided_at timestamptz not null default now()
);

alter table money_states enable row level security;
alter table spending_decisions enable row level security;

create policy "own money state" on money_states
  for select using (auth.uid() = user_id);

create policy "own money state insert" on money_states
  for insert with check (auth.uid() = user_id);

create policy "own decisions" on spending_decisions
  for all using (auth.uid() = user_id);

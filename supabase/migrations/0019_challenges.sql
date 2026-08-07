-- Opt-in savings challenges (v1: "no_spend_week" only). Progress is derived
-- live from spending_decisions, same as the Weeks Protected streak — this
-- table only records that a challenge was started, not its outcome.

create table challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null default 'no_spend_week',
  starts_at date not null,
  ends_at date not null,
  created_at timestamptz not null default now(),
  removed_at timestamptz
);

alter table challenges enable row level security;

create policy "own challenges" on challenges
  for all using (auth.uid() = user_id);

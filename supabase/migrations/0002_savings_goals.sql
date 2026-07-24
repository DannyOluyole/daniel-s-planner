-- Savings goal: what the Wall checks a purchase against to decide whether
-- it dips into savings, not just whether it clears Available.

create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  name text not null,
  target_cents integer not null,
  target_date date,
  created_at timestamptz not null default now()
);

alter table savings_goals enable row level security;

create policy "own savings goal" on savings_goals
  for all using (auth.uid() = user_id);

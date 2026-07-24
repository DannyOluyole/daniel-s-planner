-- Income: recurring monthly income lines. Sits opposite commitments — in
-- local/demo mode, Available is derived as Income minus Protected minus
-- what's already been spent this month. A real bank connection instead
-- gets Available from the synced balance, independent of this table.

create table income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

alter table income enable row level security;

create policy "own income" on income
  for all using (auth.uid() = user_id);

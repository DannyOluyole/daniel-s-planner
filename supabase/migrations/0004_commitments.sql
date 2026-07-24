-- Commitments: the user's own fixed bills, variable-category budgets, and
-- debt payments. Together these are what "Protected" itemizes, and what the
-- Wall checks a new purchase's category against, in addition to the
-- savings goal.

create table commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text not null check (type in ('fixed', 'variable', 'debt')),
  category text,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

alter table commitments enable row level security;

create policy "own commitments" on commitments
  for all using (auth.uid() = user_id);

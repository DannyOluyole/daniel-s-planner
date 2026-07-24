-- The "Future Self" concept: a short, free-text answer to "what does
-- financial freedom look like to you?" captured once during onboarding
-- (editable later from Future You), referenced back in Decision Mode's
-- narrative so a purchase reads against a real personal reason, not just a
-- dollar figure. Deliberately separate from savings_goals — this is an
-- open-ended aspiration, not a named target with a dollar amount.
create table future_visions (
  user_id uuid primary key references auth.users not null,
  text text not null,
  created_at timestamptz not null default now()
);

alter table future_visions enable row level security;

create policy "own future vision" on future_visions
  for all using (auth.uid() = user_id);

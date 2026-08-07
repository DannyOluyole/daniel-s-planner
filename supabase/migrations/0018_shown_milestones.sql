-- Tracks which one-time celebratory milestones a user has already been
-- shown, so a milestone never re-fires after being seen once (including
-- across reinstalls/devices, which is why this isn't AsyncStorage).

create table shown_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  milestone_key text not null,
  shown_at timestamptz not null default now(),
  unique (user_id, milestone_key)
);

alter table shown_milestones enable row level security;

create policy "own shown milestones" on shown_milestones
  for all using (auth.uid() = user_id);

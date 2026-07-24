-- Places a user has manually marked as worth a quiet check-in near — a
-- mall, a usual coffee shop. Location is only ever the device's own
-- coordinates at the moment the user added the place, never fetched from
-- any external directory.

create table watched_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null default 150,
  created_at timestamptz not null default now()
);

alter table watched_places enable row level security;

create policy "own watched places" on watched_places
  for all using (auth.uid() = user_id);

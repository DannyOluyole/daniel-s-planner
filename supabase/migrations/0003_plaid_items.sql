-- Bank connection status (Plaid). Access tokens are written only by Edge
-- Functions using the service-role key, which bypasses RLS entirely — this
-- policy only governs normal client reads of connection status.

create table plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  item_id text not null,
  access_token text not null,
  status text not null default 'linked' check (status in ('linked', 'error')),
  created_at timestamptz not null default now()
);

alter table plaid_items enable row level security;

create policy "own connection status" on plaid_items
  for select using (auth.uid() = user_id);

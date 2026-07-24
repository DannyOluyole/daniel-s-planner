-- Real transaction history from Plaid, synced incrementally via
-- /transactions/sync. The cursor lives on plaid_items so each item resumes
-- from where it left off instead of re-fetching everything each sync.

alter table plaid_items add column cursor text;

create table plaid_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plaid_item_id uuid references plaid_items not null,
  transaction_id text not null unique,
  account_id text not null,
  amount_cents integer not null,
  merchant_name text not null,
  category text,
  pending boolean not null default false,
  transacted_at date not null,
  created_at timestamptz not null default now()
);

alter table plaid_transactions enable row level security;

create policy "own transactions" on plaid_transactions
  for select using (auth.uid() = user_id);

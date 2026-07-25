-- Security fix: RLS is row-level, not column-level. The old "own connection
-- status" policy on plaid_items (auth.uid() = user_id) was meant to let a
-- user see their own connection status — but since it applied to the whole
-- row, it also let a user's own authenticated client select access_token
-- directly, a long-lived bearer credential to their real bank data that
-- should never reach any client at all. Moving it into its own table with
-- no client grants closes that off entirely; only service-role (used
-- exclusively by Edge Functions) can ever read it.

create table plaid_item_secrets (
  plaid_item_id uuid primary key references plaid_items on delete cascade,
  access_token text not null
);

insert into plaid_item_secrets (plaid_item_id, access_token)
select id, access_token from plaid_items;

alter table plaid_items drop column access_token;

alter table plaid_item_secrets enable row level security;
-- Deliberately no policies — RLS with zero policies denies every row to
-- anon/authenticated. The revoke below is belt-and-suspenders in case
-- Supabase's default per-schema grants ever change.
revoke all on plaid_item_secrets from anon, authenticated;

-- Also allow "unlinked" as a real, storable status (see plaid-unlink
-- function) rather than only ever representing it as "no row exists".
alter table plaid_items drop constraint plaid_items_status_check;
alter table plaid_items add constraint plaid_items_status_check
  check (status in ('linked', 'error', 'unlinked'));

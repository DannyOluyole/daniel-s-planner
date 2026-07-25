-- Account deletion: every table referencing auth.users (and, transitively,
-- plaid_transactions -> plaid_items) needs ON DELETE CASCADE so that
-- deleting the Supabase auth user is enough to remove everything else — the
-- app never has to remember to clean up each table by hand, and can't leave
-- orphaned rows behind if it forgets one. plaid_item_secrets already
-- cascades from plaid_items (see migration 0014).

alter table money_states drop constraint money_states_user_id_fkey;
alter table money_states add constraint money_states_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table spending_decisions drop constraint spending_decisions_user_id_fkey;
alter table spending_decisions add constraint spending_decisions_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table savings_goals drop constraint savings_goals_user_id_fkey;
alter table savings_goals add constraint savings_goals_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table plaid_items drop constraint plaid_items_user_id_fkey;
alter table plaid_items add constraint plaid_items_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table commitments drop constraint commitments_user_id_fkey;
alter table commitments add constraint commitments_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table income drop constraint income_user_id_fkey;
alter table income add constraint income_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table plaid_transactions drop constraint plaid_transactions_user_id_fkey;
alter table plaid_transactions add constraint plaid_transactions_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table plaid_transactions drop constraint plaid_transactions_plaid_item_id_fkey;
alter table plaid_transactions add constraint plaid_transactions_plaid_item_id_fkey
  foreign key (plaid_item_id) references plaid_items on delete cascade;

alter table watched_places drop constraint watched_places_user_id_fkey;
alter table watched_places add constraint watched_places_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

alter table future_visions drop constraint future_visions_user_id_fkey;
alter table future_visions add constraint future_visions_user_id_fkey
  foreign key (user_id) references auth.users on delete cascade;

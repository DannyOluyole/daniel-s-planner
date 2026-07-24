-- Multiple concurrent savings goals per user, instead of exactly one.
-- Soft-deleted like commitments/income (removed_at, not a hard delete) so
-- a goal that was active in the past isn't erased from history.

alter table savings_goals drop constraint if exists savings_goals_user_id_key;
alter table savings_goals add column if not exists removed_at timestamptz;

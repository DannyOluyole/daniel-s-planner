-- Optional day-of-month scheduling for income and commitments — the
-- Financial Timeline needs to know WHEN in the month each recurring item
-- actually lands to project a real day-by-day sequence, not just a monthly
-- total. Null means "unscheduled" (treated as day 1 for projection
-- purposes) so existing rows keep working without requiring a backfill.

alter table income add column day_of_month integer check (day_of_month between 1 and 31);
alter table commitments add column day_of_month integer check (day_of_month between 1 and 31);

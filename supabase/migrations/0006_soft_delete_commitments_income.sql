-- Commitments and income are soft-deleted from here on: removing one sets
-- removed_at instead of deleting the row. A past month where the item was
-- genuinely active shouldn't lose it just because it was removed later —
-- Home uses created_at/removed_at to work out what was active in whichever
-- month it's showing. See @domain/money/activeDuringMonth.

alter table commitments add column removed_at timestamptz;
alter table income add column removed_at timestamptz;

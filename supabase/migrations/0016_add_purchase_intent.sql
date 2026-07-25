-- The user's own stated reason for a purchase ("Intent Before Amount"),
-- captured before the amount in NewDecisionScreen — distinct from the
-- category-grouping intent (Investing in myself / Lifestyle /
-- Responsibilities) computed client-side, which never touches this column.
alter table spending_decisions add column intent text
  check (intent in ('Need', 'Want', 'Gift', 'Work', 'Replacement', 'Celebration'));

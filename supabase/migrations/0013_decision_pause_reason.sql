-- Decision Journal: an optional reason for pausing or reconsidering a
-- purchase, captured right after the decision so it's never a chore.
alter table spending_decisions add column pause_reason text;

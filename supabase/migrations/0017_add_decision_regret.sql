-- "Decision Memory" — lets the user mark a past continued purchase as
-- regretted after the fact, so Decision Mode can gently surface it next
-- time a similar purchase comes up (see findRegrettedPurchaseWarning).
alter table spending_decisions add column regretted boolean not null default false;

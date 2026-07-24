-- Monthly-only day-of-month recurrence silently mis-modeled anyone paid
-- biweekly or weekly (a huge share of real paychecks) — the Financial
-- Timeline had no way to represent "every other Friday" at all. Defaults to
-- 'monthly' so every existing row keeps its current day-of-month behavior
-- unchanged.
alter table income add column if not exists frequency text not null default 'monthly'
  check (frequency in ('monthly', 'biweekly', 'weekly'));
alter table income add column if not exists anchor_date date;

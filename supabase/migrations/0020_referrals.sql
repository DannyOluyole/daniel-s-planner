-- Referral loop: every user gets a stable short code; redeeming someone
-- else's code records the link and banks a Premium-days reward for both
-- sides. Premium itself isn't built yet (see monetization tiers), so these
-- rewards sit banked until it ships — this table is the ledger that makes
-- that honest ("you'll have it when Premium launches") rather than a
-- promise with nothing behind it.
--
-- No insert/update policies on any of these three tables — codes are
-- generated and rewards are granted only by the referral-ensure-code and
-- referral-redeem edge functions (service role), so a client can never
-- mint itself free reward rows or forge someone else's referral.

create table referral_codes (
  user_id uuid primary key references auth.users on delete cascade,
  code text unique not null,
  created_at timestamptz not null default now()
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references auth.users on delete cascade not null,
  -- unique: a user can be referred at most once, ever.
  referred_id uuid references auth.users on delete cascade not null unique,
  code text not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create table referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  referral_id uuid references referrals on delete cascade not null,
  premium_days integer not null default 30,
  created_at timestamptz not null default now()
);

alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table referral_rewards enable row level security;

create policy "own referral code" on referral_codes
  for select using (auth.uid() = user_id);

create policy "own referrals sent" on referrals
  for select using (auth.uid() = referrer_id);

create policy "own referral rewards" on referral_rewards
  for select using (auth.uid() = user_id);

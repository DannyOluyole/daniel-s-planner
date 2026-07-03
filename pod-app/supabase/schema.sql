-- Pod core-loop schema (v1: auth, pods, manual meal logging, feed, streaks).
-- Run this once against a fresh Supabase project (SQL Editor -> paste -> Run).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / CREATE OR REPLACE).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, created by the handle_new_user trigger.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#FF5C5C',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- New auth.users row -> auto-create a matching profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- pods
-- ---------------------------------------------------------------------------
create table if not exists public.pods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.pods enable row level security;

-- ---------------------------------------------------------------------------
-- pod_members (max 8 per pod, enforced by trigger)
-- ---------------------------------------------------------------------------
create table if not exists public.pod_members (
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);

alter table public.pod_members enable row level security;

create or replace function public.is_pod_member(p_pod_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pod_members
    where pod_id = p_pod_id and user_id = p_user_id
  );
$$;

-- profiles policy lives here (not up with the rest of the profiles block)
-- because it depends on is_pod_member(), which needs pod_members to exist.
drop policy if exists "profiles_select_podmates" on public.profiles;
create policy "profiles_select_podmates" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.pod_members pm
      where pm.user_id = auth.uid() and public.is_pod_member(pm.pod_id, profiles.id)
    )
  );

create or replace function public.enforce_pod_size()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.pod_members where pod_id = new.pod_id) >= 8 then
    raise exception 'Pod is full (8 member max)';
  end if;
  return new;
end;
$$;

drop trigger if exists check_pod_size on public.pod_members;
create trigger check_pod_size
  before insert on public.pod_members
  for each row execute function public.enforce_pod_size();

drop policy if exists "pods_select_members" on public.pods;
create policy "pods_select_members" on public.pods
  for select using (public.is_pod_member(id, auth.uid()));

drop policy if exists "pods_insert_any_authed" on public.pods;
create policy "pods_insert_any_authed" on public.pods
  for insert with check (created_by = auth.uid());

drop policy if exists "pod_members_select_podmates" on public.pod_members;
create policy "pod_members_select_podmates" on public.pod_members
  for select using (public.is_pod_member(pod_id, auth.uid()));

-- A user can only add THEMSELVES to a pod (join flow); pod creation also
-- inserts the creator as the first member via this same policy.
drop policy if exists "pod_members_insert_self" on public.pod_members;
create policy "pod_members_insert_self" on public.pod_members
  for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- meal_logs
-- ---------------------------------------------------------------------------
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  photo_url text,
  caption text,
  shared_to_pod boolean not null default true,
  logged_at timestamptz not null default now()
);

create index if not exists meal_logs_pod_logged_at_idx on public.meal_logs (pod_id, logged_at desc);
create index if not exists meal_logs_user_logged_at_idx on public.meal_logs (user_id, logged_at desc);

alter table public.meal_logs enable row level security;

drop policy if exists "meal_logs_select_podmates" on public.meal_logs;
create policy "meal_logs_select_podmates" on public.meal_logs
  for select using (public.is_pod_member(pod_id, auth.uid()));

drop policy if exists "meal_logs_insert_self" on public.meal_logs;
create policy "meal_logs_insert_self" on public.meal_logs
  for insert with check (user_id = auth.uid() and public.is_pod_member(pod_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- reactions (one reaction per user per meal; re-inserting changes the emoji)
-- ---------------------------------------------------------------------------
create table if not exists public.reactions (
  meal_log_id uuid not null references public.meal_logs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (meal_log_id, user_id)
);

alter table public.reactions enable row level security;

drop policy if exists "reactions_select_podmates" on public.reactions;
create policy "reactions_select_podmates" on public.reactions
  for select using (
    exists (
      select 1 from public.meal_logs m
      where m.id = reactions.meal_log_id and public.is_pod_member(m.pod_id, auth.uid())
    )
  );

drop policy if exists "reactions_upsert_self" on public.reactions;
create policy "reactions_upsert_self" on public.reactions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.meal_logs m
      where m.id = reactions.meal_log_id and public.is_pod_member(m.pod_id, auth.uid())
    )
  );

drop policy if exists "reactions_update_self" on public.reactions;
create policy "reactions_update_self" on public.reactions
  for update using (user_id = auth.uid());

drop policy if exists "reactions_delete_self" on public.reactions;
create policy "reactions_delete_self" on public.reactions
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: meal photos bucket (public read, authed write to own folder).
-- Run once; Supabase Storage buckets aren't part of the SQL schema per se,
-- but this is idempotent via ON CONFLICT.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

drop policy if exists "meal_photos_public_read" on storage.objects;
create policy "meal_photos_public_read" on storage.objects
  for select using (bucket_id = 'meal-photos');

drop policy if exists "meal_photos_authed_upload" on storage.objects;
create policy "meal_photos_authed_upload" on storage.objects
  for insert with check (bucket_id = 'meal-photos' and auth.role() = 'authenticated');

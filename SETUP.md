-- ============================================================
-- FamilyNest — Supabase Database Setup
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. FAMILIES
create table if not exists families (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  name            text not null,
  city            text,
  monthly_income  numeric default 0,
  monthly_expenses numeric default 0,
  savings         numeric default 0,
  debts           numeric default 0,
  insurance       numeric default 0,
  age             int default 30,
  points          int default 0,
  badges          text[] default '{}',
  invite_code     text unique
);

-- 2. MEMBERS
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  name        text not null,
  emoji       text default '👤'
);

-- 3. USER PROFILES  (links auth.users → families)
create table if not exists user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),
  family_id     uuid references families(id) on delete set null,
  display_name  text,
  role          text default 'member'   -- 'admin' | 'member'
);

-- 4. EXPENSES
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  label       text not null,
  amount      numeric not null,
  cat         text default '🛒',
  who         text,
  date        timestamptz default now()
);

-- 5. GOALS
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  title       text not null,
  emoji       text default '🎯',
  target      numeric not null,
  saved       numeric default 0,
  color       text default '#6B8EAD'
);

-- 6. EVENTS
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  title       text not null,
  date        date not null,
  emoji       text default '📅'
);

-- 7. GROCERIES
create table if not exists groceries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  name        text not null,
  done        boolean default false
);

-- 8. BILLS
create table if not exists bills (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  label       text not null,
  amount      numeric not null,
  due_date    date,
  icon        text default '📄',
  paid        boolean default false
);

-- 9. PROVIDERS  (service providers: maid, dhobi, etc.)
create table if not exists providers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  name        text not null,
  type        text not null,
  emoji       text default '🔧',
  rate        numeric not null,
  unit        text default 'visit',
  notes       text,
  active      boolean default true
);

-- 10. PROVIDER LOGS  (daily attendance)
create table if not exists provider_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  provider_id uuid references providers(id) on delete cascade,
  log_date    date not null default current_date,
  amount      numeric default 0,
  note        text
);

-- 11. MEMORIES
create table if not exists memories (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  title       text not null,
  description text,
  date        date,
  emoji       text default '📸',
  privacy     text default 'family'   -- 'private' | 'summary' | 'family'
);

-- 12. PHOTO JOURNEY
create table if not exists photo_journey (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  title       text not null,
  year        int not null,
  chapter     text not null,   -- childhood | school | college | work | wedding | parenthood | home | travel | milestones
  caption     text,
  emoji       text default '⭐'
);

-- 13. SUGGESTIONS
create table if not exists suggestions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  family_id   uuid references families(id) on delete cascade,
  content     text not null,
  category    text,
  read        boolean default false
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Rule: a user can only access rows whose family_id matches
--       the family_id stored in their user_profiles row.
-- ============================================================

-- Helper function (avoids a subquery in every policy)
create or replace function my_family_id()
returns uuid language sql stable
as $$
  select family_id from user_profiles where id = auth.uid()
$$;

-- Enable RLS on every table
alter table families       enable row level security;
alter table members        enable row level security;
alter table user_profiles  enable row level security;
alter table expenses       enable row level security;
alter table goals          enable row level security;
alter table events         enable row level security;
alter table groceries      enable row level security;
alter table bills          enable row level security;
alter table providers      enable row level security;
alter table provider_logs  enable row level security;
alter table memories       enable row level security;
alter table photo_journey  enable row level security;
alter table suggestions    enable row level security;

-- FAMILIES — can read/update own family
create policy "family members can read their family"
  on families for select using (id = my_family_id());
create policy "family members can update their family"
  on families for update using (id = my_family_id());
create policy "anyone can insert a family (signup)"
  on families for insert with check (true);

-- USER_PROFILES — own row only
create policy "users can read own profile"
  on user_profiles for select using (id = auth.uid());
create policy "users can insert own profile"
  on user_profiles for insert with check (id = auth.uid());
create policy "users can update own profile"
  on user_profiles for update using (id = auth.uid());

-- Generic family-scoped policies for all other tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'members','expenses','goals','events','groceries','bills',
    'providers','provider_logs','memories','photo_journey','suggestions'
  ] loop
    execute format(
      'create policy "family read %1$s"   on %1$s for select using  (family_id = my_family_id());
       create policy "family insert %1$s" on %1$s for insert with check (family_id = my_family_id());
       create policy "family update %1$s" on %1$s for update using  (family_id = my_family_id());
       create policy "family delete %1$s" on %1$s for delete using  (family_id = my_family_id());',
      t
    );
  end loop;
end $$;

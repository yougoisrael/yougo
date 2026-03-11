-- ════════════════════════════════════════════════════════════════
--  Yougo — Complete Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

-- ── Enable UUID ─────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ════════════════════════════════════════════════════════════════
--  1. USERS
-- ════════════════════════════════════════════════════════════════
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  phone       text unique not null,
  email       text,
  city        text,
  street      text,
  active      boolean default true,
  orders_count int default 0,
  total_spent  numeric(10,2) default 0,
  created_at  timestamptz default now()
);

-- Row Level Security
alter table users enable row level security;
-- Users can read/update only their own row
create policy "Users: own row" on users
  for all using (auth.uid() = id);
-- Admin can read all
create policy "Admin: all users" on users
  for all using (auth.email() = current_setting('app.admin_email', true));

-- ════════════════════════════════════════════════════════════════
--  2. RESTAURANTS
-- ════════════════════════════════════════════════════════════════
create table if not exists restaurants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  category    text,
  location    text,
  phone       text,
  hours       text,
  rating      numeric(2,1) default 5.0,
  reviews     int default 0,
  orders_count int default 0,
  revenue     numeric(12,2) default 0,
  delivery_fee int default 10,
  min_order   int default 30,
  delivery_time int default 25,
  active      boolean default true,
  verified    boolean default false,
  logo_emoji  text default '🍴',
  cover_color text default '#C8102E',
  created_at  timestamptz default now()
);

-- Public can read active restaurants
alter table restaurants enable row level security;
create policy "Public: read active restaurants" on restaurants
  for select using (active = true);
create policy "Admin: all restaurants" on restaurants
  for all using (auth.email() = current_setting('app.admin_email', true));

-- ════════════════════════════════════════════════════════════════
--  3. MENU ITEMS
-- ════════════════════════════════════════════════════════════════
create table if not exists menu_items (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(8,2) not null,
  category      text,
  is_hot        boolean default false,
  available     boolean default true,
  sort_order    int default 0,
  created_at    timestamptz default now()
);

alter table menu_items enable row level security;
create policy "Public: read menu" on menu_items for select using (available = true);
create policy "Admin: all menu" on menu_items for all using (auth.email() = current_setting('app.admin_email', true));

-- ════════════════════════════════════════════════════════════════
--  4. ORDERS
-- ════════════════════════════════════════════════════════════════
create type order_status as enum (
  'جديد', 'قيد التحضير', 'في الطريق', 'مكتمل', 'ملغي'
);

create type payment_method as enum ('كاش', 'بطاقة', 'Apple Pay');

create table if not exists orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references users(id),
  restaurant_id   uuid references restaurants(id),
  restaurant_name text,
  customer_name   text,
  customer_phone  text,
  address         text,
  items           jsonb not null,     -- [{name, qty, price}]
  subtotal        numeric(10,2),
  delivery_fee    numeric(6,2) default 10,
  total           numeric(10,2),
  status          order_status default 'جديد',
  payment_method  payment_method default 'كاش',
  notes           text,
  driver_id       uuid,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$
language plpgsql;

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

-- RLS
alter table orders enable row level security;
create policy "Users: own orders" on orders
  for select using (user_id = auth.uid());
create policy "Users: insert order" on orders
  for insert with check (user_id = auth.uid());
create policy "Admin: all orders" on orders
  for all using (auth.email() = current_setting('app.admin_email', true));

-- ════════════════════════════════════════════════════════════════
--  5. DRIVERS
-- ════════════════════════════════════════════════════════════════
create table if not exists drivers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  phone       text unique,
  vehicle     text,
  active      boolean default true,
  lat         numeric(10,8),
  lng         numeric(11,8),
  last_seen   timestamptz,
  created_at  timestamptz default now()
);

alter table drivers enable row level security;
create policy "Admin: all drivers" on drivers
  for all using (auth.email() = current_setting('app.admin_email', true));

-- ════════════════════════════════════════════════════════════════
--  6. SETTINGS
-- ════════════════════════════════════════════════════════════════
create table if not exists settings (
  key   text primary key,
  value text
);

insert into settings values
  ('delivery_fee',  '10'),
  ('min_order',     '40'),
  ('free_at',       '150'),
  ('commission',    '15'),
  ('app_name',      'Yougo'),
  ('maintenance',   'false'),
  ('new_user_bonus','true')
on conflict (key) do nothing;

alter table settings enable row level security;
create policy "Admin: settings" on settings
  for all using (auth.email() = current_setting('app.admin_email', true));

-- ════════════════════════════════════════════════════════════════
--  7. BANNERS
-- ════════════════════════════════════════════════════════════════
create table if not exists banners (
  id         uuid primary key default uuid_generate_v4(),
  title      text,
  subtitle   text,
  tag        text,
  bg_color   text default '#C8102E',
  active     boolean default true,
  sort_order int default 0
);

alter table banners enable row level security;
create policy "Public: read banners" on banners for select using (active = true);
create policy "Admin: all banners" on banners for all using (auth.email() = current_setting('app.admin_email', true));

-- ════════════════════════════════════════════════════════════════
--  8. Enable Realtime on orders table
-- ════════════════════════════════════════════════════════════════
-- Run in Supabase Dashboard: Database → Replication → Tables
-- Enable: orders, restaurants, drivers

-- ════════════════════════════════════════════════════════════════
--  HOW TO USE:
--  1. Go to Supabase Dashboard → SQL Editor
--  2. Paste everything above and click "Run"
--  3. Go to Auth → Users → Add your admin user
--     Email: admin@yougo.app | Password: your_strong_password
--  4. Copy your Project URL and anon key to .env
--  5. That's it! 🎉
-- ════════════════════════════════════════════════════════════════

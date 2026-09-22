create extension if not exists pgcrypto;

create table if not exists public.settings (
  id text primary key default 'shop',
  shop_name text not null,
  whatsapp_number text not null,
  address text,
  delivery_fee numeric default 0 check (delivery_fee >= 0),
  min_order_free_delivery numeric default 0 check (min_order_free_delivery >= 0),
  updated_at timestamptz default now()
);

create table if not exists public.catalogue (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric not null check (price >= 0),
  unit text not null,
  available boolean default true,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  items jsonb not null,
  fulfillment text not null check (fulfillment in ('delivery','pickup')),
  address text,
  notes text,
  subtotal numeric not null check (subtotal >= 0),
  delivery_fee numeric default 0 check (delivery_fee >= 0),
  total numeric not null check (total >= 0),
  status text default 'new' check (status in ('new','confirmed','preparing','ready','delivered','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.settings
(id, shop_name, whatsapp_number, address, delivery_fee, min_order_free_delivery)
values ('shop','My Store','919876543210','Update shop address',30,500)
on conflict (id) do nothing;

alter table public.settings enable row level security;
alter table public.catalogue enable row level security;
alter table public.orders enable row level security;

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);

drop policy if exists "public read catalogue" on public.catalogue;
create policy "public read catalogue" on public.catalogue for select using (true);

drop policy if exists "auth write settings" on public.settings;
create policy "auth write settings" on public.settings for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "auth write catalogue" on public.catalogue;
create policy "auth write catalogue" on public.catalogue for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- No public SELECT policy on orders. This protects customer PII.
drop policy if exists "public read orders" on public.orders;
drop policy if exists "public create orders" on public.orders;

drop policy if exists "auth read orders" on public.orders;
create policy "auth read orders" on public.orders for select
using (auth.role() = 'authenticated');

drop policy if exists "auth update orders" on public.orders;
create policy "auth update orders" on public.orders for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "auth delete orders" on public.orders;
create policy "auth delete orders" on public.orders for delete
using (auth.role() = 'authenticated');

insert into public.catalogue (name, category, price, unit, note)
select * from (values
 ('Fresh Milk','Dairy',60::numeric,'litre','Fresh daily'),
 ('Brown Bread','Bakery',55::numeric,'pack','Whole wheat'),
 ('Eggs','Dairy',70::numeric,'6 pcs','Farm fresh'),
 ('Apples','Fruits',180::numeric,'kg','Fresh apples'),
 ('Bananas','Fruits',60::numeric,'dozen','Ripe bananas'),
 ('Tomatoes','Vegetables',45::numeric,'kg','Fresh tomatoes')
) as x(name,category,price,unit,note)
where not exists (select 1 from public.catalogue);

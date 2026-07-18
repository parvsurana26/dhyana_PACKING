create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.brands (name)
values
  ('DHYANA'),
  ('OM PARAS CHALNI'),
  ('OM PARAS GALNI'),
  ('AMBRISH'),
  ('KOMAL'),
  ('MAZDA'),
  ('TORAL'),
  ('KAVERI')
on conflict (name) do nothing;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  item_name text not null,
  size text not null,
  rate numeric(12,2) not null default 0,
  qty_type text not null check (qty_type in ('Pcs', 'Set', 'Kg', 'Doz', 'Box')),
  discount numeric(5,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  transport text,
  phone text,
  location text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.party_brand_discounts (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  discount numeric(5,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (party_id, brand_id)
);

create table if not exists public.packing_slips (
  id uuid primary key default gen_random_uuid(),
  slip_no text not null unique,
  party_id uuid references public.parties(id) on delete set null,
  party_name text not null,
  transport text,
  phone text,
  location text,
  slip_date date not null default current_date,
  bundle_count numeric(12,2) not null default 0,
  remark text,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  packaging_charges numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  status text not null default 'Draft' check (status in ('Draft', 'Completed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.packing_slips
  add column if not exists party_id uuid references public.parties(id) on delete set null;

alter table public.packing_slips
  add column if not exists bundle_count numeric(12,2) not null default 0;

alter table public.packing_slips
  add column if not exists packaging_charges numeric(12,2) not null default 0;

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  packing_slip_id uuid not null references public.packing_slips(id) on delete cascade,
  brand_id uuid references public.brands(id),
  product_id uuid references public.products(id) on delete set null,
  brand_name text,
  item_name text,
  size text,
  qty numeric(12,2) not null default 0,
  qty_type text not null check (qty_type in ('Pcs', 'Set', 'Kg', 'Doz', 'Box')),
  rate numeric(12,2) not null default 0,
  discount numeric(5,2) not null default 0,
  amount numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.packing_items
  add column if not exists sort_order integer not null default 0;

alter table public.brands enable row level security;
alter table public.parties enable row level security;
alter table public.party_brand_discounts enable row level security;
alter table public.products enable row level security;
alter table public.packing_slips enable row level security;
alter table public.packing_items enable row level security;

create policy "Authenticated users can manage brands" on public.brands
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage parties" on public.parties
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage party brand discounts" on public.party_brand_discounts
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage products" on public.products
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage slips" on public.packing_slips
  for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage packing items" on public.packing_items
  for all to authenticated using (true) with check (true);

alter table public.products drop constraint if exists products_qty_type_check;
alter table public.products add constraint products_qty_type_check
  check (qty_type in ('Pcs', 'Set', 'Kg', 'Doz', 'Box'));

alter table public.packing_items drop constraint if exists packing_items_qty_type_check;
alter table public.packing_items add constraint packing_items_qty_type_check
  check (qty_type in ('Pcs', 'Set', 'Kg', 'Doz', 'Box'));

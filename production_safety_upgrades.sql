-- Production safety upgrades for packing slips and product master.
-- Run this in Supabase SQL Editor.

alter table public.packing_slips
  add column if not exists bundle_count numeric(12,2) not null default 0;

alter table public.packing_slips
  add column if not exists packaging_charges numeric(12,2) not null default 0;

-- Preserve the product snapshot on packing_items when a master product is deleted.
alter table public.packing_items drop constraint if exists packing_items_product_id_fkey;
alter table public.packing_items
  add constraint packing_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

-- Keep packing-slip rows in the exact order entered by the user.
alter table public.packing_items
  add column if not exists sort_order integer not null default 0;

with numbered_items as (
  select id,
         row_number() over (
           partition by packing_slip_id
           order by created_at, id
         ) - 1 as position
  from public.packing_items
)
update public.packing_items item
set sort_order = numbered_items.position
from numbered_items
where item.id = numbered_items.id
  and item.sort_order = 0;

-- Safety net for older clients/functions: assign the next position when every
-- inserted row arrives with the default position of zero.
create or replace function public.ensure_packing_item_sort_order()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.sort_order is null or (
    new.sort_order = 0 and exists (
      select 1 from public.packing_items
      where packing_slip_id = new.packing_slip_id
    )
  ) then
    select coalesce(max(sort_order), -1) + 1
      into new.sort_order
    from public.packing_items
    where packing_slip_id = new.packing_slip_id;
  end if;
  return new;
end;
$$;

drop trigger if exists packing_items_sort_order_trigger on public.packing_items;
create trigger packing_items_sort_order_trigger
before insert on public.packing_items
for each row execute function public.ensure_packing_item_sort_order();

-- 1) Database-controlled simple slip numbers: 1, 2, 3...
create sequence if not exists public.packing_slip_no_seq;

do $$
declare
  max_slip_no bigint;
begin
  select coalesce(max((regexp_match(slip_no, '(\d+)$'))[1]::bigint), 0)
    into max_slip_no
  from public.packing_slips
  where slip_no ~ '\d+$';

  if max_slip_no > 0 then
    perform setval('public.packing_slip_no_seq', max_slip_no, true);
  end if;
end $$;

create or replace function public.next_packing_slip_no()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return nextval('public.packing_slip_no_seq')::text;
end;
$$;

grant execute on function public.next_packing_slip_no() to authenticated;

-- 2) Atomic save: packing slip header and item rows are saved in one transaction.
create or replace function public.save_packing_slip(
  p_slip jsonb,
  p_items jsonb
)
returns public.packing_slips
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_slip public.packing_slips%rowtype;
  target_slip_id uuid;
  target_slip_no text;
begin
  target_slip_id := nullif(p_slip->>'id', '')::uuid;
  target_slip_no := nullif(trim(coalesce(p_slip->>'slip_no', '')), '');

  if target_slip_no is null then
    target_slip_no := public.next_packing_slip_no();
  end if;

  if target_slip_id is null then
    insert into public.packing_slips (
      slip_no,
      party_id,
      party_name,
      transport,
      phone,
      location,
      slip_date,
      bundle_count,
      packaging_charges,
      remark,
      subtotal,
      discount_total,
      grand_total,
      status,
      created_by
    )
    values (
      target_slip_no,
      nullif(p_slip->>'party_id', '')::uuid,
      coalesce(p_slip->>'party_name', ''),
      nullif(p_slip->>'transport', ''),
      nullif(p_slip->>'phone', ''),
      nullif(p_slip->>'location', ''),
      coalesce(nullif(p_slip->>'slip_date', '')::date, current_date),
      coalesce((p_slip->>'bundle_count')::numeric, 0),
      coalesce((p_slip->>'packaging_charges')::numeric, 0),
      nullif(p_slip->>'remark', ''),
      coalesce((p_slip->>'subtotal')::numeric, 0),
      coalesce((p_slip->>'discount_total')::numeric, 0),
      coalesce((p_slip->>'grand_total')::numeric, 0),
      coalesce(nullif(p_slip->>'status', ''), 'Draft'),
      auth.uid()
    )
    returning * into saved_slip;
  else
    update public.packing_slips
    set slip_no = target_slip_no,
        party_id = nullif(p_slip->>'party_id', '')::uuid,
        party_name = coalesce(p_slip->>'party_name', ''),
        transport = nullif(p_slip->>'transport', ''),
        phone = nullif(p_slip->>'phone', ''),
        location = nullif(p_slip->>'location', ''),
        slip_date = coalesce(nullif(p_slip->>'slip_date', '')::date, current_date),
        bundle_count = coalesce((p_slip->>'bundle_count')::numeric, 0),
        packaging_charges = coalesce((p_slip->>'packaging_charges')::numeric, 0),
        remark = nullif(p_slip->>'remark', ''),
        subtotal = coalesce((p_slip->>'subtotal')::numeric, 0),
        discount_total = coalesce((p_slip->>'discount_total')::numeric, 0),
        grand_total = coalesce((p_slip->>'grand_total')::numeric, 0),
        status = coalesce(nullif(p_slip->>'status', ''), 'Draft')
    where id = target_slip_id
    returning * into saved_slip;

    if not found then
      raise exception 'Packing slip % was not found', target_slip_id;
    end if;

    delete from public.packing_items
    where packing_slip_id = target_slip_id;
  end if;

  insert into public.packing_items (
    packing_slip_id,
    brand_id,
    product_id,
    brand_name,
    item_name,
    size,
    qty,
    qty_type,
    rate,
    discount,
    amount,
    sort_order
  )
  select
    saved_slip.id,
    nullif(item.brand_id, '')::uuid,
    nullif(item.product_id, '')::uuid,
    nullif(item.brand_name, ''),
    nullif(item.item_name, ''),
    nullif(item.size, ''),
    coalesce(item.qty, 0),
    coalesce(nullif(item.qty_type, ''), 'Pcs'),
    coalesce(item.rate, 0),
    coalesce(item.discount, 0),
    coalesce(item.amount, 0),
    coalesce(item.sort_order, 0)
  from jsonb_to_recordset(p_items) as item(
    brand_id text,
    product_id text,
    brand_name text,
    item_name text,
    size text,
    qty numeric,
    qty_type text,
    rate numeric,
    discount numeric,
    amount numeric,
    sort_order integer
  )
  where nullif(item.product_id, '') is not null
    and coalesce(item.qty, 0) > 0;

  return saved_slip;
end;
$$;

grant execute on function public.save_packing_slip(jsonb, jsonb) to authenticated;

-- 3) Duplicate checks before adding strict unique indexes.
-- If these queries return rows, merge/delete duplicates before creating the indexes below.
select 'duplicate brands' as check_name, upper(trim(name)) as normalized_name, count(*)
from public.brands
group by upper(trim(name))
having count(*) > 1;

select
  'duplicate products' as check_name,
  brand_id,
  upper(trim(item_name)) as item_name,
  upper(trim(size)) as size,
  upper(trim(qty_type)) as qty_type,
  count(*)
from public.products
group by brand_id, upper(trim(item_name)), upper(trim(size)), upper(trim(qty_type))
having count(*) > 1;

-- Uncomment these after duplicate checks return no rows.
-- create unique index if not exists brands_name_normalized_unique
--   on public.brands (upper(trim(name)));
--
-- create unique index if not exists products_brand_item_size_type_unique
--   on public.products (brand_id, upper(trim(item_name)), upper(trim(size)), upper(trim(qty_type)));

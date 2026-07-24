create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text not null unique,
  po_date date not null default current_date,
  party_id uuid references public.parties(id) on delete set null,
  supplier_name text not null,
  supplier_phone text,
  payment_terms text,
  delivery_within text,
  delivery_at text not null default 'VASAI (Godown)',
  delivery_contact text not null default 'Darshit Gandhi - 9769158284',
  remark text,
  subtotal numeric(12,2) not null default 0,
  status text not null default 'Saved' check (status in ('Saved', 'Sent')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchase_orders
  add column if not exists party_id uuid references public.parties(id) on delete set null;

alter table public.purchase_orders drop constraint if exists purchase_orders_status_check;
update public.purchase_orders set status = 'Saved' where status = 'Draft';
alter table public.purchase_orders alter column status set default 'Saved';
alter table public.purchase_orders add constraint purchase_orders_status_check
  check (status in ('Saved', 'Sent'));

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  item_remark text,
  size text,
  qty numeric(12,2) not null default 0,
  qty_type text not null default 'Pcs',
  rate numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.purchase_order_items
  add column if not exists item_remark text;

create index if not exists purchase_orders_date_idx
  on public.purchase_orders (po_date desc, created_at desc);

create index if not exists purchase_order_items_order_idx
  on public.purchase_order_items (purchase_order_id, sort_order);

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

drop policy if exists "Authenticated users can manage purchase orders" on public.purchase_orders;
create policy "Authenticated users can manage purchase orders" on public.purchase_orders
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage purchase order items" on public.purchase_order_items;
create policy "Authenticated users can manage purchase order items" on public.purchase_order_items
  for all to authenticated using (true) with check (true);

create or replace function public.touch_purchase_order_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists purchase_orders_updated_at_trigger on public.purchase_orders;
create trigger purchase_orders_updated_at_trigger
before update on public.purchase_orders
for each row execute function public.touch_purchase_order_updated_at();

create or replace function public.save_purchase_order(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  v_order_id := nullif(p_order->>'id', '')::uuid;

  if v_order_id is null then
    insert into public.purchase_orders (
      po_no,
      po_date,
      party_id,
      supplier_name,
      supplier_phone,
      payment_terms,
      delivery_within,
      delivery_at,
      delivery_contact,
      remark,
      subtotal,
      status,
      created_by
    )
    values (
      p_order->>'po_no',
      coalesce(nullif(p_order->>'po_date', '')::date, current_date),
      nullif(p_order->>'party_id', '')::uuid,
      p_order->>'supplier_name',
      p_order->>'supplier_phone',
      p_order->>'payment_terms',
      p_order->>'delivery_within',
      coalesce(nullif(p_order->>'delivery_at', ''), 'VASAI (Godown)'),
      coalesce(nullif(p_order->>'delivery_contact', ''), 'Darshit Gandhi - 9769158284'),
      p_order->>'remark',
      coalesce((p_order->>'subtotal')::numeric, 0),
      coalesce(nullif(p_order->>'status', ''), 'Saved'),
      nullif(p_order->>'created_by', '')::uuid
    )
    returning id into v_order_id;
  else
    update public.purchase_orders
    set
      po_no = p_order->>'po_no',
      po_date = coalesce(nullif(p_order->>'po_date', '')::date, current_date),
      party_id = nullif(p_order->>'party_id', '')::uuid,
      supplier_name = p_order->>'supplier_name',
      supplier_phone = p_order->>'supplier_phone',
      payment_terms = p_order->>'payment_terms',
      delivery_within = p_order->>'delivery_within',
      delivery_at = p_order->>'delivery_at',
      delivery_contact = p_order->>'delivery_contact',
      remark = p_order->>'remark',
      subtotal = coalesce((p_order->>'subtotal')::numeric, 0),
      status = coalesce(nullif(p_order->>'status', ''), 'Saved')
    where id = v_order_id;

    if not found then
      raise exception 'Purchase order not found';
    end if;

    delete from public.purchase_order_items where purchase_order_id = v_order_id;
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.purchase_order_items (
      purchase_order_id,
      product_id,
      product_name,
      item_remark,
      size,
      qty,
      qty_type,
      rate,
      amount,
      sort_order
    )
    values (
      v_order_id,
      nullif(v_item->>'product_id', '')::uuid,
      v_item->>'product_name',
      v_item->>'item_remark',
      v_item->>'size',
      coalesce((v_item->>'qty')::numeric, 0),
      coalesce(nullif(v_item->>'qty_type', ''), 'Pcs'),
      coalesce((v_item->>'rate')::numeric, 0),
      coalesce((v_item->>'amount')::numeric, 0),
      coalesce((v_item->>'sort_order')::integer, 0)
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.save_purchase_order(jsonb, jsonb) to authenticated;

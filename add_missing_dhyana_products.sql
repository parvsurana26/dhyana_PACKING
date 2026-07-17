-- Add missing DHYANA products.
-- Run this in Supabase SQL Editor.

insert into public.brands (name)
values ('DHYANA')
on conflict (name) do nothing;

with brand_row as (
  select id from public.brands where name = 'DHYANA'
), seed(item_name, size, rate, qty_type) as (
  values
    ('SS MESHER (OVAL/ROUND/SQUARE)', '3', 92.00, 'Pcs'),
    ('SS MESHER (ROUND)', '4', 190.00, 'Pcs'),
    ('WH MESHER (OVAL/ROUND/SQUARE)', '3', 88.00, 'Pcs'),
    ('WH MESHER (ROUND)', '4', 180.00, 'Pcs'),
    ('SS BOTTLE', 'LEO', 170.00, 'Pcs'),
    ('SS BOTTLE', 'WAVE', 170.00, 'Pcs'),
    ('SS BOTTLE', 'CUBIX', 170.00, 'Pcs')
), updated as (
  update public.products p
  set rate = seed.rate,
      is_active = true
  from seed, brand_row
  where p.brand_id = brand_row.id
    and upper(trim(p.item_name)) = upper(trim(seed.item_name))
    and upper(trim(p.size)) = upper(trim(seed.size))
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
  returning p.id
)
insert into public.products (brand_id, item_name, size, rate, qty_type, is_active)
select brand_row.id, seed.item_name, seed.size, seed.rate, seed.qty_type, true
from seed
cross join brand_row
where not exists (
  select 1
  from public.products p
  where p.brand_id = brand_row.id
    and upper(trim(p.item_name)) = upper(trim(seed.item_name))
    and upper(trim(p.size)) = upper(trim(seed.size))
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
);

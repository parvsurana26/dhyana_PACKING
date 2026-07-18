-- Seed DHYANA New Arrivals products from NEW ARRIVALS MASTER MRP.xlsx
-- Rows: 21
-- Rate uses the RATE column from the workbook (not MRP).

insert into public.brands (name)
values ('DHYANA')
on conflict (name) do nothing;

with dhyana_brand as (
  select id from public.brands where name = 'DHYANA'
), seed(item_name, size, rate, qty_type) as (
  values
    ('TRIMEX PLAIN', '2 PCS SET', 315.00, 'Set'),
    ('TRIMEX SIDE SEE THROUGH', '2 PCS SET', 400.00, 'Set'),
    ('TRIMEX TOP SEE THROUGH', '2 PCS SET', 380.00, 'Set'),
    ('TRIMEX HAMMER', '2 PCS SET', 355.00, 'Set'),
    ('TIPSY BLACK', '2 PCS SET', 430.00, 'Set'),
    ('TIPSY WHITE', '2 PCS SET', 430.00, 'Set'),
    ('TIPSY DESIGN', '2 PCS SET', 430.00, 'Set'),
    ('TIPSY BLOOM', '2 PCS SET', 430.00, 'Set'),
    ('TRIMEX PLAIN', '3PCS SET', 570.00, 'Set'),
    ('SIDE SEE THROUGH', '3PCS SET', 715.00, 'Set'),
    ('TRIMEX TOP SEE THROUGH', '3PCS SET', 665.00, 'Set'),
    ('TRIMEX HAMMER', '3PCS SET', 625.00, 'Set'),
    ('PLAIN-7 X9', '3PCS SET', 395.00, 'Set'),
    ('TOP SEE THROUGH-7X9', '3PCS SET', 465.00, 'Set'),
    ('SIDE SEE THROUGH-7X9', '3PCS SET', 530.00, 'Set'),
    ('APPLE-7X9', '3PCS SET', 395.00, 'Set'),
    ('DIAMOND-7X9', '3PCS SET', 450.00, 'Set'),
    ('BLACK DESIGN (7 X 9)', '3 PCS SET', 520.00, 'Set'),
    ('BLACK APPLE (7 X 9)', '3 PCS SET', 520.00, 'Set'),
    ('WHITE TCS (7 X 9)', '3 PCS SET', 520.00, 'Set'),
    ('BLACK TCS (7 X 9)', '3 PCS SET', 520.00, 'Set')
), updated as (
  update public.products p
  set rate = seed.rate,
      is_active = true
  from seed, dhyana_brand
  where p.brand_id = dhyana_brand.id
    and upper(trim(p.item_name)) = upper(trim(seed.item_name))
    and regexp_replace(upper(trim(p.size)), '\s+', '', 'g') = regexp_replace(upper(trim(seed.size)), '\s+', '', 'g')
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
  returning p.id
)
insert into public.products (brand_id, item_name, size, rate, qty_type, is_active)
select dhyana_brand.id, seed.item_name, seed.size, seed.rate, seed.qty_type, true
from seed
cross join dhyana_brand
where not exists (
  select 1
  from public.products p
  where p.brand_id = dhyana_brand.id
    and upper(trim(p.item_name)) = upper(trim(seed.item_name))
    and regexp_replace(upper(trim(p.size)), '\s+', '', 'g') = regexp_replace(upper(trim(seed.size)), '\s+', '', 'g')
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
);

-- Verification: these are the final RATE values now stored in Supabase.
select p.item_name, p.size, p.rate, p.qty_type
from public.products p
join public.brands b on b.id = p.brand_id
where upper(trim(b.name)) = 'DHYANA'
  and upper(trim(p.item_name)) in (
    'TRIMEX PLAIN',
    'TRIMEX SIDE SEE THROUGH',
    'TRIMEX TOP SEE THROUGH',
    'TRIMEX HAMMER',
    'TIPSY BLACK',
    'TIPSY WHITE',
    'TIPSY DESIGN',
    'TIPSY BLOOM',
    'SIDE SEE THROUGH',
    'PLAIN-7 X9',
    'TOP SEE THROUGH-7X9',
    'SIDE SEE THROUGH-7X9',
    'APPLE-7X9',
    'DIAMOND-7X9',
    'BLACK DESIGN (7 X 9)',
    'BLACK APPLE (7 X 9)',
    'WHITE TCS (7 X 9)',
    'BLACK TCS (7 X 9)'
  )
order by p.item_name, p.size;

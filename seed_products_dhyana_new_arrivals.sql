-- Seed DHYANA New Arrivals products from NEW ARRIVALS MASTER MRP.xlsx
-- Rows: 21
-- Rate uses the rounded MRP column from the workbook.

insert into public.brands (name)
values ('DHYANA')
on conflict (name) do nothing;

with dhyana_brand as (
  select id from public.brands where name = 'DHYANA'
), seed(item_name, size, rate, qty_type) as (
  values
    ('TRIMEX PLAIN', '2 PCS SET', 710.00, 'Set'),
    ('TRIMEX SIDE SEE THROUGH', '2 PCS SET', 900.00, 'Set'),
    ('TRIMEX TOP SEE THROUGH', '2 PCS SET', 855.00, 'Set'),
    ('TRIMEX HAMMER', '2 PCS SET', 800.00, 'Set'),
    ('TIPSY BLACK', '2 PCS SET', 970.00, 'Set'),
    ('TIPSY WHITE', '2 PCS SET', 970.00, 'Set'),
    ('TIPSY DESIGN', '2 PCS SET', 970.00, 'Set'),
    ('TIPSY BLOOM', '2 PCS SET', 970.00, 'Set'),
    ('TRIMEX PLAIN', '3PCS SET', 1285.00, 'Set'),
    ('SIDE SEE THROUGH', '3PCS SET', 1610.00, 'Set'),
    ('TRIMEX TOP SEE THROUGH', '3PCS SET', 1500.00, 'Set'),
    ('TRIMEX HAMMER', '3PCS SET', 1410.00, 'Set'),
    ('PLAIN-7 X9', '3PCS SET', 890.00, 'Set'),
    ('TOP SEE THROUGH-7X9', '3PCS SET', 1050.00, 'Set'),
    ('SIDE SEE THROUGH-7X9', '3PCS SET', 1195.00, 'Set'),
    ('APPLE-7X9', '3PCS SET', 890.00, 'Set'),
    ('DIAMOND-7X9', '3PCS SET', 1015.00, 'Set'),
    ('BLACK DESIGN (7 X 9)', '3 PCS SET', 1170.00, 'Set'),
    ('BLACK APPLE (7 X 9)', '3 PCS SET', 1170.00, 'Set'),
    ('WHITE TCS (7 X 9)', '3 PCS SET', 1170.00, 'Set'),
    ('BLACK TCS (7 X 9)', '3 PCS SET', 1170.00, 'Set')
), updated as (
  update public.products p
  set rate = seed.rate,
      is_active = true
  from seed, dhyana_brand
  where p.brand_id = dhyana_brand.id
    and upper(trim(p.item_name)) = upper(trim(seed.item_name))
    and upper(trim(p.size)) = upper(trim(seed.size))
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
    and upper(trim(p.size)) = upper(trim(seed.size))
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
);

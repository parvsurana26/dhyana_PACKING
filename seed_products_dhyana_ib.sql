-- Seed DHYANA IB products from IB MRP MASTER.xlsx
-- Rows: 28
-- Rate uses the size-wise MRP column from the workbook.

insert into public.brands (name)
values ('DHYANA')
on conflict (name) do nothing;

with dhyana_brand as (
  select id from public.brands where name = 'DHYANA'
), seed(item_name, size, rate, qty_type) as (
  values
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '9', 500.00, 'Kg'),
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '10', 575.00, 'Kg'),
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '11', 685.00, 'Kg'),
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '12', 745.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '11', 645.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '12', 775.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '13', 890.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '14', 990.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '15', 1110.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '16', 1325.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '17', 1505.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '10', 480.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '11', 540.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '12', 655.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '13', 785.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '14', 925.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '15', 1015.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '16', 1180.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '17', 1375.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '18', 1565.00, 'Kg'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '1', 825.00, 'Pcs'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '2', 1015.00, 'Pcs'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '3', 1240.00, 'Pcs'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '4', 1485.00, 'Pcs'),
    ('S/S Capsulated (IB) Kadai With Lid (BOX PACKING)', '12', 1070.00, 'Pcs'),
    ('S/S Capsulated (IB) Kadai With Lid (BOX PACKING)', '13', 1205.00, 'Pcs'),
    ('S/S Capsulated (IB) Tope With Lid (BOX PACKING)', '3 PCS SET (10 X 12)', 2140.00, 'Set'),
    ('S/S Capsulated (IB) Tope With Lid (BOX PACKING)', '5 PCS SET (10 X 14)', 4165.00, 'Set')
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

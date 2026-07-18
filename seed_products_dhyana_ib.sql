-- Seed DHYANA IB products from IB MRP MASTER.xlsx
-- Rows: 28
-- Rate uses the RATE /KG or RATE column from IB MRP MASTER.xlsx.

insert into public.brands (name)
values ('DHYANA')
on conflict (name) do nothing;

with dhyana_brand as (
  select id from public.brands where name = 'DHYANA'
), seed(item_name, size, rate, qty_type) as (
  values
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '9', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '10', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '11', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Saucepan With S.S Wire Handle', '12', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '11', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '12', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '13', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '14', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '15', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '16', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Kadai', '17', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '10', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '11', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '12', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '13', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '14', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '15', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '16', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '17', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Tope', '18', 530.00, 'Kg'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '1', 365.00, 'Pcs'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '2', 450.00, 'Pcs'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '3', 550.00, 'Pcs'),
    ('S/S Capsulated (IB) Belly Casserole With Glass Lid (Multi Color Box Packing)', '4', 660.00, 'Pcs'),
    ('S/S Capsulated (IB) Kadai With Lid (BOX PACKING)', '12', 475.00, 'Pcs'),
    ('S/S Capsulated (IB) Kadai With Lid (BOX PACKING)', '13', 535.00, 'Pcs'),
    ('S/S Capsulated (IB) Tope With Lid (BOX PACKING)', '3 PCS SET (10 X 12)', 950.00, 'Set'),
    ('S/S Capsulated (IB) Tope With Lid (BOX PACKING)', '5 PCS SET (10 X 14)', 1850.00, 'Set')
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

-- Verification: final DHYANA IB RATE values stored in Supabase.
select p.item_name, p.size, p.rate, p.qty_type
from public.products p
join public.brands b on b.id = p.brand_id
where upper(trim(b.name)) = 'DHYANA'
  and upper(p.item_name) like 'S/S CAPSULATED (IB)%'
order by p.item_name, p.size;

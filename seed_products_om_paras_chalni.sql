-- Seed OM PARAS CHALNI products from Om Paras PRICE LIST Feb 26.xlsx
-- Source sheets: Table 1
-- Rows: 62

insert into public.brands (name)
values ('OM PARAS CHALNI')
on conflict (name) do nothing;

with brand_row as (
  select id from public.brands where name = 'OM PARAS CHALNI'
), seed(item_name, size, rate, qty_type) as (
  values
    ('FIX CHALNI ATTA / MAIDA', '16 BOX', 810.00, 'Pcs'),
    ('FIX CHALNI ATTA / MAIDA', '16 REGULAR', 760.00, 'Pcs'),
    ('FIX CHALNI ATTA / MAIDA', '18 BOX', 920.00, 'Pcs'),
    ('FIX CHALNI ATTA / MAIDA', '18 REGULAR', 845.00, 'Pcs'),
    ('FIX CHALNI ATTA / MAIDA', '20 BOX', 1065.00, 'Pcs'),
    ('FIX CHALNI ATTA / MAIDA', '20 REGULAR', 950.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '5', 120.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '6', 130.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '7', 190.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '8', 200.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '9', 230.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '10', 290.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '11', 335.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '12', 405.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '13', 465.00, 'Pcs'),
    ('FIX CHALNI ATTA OR MAIDA', '14', 515.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '10', 305.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '11', 350.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '12', 415.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '13', 475.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '14', 545.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '16', 795.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '18', 880.00, 'Pcs'),
    ('FIX CHALNI BAJRI', '20', 1085.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '10', 425.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '11', 450.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '12', 495.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '13', 545.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '14', 615.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '16', 805.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '18', 925.00, 'Pcs'),
    ('FIX CHALNI CHANNA', '20', 1105.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '10', 280.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '11', 335.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '12', 400.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '13', 475.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '14', 515.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '16', 785.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '18', 870.00, 'Pcs'),
    ('FIX CHALNI WHEAT / RICE', '20', 1075.00, 'Pcs'),
    ('FOLDING CHALNI 2 JALI', '8', 350.00, 'Pcs'),
    ('FOLDING CHALNI 2 JALI', '9', 400.00, 'Pcs'),
    ('FOLDING CHALNI 2 JALI', '10', 450.00, 'Pcs'),
    ('FOLDING CHALNI 2 JALI', '11', 530.00, 'Pcs'),
    ('FOLDING CHALNI 2 JALI', '12', 595.00, 'Pcs'),
    ('FOLDING CHALNI 3 JALI', '8', 390.00, 'Pcs'),
    ('FOLDING CHALNI 3 JALI', '9', 435.00, 'Pcs'),
    ('FOLDING CHALNI 3 JALI', '10', 515.00, 'Pcs'),
    ('FOLDING CHALNI 3 JALI', '11', 600.00, 'Pcs'),
    ('FOLDING CHALNI 3 JALI', '12', 700.00, 'Pcs'),
    ('FOLDING CHALNI 4 JALI', '8', 430.00, 'Pcs'),
    ('FOLDING CHALNI 4 JALI', '9', 500.00, 'Pcs'),
    ('FOLDING CHALNI 4 JALI', '10', 595.00, 'Pcs'),
    ('FOLDING CHALNI 4 JALI', '11', 705.00, 'Pcs'),
    ('FOLDING CHALNI 4 JALI', '12', 815.00, 'Pcs'),
    ('NET COVER', '6', 105.00, 'Pcs'),
    ('NET COVER', '7', 125.00, 'Pcs'),
    ('NET COVER', '8', 140.00, 'Pcs'),
    ('NET COVER', '9', 155.00, 'Pcs'),
    ('NET COVER', '10', 180.00, 'Pcs'),
    ('NET COVER', '11', 205.00, 'Pcs'),
    ('NET COVER', '12', 230.00, 'Pcs')
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

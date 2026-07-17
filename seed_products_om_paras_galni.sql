-- Seed OM PARAS GALNI products from Om Paras PRICE LIST Feb 26.xlsx
-- Source sheets: Table 2, Table 3, Table 4, Table 5
-- Rows: 112

insert into public.brands (name)
values ('OM PARAS GALNI')
on conflict (name) do nothing;

with brand_row as (
  select id from public.brands where name = 'OM PARAS GALNI'
), seed(item_name, size, rate, qty_type) as (
  values
    ('DEEP FRYIER', '2', 205.00, 'Pcs'),
    ('DEEP FRYIER', '3', 220.00, 'Pcs'),
    ('DEEP FRYIER', '4', 275.00, 'Pcs'),
    ('DEEP FRYIER', '5', 310.00, 'Pcs'),
    ('DOME COVER', '7', 220.00, 'Pcs'),
    ('DOME COVER', '8', 265.00, 'Pcs'),
    ('DOME COVER', '9', 315.00, 'Pcs'),
    ('DOME COVER', '10', 370.00, 'Pcs'),
    ('DOME COVER', '11', 440.00, 'Pcs'),
    ('DOME COVER', '12', 480.00, 'Pcs'),
    ('FLAT BASKET( MULTIPURPOSE USE)', '5', 175.00, 'Pcs'),
    ('FLAT BASKET( MULTIPURPOSE USE)', '6', 225.00, 'Pcs'),
    ('FLAT BASKET( MULTIPURPOSE USE)', '7', 250.00, 'Pcs'),
    ('FLAT BASKET( MULTIPURPOSE USE)', '8', 285.00, 'Pcs'),
    ('FLAT BASKET( MULTIPURPOSE USE)', '9', 315.00, 'Pcs'),
    ('FLAT BASKET( MULTIPURPOSE USE)', '10', 370.00, 'Pcs'),
    ('FRIDGE BASKET', '9', 380.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '4', 205.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '5', 240.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '6', 275.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '7', 325.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '8', 380.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '9', 440.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '10', 495.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '11', 560.00, 'Pcs'),
    ('HEAVY HANDLE JUICE & SOUP STRAINERS', '12', 620.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '4', 230.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '5', 265.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '6', 315.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '7', 380.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '8', 445.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '9', 510.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '10', 600.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '11', 680.00, 'Pcs'),
    ('HEAVY HANDLE MILK & COFFEE STRAINERS', '12', 755.00, 'Pcs'),
    ('LIGHT JUICE STRAINER', '4', 115.00, 'Pcs'),
    ('LIGHT JUICE STRAINER', '5', 135.00, 'Pcs'),
    ('LIGHT JUICE STRAINER', '6', 155.00, 'Pcs'),
    ('LIGHT JUICE STRAINER', '7', 175.00, 'Pcs'),
    ('LIGHT JUICE STRAINER', '8', 205.00, 'Pcs'),
    ('LIGHT SERIES BASKET', '8', 255.00, 'Pcs'),
    ('LIGHT SERIES BASKET', '9', 285.00, 'Pcs'),
    ('LIGHT SERIES BASKET', '10', 320.00, 'Pcs'),
    ('LITTI CHOKHA', '8', 260.00, 'Pcs'),
    ('LITTI CHOKHA', '9', 290.00, 'Pcs'),
    ('LITTI CHOKHA', '10', 315.00, 'Pcs'),
    ('MULTIPURPOSE TRAY', 'SMALL', 250.00, 'Pcs'),
    ('PAPAD JALI (ROASTER)', '7', 205.00, 'Pcs'),
    ('PAPAD JALI (ROASTER)', '8', 230.00, 'Pcs'),
    ('PAPAD JALI (ROASTER)', '9', 265.00, 'Pcs'),
    ('PAPAD JALI (ROASTER)', '10', 295.00, 'Pcs'),
    ('PURAN CHALNI', '7', 195.00, 'Pcs'),
    ('PURAN CHALNI', '8', 215.00, 'Pcs'),
    ('PURAN CHALNI', '9', 245.00, 'Pcs'),
    ('PURAN CHALNI', '10', 285.00, 'Pcs'),
    ('PURAN CHALNI', '11', 325.00, 'Pcs'),
    ('PURAN CHALNI', '12', 350.00, 'Pcs'),
    ('ROTI BASKET', '8', 260.00, 'Pcs'),
    ('ROTI BASKET', '9', 290.00, 'Pcs'),
    ('ROTI BASKET', '10', 320.00, 'Pcs'),
    ('ROUND BASKET WITH LID', '7', 505.00, 'Pcs'),
    ('ROUND BASKET WITH LID', '8', 585.00, 'Pcs'),
    ('ROUND BASKET WITH LID', '9', 665.00, 'Pcs'),
    ('ROUND BASKET WITH LID', '10', 780.00, 'Pcs'),
    ('ROUND BASKET WITH LID', '11', 850.00, 'Pcs'),
    ('ROUND BASKET WITH LID', '12', 945.00, 'Pcs'),
    ('ROUND BASKET(MUTIPURPOSE)', '6', 230.00, 'Pcs'),
    ('ROUND BASKET(MUTIPURPOSE)', '7', 270.00, 'Pcs'),
    ('ROUND BASKET(MUTIPURPOSE)', '8', 315.00, 'Pcs'),
    ('ROUND BASKET(MUTIPURPOSE)', '9', 360.00, 'Pcs'),
    ('ROUND BASKET(MUTIPURPOSE)', '10', 430.00, 'Pcs'),
    ('ROUND BASKET(MUTIPURPOSE)', '11', 470.00, 'Pcs'),
    ('ROUND BASKET(MUTIPURPOSE)', '12', 525.00, 'Pcs'),
    ('ROYAL HANDLE JHARA', '12', 180.00, 'Pcs'),
    ('ROYAL HANDLE JHARA', '14', 210.00, 'Pcs'),
    ('ROYAL HANDLE JHARA', '16', 245.00, 'Pcs'),
    ('S/S RING (3 PC SET)', 'BIG', 150.00, 'Set'),
    ('S/S RING (3 PC SET)', 'SMALL', 85.00, 'Set'),
    ('TEA & COFFEE STRAINER DOUBLE/J', '1', 730.00, 'Doz'),
    ('TEA & COFFEE STRAINER DOUBLE/J', '2', 810.00, 'Doz'),
    ('TEA & COFFEE STRAINER DOUBLE/J', '3', 910.00, 'Doz'),
    ('TEA & COFFEE STRAINER DOUBLE/J', '4', 1010.00, 'Doz'),
    ('TEA & COFFEE STRAINER SINGLE/J', '1', 620.00, 'Doz'),
    ('TEA & COFFEE STRAINER SINGLE/J', '2', 690.00, 'Doz'),
    ('TEA & COFFEE STRAINER SINGLE/J', '3', 745.00, 'Doz'),
    ('TEA & COFFEE STRAINER SINGLE/J', '4', 800.00, 'Doz'),
    ('TEA & COFFEE STRAINER SINGLE/J', '5', 1140.00, 'Doz'),
    ('TOPLI BASKET', '6', 175.00, 'Pcs'),
    ('TOPLI BASKET', '7', 210.00, 'Pcs'),
    ('TOPLI BASKET', '8', 265.00, 'Pcs'),
    ('TOPLI BASKET', '9', 300.00, 'Pcs'),
    ('TOPLI BASKET', '10', 335.00, 'Pcs'),
    ('WIRE HANDLE GHEE & OIL', '1', 165.00, 'Pcs'),
    ('WIRE HANDLE GHEE & OIL', '2', 185.00, 'Pcs'),
    ('WIRE HANDLE GHEE & OIL', '3', 210.00, 'Pcs'),
    ('WIRE HANDLE GHEE & OIL', '4', 245.00, 'Pcs'),
    ('WIRE HANDLE JUICE & SOUP STRAINERS', '1', 170.00, 'Pcs'),
    ('WIRE HANDLE JUICE & SOUP STRAINERS', '2', 180.00, 'Pcs'),
    ('WIRE HANDLE JUICE & SOUP STRAINERS', '3', 205.00, 'Pcs'),
    ('WIRE HANDLE JUICE & SOUP STRAINERS', '4', 245.00, 'Pcs'),
    ('WIRE HANDLE JUICE & SOUP STRAINERS', '5', 285.00, 'Pcs'),
    ('WIRE HANDLE JUICE & SOUP STRAINERS', '6', 355.00, 'Pcs'),
    ('WIRE HANDLE MILK & COFFEE STRAINERS', '1', 190.00, 'Pcs'),
    ('WIRE HANDLE MILK & COFFEE STRAINERS', '2', 205.00, 'Pcs'),
    ('WIRE HANDLE MILK & COFFEE STRAINERS', '3', 230.00, 'Pcs'),
    ('WIRE HANDLE MILK & COFFEE STRAINERS', '4', 285.00, 'Pcs'),
    ('WIRE HANDLE MILK & COFFEE STRAINERS', '5', 345.00, 'Pcs'),
    ('WIRE HANDLE MILK & COFFEE STRAINERS', '6', 430.00, 'Pcs'),
    ('WIRE HANDLE PURI JHARA', '1', 140.00, 'Pcs'),
    ('WIRE HANDLE PURI JHARA', '2', 155.00, 'Pcs'),
    ('WIRE HANDLE PURI JHARA', '3', 190.00, 'Pcs'),
    ('WIRE HANDLE PURI JHARA', '4', 205.00, 'Pcs')
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

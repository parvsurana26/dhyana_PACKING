-- Check whether the missing DHYANA products exist and are active.
-- Run this in Supabase SQL Editor.

select
  b.name as brand,
  p.item_name,
  p.size,
  p.rate,
  p.qty_type,
  p.is_active,
  p.created_at
from public.products p
join public.brands b on b.id = p.brand_id
where upper(trim(b.name)) = 'DHYANA'
  and (
    upper(p.item_name) like '%MESHER%'
    or upper(p.item_name) = 'SS BOTTLE'
  )
order by p.item_name, p.size;

-- If this returns more than one DHYANA-like brand, keep only the one you use in the app.
select id, name, created_at
from public.brands
where upper(trim(name)) like '%DHYANA%'
order by created_at;

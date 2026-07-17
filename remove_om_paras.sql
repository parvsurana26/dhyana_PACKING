-- Remove OM PARAS brand and all OM PARAS product master data.
-- Run this in Supabase SQL Editor.

with om_paras as (
  select id from public.brands where upper(trim(name)) = 'OM PARAS'
)
update public.packing_items
set brand_id = null,
    product_id = null
where brand_id in (select id from om_paras)
   or upper(trim(brand_name)) = 'OM PARAS';

with om_paras as (
  select id from public.brands where upper(trim(name)) = 'OM PARAS'
)
delete from public.party_brand_discounts
where brand_id in (select id from om_paras);

with om_paras as (
  select id from public.brands where upper(trim(name)) = 'OM PARAS'
)
delete from public.products
where brand_id in (select id from om_paras);

delete from public.brands
where upper(trim(name)) = 'OM PARAS';

-- Add editable packaging charges to saved packing slips.
-- Run this in Supabase SQL Editor before deploying the updated app.

alter table public.packing_slips
  add column if not exists packaging_charges numeric(12,2) not null default 0;

update public.packing_slips
set packaging_charges = coalesce(bundle_count, 0) * 350
where packaging_charges = 0
  and coalesce(bundle_count, 0) > 0;

-- Add paid field to order_items table
-- This allows marking individual items as paid when customers pay separately

alter table public.order_items
add column if not exists paid boolean default false;

-- Add comment to explain the field
comment on column public.order_items.paid is 'Indicates if this item has been paid separately';


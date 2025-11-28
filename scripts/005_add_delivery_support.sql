-- Add delivery support to orders table
alter table public.orders
  add column if not exists order_type text not null default 'dine-in' check (order_type in ('dine-in', 'delivery')),
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists delivery_address text,
  add column if not exists delivery_fee decimal(10, 2) default 0;

-- Update status check constraint to include delivery statuses
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check 
  check (status in ('pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));

-- Create index for order_type for better filtering
create index if not exists idx_orders_order_type on public.orders(order_type);

-- Update RLS policies to allow customers to create delivery orders
drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
  on public.orders for insert
  with check (true);

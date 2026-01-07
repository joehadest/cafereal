-- Add waiter_name column to orders table
alter table public.orders
  add column if not exists waiter_name text;


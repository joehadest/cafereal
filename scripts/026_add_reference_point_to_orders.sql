-- Add reference point column to orders table for delivery addresses
alter table public.orders
  add column if not exists reference_point text;


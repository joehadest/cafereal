-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  display_order integer default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  image_url text,
  active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create tables (restaurant tables/mesas)
create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  capacity integer not null,
  status text not null default 'available' check (status in ('available', 'occupied', 'reserved')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.restaurant_tables(id) on delete set null,
  table_number integer not null,
  status text not null default 'pending' check (status in ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  total decimal(10, 2) not null default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create order_items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_price decimal(10, 2) not null,
  quantity integer not null default 1,
  subtotal decimal(10, 2) not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create profiles table for admin users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'manager')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_orders_table_id on public.orders(table_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_restaurant_tables_status on public.restaurant_tables(status);

-- Enable Row Level Security
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.profiles enable row level security;

-- RLS Policies for categories (public read, admin write)
create policy "Anyone can view active categories"
  on public.categories for select
  using (active = true);

create policy "Authenticated users can manage categories"
  on public.categories for all
  using (auth.role() = 'authenticated');

-- RLS Policies for products (public read, admin write)
create policy "Anyone can view active products"
  on public.products for select
  using (active = true);

create policy "Authenticated users can manage products"
  on public.products for all
  using (auth.role() = 'authenticated');

-- RLS Policies for restaurant_tables (public read, admin write)
create policy "Anyone can view tables"
  on public.restaurant_tables for select
  using (true);

create policy "Authenticated users can manage tables"
  on public.restaurant_tables for all
  using (auth.role() = 'authenticated');

-- RLS Policies for orders (public insert, admin full access)
create policy "Anyone can create orders"
  on public.orders for insert
  with check (true);

create policy "Anyone can view orders"
  on public.orders for select
  using (true);

create policy "Authenticated users can manage orders"
  on public.orders for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete orders"
  on public.orders for delete
  using (auth.role() = 'authenticated');

-- RLS Policies for order_items (public insert, admin full access)
create policy "Anyone can create order items"
  on public.order_items for insert
  with check (true);

create policy "Anyone can view order items"
  on public.order_items for select
  using (true);

create policy "Authenticated users can manage order items"
  on public.order_items for all
  using (auth.role() = 'authenticated');

-- RLS Policies for profiles (users can view their own profile)
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Adicionar política para permitir INSERT de perfis durante sign-up
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_updated_at_categories
  before update on public.categories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_products
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_restaurant_tables
  before update on public.restaurant_tables
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_orders
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

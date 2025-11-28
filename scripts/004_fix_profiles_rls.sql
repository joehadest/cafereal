-- Fix RLS policy for profiles table to allow INSERT during signup
-- The trigger needs to be able to insert new profiles

-- Drop existing policies
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Recreate policies with INSERT permission
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow authenticated users to read all profiles (for admin purposes)
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

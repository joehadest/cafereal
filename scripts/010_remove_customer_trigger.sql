-- Remove the problematic trigger and function that's preventing user creation
-- Using CASCADE to remove all dependent objects (triggers)

-- Using CASCADE to remove function and all dependent triggers
DROP FUNCTION IF EXISTS public.handle_new_customer() CASCADE;

-- Ensure RLS policies allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;

CREATE POLICY "Users can insert own profile"
ON customer_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also ensure users can insert their own addresses
DROP POLICY IF EXISTS "Users can insert own addresses" ON customer_addresses;

CREATE POLICY "Users can insert own addresses"
ON customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customer_profiles
    -- Corrigido de profile_id para customer_id
    WHERE customer_profiles.id = customer_addresses.customer_id
    AND customer_profiles.id = auth.uid()
  )
);

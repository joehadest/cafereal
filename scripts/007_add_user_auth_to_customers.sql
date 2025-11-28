-- Add user_id to customer_profiles to link with auth.users
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS customer_profiles_user_id_idx ON customer_profiles(user_id);

-- Update RLS policies for customer_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;

CREATE POLICY "Users can view own profile"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON customer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Update RLS policies for customer_addresses to use user_id
DROP POLICY IF EXISTS "Users can manage own addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Users can view own addresses" ON customer_addresses;

CREATE POLICY "Users can view own addresses"
  ON customer_addresses FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own addresses"
  ON customer_addresses FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM customer_profiles WHERE user_id = auth.uid()
    )
  );

-- Create function to auto-create customer profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, user_id, full_name, phone)
  VALUES (
    gen_random_uuid(),
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Create trigger for auto-creating customer profile
DROP TRIGGER IF EXISTS on_customer_auth_user_created ON auth.users;

CREATE TRIGGER on_customer_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_customer();

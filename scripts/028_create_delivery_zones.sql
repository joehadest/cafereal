-- Create delivery_zones table for multiple delivery fees
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active zones
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON public.delivery_zones(active);

-- Create index for display order
CREATE INDEX IF NOT EXISTS idx_delivery_zones_display_order ON public.delivery_zones(display_order);

-- Add RLS policies
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active zones
CREATE POLICY "Anyone can read active delivery zones"
  ON public.delivery_zones FOR SELECT
  USING (active = true);

-- Allow authenticated users to manage zones (admin only)
CREATE POLICY "Authenticated users can manage delivery zones"
  ON public.delivery_zones FOR ALL
  USING (auth.role() = 'authenticated');

-- Add zone_id to orders table (optional, for tracking which zone was used)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL;

-- Create index for zone_id
CREATE INDEX IF NOT EXISTS idx_orders_delivery_zone_id ON public.orders(delivery_zone_id);

-- Insert default zone if none exists (migrate from delivery_fee if exists)
DO $$
DECLARE
  default_fee DECIMAL(10, 2);
  zone_count INTEGER;
BEGIN
  -- Check if there are any zones
  SELECT COUNT(*) INTO zone_count FROM public.delivery_zones;
  
  -- If no zones exist, create a default one
  IF zone_count = 0 THEN
    -- Try to get delivery_fee from restaurant_settings
    SELECT COALESCE(delivery_fee, 5.0) INTO default_fee
    FROM public.restaurant_settings
    LIMIT 1;
    
    -- Insert default zone
    INSERT INTO public.delivery_zones (name, fee, active, display_order)
    VALUES ('Zona Padrão', COALESCE(default_fee, 5.0), true, 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


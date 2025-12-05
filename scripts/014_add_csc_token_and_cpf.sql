-- Add CSC TOKEN for NFC-e emission
ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS csc_token TEXT;

COMMENT ON COLUMN public.restaurant_settings.csc_token IS 'CSC TOKEN para emissão de Nota Fiscal de Consumidor Eletrônica (NFC-e)';

-- Add CNPJ field to restaurant_settings table (for fiscal note)
ALTER TABLE public.restaurant_settings
ADD COLUMN IF NOT EXISTS cnpj TEXT;

COMMENT ON COLUMN public.restaurant_settings.cnpj IS 'CNPJ da empresa que aparecerá nas notas fiscais e comprovantes';


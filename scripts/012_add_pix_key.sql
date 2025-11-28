-- Add pix_key column to restaurant_settings table
ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS pix_key TEXT;

COMMENT ON COLUMN public.restaurant_settings.pix_key IS 'Chave PIX para pagamento (CPF, CNPJ, email, telefone ou chave aleatória)';


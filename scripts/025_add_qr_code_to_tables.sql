-- Adicionar campo qr_code_id na tabela restaurant_tables
-- Este campo será usado para gerar QR codes únicos para cada mesa

ALTER TABLE public.restaurant_tables
ADD COLUMN IF NOT EXISTS qr_code_id UUID DEFAULT gen_random_uuid();

-- Atualizar todas as mesas existentes para ter um qr_code_id único
UPDATE public.restaurant_tables
SET qr_code_id = gen_random_uuid()
WHERE qr_code_id IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_qr_code_id ON public.restaurant_tables(qr_code_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.restaurant_tables.qr_code_id IS 'ID único usado para gerar o QR code da mesa. Cada mesa terá um QR code único que redireciona para o menu com a mesa selecionada.';


-- Adicionar campo active na tabela restaurant_tables
ALTER TABLE public.restaurant_tables
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Atualizar todas as mesas existentes para ativas
UPDATE public.restaurant_tables
SET active = true
WHERE active IS NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.restaurant_tables.active IS 'Indica se a mesa está ativa (true) ou desativada (false). Mesas desativadas não aparecem na seleção de mesas para pedidos.';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_active ON public.restaurant_tables(active);


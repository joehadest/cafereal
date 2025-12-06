-- Adicionar campo de categoria na tabela order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS category_name TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.order_items.category_name IS 'Nome da categoria do produto no momento da criação do pedido';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_order_items_category_name ON public.order_items(category_name);


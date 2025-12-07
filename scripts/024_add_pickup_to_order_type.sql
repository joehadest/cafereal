-- Adicionar 'pickup' ao constraint de order_type
-- Atualizar o constraint para incluir 'pickup' além de 'dine-in' e 'delivery'

-- Remover o constraint antigo
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;

-- Adicionar o novo constraint com 'pickup'
ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_type_check 
CHECK (order_type IN ('dine-in', 'delivery', 'pickup'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.orders.order_type IS 'Tipo de pedido: dine-in (mesa), delivery (entrega) ou pickup (retirada no local)';


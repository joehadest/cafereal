-- Adicionar campo de forma de pagamento na tabela de pedidos
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.orders.payment_method IS 'Forma de pagamento escolhida pelo cliente (PIX, Dinheiro, Cartão de Débito, Cartão de Crédito, etc.)';

-- Criar índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);


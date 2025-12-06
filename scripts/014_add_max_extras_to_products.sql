-- Adicionar coluna max_extras na tabela products
-- Esta coluna limita quantos extras diferentes podem ser selecionados para um produto
-- NULL = sem limite (comportamento padrão)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS max_extras INTEGER NULL;

COMMENT ON COLUMN public.products.max_extras IS 'Limite máximo de extras diferentes que podem ser selecionados. NULL = sem limite';


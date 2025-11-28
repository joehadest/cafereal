-- Script para criar o primeiro usuário admin manualmente
-- Execute este script no SQL Editor do Supabase após criar o usuário no Authentication

-- IMPORTANTE: Primeiro, crie o usuário no Supabase Authentication:
-- 1. Vá para Authentication > Users no painel do Supabase
-- 2. Clique em "Add user" > "Create new user"
-- 3. Preencha o email e senha
-- 4. Copie o UUID do usuário criado
-- 5. Execute o comando abaixo substituindo 'USER_UUID_AQUI' pelo UUID copiado

-- Exemplo de uso:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES (
--   'USER_UUID_AQUI',  -- Substitua pelo UUID do usuário criado
--   'admin@restaurante.com',  -- Email do admin
--   'Administrador',  -- Nome do admin
--   'admin'  -- Role: 'admin' ou 'manager'
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET email = EXCLUDED.email,
--     full_name = EXCLUDED.full_name,
--     role = EXCLUDED.role;

-- Verificar se o usuário foi criado corretamente:
-- SELECT * FROM public.profiles WHERE email = 'admin@restaurante.com';

-- Garantir que o usuário NÃO está na tabela customer_profiles:
-- DELETE FROM public.customer_profiles WHERE user_id = 'USER_UUID_AQUI';


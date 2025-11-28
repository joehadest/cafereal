# Como Criar o Primeiro Usuário Admin

Existem duas formas de criar o primeiro usuário admin:

## Método 1: Usando a Página de Cadastro (Recomendado)

1. Acesse `/auth/login`
2. Clique em "Criar Conta Admin"
3. Preencha os dados:
   - Nome completo
   - Email (use um email diferente dos clientes)
   - Senha
   - Confirme a senha
4. Clique em "Criar Conta"
5. Se necessário, confirme o email (ou desabilite a confirmação no Supabase)
6. Faça login com as credenciais criadas

**Importante:** O email usado para criar a conta admin NÃO pode ser o mesmo usado para criar contas de clientes.

## Método 2: Criar Manualmente no Supabase

Se o método 1 não funcionar, você pode criar manualmente:

### Passo 1: Criar o usuário no Supabase Authentication

1. Acesse o painel do Supabase
2. Vá para **Authentication** > **Users**
3. Clique em **"Add user"** > **"Create new user"**
4. Preencha:
   - Email: `admin@restaurante.com` (ou outro email de sua escolha)
   - Senha: (crie uma senha segura)
   - Auto Confirm User: ✅ (marque esta opção)
5. Clique em **"Create user"**
6. **Copie o UUID** do usuário criado (aparece na lista de usuários)

### Passo 2: Criar o perfil admin no banco de dados

1. No Supabase, vá para **SQL Editor**
2. Execute o seguinte comando, substituindo:
   - `USER_UUID_AQUI` pelo UUID copiado no passo 1
   - `admin@restaurante.com` pelo email usado
   - `Administrador` pelo nome desejado

```sql
-- Criar perfil admin
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'USER_UUID_AQUI',  -- Cole o UUID aqui
  'admin@restaurante.com',  -- Email do admin
  'Administrador',  -- Nome do admin
  'admin'  -- Role: 'admin' ou 'manager'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Garantir que NÃO está na tabela de clientes
DELETE FROM public.customer_profiles 
WHERE user_id = 'USER_UUID_AQUI';  -- Cole o UUID aqui
```

### Passo 3: Verificar se foi criado corretamente

Execute este comando para verificar:

```sql
SELECT * FROM public.profiles WHERE email = 'admin@restaurante.com';
```

Você deve ver o registro com `role = 'admin'`.

### Passo 4: Fazer login

1. Acesse `/auth/login`
2. Use o email e senha criados
3. Você será redirecionado para o painel admin

## Importante

- **Emails de clientes NÃO podem acessar o painel admin**
- Se um email já foi usado para criar uma conta de cliente, ele não poderá ser usado como admin
- Use emails diferentes para admins e clientes
- Exemplo:
  - Admin: `admin@restaurante.com`
  - Cliente: `cliente@email.com`

## Solução de Problemas

### "Este email é de um cliente"

Isso significa que o email está na tabela `customer_profiles`. Para resolver:

1. Execute no SQL Editor do Supabase:

```sql
-- Verificar se o email está na tabela de clientes
SELECT * FROM public.customer_profiles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
);

-- Se encontrar, remova o registro
DELETE FROM public.customer_profiles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
);
```

2. Certifique-se de que o perfil admin existe:

```sql
-- Verificar se o perfil admin existe
SELECT * FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
);

-- Se não existir, crie:
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Administrador', 'admin'
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

### "Email não confirmado"

1. No Supabase, vá para **Authentication** > **Providers** > **Email**
2. Desmarque **"Confirm email"** (apenas para desenvolvimento)
3. Ou confirme o email clicando no link enviado


# 🍕 CafeReal - Sistema de Pedidos Online

Sistema completo de cardápio digital e gestão de pedidos para restaurantes, desenvolvido com Next.js, TypeScript e Supabase.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## 📋 Sobre o Projeto

O CafeReal é uma solução completa para restaurantes gerenciarem seus pedidos online, oferecendo uma experiência moderna tanto para clientes quanto para administradores. O sistema suporta pedidos por delivery e pedidos na mesa, com interface responsiva e intuitiva.

## ✨ Funcionalidades

### 👥 Para Clientes
- 📱 **Cardápio Digital Interativo**: Navegação por categorias com produtos, variedades e extras
- 🛒 **Carrinho Inteligente**: Gerenciamento de itens com opções personalizadas
- 🚚 **Delivery**: Sistema completo de entrega com cadastro de endereço
- 🪑 **Pedido na Mesa**: Seleção de mesa antes de visualizar o cardápio
- 💬 **WhatsApp Integration**: Envio automático de pedidos para WhatsApp com informações completas
- 💳 **PIX**: Integração com chave PIX para pagamento
- 📄 **Perfil do Cliente**: Gerenciamento de dados pessoais

### 👨‍💼 Para Administradores
- 📊 **Dashboard**: Visão geral de pedidos, estatísticas e status
- 🍽️ **Gestão de Produtos**: CRUD completo com categorias, variedades e extras
- 📦 **Gestão de Pedidos**: Visualização, impressão e controle de status
- 🪑 **Gestão de Mesas**: Controle de mesas do restaurante
- ⚙️ **Configurações**: Personalização completa do estabelecimento
  - Logo e informações do restaurante
  - Taxa de entrega e pedido mínimo
  - Horários de funcionamento
  - Redes sociais e contatos
  - Chave PIX
- 🖨️ **Impressão**: Comprovantes de pedido e comandas de cozinha otimizadas

## 🛠️ Tecnologias

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deploy**: Vercel (recomendado)

## 📦 Requisitos

- Node.js 18+ ou superior
- npm, yarn ou pnpm
- Conta no Supabase
- Conta no Vercel (para deploy)

## 🚀 Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/cafereal.git
   cd cafereal
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. **Configure o banco de dados**
   
   Execute os scripts SQL na ordem no Supabase SQL Editor:
   - `scripts/001_create_schema.sql` - Schema principal
   - `scripts/002_seed_data.sql` - Dados iniciais (opcional)
   - `scripts/003_create_profile_trigger.sql` - Triggers de perfil
   - `scripts/004_fix_profiles_rls.sql` - Políticas RLS
   - `scripts/005_add_delivery_support.sql` - Suporte a delivery
   - `scripts/006_create_storage_bucket.sql` - Bucket de storage
   - `scripts/007_add_user_auth_to_customers.sql` - Autenticação de clientes
   - `scripts/011_create_product_extras_and_varieties.sql` - Variedades e extras
   - `scripts/012_add_pix_key.sql` - Chave PIX

5. **Execute o projeto**
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000)

## 👤 Criando o Primeiro Admin

Consulte o arquivo `INSTRUCOES_ADMIN.md` para instruções detalhadas sobre como criar o primeiro usuário administrador.

## 📁 Estrutura do Projeto

```
cafereal/
├── app/                    # Rotas Next.js (App Router)
│   ├── admin/              # Painel administrativo
│   ├── auth/               # Autenticação
│   ├── customer/           # Área do cliente
│   └── orders/             # Página de pedidos
├── components/             # Componentes React
│   ├── admin/              # Componentes do admin
│   ├── menu/               # Componentes do cardápio
│   ├── orders/             # Componentes de pedidos
│   └── ui/                 # Componentes UI reutilizáveis
├── lib/                    # Utilitários e configurações
│   └── supabase/           # Clientes Supabase
├── hooks/                  # React Hooks customizados
├── types/                  # Definições TypeScript
├── scripts/                # Scripts SQL
└── public/                 # Arquivos estáticos
```

## 🎨 Funcionalidades Principais

### Sistema de Pedidos
- Pedidos em tempo real com notificações
- Status de pedidos (pendente, preparando, pronto, entregue)
- Impressão de comprovantes e comandas
- Histórico de pedidos

### Gestão de Produtos
- Categorias organizadas
- Produtos com imagens
- Variedades (tamanhos, porções)
- Extras personalizáveis
- Controle de ativação/desativação

### Autenticação
- Sistema de autenticação com Supabase
- Separação entre admin e clientes
- Proteção de rotas com middleware
- Perfis de usuário

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 📝 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run start    # Inicia servidor de produção
npm run lint     # Executa ESLint
```

## 🔒 Segurança

- Row Level Security (RLS) no Supabase
- Middleware de autenticação
- Proteção de rotas admin
- Validação de dados no cliente e servidor

## 📄 Licença

Este projeto é privado e de uso exclusivo.

## 👨‍💻 Desenvolvimento

Para contribuir ou reportar problemas, abra uma issue no repositório.

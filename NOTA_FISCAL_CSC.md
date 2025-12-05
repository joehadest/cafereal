# 📄 Sistema de Nota Fiscal - CSC TOKEN

## O que é o CSC TOKEN?

O **CSC TOKEN** (Código de Segurança do Contribuinte) é um código fornecido pela SEFAZ (Secretaria da Fazenda) necessário para autenticar a emissão de **NFC-e** (Nota Fiscal de Consumidor Eletrônica).

## Como Funciona?

### 1. **Cadastro do CSC TOKEN**
- O token fornecido (`7E017DBC-13CA-481E-8604-41D925CC2F46`) deve ser cadastrado nas **Configurações do Restaurante**
- Acesse: **Admin → Configurações → CSC TOKEN (Nota Fiscal)**
- Este token será usado para autenticar as requisições de emissão de notas fiscais

### 2. **CNPJ da Empresa**
- O CNPJ da empresa deve ser cadastrado nas **Configurações do Restaurante**
- Acesse: **Admin → Configurações → CNPJ da Empresa**
- O CNPJ aparecerá automaticamente em todas as impressões (recibos, comandas)
- O CNPJ é formatado automaticamente (00.000.000/0000-00)
- Este é o CNPJ da empresa que aparecerá nas notas fiscais

### 3. **Quando o CPF é Necessário?**
- **Opcional**: O cliente pode escolher informar ou não
- **Recomendado**: Para clientes que precisam de nota fiscal para reembolso ou declaração de imposto de renda
- **Não obrigatório**: Pedidos podem ser feitos sem CPF normalmente

## Estrutura Implementada

### ✅ Campos Adicionados

1. **Tabela `restaurant_settings`**:
   - `csc_token` (TEXT) - Armazena o CSC TOKEN para emissão de NFC-e
   - `cnpj` (TEXT) - Armazena o CNPJ da empresa

### ✅ Interface Implementada

1. **Configurações do Admin**:
   - Campo para cadastrar o CSC TOKEN
   - Campo para cadastrar o CNPJ da empresa
   - Localizado em: Admin → Configurações → Pagamento

2. **Impressões**:
   - CNPJ aparece automaticamente no rodapé de todas as impressões
   - Formatação automática (00.000.000/0000-00)
   - Disponível em: Recibo Completo, Comanda do Cliente e Comanda de Cozinha

## Próximos Passos (Integração com API)

Para emitir notas fiscais, será necessário:

1. **Integrar com API de NFC-e**:
   - Usar o CSC TOKEN para autenticação
   - Enviar dados do pedido (itens, valores, CPF se informado)
   - Receber o número da nota fiscal e código de acesso

2. **Armazenar Dados da Nota**:
   - Adicionar campos na tabela `orders`:
     - `nfc_e_number` - Número da NFC-e
     - `nfc_e_access_code` - Código de acesso da NFC-e
     - `nfc_e_emission_date` - Data de emissão

3. **Exibir Nota Fiscal**:
   - Mostrar link para consulta da nota fiscal
   - Permitir reimpressão da nota
   - Incluir QR Code para consulta

## Script SQL

Execute o script `scripts/014_add_csc_token_and_cpf.sql` no banco de dados para adicionar os campos necessários.

## Observações Importantes

⚠️ **Segurança**:
- O CSC TOKEN é sensível e deve ser mantido seguro
- Não compartilhe o token publicamente
- Armazene apenas no banco de dados com acesso restrito

⚠️ **Validação**:
- O CNPJ é validado apenas quanto ao formato (14 dígitos)
- Para validação completa, implemente algoritmo de validação de CNPJ

⚠️ **Importante**:
- O CNPJ é informação pública da empresa
- Deve ser o CNPJ oficial cadastrado na Receita Federal
- Será usado na emissão de notas fiscais


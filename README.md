# Finanças Simplificadas

Aplicação para gerenciamento de finanças pessoais.

## Implantação no Vercel

Para implantar este projeto no Vercel, siga estas etapas:

### Opção 1: Usando o assistente de implantação

1. Execute o assistente de implantação:
   ```bash
   npm run deploy:wizard
   ```

2. Siga as instruções na tela.

### Opção 2: Implantação manual

1. Crie uma conta no [Vercel](https://vercel.com) se ainda não tiver uma.

2. Instale a CLI do Vercel:
   ```bash
   npm i -g vercel
   ```

3. Faça login na sua conta Vercel:
   ```bash
   vercel login
   ```

4. Configure as variáveis de ambiente no Vercel:
   - Acesse o dashboard do Vercel
   - Selecione seu projeto
   - Vá para "Settings" > "Environment Variables"
   - Adicione as seguintes variáveis:
     - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
     - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
     - `VITE_SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

5. Implante o projeto:
   ```bash
   vercel
   ```

6. Para implantar em produção:
   ```bash
   vercel --prod
   ```

## Desenvolvimento Local

1. Clone o repositório

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
   VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase
   ```

4. Execute o projeto:
   ```bash
   npm run dev
   ```

## Correção do Limite de Contas Bancárias

Se você estiver enfrentando problemas ao adicionar contas bancárias mesmo após atualizar seu plano para Premium, siga estas etapas:

1. Acesse o Dashboard do Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `supabase/fix_bank_account_limit_simple.sql`
5. Execute a consulta

O script irá corrigir o problema de limite de contas bancárias, permitindo:
- Plano Free: 1 conta
- Plano Basic: 3 contas
- Plano Premium: 5 contas

Para instruções mais detalhadas, consulte o arquivo `supabase/INSTRUCOES_CORRECAO_LIMITE_CONTAS.md`.

## Bot WhatsApp

O bot WhatsApp não funcionará no ambiente do Vercel devido às limitações do ambiente serverless. Para executar o bot WhatsApp, você precisa:

1. Configurar um ambiente de servidor separado (VPS, Heroku, Railway, etc.)
2. Clonar este repositório no servidor
3. Instalar as dependências: `npm install`
4. Configurar as variáveis de ambiente no arquivo `.env`
5. Executar o bot: `npm run bot`

### Comandos do Bot

O bot suporta os seguintes comandos:
- `/vincular` - Vincular seu WhatsApp à conta
- `/gasto [valor] [categoria]` - Registrar um gasto
- `/receita [valor] [categoria]` - Registrar uma receita
- `/saldo` - Consultar seu saldo atual
- `/categorias` - Listar suas categorias
- `/ajuda` - Ver mensagem de ajuda

## Observações Importantes

- O bot WhatsApp não funcionará no Vercel, pois ele requer um ambiente de servidor com persistência.
- As variáveis de ambiente precisam ser configuradas corretamente para que o aplicativo funcione.

## Histórico de Transações Bancárias

Agora você pode visualizar o histórico de transações associadas a cada conta bancária. Para usar esta funcionalidade:

1. Na página principal, clique no ícone de histórico (relógio) em qualquer cartão de conta bancária
2. Uma janela modal será aberta com duas abas:
   - **Informações da Conta**: Mostra detalhes da conta bancária
   - **Histórico de Transações**: Exibe as transações associadas a esta conta

### Adicionando uma transação a uma conta bancária

Para associar uma transação a uma conta bancária específica:

1. Clique em "Nova Transação"
2. Preencha os detalhes da transação
3. Selecione a conta bancária no campo "Conta Bancária"
4. Clique em "Salvar"

A transação será associada à conta bancária selecionada e aparecerá no histórico da conta.

### Configuração do Banco de Dados

Se você estiver enfrentando problemas com o histórico de transações, pode ser necessário adicionar a coluna `bank_id` à tabela `transactions`. Execute o script SQL abaixo no console do Supabase:

```sql
-- Adicionar coluna bank_id à tabela transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES public.banks(id) ON DELETE SET NULL;

-- Criar índice para melhorar desempenho
CREATE INDEX IF NOT EXISTS transactions_bank_id_idx ON public.transactions(bank_id);
```

## Recursos Adicionais

- Visualização de saldo atual
- Histórico de transações por conta
- Filtragem de transações
- Categorização de despesas e receitas 
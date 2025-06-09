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
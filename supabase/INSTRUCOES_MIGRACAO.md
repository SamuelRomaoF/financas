# Instruções para Aplicar Migrações no Supabase

Este documento contém instruções para aplicar as migrações necessárias para corrigir problemas no sistema.

## Problemas Corrigidos

1. **Coluna `paid_installments` na tabela `loans`**

   - Adiciona uma coluna para armazenar explicitamente o número de parcelas pagas
   - Calcula automaticamente o valor correto para empréstimos existentes

2. **Funções RPC do Dashboard**
   - Corrige as funções `get_expenses_by_category` e `get_monthly_summary`
   - Garante tipos de dados consistentes e evita ambiguidades

## Como Aplicar as Migrações

### Método Recomendado: Script Completo

1. Acesse o [Console do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para a seção "SQL Editor"
4. Crie um novo script
5. Cole o conteúdo do arquivo `apply_all_migrations.sql`
6. Execute o script

> **Importante**: O script foi modificado para incluir todo o código necessário diretamente, sem depender de outros arquivos.

## Verificação

Após aplicar as migrações, verifique se:

1. A coluna `paid_installments` foi adicionada à tabela `loans`:

   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'loans' AND column_name = 'paid_installments';
   ```

2. As funções RPC estão funcionando corretamente:
   ```sql
   SELECT * FROM pg_proc WHERE proname IN ('get_expenses_by_category', 'get_monthly_summary');
   ```

## Solução de Problemas

Se encontrar erros durante a execução:

1. **Erro de ambiguidade de coluna**: Já corrigimos este problema renomeando as variáveis para evitar conflito.

2. **Erro de sintaxe com \i**: O script foi reescrito para incluir todo o código diretamente, sem usar comandos \i.

## Suporte

Em caso de problemas, entre em contato com a equipe de desenvolvimento.

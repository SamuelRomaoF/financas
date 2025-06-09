# Instruções para Corrigir os Erros do Dashboard

## Problema Identificado

Os logs mostram dois erros nas funções RPC do Supabase:

1. **get_expenses_by_category**: Erro de incompatibilidade de tipo

   ```
   Returned type character varying(255) does not match expected type text in column 2
   ```

2. **get_monthly_summary**: Erro de ambiguidade na coluna 'month'
   ```
   column reference "month" is ambiguous
   ```

## Como Corrigir

Siga os passos abaixo para corrigir os erros:

### Passo 1: Acesse o Console do Supabase

1. Acesse o [Console do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral

### Passo 2: Execute o SQL Corrigido

Copie e cole o código SQL abaixo no editor SQL e execute:

```sql
-- Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS public.get_expenses_by_category(UUID);
DROP FUNCTION IF EXISTS public.get_monthly_summary(UUID);
DROP FUNCTION IF EXISTS public.get_expenses_by_category(TEXT);
DROP FUNCTION IF EXISTS public.get_monthly_summary(TEXT);

-- Função para calcular despesas por categoria
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(user_id_param TEXT)
RETURNS TABLE (
    category_id TEXT,
    category_name TEXT,
    total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id::TEXT as category_id,
        c.name as category_name,
        COALESCE(SUM(t.amount), 0) as total_amount
    FROM
        categories c
    LEFT JOIN
        transactions t ON c.id = t.category_id
                     AND t.user_id::TEXT = user_id_param
                     AND t.type = 'expense'
    WHERE
        c.user_id::TEXT = user_id_param OR c.is_default = true
    GROUP BY
        c.id, c.name
    ORDER BY
        total_amount DESC;
END;
$$;

-- Função para calcular resumo financeiro mensal
CREATE OR REPLACE FUNCTION public.get_monthly_summary(user_id_param TEXT)
RETURNS TABLE (
    month TEXT,
    year TEXT,
    income NUMERIC,
    expenses NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT
            TO_CHAR(date, 'MM') as month,
            TO_CHAR(date, 'YYYY') as year,
            CASE WHEN type = 'income' THEN amount ELSE 0 END as income_amount,
            CASE WHEN type = 'expense' THEN amount ELSE 0 END as expense_amount
        FROM
            transactions
        WHERE
            user_id::TEXT = user_id_param
            AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
    )
    SELECT
        monthly_data.month,
        monthly_data.year,
        SUM(income_amount) as income,
        SUM(expense_amount) as expenses
    FROM
        monthly_data
    GROUP BY
        monthly_data.year, monthly_data.month
    ORDER BY
        monthly_data.year, monthly_data.month
    LIMIT 6;
END;
$$;

-- Conceder permissões para uso das funções a todos os usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(TEXT) TO authenticated;
```

### Passo 3: Teste o Dashboard

1. Após executar o SQL, volte ao seu aplicativo
2. Recarregue a página do dashboard
3. Verifique se os gráficos agora estão carregando corretamente sem erros

## Explicação das Correções

1. **Tipo de Dados**: Alteramos o tipo de parâmetro e retorno de UUID para TEXT para resolver os problemas de incompatibilidade de tipo, convertendo explicitamente os IDs para texto.

2. **Ambiguidade de Coluna**: Qualificamos as referências às colunas "month" e "year" no SELECT e cláusulas GROUP BY/ORDER BY, adicionando "monthly_data." antes dos nomes das colunas.

3. **Permissões**: Adicionamos explicitamente permissões para que usuários autenticados possam executar estas funções.

Estas correções garantem que as funções RPC sejam chamadas corretamente, evitando a necessidade de usar o fallback manual para cálculo de dados que estava ocorrendo.

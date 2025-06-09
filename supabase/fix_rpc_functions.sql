-- Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS public.get_expenses_by_category(UUID);
DROP FUNCTION IF EXISTS public.get_monthly_summary(UUID);
DROP FUNCTION IF EXISTS public.get_expenses_by_category(TEXT);
DROP FUNCTION IF EXISTS public.get_monthly_summary(TEXT);

-- Função para calcular despesas por categoria (corrigida para evitar problemas de tipo)
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
        c.name::TEXT as category_name,  -- Forçando o tipo TEXT
        COALESCE(SUM(t.amount), 0)::NUMERIC as total_amount  -- Forçando o tipo NUMERIC
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

-- Função para calcular resumo financeiro mensal (corrigida para evitar problemas de tipo e ambiguidade)
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
            TO_CHAR(date, 'MM')::TEXT as month_val,  -- Renomeado para evitar ambiguidade
            TO_CHAR(date, 'YYYY')::TEXT as year_val,  -- Renomeado para evitar ambiguidade
            CASE WHEN type = 'income' THEN amount ELSE 0 END as income_amount,
            CASE WHEN type = 'expense' THEN amount ELSE 0 END as expense_amount
        FROM
            transactions
        WHERE
            user_id::TEXT = user_id_param
            AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
    )
    SELECT
        month_val::TEXT as month,  -- Usando o nome não ambíguo
        year_val::TEXT as year,    -- Usando o nome não ambíguo
        SUM(income_amount)::NUMERIC as income,
        SUM(expense_amount)::NUMERIC as expenses
    FROM
        monthly_data
    GROUP BY
        year_val, month_val
    ORDER BY
        year_val, month_val
    LIMIT 6;
END;
$$;

-- Conceder permissões para uso das funções a todos os usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(TEXT) TO authenticated; 
-- Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS public.get_expenses_by_category(UUID);
DROP FUNCTION IF EXISTS public.get_monthly_summary(UUID);
DROP FUNCTION IF EXISTS public.get_expenses_by_category(TEXT);
DROP FUNCTION IF EXISTS public.get_monthly_summary(TEXT);

-- Função para calcular despesas por categoria - Corrigida para usar apenas o valor da parcela (amount)
-- Para transações parceladas, o campo amount contém o valor da parcela individual
-- e não o valor total da compra (que estaria em original_amount)
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
        -- Somamos o campo amount, que para transações parceladas representa o valor da parcela
        -- e não o valor total da compra
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

-- Função para calcular resumo financeiro mensal - Corrigida para usar apenas o valor da parcela (amount)
-- Para transações parceladas, o campo amount contém o valor da parcela individual
-- e não o valor total da compra (que estaria em original_amount)
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
            -- Para despesas, usamos o campo amount, que para transações parceladas
            -- representa o valor da parcela e não o valor total da compra
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
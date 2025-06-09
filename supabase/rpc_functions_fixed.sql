-- Versão corrigida das funções RPC
-- O problema pode ser com o tipo UUID, vamos usar text para simplificar

-- Função para calcular despesas por categoria
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(user_id_param text)
RETURNS TABLE (
    category_id text,
    category_name text,
    total_amount numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id::text as category_id,
        c.name as category_name,
        COALESCE(SUM(t.amount), 0) as total_amount
    FROM 
        categories c
    LEFT JOIN 
        transactions t ON c.id = t.category_id 
                     AND t.user_id::text = user_id_param 
                     AND t.type = 'expense'
    WHERE 
        c.user_id::text = user_id_param OR c.is_default = true
    GROUP BY 
        c.id, c.name
    ORDER BY 
        total_amount DESC;
END;
$$;

-- Função para calcular resumo financeiro mensal
CREATE OR REPLACE FUNCTION public.get_monthly_summary(user_id_param text)
RETURNS TABLE (
    month text,
    year text,
    income numeric,
    expenses numeric
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
            user_id::text = user_id_param
            AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
    )
    SELECT
        month,
        year,
        SUM(income_amount) as income,
        SUM(expense_amount) as expenses
    FROM
        monthly_data
    GROUP BY
        year, month
    ORDER BY
        year, month
    LIMIT 6;
END;
$$; 
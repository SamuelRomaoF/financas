-- CORREÇÃO FINAL - FUNÇÃO GET_MONTHLY_SUMMARY
-- Corrige o problema de ambiguidade da coluna month_name

-- Remover a função existente
DROP FUNCTION IF EXISTS public.get_monthly_summary(TEXT);

-- Recriar a função com nomes de colunas não ambíguos
CREATE OR REPLACE FUNCTION public.get_monthly_summary(user_id_param TEXT)
RETURNS TABLE (
    month TEXT,
    year TEXT,
    month_name TEXT,
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
            TO_CHAR(date, 'MM')::TEXT as month_num,
            TO_CHAR(date, 'YYYY')::TEXT as year_num,
            CASE 
                WHEN TO_CHAR(date, 'MM') = '01' THEN 'Jan'
                WHEN TO_CHAR(date, 'MM') = '02' THEN 'Fev'
                WHEN TO_CHAR(date, 'MM') = '03' THEN 'Mar'
                WHEN TO_CHAR(date, 'MM') = '04' THEN 'Abr'
                WHEN TO_CHAR(date, 'MM') = '05' THEN 'Mai'
                WHEN TO_CHAR(date, 'MM') = '06' THEN 'Jun'
                WHEN TO_CHAR(date, 'MM') = '07' THEN 'Jul'
                WHEN TO_CHAR(date, 'MM') = '08' THEN 'Ago'
                WHEN TO_CHAR(date, 'MM') = '09' THEN 'Set'
                WHEN TO_CHAR(date, 'MM') = '10' THEN 'Out'
                WHEN TO_CHAR(date, 'MM') = '11' THEN 'Nov'
                WHEN TO_CHAR(date, 'MM') = '12' THEN 'Dez'
            END as month_short_name,
            CASE WHEN type = 'income' THEN amount ELSE 0 END as income_amount,
            CASE WHEN type = 'expense' THEN amount ELSE 0 END as expense_amount
        FROM
            transactions
        WHERE
            user_id::TEXT = user_id_param
            AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
    )
    SELECT
        month_num as month,
        year_num as year,
        month_short_name as month_name,
        SUM(income_amount)::NUMERIC as income,
        SUM(expense_amount)::NUMERIC as expenses
    FROM
        monthly_data
    GROUP BY
        year_num, month_num, month_short_name
    ORDER BY
        year_num, month_num
    LIMIT 12;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(TEXT) TO authenticated;

-- Verificar resultado
DO $$
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Função get_monthly_summary corrigida com sucesso!';
    RAISE NOTICE '----------------------------------------';
END $$; 
-- Corrige o problema de ambiguidade da coluna month_name

-- Remover a função existente
DROP FUNCTION IF EXISTS public.get_monthly_summary(TEXT);

-- Recriar a função com nomes de colunas não ambíguos
CREATE OR REPLACE FUNCTION public.get_monthly_summary(user_id_param TEXT)
RETURNS TABLE (
    month TEXT,
    year TEXT,
    month_name TEXT,
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
            TO_CHAR(date, 'MM')::TEXT as month_num,
            TO_CHAR(date, 'YYYY')::TEXT as year_num,
            CASE 
                WHEN TO_CHAR(date, 'MM') = '01' THEN 'Jan'
                WHEN TO_CHAR(date, 'MM') = '02' THEN 'Fev'
                WHEN TO_CHAR(date, 'MM') = '03' THEN 'Mar'
                WHEN TO_CHAR(date, 'MM') = '04' THEN 'Abr'
                WHEN TO_CHAR(date, 'MM') = '05' THEN 'Mai'
                WHEN TO_CHAR(date, 'MM') = '06' THEN 'Jun'
                WHEN TO_CHAR(date, 'MM') = '07' THEN 'Jul'
                WHEN TO_CHAR(date, 'MM') = '08' THEN 'Ago'
                WHEN TO_CHAR(date, 'MM') = '09' THEN 'Set'
                WHEN TO_CHAR(date, 'MM') = '10' THEN 'Out'
                WHEN TO_CHAR(date, 'MM') = '11' THEN 'Nov'
                WHEN TO_CHAR(date, 'MM') = '12' THEN 'Dez'
            END as month_short_name,
            CASE WHEN type = 'income' THEN amount ELSE 0 END as income_amount,
            CASE WHEN type = 'expense' THEN amount ELSE 0 END as expense_amount
        FROM
            transactions
        WHERE
            user_id::TEXT = user_id_param
            AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
    )
    SELECT
        month_num as month,
        year_num as year,
        month_short_name as month_name,
        SUM(income_amount)::NUMERIC as income,
        SUM(expense_amount)::NUMERIC as expenses
    FROM
        monthly_data
    GROUP BY
        year_num, month_num, month_short_name
    ORDER BY
        year_num, month_num
    LIMIT 12;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(TEXT) TO authenticated;

-- Verificar resultado
DO $$
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Função get_monthly_summary corrigida com sucesso!';
    RAISE NOTICE '----------------------------------------';
END $$; 
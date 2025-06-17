-- Script para aplicar todas as migrações necessárias

-- 1. Adicionar coluna paid_installments à tabela loans
-- Verificar se a coluna já existe
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'loans'
        AND column_name = 'paid_installments'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna paid_installments à tabela loans...';
        EXECUTE 'ALTER TABLE public.loans ADD COLUMN paid_installments INTEGER DEFAULT 0';
        RAISE NOTICE 'Coluna paid_installments adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna paid_installments já existe na tabela loans.';
    END IF;
END $$;

-- Atualizar os empréstimos existentes para calcular parcelas pagas
DO $$
DECLARE
    loan_record RECORD;
    loan_start_date DATE;
    loan_next_payment_date DATE;
    months_passed INTEGER;
BEGIN
    FOR loan_record IN SELECT id, start_date, next_payment_date, installments FROM public.loans WHERE paid_installments IS NULL LOOP
        -- Calcular parcelas pagas com base na data de início e próximo pagamento
        loan_start_date := loan_record.start_date;
        loan_next_payment_date := loan_record.next_payment_date;
        
        -- Calcular meses passados entre a data de início e a próxima data de pagamento
        months_passed := (EXTRACT(YEAR FROM loan_next_payment_date) - EXTRACT(YEAR FROM loan_start_date)) * 12 +
                         (EXTRACT(MONTH FROM loan_next_payment_date) - EXTRACT(MONTH FROM loan_start_date));
        
        -- Atualizar o valor de parcelas pagas
        UPDATE public.loans
        SET paid_installments = GREATEST(0, months_passed)
        WHERE id = loan_record.id;
        
        RAISE NOTICE 'Atualizado empréstimo ID %, parcelas pagas: %', loan_record.id, GREATEST(0, months_passed);
    END LOOP;
END $$;

-- 2. Criar ou atualizar funções do dashboard
-- Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS public.get_expense_by_category;
DROP FUNCTION IF EXISTS public.get_expenses_by_category;
DROP FUNCTION IF EXISTS public.get_monthly_summary;

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
        c.name::TEXT as category_name,
        COALESCE(SUM(t.amount), 0)::NUMERIC as total_amount
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
            END as month_name,
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
        month_name,
        SUM(income_amount)::NUMERIC as income,
        SUM(expense_amount)::NUMERIC as expenses
    FROM
        monthly_data
    GROUP BY
        year_num, month_num, month_name
    ORDER BY
        year_num, month_num
    LIMIT 12;
END;
$$;

-- Conceder permissões para uso das funções a todos os usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(TEXT) TO authenticated;

-- Mostrar mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Todas as migrações aplicadas com sucesso!';
    RAISE NOTICE '----------------------------------------';
END $$; 

-- 1. Adicionar coluna paid_installments à tabela loans
-- Verificar se a coluna já existe
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'loans'
        AND column_name = 'paid_installments'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna paid_installments à tabela loans...';
        EXECUTE 'ALTER TABLE public.loans ADD COLUMN paid_installments INTEGER DEFAULT 0';
        RAISE NOTICE 'Coluna paid_installments adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna paid_installments já existe na tabela loans.';
    END IF;
END $$;

-- Atualizar os empréstimos existentes para calcular parcelas pagas
DO $$
DECLARE
    loan_record RECORD;
    loan_start_date DATE;
    loan_next_payment_date DATE;
    months_passed INTEGER;
BEGIN
    FOR loan_record IN SELECT id, start_date, next_payment_date, installments FROM public.loans WHERE paid_installments IS NULL LOOP
        -- Calcular parcelas pagas com base na data de início e próximo pagamento
        loan_start_date := loan_record.start_date;
        loan_next_payment_date := loan_record.next_payment_date;
        
        -- Calcular meses passados entre a data de início e a próxima data de pagamento
        months_passed := (EXTRACT(YEAR FROM loan_next_payment_date) - EXTRACT(YEAR FROM loan_start_date)) * 12 +
                         (EXTRACT(MONTH FROM loan_next_payment_date) - EXTRACT(MONTH FROM loan_start_date));
        
        -- Atualizar o valor de parcelas pagas
        UPDATE public.loans
        SET paid_installments = GREATEST(0, months_passed)
        WHERE id = loan_record.id;
        
        RAISE NOTICE 'Atualizado empréstimo ID %, parcelas pagas: %', loan_record.id, GREATEST(0, months_passed);
    END LOOP;
END $$;

-- 2. Criar ou atualizar funções do dashboard
-- Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS public.get_expense_by_category;
DROP FUNCTION IF EXISTS public.get_expenses_by_category;
DROP FUNCTION IF EXISTS public.get_monthly_summary;

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
        c.name::TEXT as category_name,
        COALESCE(SUM(t.amount), 0)::NUMERIC as total_amount
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
            END as month_name,
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
        month_name,
        SUM(income_amount)::NUMERIC as income,
        SUM(expense_amount)::NUMERIC as expenses
    FROM
        monthly_data
    GROUP BY
        year_num, month_num, month_name
    ORDER BY
        year_num, month_num
    LIMIT 12;
END;
$$;

-- Conceder permissões para uso das funções a todos os usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_summary(TEXT) TO authenticated;

-- Mostrar mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Todas as migrações aplicadas com sucesso!';
    RAISE NOTICE '----------------------------------------';
END $$; 
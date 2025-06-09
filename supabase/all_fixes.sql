-- Script combinado para aplicar todas as correções

-- Garantir que a extensão uuid-ossp esteja instalada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de alertas
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'balance', 'goal', 'bill')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    condition TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    next_check TIMESTAMPTZ
);

-- Criar tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    last_four_digits TEXT,
    "limit" NUMERIC NOT NULL,
    current_spending NUMERIC DEFAULT 0,
    due_date INTEGER NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
    closing_date INTEGER NOT NULL CHECK (closing_date >= 1 AND closing_date <= 31),
    color TEXT,
    brand TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS para as tabelas
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes, se houver
DO $$
BEGIN
    -- Tentar remover políticas para a tabela alerts
    BEGIN
        DROP POLICY IF EXISTS "Usuários podem ver seus próprios alertas" ON public.alerts;
        DROP POLICY IF EXISTS "Usuários podem inserir seus próprios alertas" ON public.alerts;
        DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios alertas" ON public.alerts;
        DROP POLICY IF EXISTS "Usuários podem excluir seus próprios alertas" ON public.alerts;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao remover políticas de alertas: %', SQLERRM;
    END;

    -- Tentar remover políticas para a tabela credit_cards
    BEGIN
        DROP POLICY IF EXISTS "Usuários podem ver seus próprios cartões" ON public.credit_cards;
        DROP POLICY IF EXISTS "Usuários podem inserir seus próprios cartões" ON public.credit_cards;
        DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios cartões" ON public.credit_cards;
        DROP POLICY IF EXISTS "Usuários podem excluir seus próprios cartões" ON public.credit_cards;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao remover políticas de cartões: %', SQLERRM;
    END;
END $$;

-- Criar políticas de segurança para a tabela de alertas
CREATE POLICY "Usuários podem ver seus próprios alertas"
  ON public.alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios alertas"
  ON public.alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios alertas"
  ON public.alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios alertas"
  ON public.alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar políticas de segurança para a tabela de cartões de crédito
CREATE POLICY "Usuários podem ver seus próprios cartões"
  ON public.credit_cards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios cartões"
  ON public.credit_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios cartões"
  ON public.credit_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios cartões"
  ON public.credit_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- Remover funções existentes
DROP FUNCTION IF EXISTS public.get_expenses_by_category(text);
DROP FUNCTION IF EXISTS public.get_monthly_summary(text);

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
-- Script SQL para aplicar todas as migrações necessárias
-- Execute isso no console SQL do Supabase

-- Funções para o dashboard
-- Função para calcular despesas por categoria
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(user_id_param UUID)
RETURNS TABLE (
    category_id UUID,
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
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(t.amount), 0) as total_amount
    FROM 
        categories c
    LEFT JOIN 
        transactions t ON c.id = t.category_id 
                     AND t.user_id = user_id_param 
                     AND t.type = 'expense'
    WHERE 
        c.user_id = user_id_param OR c.is_default = true
    GROUP BY 
        c.id, c.name
    ORDER BY 
        total_amount DESC;
END;
$$;

-- Função para calcular resumo financeiro mensal
CREATE OR REPLACE FUNCTION public.get_monthly_summary(user_id_param UUID)
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
            user_id = user_id_param
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

-- Tabela de alertas
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'balance', 'goal', 'bill')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    condition TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    next_check TIMESTAMPTZ,
    
    -- Políticas RLS serão aplicadas para proteger os dados
    CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Políticas RLS para garantir que usuários só vejam seus próprios alertas
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Usuários podem ver seus próprios alertas'
    ) THEN
        CREATE POLICY "Usuários podem ver seus próprios alertas"
        ON public.alerts
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Usuários podem inserir seus próprios alertas'
    ) THEN
        CREATE POLICY "Usuários podem inserir seus próprios alertas"
        ON public.alerts
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Usuários podem atualizar seus próprios alertas'
    ) THEN
        CREATE POLICY "Usuários podem atualizar seus próprios alertas"
        ON public.alerts
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Usuários podem excluir seus próprios alertas'
    ) THEN
        CREATE POLICY "Usuários podem excluir seus próprios alertas"
        ON public.alerts
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_four_digits TEXT,
    "limit" NUMERIC NOT NULL, -- "limit" entre aspas pois é palavra reservada
    current_spending NUMERIC DEFAULT 0,
    due_date INTEGER NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
    closing_date INTEGER NOT NULL CHECK (closing_date >= 1 AND closing_date <= 31),
    color TEXT,
    brand TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Políticas RLS serão aplicadas para proteger os dados
    CONSTRAINT credit_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Políticas RLS para garantir que usuários só vejam seus próprios cartões
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'credit_cards' AND policyname = 'Usuários podem ver seus próprios cartões'
    ) THEN
        CREATE POLICY "Usuários podem ver seus próprios cartões"
        ON public.credit_cards
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'credit_cards' AND policyname = 'Usuários podem inserir seus próprios cartões'
    ) THEN
        CREATE POLICY "Usuários podem inserir seus próprios cartões"
        ON public.credit_cards
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'credit_cards' AND policyname = 'Usuários podem atualizar seus próprios cartões'
    ) THEN
        CREATE POLICY "Usuários podem atualizar seus próprios cartões"
        ON public.credit_cards
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'credit_cards' AND policyname = 'Usuários podem excluir seus próprios cartões'
    ) THEN
        CREATE POLICY "Usuários podem excluir seus próprios cartões"
        ON public.credit_cards
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$; 
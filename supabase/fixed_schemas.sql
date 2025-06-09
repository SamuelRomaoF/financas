-- Script SQL para criar ou atualizar schemas de alertas e cartões
-- Execute isso no console SQL do Supabase após executar o script de funções
-- Versão com verificações para evitar erros de duplicação

-- Políticas de alerta - verificando se já existem
DO $$
BEGIN
    -- Se existir uma tabela de alertas, aplique apenas as políticas necessárias
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'alerts'
    ) THEN
        -- Certifique-se de que o RLS está ativado
        ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
        
        -- E que as políticas existem
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
    END IF;
END
$$;

-- Políticas de cartões de crédito - verificando se já existem
DO $$
BEGIN
    -- Se existir uma tabela de cartões, aplique apenas as políticas necessárias
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_cards'
    ) THEN
        -- Certifique-se de que o RLS está ativado
        ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
        
        -- E que as políticas existem
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
    END IF;
END
$$; 
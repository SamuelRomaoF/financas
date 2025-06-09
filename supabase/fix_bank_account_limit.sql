-- Script para verificar e corrigir o limite de contas bancárias no Supabase

-- 1. Verificar se existe algum trigger na tabela banks que possa estar limitando a criação de contas
DO $$
BEGIN
    -- Verificar triggers existentes na tabela banks
    RAISE NOTICE 'Verificando triggers na tabela banks...';
END
$$;

-- Listar todos os triggers na tabela banks
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'public.banks'::regclass;

-- 2. Verificar se existe alguma função que possa estar verificando o limite de contas
DO $$
BEGIN
    RAISE NOTICE 'Verificando funções relacionadas ao limite de contas...';
END
$$;

-- Listar funções que podem conter a palavra "limit", "bank", "account", "conta", etc.
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM 
    pg_proc
WHERE 
    pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND (prosrc ILIKE '%bank%' OR prosrc ILIKE '%account%' OR prosrc ILIKE '%limit%' OR prosrc ILIKE '%conta%');

-- 3. Verificar políticas RLS na tabela banks que possam estar restringindo a inserção
DO $$
BEGIN
    RAISE NOTICE 'Verificando políticas RLS na tabela banks...';
END
$$;

SELECT 
    polname AS policy_name,
    polcmd AS command,
    pg_get_expr(polqual, polrelid) AS expression
FROM 
    pg_policy
WHERE 
    polrelid = 'public.banks'::regclass;

-- 4. Criar ou atualizar função para verificar o limite de contas com base no plano
CREATE OR REPLACE FUNCTION check_bank_account_limit()
RETURNS TRIGGER AS $$
DECLARE
    account_count INTEGER;
    user_plan TEXT;
    max_accounts INTEGER;
BEGIN
    -- Obter o plano atual do usuário
    SELECT plan INTO user_plan
    FROM subscriptions
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Definir limite com base no plano
    CASE user_plan
        WHEN 'free' THEN max_accounts := 1;
        WHEN 'basic' THEN max_accounts := 3;
        WHEN 'premium' THEN max_accounts := 5;
        ELSE max_accounts := 1; -- Padrão para casos não previstos
    END CASE;
    
    -- Contar contas existentes
    SELECT COUNT(*) INTO account_count
    FROM banks
    WHERE user_id = NEW.user_id;
    
    -- Verificar se ultrapassou o limite
    IF account_count >= max_accounts THEN
        RAISE EXCEPTION 'Você atingiu o limite de % conta(s) para o seu plano %', max_accounts, user_plan;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar se o trigger já existe e criar se não existir
DO $$
BEGIN
    -- Remover o trigger se existir
    DROP TRIGGER IF EXISTS check_bank_account_limit_trigger ON public.banks;
    
    -- Criar o trigger
    CREATE TRIGGER check_bank_account_limit_trigger
    BEFORE INSERT ON public.banks
    FOR EACH ROW
    EXECUTE FUNCTION check_bank_account_limit();
    
    RAISE NOTICE 'Trigger de limite de contas bancárias atualizado com sucesso!';
END
$$;

-- 6. Verificar se a tabela banks tem RLS habilitado e configurar políticas
DO $$
BEGIN
    -- Habilitar RLS na tabela banks
    ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
    
    -- Criar políticas se não existirem
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem ver suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem ver suas próprias contas bancárias"
        ON public.banks
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem inserir suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem inserir suas próprias contas bancárias"
        ON public.banks
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem atualizar suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem atualizar suas próprias contas bancárias"
        ON public.banks
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem excluir suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem excluir suas próprias contas bancárias"
        ON public.banks
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
    
    RAISE NOTICE 'Políticas RLS para a tabela banks configuradas com sucesso!';
END
$$; 
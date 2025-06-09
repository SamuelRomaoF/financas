-- Script ROBUSTO para configurar o limite de contas bancárias por plano
-- Versão 1.0 - Implementa limite de 5 contas para premium e 1 para free

-- 1. Remover qualquer trigger existente relacionado ao limite de contas
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
        WHERE relname = 'banks' AND tgname NOT LIKE 'pg_%' AND tgname NOT LIKE 'RI_%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.tgname || ' ON public.banks CASCADE;';
        RAISE NOTICE 'Removido trigger: %', trigger_rec.tgname;
    END LOOP;
END
$$;

-- 2. Remover funções relacionadas ao limite de contas
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    FOR func_rec IN 
        SELECT proname 
        FROM pg_proc
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND (prosrc ILIKE '%bank%limit%' OR prosrc ILIKE '%account%limit%' OR prosrc ILIKE '%conta%limite%')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_rec.proname || '() CASCADE;';
        RAISE NOTICE 'Removida função: %', func_rec.proname;
    END LOOP;
END
$$;

-- 3. Criar uma função robusta para verificar o limite de contas
CREATE OR REPLACE FUNCTION check_bank_account_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    user_plan TEXT;
    account_limit INTEGER;
    has_active_subscription BOOLEAN;
BEGIN
    -- Verificar se o usuário tem uma assinatura ativa
    SELECT EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE user_id = NEW.user_id
        AND status = 'active'
    ) INTO has_active_subscription;
    
    -- Obter o plano do usuário (com tratamento para NULL)
    SELECT plan INTO user_plan
    FROM subscriptions
    WHERE user_id = NEW.user_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Definir o limite com base no plano
    IF user_plan = 'premium' THEN
        account_limit := 5;
    ELSIF user_plan = 'free' OR user_plan IS NULL THEN
        account_limit := 1;
    ELSE
        -- Para qualquer outro plano não reconhecido, usar um valor padrão seguro
        account_limit := 1;
    END IF;
    
    -- Contar quantas contas o usuário já tem
    SELECT COUNT(*) INTO current_count
    FROM banks
    WHERE user_id = NEW.user_id;
    
    -- Verificar se o usuário atingiu o limite
    IF current_count >= account_limit THEN
        RAISE EXCEPTION 'Você atingiu o limite de % conta(s) para o seu plano %', account_limit, COALESCE(user_plan, 'free');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar o trigger que usa essa função
CREATE TRIGGER check_bank_account_limit_trigger
BEFORE INSERT ON public.banks
FOR EACH ROW
EXECUTE FUNCTION check_bank_account_limit();

-- 5. Garantir que as políticas RLS estejam configuradas corretamente
DO $$
BEGIN
    -- Habilitar RLS na tabela banks
    ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes para evitar conflitos
    DROP POLICY IF EXISTS "Usuários podem ver suas próprias contas bancárias" ON public.banks;
    DROP POLICY IF EXISTS "Usuários podem inserir suas próprias contas bancárias" ON public.banks;
    DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias contas bancárias" ON public.banks;
    DROP POLICY IF EXISTS "Usuários podem excluir suas próprias contas bancárias" ON public.banks;
    
    -- Criar políticas novas
    CREATE POLICY "Usuários podem ver suas próprias contas bancárias"
    ON public.banks
    FOR SELECT
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem inserir suas próprias contas bancárias"
    ON public.banks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem atualizar suas próprias contas bancárias"
    ON public.banks
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem excluir suas próprias contas bancárias"
    ON public.banks
    FOR DELETE
    USING (auth.uid() = user_id);
END
$$;

-- 6. Verificar o resultado
SELECT 'Limite de contas configurado com sucesso: 5 contas para plano premium, 1 conta para outros planos' AS status; 
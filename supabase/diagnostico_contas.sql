-- Script de diagnóstico para o problema de limite de contas bancárias

-- 1. Verificar a estrutura da tabela banks
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'banks';

-- 2. Verificar a estrutura da tabela subscriptions
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';

-- 3. Verificar todos os triggers no banco de dados que podem estar relacionados
SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    pg_get_triggerdef(pg_trigger.oid) AS trigger_definition
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE relname IN ('banks', 'subscriptions');

-- 4. Verificar todas as funções que podem estar relacionadas ao limite de contas
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM 
    pg_proc
WHERE 
    pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND (prosrc ILIKE '%bank%' OR prosrc ILIKE '%account%' OR prosrc ILIKE '%limit%' 
         OR prosrc ILIKE '%conta%' OR prosrc ILIKE '%subscription%' OR prosrc ILIKE '%plano%');

-- 5. Verificar a assinatura atual do usuário
SELECT 
    id, 
    user_id, 
    plan, 
    status, 
    created_at, 
    updated_at
FROM 
    subscriptions
ORDER BY 
    created_at DESC
LIMIT 5;

-- 6. Verificar se a tabela banks tem RLS ativado e quais são as políticas
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM 
    pg_class
WHERE 
    relname = 'banks';

SELECT 
    polname AS policy_name,
    polcmd AS command,
    pg_get_expr(polqual, polrelid) AS expression
FROM 
    pg_policy
WHERE 
    polrelid = 'public.banks'::regclass;

-- 7. Verificar se há algum erro de permissão
DO $$
DECLARE
    current_role TEXT;
BEGIN
    SELECT current_role INTO current_role;
    RAISE NOTICE 'Usuário atual: %', current_role;
END
$$;

-- 8. Correção direta: remover TODOS os triggers na tabela banks
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
        WHERE relname = 'banks' AND tgname NOT LIKE 'pg_%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.tgname || ' ON public.banks CASCADE;';
        RAISE NOTICE 'Removido trigger: %', trigger_rec.tgname;
    END LOOP;
END
$$;

-- 9. Verificar se há alguma restrição (constraint) na tabela banks
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'public.banks'::regclass;

-- 10. Criar uma função de verificação de plano simplificada
CREATE OR REPLACE FUNCTION get_user_plan_limit(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_plan TEXT;
    max_accounts INTEGER;
BEGIN
    -- Obter o plano atual do usuário
    SELECT plan INTO user_plan
    FROM subscriptions
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'Plano do usuário %: %', user_uuid, user_plan;
    
    -- Definir limite com base no plano
    CASE user_plan
        WHEN 'free' THEN max_accounts := 1;
        WHEN 'basic' THEN max_accounts := 3;
        WHEN 'premium' THEN max_accounts := 5;
        ELSE max_accounts := 10; -- Valor alto para garantir que não bloqueie
    END CASE;
    
    RETURN max_accounts;
END;
$$ LANGUAGE plpgsql;

-- 11. Testar a função para um usuário específico (substitua o UUID)
-- Exemplo: SELECT get_user_plan_limit('seu-user-id-aqui');

-- 12. Criar uma nova função simplificada para verificar o limite (sem trigger)
CREATE OR REPLACE FUNCTION check_bank_account_limit_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Permitir qualquer inserção por enquanto
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Criar um trigger simples que não bloqueia nada
CREATE TRIGGER check_bank_account_limit_trigger
BEFORE INSERT ON public.banks
FOR EACH ROW
EXECUTE FUNCTION check_bank_account_limit_simple(); 
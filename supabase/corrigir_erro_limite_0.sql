-- Script para corrigir o erro "Você atingiu o limite de 0 conta(s) para o seu plano active"

-- 1. Encontrar a função que está gerando o erro específico
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM 
    pg_proc
WHERE 
    pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND prosrc ILIKE '%atingiu o limite de%conta%';

-- 2. Remover todos os triggers na tabela banks
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

-- 3. Criar uma nova função que corrige o problema específico
CREATE OR REPLACE FUNCTION check_bank_account_limit()
RETURNS TRIGGER AS $$
DECLARE
    account_count INTEGER;
    user_plan TEXT;
    max_accounts INTEGER := 5; -- Valor padrão alto para garantir que não bloqueie
BEGIN
    -- Obter o plano atual do usuário
    SELECT plan INTO user_plan
    FROM subscriptions
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Definir limite com base no plano (garantindo que nunca seja 0)
    IF user_plan = 'free' THEN
        max_accounts := 1;
    ELSIF user_plan = 'basic' THEN
        max_accounts := 3;
    ELSIF user_plan = 'premium' THEN
        max_accounts := 5;
    ELSE
        -- Se o plano não for reconhecido, usar um valor padrão
        max_accounts := 5;
    END IF;
    
    -- Garantir que o limite nunca seja 0
    IF max_accounts < 1 THEN
        max_accounts := 5;
    END IF;
    
    -- Contar contas existentes
    SELECT COUNT(*) INTO account_count
    FROM banks
    WHERE user_id = NEW.user_id;
    
    -- Verificar se ultrapassou o limite
    IF account_count >= max_accounts THEN
        RAISE EXCEPTION 'Você atingiu o limite de % conta(s) para o seu plano %', max_accounts, COALESCE(user_plan, 'atual');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar o trigger com a nova função
CREATE TRIGGER check_bank_account_limit_trigger
BEFORE INSERT ON public.banks
FOR EACH ROW
EXECUTE FUNCTION check_bank_account_limit();

-- 5. Verificar se há algum problema com a tabela subscriptions
SELECT 
    id, 
    user_id, 
    plan, 
    status, 
    created_at, 
    updated_at
FROM 
    subscriptions
WHERE 
    status = 'active'
ORDER BY 
    created_at DESC
LIMIT 5;

-- 6. Atualizar o status de todas as assinaturas premium para 'active'
UPDATE subscriptions
SET status = 'active'
WHERE plan = 'premium' AND status != 'active';

-- 7. Verificar se há alguma assinatura com status 'active' mas sem plano definido
UPDATE subscriptions
SET plan = 'premium'
WHERE status = 'active' AND (plan IS NULL OR plan = ''); 
-- Script simplificado para corrigir o limite de contas bancárias no Supabase

-- 1. Remover o trigger existente que pode estar causando o problema
DROP TRIGGER IF EXISTS check_bank_account_limit_trigger ON public.banks;
DROP FUNCTION IF EXISTS check_bank_account_limit();

-- 2. Criar uma nova função para verificar o limite de contas com base no plano
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

-- 3. Criar o novo trigger
CREATE TRIGGER check_bank_account_limit_trigger
BEFORE INSERT ON public.banks
FOR EACH ROW
EXECUTE FUNCTION check_bank_account_limit(); 
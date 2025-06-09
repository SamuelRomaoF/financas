-- Script para configurar o limite de 5 contas para o plano premium

-- 1. Remover o trigger atual que permite qualquer inserção
DROP TRIGGER IF EXISTS allow_bank_insert_trigger ON public.banks;
DROP FUNCTION IF EXISTS allow_bank_insert();

-- 2. Criar uma função que verifica o limite de contas de acordo com o plano
CREATE OR REPLACE FUNCTION check_bank_account_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    user_plan TEXT;
    account_limit INTEGER;
BEGIN
    -- Obter o plano do usuário
    SELECT plan INTO user_plan
    FROM subscriptions
    WHERE user_id = NEW.user_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Definir o limite com base no plano
    IF user_plan = 'premium' THEN
        account_limit := 5;
    ELSE
        account_limit := 1; -- Plano free ou qualquer outro
    END IF;
    
    -- Contar quantas contas o usuário já tem
    SELECT COUNT(*) INTO current_count
    FROM banks
    WHERE user_id = NEW.user_id;
    
    -- Verificar se o usuário atingiu o limite
    IF current_count >= account_limit THEN
        RAISE EXCEPTION 'Você atingiu o limite de % conta(s) para o seu plano %', account_limit, user_plan;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o trigger que usa essa função
CREATE TRIGGER check_bank_account_limit_trigger
BEFORE INSERT ON public.banks
FOR EACH ROW
EXECUTE FUNCTION check_bank_account_limit();

-- 4. Verificar o resultado
SELECT 'Limite de contas configurado com sucesso: 5 contas para plano premium, 1 conta para outros planos' AS status; 
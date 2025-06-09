-- Script para testar o limite de contas bancárias
-- Este script testa se o limite de contas está funcionando corretamente

-- 1. Função para testar o limite de contas para um usuário específico
CREATE OR REPLACE FUNCTION test_account_limit(user_uuid UUID)
RETURNS TABLE (
    test_name TEXT,
    result TEXT
) AS $$
DECLARE
    user_plan TEXT;
    account_limit INTEGER;
    current_count INTEGER;
    test_result TEXT;
BEGIN
    -- Verificar o plano do usuário
    SELECT plan INTO user_plan
    FROM subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Determinar o limite esperado
    IF user_plan = 'premium' THEN
        account_limit := 5;
    ELSE
        account_limit := 1;
    END IF;
    
    -- Contar quantas contas o usuário já tem
    SELECT COUNT(*) INTO current_count
    FROM banks
    WHERE user_id = user_uuid;
    
    -- Teste 1: Verificar plano do usuário
    test_name := 'Verificação do plano do usuário';
    result := 'Plano atual: ' || COALESCE(user_plan, 'Nenhum plano ativo') || 
              ' (Limite: ' || account_limit || ' contas)';
    RETURN NEXT;
    
    -- Teste 2: Verificar contagem atual de contas
    test_name := 'Contagem atual de contas';
    result := 'O usuário tem ' || current_count || ' conta(s) de ' || account_limit || ' permitidas';
    RETURN NEXT;
    
    -- Teste 3: Verificar se o trigger está funcionando
    test_name := 'Verificação do trigger de limite';
    BEGIN
        IF current_count < account_limit THEN
            result := 'O usuário ainda pode adicionar mais contas (dentro do limite)';
        ELSE
            -- Tentar inserir uma conta adicional (deve falhar se o trigger estiver funcionando)
            BEGIN
                INSERT INTO public.banks (
                    user_id, 
                    name, 
                    type, 
                    balance
                ) VALUES (
                    user_uuid,
                    'Conta de Teste',
                    'checking',
                    0
                );
                
                -- Se chegou aqui, a inserção foi bem-sucedida (o que não deveria acontecer se atingiu o limite)
                result := 'ERRO: O trigger não está funcionando! Foi possível inserir uma conta além do limite.';
                
                -- Remover a conta de teste que foi inserida
                DELETE FROM public.banks 
                WHERE user_id = user_uuid AND name = 'Conta de Teste'
                AND created_at = (SELECT MAX(created_at) FROM public.banks WHERE user_id = user_uuid);
            EXCEPTION WHEN OTHERS THEN
                -- A exceção era esperada se o usuário já atingiu o limite
                result := 'OK: O trigger está funcionando corretamente. Erro ao tentar adicionar: ' || SQLERRM;
            END;
        END IF;
    END;
    RETURN NEXT;
    
    -- Teste 4: Verificar se as políticas RLS estão corretas
    test_name := 'Verificação das políticas RLS';
    BEGIN
        SELECT COUNT(*) INTO current_count
        FROM pg_policies
        WHERE tablename = 'banks' AND 
              (policyname LIKE '%suas próprias contas%');
        
        IF current_count >= 4 THEN -- SELECT, INSERT, UPDATE, DELETE
            result := 'OK: As políticas RLS estão configuradas corretamente';
        ELSE
            result := 'ALERTA: Algumas políticas RLS podem estar faltando. Encontradas: ' || current_count;
        END IF;
    END;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 2. Executar o teste para o usuário atual (substituir pelo UUID do usuário)
-- Você deve substituir 'SEU-UUID-AQUI' pelo UUID do usuário que deseja testar
SELECT * FROM test_account_limit('SEU-UUID-AQUI');

-- 3. Verificar a configuração atual do trigger
SELECT 
    tgname AS trigger_name,
    tgenabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'public.banks'::regclass AND
    tgname = 'check_bank_account_limit_trigger';

-- 4. Verificar a função do trigger
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM 
    pg_proc
WHERE 
    proname = 'check_bank_account_limit';

-- 5. Verificar o status das políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    tablename = 'banks'; 
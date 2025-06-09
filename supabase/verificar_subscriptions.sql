-- Script para verificar e corrigir problemas com a tabela subscriptions

-- 1. Verificar a estrutura da tabela subscriptions
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';

-- 2. Verificar os registros da tabela subscriptions
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
LIMIT 10;

-- 3. Verificar se há algum problema com o plano 'premium'
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
    plan = 'premium'
ORDER BY 
    created_at DESC;

-- 4. Verificar se há algum problema com o status 'active'
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
    created_at DESC;

-- 5. Corrigir possíveis problemas com a tabela subscriptions
DO $$
DECLARE
    user_id_var UUID;
    subscription_id_var UUID;
BEGIN
    -- Obter o ID do usuário da assinatura mais recente
    SELECT user_id INTO user_id_var
    FROM subscriptions
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF user_id_var IS NOT NULL THEN
        -- Verificar se o usuário tem uma assinatura premium
        SELECT id INTO subscription_id_var
        FROM subscriptions
        WHERE user_id = user_id_var AND plan = 'premium' AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF subscription_id_var IS NULL THEN
            -- Criar uma nova assinatura premium para o usuário
            INSERT INTO subscriptions (
                user_id, 
                plan, 
                status, 
                current_period_starts_at, 
                current_period_ends_at, 
                created_at, 
                updated_at
            )
            VALUES (
                user_id_var,
                'premium',
                'active',
                NOW(),
                NOW() + INTERVAL '1 month',
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Criada nova assinatura premium para o usuário %', user_id_var;
        ELSE
            -- Atualizar a assinatura existente
            UPDATE subscriptions
            SET 
                status = 'active',
                updated_at = NOW(),
                current_period_ends_at = NOW() + INTERVAL '1 month'
            WHERE id = subscription_id_var;
            
            RAISE NOTICE 'Atualizada assinatura premium existente para o usuário %', user_id_var;
        END IF;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado na tabela subscriptions';
    END IF;
END
$$; 
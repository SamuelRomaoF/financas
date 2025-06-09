-- Script para obter o UUID do usuário atual

-- 1. Obter o UUID do usuário atual
SELECT 
    auth.uid() AS seu_uuid;

-- 2. Obter informações sobre as assinaturas do usuário
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
    user_id = auth.uid()
ORDER BY 
    created_at DESC;

-- 3. Obter informações sobre as contas bancárias do usuário
SELECT 
    id,
    name,
    type,
    balance,
    created_at
FROM 
    banks
WHERE 
    user_id = auth.uid()
ORDER BY 
    created_at DESC;

-- 4. Instruções para uso
SELECT 
    'Copie o valor do seu UUID acima e substitua no script testar_limite_contas.sql' AS instrucao; 
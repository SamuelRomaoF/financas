-- Script para verificar diretamente o banco de dados

-- 1. Verificar a estrutura da tabela banks
\d public.banks

-- 2. Verificar se há algum erro de permissão
SELECT has_table_privilege(current_user, 'public.banks', 'INSERT');

-- 3. Verificar se há algum hook de validação na tabela
SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'public.banks'::regclass;

-- 4. Verificar todas as funções no esquema public
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM 
    pg_proc
WHERE 
    pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND prosrc ILIKE '%bank%';

-- 5. Verificar a tabela subscriptions
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'subscriptions';

-- 6. Verificar os registros da tabela subscriptions
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

-- 7. Verificar se há algum erro específico relacionado ao plano 'active'
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

-- 8. Criar uma função para testar a inserção
CREATE OR REPLACE FUNCTION test_bank_insert(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    BEGIN
        INSERT INTO public.banks (
            user_id, 
            name, 
            type, 
            balance
        ) VALUES (
            user_uuid,
            'Teste',
            'checking',
            0
        );
        result := 'Inserção bem-sucedida';
    EXCEPTION WHEN OTHERS THEN
        result := 'Erro: ' || SQLERRM;
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql; 
-- Script que apenas remove todos os triggers e funções relacionadas

-- Remover todos os triggers na tabela banks
DROP TRIGGER IF EXISTS check_bank_account_limit_trigger ON public.banks;
DROP TRIGGER IF EXISTS check_accounts_limit_trigger ON public.banks;
DROP TRIGGER IF EXISTS banks_limit_check_trigger ON public.banks;
DROP TRIGGER IF EXISTS validate_bank_account_limit_trigger ON public.banks;
DROP TRIGGER IF EXISTS bank_limit_trigger ON public.banks;
DROP TRIGGER IF EXISTS allow_bank_insert_trigger ON public.banks;

-- Remover todas as funções relacionadas
DROP FUNCTION IF EXISTS check_bank_account_limit() CASCADE;
DROP FUNCTION IF EXISTS check_accounts_limit() CASCADE;
DROP FUNCTION IF EXISTS banks_limit_check() CASCADE;
DROP FUNCTION IF EXISTS validate_bank_account_limit() CASCADE;
DROP FUNCTION IF EXISTS bank_limit() CASCADE;
DROP FUNCTION IF EXISTS allow_bank_insert() CASCADE;

-- Listar todos os triggers restantes na tabela banks
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'public.banks'::regclass
    AND tgname NOT LIKE 'pg_%'; 
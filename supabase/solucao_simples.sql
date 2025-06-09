-- Script simples para remover a verificação de limite de contas bancárias

-- 1. Remover todos os triggers na tabela banks
DROP TRIGGER IF EXISTS check_bank_account_limit_trigger ON public.banks;
DROP TRIGGER IF EXISTS check_accounts_limit_trigger ON public.banks;
DROP TRIGGER IF EXISTS banks_limit_check_trigger ON public.banks;
DROP TRIGGER IF EXISTS validate_bank_account_limit_trigger ON public.banks;
DROP TRIGGER IF EXISTS bank_limit_trigger ON public.banks;

-- 2. Remover todas as funções relacionadas
DROP FUNCTION IF EXISTS check_bank_account_limit() CASCADE;
DROP FUNCTION IF EXISTS check_accounts_limit() CASCADE;
DROP FUNCTION IF EXISTS banks_limit_check() CASCADE;
DROP FUNCTION IF EXISTS validate_bank_account_limit() CASCADE;
DROP FUNCTION IF EXISTS bank_limit() CASCADE;

-- 3. Criar uma função simples que sempre permite inserção
CREATE OR REPLACE FUNCTION allow_bank_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Sempre permite a inserção
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar um trigger que usa essa função
CREATE TRIGGER allow_bank_insert_trigger
BEFORE INSERT ON public.banks
FOR EACH ROW
EXECUTE FUNCTION allow_bank_insert(); 
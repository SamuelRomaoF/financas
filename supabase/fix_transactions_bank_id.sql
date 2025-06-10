-- Script para corrigir a restrição de chave estrangeira bank_id na tabela transactions

-- Passo 1: Verificar se a coluna bank_id existe na tabela transactions
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        AND column_name = 'bank_id'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'A coluna bank_id não existe na tabela transactions. Criando coluna...';
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN bank_id UUID REFERENCES public.banks(id) ON DELETE SET NULL';
    ELSE
        RAISE NOTICE 'A coluna bank_id já existe na tabela transactions.';
    END IF;
END $$;

-- Passo 2: Verificar e corrigir a restrição de chave estrangeira para permitir valores nulos
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Obter o nome da restrição de chave estrangeira
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conname = 'transactions_bank_id_fkey';

    -- Se a restrição existir, dropá-la e recriar com a configuração correta
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Recriando a restrição de chave estrangeira para permitir valores nulos...';
        
        -- Remover a restrição atual
        EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT ' || constraint_name;
        
        -- Recriar a restrição com a configuração correta
        EXECUTE 'ALTER TABLE public.transactions 
                ADD CONSTRAINT transactions_bank_id_fkey 
                FOREIGN KEY (bank_id) 
                REFERENCES public.banks(id) 
                ON DELETE SET NULL';
                
        RAISE NOTICE 'Restrição recriada com sucesso.';
    ELSE
        RAISE NOTICE 'A restrição transactions_bank_id_fkey não foi encontrada.';
    END IF;
END $$;

-- Passo 3: Verificar se a coluna bank_id está configurada para aceitar valores nulos
DO $$
DECLARE
    column_nullable BOOLEAN;
BEGIN
    SELECT (is_nullable = 'YES') INTO column_nullable
    FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'bank_id';

    IF NOT column_nullable THEN
        RAISE NOTICE 'Alterando a coluna bank_id para aceitar valores nulos...';
        EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN bank_id DROP NOT NULL';
        RAISE NOTICE 'Coluna bank_id agora aceita valores nulos.';
    ELSE
        RAISE NOTICE 'A coluna bank_id já aceita valores nulos.';
    END IF;
END $$;

-- Resumo da estrutura atual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'transactions'
ORDER BY 
    ordinal_position; 
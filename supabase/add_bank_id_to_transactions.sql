-- Script para adicionar a coluna bank_id à tabela transactions

-- Verificar se a coluna bank_id já existe
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

    -- Se a coluna não existir, adicionar
    IF NOT column_exists THEN
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN bank_id UUID REFERENCES public.banks(id) ON DELETE SET NULL';
        RAISE NOTICE 'Coluna bank_id adicionada à tabela transactions';
    ELSE
        RAISE NOTICE 'A coluna bank_id já existe na tabela transactions';
    END IF;
END
$$;

-- Criar um índice para melhorar o desempenho das consultas
DO $$
DECLARE
    index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'transactions_bank_id_idx'
    ) INTO index_exists;

    -- Se o índice não existir, criar
    IF NOT index_exists THEN
        EXECUTE 'CREATE INDEX transactions_bank_id_idx ON public.transactions(bank_id)';
        RAISE NOTICE 'Índice transactions_bank_id_idx criado';
    ELSE
        RAISE NOTICE 'O índice transactions_bank_id_idx já existe';
    END IF;
END
$$;

-- Verificar se a tabela transactions existe
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'transactions'
    ) INTO table_exists;

    -- Se a tabela não existir, mostrar mensagem
    IF NOT table_exists THEN
        RAISE NOTICE 'A tabela transactions não existe. Crie a tabela antes de executar este script.';
    END IF;
END
$$;

-- Mostrar estrutura atual da tabela transactions
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'transactions'
ORDER BY 
    ordinal_position; 
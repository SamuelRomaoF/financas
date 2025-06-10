-- Script para adicionar campos de parcelas à tabela transactions

-- Passo 1: Adicionar coluna para o número total de parcelas
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        AND column_name = 'installments_total'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna installments_total à tabela transactions...';
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN installments_total INTEGER DEFAULT 1';
        RAISE NOTICE 'Coluna installments_total adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna installments_total já existe na tabela transactions.';
    END IF;
END $$;

-- Passo 2: Adicionar coluna para o número atual da parcela
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        AND column_name = 'installment_number'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna installment_number à tabela transactions...';
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN installment_number INTEGER DEFAULT 1';
        RAISE NOTICE 'Coluna installment_number adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna installment_number já existe na tabela transactions.';
    END IF;
END $$;

-- Passo 3: Adicionar coluna para armazenar o ID da transação principal (para agrupar parcelas)
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        AND column_name = 'parent_transaction_id'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna parent_transaction_id à tabela transactions...';
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL';
        RAISE NOTICE 'Coluna parent_transaction_id adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna parent_transaction_id já existe na tabela transactions.';
    END IF;
END $$;

-- Passo 4: Adicionar coluna para o valor original da transação (para cálculos)
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        AND column_name = 'original_amount'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna original_amount à tabela transactions...';
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN original_amount NUMERIC';
        RAISE NOTICE 'Coluna original_amount adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna original_amount já existe na tabela transactions.';
    END IF;
END $$;

-- Passo 5: Adicionar coluna para o identificador do cartão de crédito
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        AND column_name = 'credit_card_id'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna credit_card_id à tabela transactions...';
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL';
        RAISE NOTICE 'Coluna credit_card_id adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna credit_card_id já existe na tabela transactions.';
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
-- Script para verificar e corrigir problemas com credit_card_id na tabela transactions

-- Passo 1: Verificar se a coluna credit_card_id existe na tabela transactions
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
        RAISE NOTICE 'A coluna credit_card_id não existe na tabela transactions. Criando coluna...';
        EXECUTE 'ALTER TABLE public.transactions ADD COLUMN credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL';
        RAISE NOTICE 'Coluna credit_card_id adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna credit_card_id já existe na tabela transactions.';
    END IF;
END $$;

-- Passo 2: Verificar se a restrição de chave estrangeira está correta
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Obter o nome da restrição de chave estrangeira
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conname = 'transactions_credit_card_id_fkey';

    -- Se a restrição existir, verificar se está configurada corretamente
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Verificando a restrição de chave estrangeira credit_card_id...';
        
        -- Remover a restrição atual
        EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT ' || constraint_name;
        
        -- Recriar a restrição com a configuração correta
        EXECUTE 'ALTER TABLE public.transactions 
                ADD CONSTRAINT transactions_credit_card_id_fkey 
                FOREIGN KEY (credit_card_id) 
                REFERENCES public.credit_cards(id) 
                ON DELETE SET NULL';
                
        RAISE NOTICE 'Restrição recriada com sucesso.';
    ELSE
        RAISE NOTICE 'A restrição transactions_credit_card_id_fkey não foi encontrada. Criando...';
        
        -- Criar a restrição
        EXECUTE 'ALTER TABLE public.transactions 
                ADD CONSTRAINT transactions_credit_card_id_fkey 
                FOREIGN KEY (credit_card_id) 
                REFERENCES public.credit_cards(id) 
                ON DELETE SET NULL';
                
        RAISE NOTICE 'Restrição criada com sucesso.';
    END IF;
END $$;

-- Passo 3: Verificar se a coluna credit_card_id está configurada para aceitar valores nulos
DO $$
DECLARE
    column_nullable BOOLEAN;
BEGIN
    SELECT (is_nullable = 'YES') INTO column_nullable
    FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'credit_card_id';

    IF NOT column_nullable THEN
        RAISE NOTICE 'Alterando a coluna credit_card_id para aceitar valores nulos...';
        EXECUTE 'ALTER TABLE public.transactions ALTER COLUMN credit_card_id DROP NOT NULL';
        RAISE NOTICE 'Coluna credit_card_id agora aceita valores nulos.';
    ELSE
        RAISE NOTICE 'A coluna credit_card_id já aceita valores nulos.';
    END IF;
END $$;

-- Passo 4: Criar um índice para melhorar o desempenho das consultas
DO $$
DECLARE
    index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'transactions_credit_card_id_idx'
    ) INTO index_exists;

    -- Se o índice não existir, criar
    IF NOT index_exists THEN
        EXECUTE 'CREATE INDEX transactions_credit_card_id_idx ON public.transactions(credit_card_id)';
        RAISE NOTICE 'Índice transactions_credit_card_id_idx criado';
    ELSE
        RAISE NOTICE 'O índice transactions_credit_card_id_idx já existe';
    END IF;
END $$;

-- Verificar transações atuais com credit_card_id
SELECT COUNT(*) as transactions_with_credit_card_id
FROM public.transactions
WHERE credit_card_id IS NOT NULL;

-- Verificar se há transações com método de pagamento 'card' que não têm credit_card_id
SELECT COUNT(*) as card_transactions_without_credit_card_id
FROM public.transactions
WHERE payment_method = 'card' AND credit_card_id IS NULL;

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
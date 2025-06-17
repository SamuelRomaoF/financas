-- Script para adicionar coluna paid_installments à tabela loans

-- Verificar se a coluna já existe
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'loans'
        AND column_name = 'paid_installments'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna paid_installments à tabela loans...';
        EXECUTE 'ALTER TABLE public.loans ADD COLUMN paid_installments INTEGER DEFAULT 0';
        RAISE NOTICE 'Coluna paid_installments adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna paid_installments já existe na tabela loans.';
    END IF;
END $$;

-- Atualizar os empréstimos existentes para calcular parcelas pagas
DO $$
DECLARE
    loan_record RECORD;
    start_date DATE;
    next_payment_date DATE;
    months_passed INTEGER;
BEGIN
    FOR loan_record IN SELECT id, start_date, next_payment_date, installments FROM public.loans WHERE paid_installments IS NULL LOOP
        -- Calcular parcelas pagas com base na data de início e próximo pagamento
        start_date := loan_record.start_date;
        next_payment_date := loan_record.next_payment_date;
        
        -- Calcular meses passados entre a data de início e a próxima data de pagamento
        months_passed := (EXTRACT(YEAR FROM next_payment_date) - EXTRACT(YEAR FROM start_date)) * 12 +
                         (EXTRACT(MONTH FROM next_payment_date) - EXTRACT(MONTH FROM start_date));
        
        -- Atualizar o valor de parcelas pagas
        UPDATE public.loans
        SET paid_installments = GREATEST(0, months_passed)
        WHERE id = loan_record.id;
        
        RAISE NOTICE 'Atualizado empréstimo ID %, parcelas pagas: %', loan_record.id, GREATEST(0, months_passed);
    END LOOP;
END $$; 

-- Verificar se a coluna já existe
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'loans'
        AND column_name = 'paid_installments'
    ) INTO column_exists;

    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna paid_installments à tabela loans...';
        EXECUTE 'ALTER TABLE public.loans ADD COLUMN paid_installments INTEGER DEFAULT 0';
        RAISE NOTICE 'Coluna paid_installments adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A coluna paid_installments já existe na tabela loans.';
    END IF;
END $$;

-- Atualizar os empréstimos existentes para calcular parcelas pagas
DO $$
DECLARE
    loan_record RECORD;
    start_date DATE;
    next_payment_date DATE;
    months_passed INTEGER;
BEGIN
    FOR loan_record IN SELECT id, start_date, next_payment_date, installments FROM public.loans WHERE paid_installments IS NULL LOOP
        -- Calcular parcelas pagas com base na data de início e próximo pagamento
        start_date := loan_record.start_date;
        next_payment_date := loan_record.next_payment_date;
        
        -- Calcular meses passados entre a data de início e a próxima data de pagamento
        months_passed := (EXTRACT(YEAR FROM next_payment_date) - EXTRACT(YEAR FROM start_date)) * 12 +
                         (EXTRACT(MONTH FROM next_payment_date) - EXTRACT(MONTH FROM start_date));
        
        -- Atualizar o valor de parcelas pagas
        UPDATE public.loans
        SET paid_installments = GREATEST(0, months_passed)
        WHERE id = loan_record.id;
        
        RAISE NOTICE 'Atualizado empréstimo ID %, parcelas pagas: %', loan_record.id, GREATEST(0, months_passed);
    END LOOP;
END $$; 
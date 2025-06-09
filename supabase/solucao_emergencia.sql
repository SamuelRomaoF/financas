-- SOLUÇÃO DE EMERGÊNCIA
-- Este script remove TODAS as verificações de limite de contas bancárias
-- Use apenas se os outros scripts não funcionarem

-- 1. Remover TODOS os triggers na tabela banks
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
        WHERE relname = 'banks' AND tgname NOT LIKE 'pg_%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.tgname || ' ON public.banks CASCADE;';
        RAISE NOTICE 'Removido trigger: %', trigger_rec.tgname;
    END LOOP;
END
$$;

-- 2. Remover TODAS as funções que podem estar relacionadas ao limite de contas
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    FOR func_rec IN 
        SELECT proname 
        FROM pg_proc
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND (prosrc ILIKE '%bank%limit%' OR prosrc ILIKE '%account%limit%' OR prosrc ILIKE '%conta%limite%')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_rec.proname || '() CASCADE;';
        RAISE NOTICE 'Removida função: %', func_rec.proname;
    END LOOP;
END
$$;

-- 3. Criar uma função vazia para substituir qualquer verificação de limite
CREATE OR REPLACE FUNCTION check_bank_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Não faz nenhuma verificação, apenas permite a inserção
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar um trigger simples que não bloqueia nada
CREATE TRIGGER check_bank_account_limit_trigger
BEFORE INSERT ON public.banks
FOR EACH ROW
EXECUTE FUNCTION check_bank_account_limit();

-- 5. Garantir que as políticas RLS estão configuradas corretamente
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem ver suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem ver suas próprias contas bancárias"
        ON public.banks
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem inserir suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem inserir suas próprias contas bancárias"
        ON public.banks
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem atualizar suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem atualizar suas próprias contas bancárias"
        ON public.banks
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem excluir suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem excluir suas próprias contas bancárias"
        ON public.banks
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$; 
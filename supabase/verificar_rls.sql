-- Script para verificar as políticas RLS na tabela banks

-- 1. Verificar se RLS está ativado na tabela banks
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM 
    pg_class
WHERE 
    relname = 'banks';

-- 2. Listar todas as políticas RLS na tabela banks
SELECT 
    polname AS policy_name,
    polcmd AS command_type,
    pg_get_expr(polqual, polrelid) AS using_expression,
    pg_get_expr(polwithcheck, polrelid) AS with_check_expression
FROM 
    pg_policy
WHERE 
    polrelid = 'public.banks'::regclass;

-- 3. Verificar se há alguma função sendo chamada nas políticas
SELECT 
    p.polname AS policy_name,
    p.polcmd AS command_type,
    pg_get_expr(p.polqual, p.polrelid) AS using_expression,
    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expression,
    f.proname AS function_name
FROM 
    pg_policy p
JOIN 
    pg_depend d ON d.objid = p.oid
JOIN 
    pg_proc f ON f.oid = d.refobjid
WHERE 
    p.polrelid = 'public.banks'::regclass;

-- 4. Garantir que as políticas RLS básicas estejam configuradas corretamente
DO $$
BEGIN
    -- Habilitar RLS na tabela banks
    ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
    
    -- Criar política para SELECT se não existir
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem ver suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem ver suas próprias contas bancárias"
        ON public.banks
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
    
    -- Criar política para INSERT se não existir
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem inserir suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem inserir suas próprias contas bancárias"
        ON public.banks
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Criar política para UPDATE se não existir
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'banks' AND policyname = 'Usuários podem atualizar suas próprias contas bancárias'
    ) THEN
        CREATE POLICY "Usuários podem atualizar suas próprias contas bancárias"
        ON public.banks
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
    
    -- Criar política para DELETE se não existir
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
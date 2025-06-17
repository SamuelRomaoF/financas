-- CORREÇÃO FINAL - FUNÇÃO GET_EXPENSES_BY_CATEGORY
-- Corrige problemas na função de despesas por categoria

-- Remover a função existente
DROP FUNCTION IF EXISTS public.get_expense_by_category;
DROP FUNCTION IF EXISTS public.get_expenses_by_category(TEXT);

-- Recriar a função corretamente
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(user_id_param TEXT)
RETURNS TABLE (
    category_id TEXT,
    category_name TEXT,
    total_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id::TEXT as category_id,
        c.name::TEXT as category_name,
        COALESCE(SUM(t.amount), 0)::NUMERIC as total_amount
    FROM 
        categories c
    LEFT JOIN 
        transactions t ON c.id = t.category_id 
                     AND t.user_id::TEXT = user_id_param 
                     AND t.type = 'expense'
    WHERE 
        c.user_id::TEXT = user_id_param OR c.is_default = true
    GROUP BY 
        c.id, c.name
    ORDER BY 
        total_amount DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(TEXT) TO authenticated;

-- Verificar resultado
DO $$
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Função get_expenses_by_category corrigida com sucesso!';
    RAISE NOTICE '----------------------------------------';
END $$; 
-- Corrige problemas na função de despesas por categoria

-- Remover a função existente
DROP FUNCTION IF EXISTS public.get_expense_by_category;
DROP FUNCTION IF EXISTS public.get_expenses_by_category(TEXT);

-- Recriar a função corretamente
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(user_id_param TEXT)
RETURNS TABLE (
    category_id TEXT,
    category_name TEXT,
    total_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id::TEXT as category_id,
        c.name::TEXT as category_name,
        COALESCE(SUM(t.amount), 0)::NUMERIC as total_amount
    FROM 
        categories c
    LEFT JOIN 
        transactions t ON c.id = t.category_id 
                     AND t.user_id::TEXT = user_id_param 
                     AND t.type = 'expense'
    WHERE 
        c.user_id::TEXT = user_id_param OR c.is_default = true
    GROUP BY 
        c.id, c.name
    ORDER BY 
        total_amount DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(TEXT) TO authenticated;

-- Verificar resultado
DO $$
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Função get_expenses_by_category corrigida com sucesso!';
    RAISE NOTICE '----------------------------------------';
END $$; 
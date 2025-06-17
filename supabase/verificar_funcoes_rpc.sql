-- SCRIPT PARA VERIFICAR FUNÇÕES RPC
-- Este script verifica se as funções RPC estão corretamente instaladas

-- 1. Verificar se as funções existem
SELECT 
    proname as nome_funcao, 
    pronargs as num_parametros,
    prorettype::regtype as tipo_retorno
FROM 
    pg_proc 
WHERE 
    proname IN ('get_expenses_by_category', 'get_monthly_summary')
ORDER BY 
    proname;

-- 2. Verificar permissões
SELECT
    p.proname as nome_funcao,
    r.rolname as nome_role,
    has_function_privilege(r.oid, p.oid, 'execute') as tem_permissao_execucao
FROM
    pg_proc p,
    pg_roles r
WHERE
    p.proname IN ('get_expenses_by_category', 'get_monthly_summary')
    AND r.rolname = 'authenticated';

-- 3. Verificar definição da função get_expenses_by_category
SELECT 
    pg_get_functiondef(oid) as definicao_funcao
FROM 
    pg_proc 
WHERE 
    proname = 'get_expenses_by_category';

-- 4. Verificar definição da função get_monthly_summary
SELECT 
    pg_get_functiondef(oid) as definicao_funcao
FROM 
    pg_proc 
WHERE 
    proname = 'get_monthly_summary'; 
-- Este script verifica se as funções RPC estão corretamente instaladas

-- 1. Verificar se as funções existem
SELECT 
    proname as nome_funcao, 
    pronargs as num_parametros,
    prorettype::regtype as tipo_retorno
FROM 
    pg_proc 
WHERE 
    proname IN ('get_expenses_by_category', 'get_monthly_summary')
ORDER BY 
    proname;

-- 2. Verificar permissões
SELECT
    p.proname as nome_funcao,
    r.rolname as nome_role,
    has_function_privilege(r.oid, p.oid, 'execute') as tem_permissao_execucao
FROM
    pg_proc p,
    pg_roles r
WHERE
    p.proname IN ('get_expenses_by_category', 'get_monthly_summary')
    AND r.rolname = 'authenticated';

-- 3. Verificar definição da função get_expenses_by_category
SELECT 
    pg_get_functiondef(oid) as definicao_funcao
FROM 
    pg_proc 
WHERE 
    proname = 'get_expenses_by_category';

-- 4. Verificar definição da função get_monthly_summary
SELECT 
    pg_get_functiondef(oid) as definicao_funcao
FROM 
    pg_proc 
WHERE 
    proname = 'get_monthly_summary'; 
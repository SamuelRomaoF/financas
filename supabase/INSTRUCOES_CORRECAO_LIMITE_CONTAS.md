# Instruções para Corrigir o Limite de Contas Bancárias no Supabase

## Problema

O sistema está apresentando um erro ao tentar adicionar contas bancárias mesmo após a atualização do plano para Premium. O erro indica que o limite de contas bancárias está configurado incorretamente no banco de dados.

Mensagem de erro: `Você atingiu o limite de 0 conta(s) para o seu plano active.`

## Solução

O problema está relacionado a um trigger no banco de dados que verifica o limite de contas bancárias com base no plano de assinatura. O trigger atual está configurado incorretamente ou não está reconhecendo a atualização do plano.

### Opção 1: Correção Específica do Erro (Recomendada)

Este script foi criado especificamente para corrigir o erro "Você atingiu o limite de 0 conta(s) para o seu plano active".

1. Acesse o Dashboard do Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `corrigir_erro_limite_0.sql`
5. Execute a consulta

### Opção 2: Diagnóstico Completo

Se a Opção 1 não resolver o problema, este script vai diagnosticar em detalhes o que está acontecendo no banco de dados.

1. Acesse o Dashboard do Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `diagnostico_contas.sql`
5. Execute a consulta
6. Analise os resultados para identificar o problema específico

### Opção 3: Verificar Problemas com Assinaturas

Este script verifica se há problemas com a tabela de assinaturas (subscriptions).

1. Acesse o Dashboard do Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `verificar_subscriptions.sql`
5. Execute a consulta

### Opção 4: Solução de Emergência (Último Recurso)

Se nenhuma das opções anteriores resolver o problema, esta solução remove completamente todas as verificações de limite de contas bancárias.

1. Acesse o Dashboard do Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `solucao_emergencia.sql`
5. Execute a consulta

## Verificação

Após executar um dos scripts, tente adicionar uma nova conta bancária na aplicação. Se o problema persistir, tente a próxima opção de solução.

## Observações Importantes

- Estes scripts modificam a estrutura do banco de dados. É recomendável fazer um backup antes de executá-los.
- A solução de emergência deve ser usada apenas como último recurso, pois remove completamente as verificações de limite.
- Os scripts assumem que a tabela de assinaturas é chamada `subscriptions` e tem uma coluna `plan` que armazena o plano do usuário.

## Verificação Manual

Se preferir verificar manualmente o problema antes de aplicar a correção, execute as seguintes consultas no SQL Editor do Supabase:

```sql
-- Verificar o plano atual do usuário
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;

-- Verificar as contas bancárias existentes
SELECT * FROM banks WHERE user_id = 'seu_user_id';

-- Verificar os triggers existentes na tabela banks
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'public.banks'::regclass;
``` 
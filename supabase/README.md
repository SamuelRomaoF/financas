# Solução para o Problema de Limite de Contas Bancárias

Este diretório contém scripts SQL para resolver o problema de limite de contas bancárias no aplicativo de finanças pessoais.

## Problema

O problema ocorre quando um usuário tenta adicionar contas bancárias e recebe o erro:
```
Você atingiu o limite de 0 conta(s) para o seu plano active
```

Este erro ocorre devido a um trigger no banco de dados que verifica incorretamente o limite de contas bancárias.

## Solução

Existem vários scripts disponíveis para resolver o problema:

### 1. Solução Completa (Recomendada)

Execute o script `configurar_limite_premium_robusto.sql` para:
- Remover todos os triggers existentes relacionados ao limite de contas
- Criar uma nova função que implementa o limite correto (5 contas para premium, 1 para free)
- Configurar as políticas RLS corretamente

```sql
-- No console SQL do Supabase
\i configurar_limite_premium_robusto.sql
```

### 2. Solução Simples

Se você precisa apenas de uma solução rápida, execute o script `configurar_limite_premium.sql`:
```sql
-- No console SQL do Supabase
\i configurar_limite_premium.sql
```

### 3. Diagnóstico

Para diagnosticar problemas, você pode usar:
- `verificar_rls.sql` - Verifica as políticas RLS
- `verificar_banco.sql` - Verifica a estrutura do banco de dados
- `obter_uuid_usuario.sql` - Obtém o UUID do usuário atual
- `testar_limite_contas.sql` - Testa se o limite está funcionando corretamente

## Como Testar

1. Execute o script para obter seu UUID:
```sql
\i obter_uuid_usuario.sql
```

2. Copie o valor do UUID retornado

3. Edite o script `testar_limite_contas.sql` e substitua `'SEU-UUID-AQUI'` pelo seu UUID

4. Execute o script de teste:
```sql
\i testar_limite_contas.sql
```

## Limites por Plano

| Plano   | Limite de Contas |
|---------|------------------|
| Free    | 1 conta          |
| Premium | 5 contas         |

## Solução de Emergência

Se você ainda estiver enfrentando problemas, pode usar o script `solucao_final.sql` que tenta resolver o problema de todas as formas possíveis.

## Contato

Se precisar de ajuda adicional, entre em contato com o suporte técnico. 
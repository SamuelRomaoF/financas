-- Remove a função antiga se existir
drop function if exists public.delete_user();

-- Cria a função para deletar o usuário atual
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  -- Pega o ID do usuário atual
  uid := auth.uid();
  
  -- Verifica se existe um usuário autenticado
  if uid is null then
    raise exception 'Não autorizado';
  end if;

  -- Deleta os dados do usuário em todas as tabelas (se existirem)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'transactions') then
    delete from public.transactions where user_id = uid;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'bank_accounts') then
    delete from public.bank_accounts where user_id = uid;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'categories') then
    delete from public.categories where user_id = uid;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'goals') then
    delete from public.goals where user_id = uid;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') then
    delete from public.users where id = uid;
  end if;

  -- Por fim, deleta o usuário da tabela auth.users
  delete from auth.users where id = uid;
end;
$$; 
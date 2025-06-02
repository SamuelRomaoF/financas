-- Cria a função para deletar o usuário atual
create or replace function public.delete_user()
returns void
language plpgsql
security definer
as $$
begin
  -- Verifica se existe um usuário autenticado
  if auth.uid() is null then
    raise exception 'Não autorizado';
  end if;

  -- Deleta o usuário atual
  delete from auth.users where id = auth.uid();
end;
$$; 
-- Cria a função para verificar o acesso do usuário
create or replace function public.check_user_access(user_uuid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_record record;
begin
  -- Busca a assinatura mais recente do usuário
  select *
  into subscription_record
  from subscriptions
  where user_id = user_uuid
  order by created_at desc
  limit 1;

  -- Se não tem assinatura, não tem acesso
  if subscription_record is null then
    return false;
  end if;

  -- Verifica se tem plano pago ativo
  if subscription_record.plan != 'free' and subscription_record.status = 'active' then
    return true;
  end if;

  -- Verifica se está no período de trial
  if subscription_record.trial_ends_at is not null and subscription_record.trial_ends_at > now() then
    return true;
  end if;

  -- Se chegou aqui, não tem acesso
  return false;
end;
$$; 
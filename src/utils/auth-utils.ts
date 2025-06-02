import { User } from '@supabase/supabase-js';
import { SubscriptionPlan } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';

export async function getUserPlanSafely(user: User | null): Promise<SubscriptionPlan> {
  if (!user?.id) {
    console.log('[getUserPlanSafely] Usuário não encontrado ou sem ID');
    return 'free';
  }

  try {
    console.log('[getUserPlanSafely] Buscando assinatura para:', user.id);
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('[getUserPlanSafely] Resultado da busca:', { subscription, error });

    if (error || !subscription) {
      console.log('[getUserPlanSafely] Nenhuma assinatura encontrada');
      return 'free';
    }

    console.log('[getUserPlanSafely] Retornando plano:', subscription.plan);
    return subscription.plan;
  } catch (error) {
    console.error('[getUserPlanSafely] Erro:', error);
    return 'free';
  }
}

export async function initializeAuthState() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[initializeAuthState] Sessão inicial:', session);
    
    if (!session?.user) {
      console.log('[initializeAuthState] Nenhuma sessão encontrada');
      return { user: null, plan: 'free' as SubscriptionPlan };
    }

    const plan = await getUserPlanSafely(session.user);
    console.log('[initializeAuthState] Plano inicial:', plan);
    
    return { user: session.user, plan };
  } catch (error) {
    console.error('[initializeAuthState] Erro:', error);
    return { user: null, plan: 'free' as SubscriptionPlan };
  }
}

export async function handleAuthStateChange(user: User | null): Promise<SubscriptionPlan> {
  if (!user) {
    console.log('[handleAuthStateChange] Usuário não encontrado');
    return 'free';
  }

  const plan = await getUserPlanSafely(user);
  console.log('[handleAuthStateChange] Novo plano:', plan);
  return plan;
} 
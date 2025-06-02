import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

const PLAN_CACHE_KEY = '@app:user-plan';

export function usePlanSync() {
  const { user, userPlan } = useAuth();
  const { subscription } = useSubscription();

  useEffect(() => {
    // Se temos uma assinatura válida
    if (subscription?.plan === 'premium') {
      // Salva o plano no localStorage
      localStorage.setItem(PLAN_CACHE_KEY, subscription.plan);
    }
  }, [subscription]);

  useEffect(() => {
    // Se o plano atual é free mas temos um plano premium no cache
    if (userPlan === 'free' && localStorage.getItem(PLAN_CACHE_KEY) === 'premium') {
      // Força um único reload
      const hasReloaded = sessionStorage.getItem('reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('reloaded', 'true');
        window.location.reload();
      }
    }
  }, [userPlan]);

  // Limpa o cache quando o usuário sair
  useEffect(() => {
    if (!user) {
      localStorage.removeItem(PLAN_CACHE_KEY);
      sessionStorage.removeItem('reloaded');
    }
  }, [user]);

  return null;
} 
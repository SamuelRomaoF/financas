// console.log('useSubscription.ts: ARQUIVO SENDO CARREGADO NO NAVEGADOR - INÍCIO'); // LOG DE TESTE
import { User } from '@supabase/supabase-js'; // Importar User se já não estiver
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from './useAuth';

export type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];
export type SubscriptionStatus = 'active' | 'canceled' | 'expired';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export function useSubscription() {
  // console.log('useSubscription.ts: HOOK useSubscription SENDO CHAMADO'); // LOG DE TESTE
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const hookUserId = user?.id;

  const fetchSubscription = useCallback(async () => {
    if (!hookUserId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', hookUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      // console.error('Erro ao buscar assinatura:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [hookUserId]);

  useEffect(() => {
    // Limpar qualquer cache antes de buscar a assinatura
    const refreshData = async () => {
      try {
        // Força uma atualização explícita do token de autenticação
        await supabase.auth.refreshSession();
        console.log('Sessão atualizada, buscando assinatura atualizada...');
        
        // Agora buscar os dados atualizados
        fetchSubscription();
      } catch (error) {
        console.error('Erro ao atualizar sessão:', error);
        fetchSubscription();
      }
    };
    
    refreshData();
  }, [fetchSubscription]);

  const createTrialSubscription = async (passedInUser?: User | null) => {
    const userIdToUse = passedInUser?.id;
    // console.log(`useSubscription - createTrialSubscription: ID do usuário recebido como argumento: ${userIdToUse}`);

    if (!userIdToUse) {
      // console.error('useSubscription - createTrialSubscription: Nenhum ID de usuário válido foi passado como argumento.');
      throw new Error('ID do usuário não fornecido para criar assinatura trial.');
    }

    try {
      // console.log(`useSubscription - createTrialSubscription: Prosseguindo com userId: ${userIdToUse} para operações no Supabase.`);

      const { data: existingSubscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userIdToUse)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingSubscription?.status === 'active') {
        setSubscription(existingSubscription);
        return { subscription: existingSubscription, error: null };
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userIdToUse,
          plan: 'free',
          status: 'active',
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      setSubscription(newSubscription);
      return { subscription: newSubscription, error: null };
    } catch (error) {
      // console.error('Erro ao criar assinatura trial:', error);
      return { subscription: null, error: error as Error };
    }
  };

  const updateSubscription = useCallback(async (plan: SubscriptionPlan) => {
    if (!hookUserId) return { error: new Error('Usuário não autenticado') };

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          trial_ends_at: null,
          current_period_starts_at: new Date().toISOString(),
          current_period_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          canceled_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', hookUserId)
        .select()
        .single();

      if (error) throw error;
      setSubscription(data);
      return { data, error: null };
    } catch (error) {
      // console.error('Erro ao atualizar assinatura:', error);
      return { data: null, error };
    }
  }, [hookUserId]);

  const cancelSubscription = useCallback(async () => {
    if (!hookUserId) return { error: new Error('Usuário não autenticado') };

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', hookUserId)
        .select()
        .single();

      if (error) throw error;
      setSubscription(data);
      return { data, error: null };
    } catch (error) {
      // console.error('Erro ao cancelar assinatura:', error);
      return { data: null, error };
    }
  }, [hookUserId]);

  const checkAccess = useCallback(async () => {
    if (!hookUserId) {
        // console.warn("useSubscription - checkAccess: hookUserId é nulo. Retornando false.");
        return false;
    }
    // console.log("useSubscription - checkAccess: Verificando acesso para hookUserId:", hookUserId);

    try {
      const { data: hasAccess } = await supabase.rpc('check_user_access', {
        user_uuid: hookUserId
      });
      // console.log("useSubscription - checkAccess: Resultado da RPC:", hasAccess);
      return hasAccess;
    } catch (error) {
      // console.error('Erro ao verificar acesso:', error);
      return false;
    }
  }, [hookUserId]);

  return {
    subscription,
    isLoading: loading,
    createTrialSubscription,
    updateSubscription,
    cancelSubscription,
    checkAccess,
  };
} 
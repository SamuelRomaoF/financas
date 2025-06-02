import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from './useAuth';

export type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];
export type SubscriptionStatus = 'active' | 'canceled' | 'expired';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createTrialSubscription = async () => {
    try {
      if (!user?.id) {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (user?.id) break;
        }
        if (!user?.id) {
          throw new Error('Usuário não autenticado. Por favor, tente fazer login novamente.');
        }
      }

      const { data: existingSubscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
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
          user_id: user.id,
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
      console.error('Erro ao criar assinatura trial:', error);
      return { subscription: null, error: error as Error };
    }
  };

  const updateSubscription = useCallback(async (plan: SubscriptionPlan) => {
    if (!userId) return { error: new Error('Usuário não autenticado') };

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
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      setSubscription(data);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      return { data: null, error };
    }
  }, [userId]);

  const cancelSubscription = useCallback(async () => {
    if (!userId) return { error: new Error('Usuário não autenticado') };

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      setSubscription(data);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return { data: null, error };
    }
  }, [userId]);

  const checkAccess = useCallback(async () => {
    if (!userId) return false;

    try {
      const { data: hasAccess } = await supabase.rpc('check_user_access', {
        user_uuid: userId
      });

      return hasAccess;
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      return false;
    }
  }, [userId]);

  return {
    subscription,
    isLoading: loading,
    createTrialSubscription,
    updateSubscription,
    cancelSubscription,
    checkAccess,
  };
} 
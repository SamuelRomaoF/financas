import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { SubscriptionPlan } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { getUserPlanSafely, handleAuthStateChange, initializeAuthState } from '../utils/auth-utils';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { user: initialUser, plan: initialPlan } = await initializeAuthState();
        
        if (!mounted) return;
        
        setUser(initialUser);
        setUserPlan(initialPlan);
        setLoading(false);
      } catch (error) {
        console.error('[useAuthState] Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const newUser = session?.user || null;
      setUser(newUser);

      if (newUser) {
        const newPlan = await handleAuthStateChange(newUser);
        if (mounted) {
          setUserPlan(newPlan);
        }
      } else {
        setUserPlan('free');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateUserPlan = async () => {
    if (!user) return;
    const newPlan = await getUserPlanSafely(user);
    setUserPlan(newPlan);
  };

  return {
    user,
    userPlan,
    loading,
    updateUserPlan
  };
} 
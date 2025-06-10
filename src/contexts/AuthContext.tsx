import { AuthError, AuthResponse, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  supabase: SupabaseClient<Database>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{
    data: AuthResponse['data'] | null;
    error: Error | null;
  }>;
  signUp: (email: string, password: string, name: string) => Promise<{
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  checkUserSubscription: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  supabase,
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  checkUserSubscription: async () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para atualizar o usuário
  const updateUser = (session: Session | null) => {
    setUser(session?.user || null);
  };

  useEffect(() => {
    // Verifica se já existe uma sessão, mas limita a frequência das chamadas
    let isSessionFetched = false;
    
    const getInitialSession = async () => {
      if (isSessionFetched) return;
      isSessionFetched = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        updateUser(session);
      } catch (error) {
        console.error("Erro ao buscar sessão inicial:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialSession();

    // Escuta mudanças na autenticação, mas com throttling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Apenas atualiza o usuário se houve mudança real
      const currentUserId = user?.id;
      const newUserId = session?.user?.id;
      
      if (currentUserId !== newUserId) {
        updateUser(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  const checkUserSubscription = async () => {
    if (!user) return false;
    
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      return subscription && subscription.status === 'active';
    } catch (error) {
      return false;
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      if (!rememberMe) {
        await supabase.auth.signOut();
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      updateUser(data.session);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`
        },
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      if (error instanceof AuthError) {
        return { error };
      }
      return { error: new Error('Erro ao criar conta. Tente novamente mais tarde.') };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      updateUser(null);
    } catch (error) {
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    supabase,
    signIn,
    signUp,
    signOut,
    checkUserSubscription,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
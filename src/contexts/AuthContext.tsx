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
    console.log('Atualizando usuário:', session?.user || null);
    setUser(session?.user || null);
  };

  useEffect(() => {
    // Verifica se já existe uma sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sessão inicial:', session);
      updateUser(session);
      setLoading(false);
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Mudança de estado de autenticação:', session);
      updateUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      console.error('Erro ao verificar assinatura:', error);
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

      console.log('Login bem-sucedido:', data.session);
      updateUser(data.session);

      // Verifica se o usuário tem um plano ativo
      const hasActivePlan = await checkUserSubscription();
      
      // Redireciona com base no plano
      if (hasActivePlan) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/planos';
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { data: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Iniciando registro com:', { email, name });
      
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
        console.error('Erro no registro:', error);
        throw error;
      }

      console.log('Registro bem-sucedido:', data);
      return { error: null };
    } catch (error) {
      console.error('Erro capturado no registro:', error);
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
      console.error('Erro ao fazer logout:', error);
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
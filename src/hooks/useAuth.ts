import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  const { user, loading, signIn, signUp, signOut, supabase } = context;

  const deleteAccount = async () => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não encontrado');
      }

      // A função RPC vai cuidar de deletar todos os dados e o usuário
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;

      // Se chegou aqui, deu tudo certo
      await signOut();
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      throw error;
    }
  };

  // Retorna todas as funções e dados do contexto
  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    supabase
  };
}
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// Definindo o tipo localmente para evitar problemas com o arquivo global
export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  bank_id?: string;
  category_id: string;
}

interface TransactionContextData {
  transactions: Transaction[];
  isLoading: boolean;
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id'>) => Promise<{ error: any }>;
  removeTransaction: (id: string) => Promise<{ error: any }>;
}

const TransactionContext = createContext<TransactionContextData | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          date,
          type,
          user_id,
          category_id, 
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }
      
      const formattedData = data?.map(t => ({
        ...t,
        id: t.id!,
        userId: t.user_id!,
        type: t.type as 'income' | 'expense',
        category: t.categories?.name || 'Sem Categoria',
        category_id: t.category_id,
      })) || [];

      setTransactions(formattedData as Transaction[]);
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user) {
      const err = new Error("Usuário não autenticado");
      console.error(err.message);
      return { error: err };
    }
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        description: transaction.description, 
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar transação:', error);
      return { error };
    }
    
    await fetchTransactions();
    return { error: null };
  };

  const removeTransaction = async (id: string) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao remover transação:', error);
        return { error };
    }
    
    setTransactions(prev => prev.filter(t => t.id !== id));
    return { error: null };
  };


  return (
    <TransactionContext.Provider value={{ transactions, isLoading, fetchTransactions, addTransaction, removeTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions deve ser usado dentro de um TransactionProvider');
  }
  return context;
}; 
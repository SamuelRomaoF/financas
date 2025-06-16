import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useBankAccounts } from './BankAccountContext';

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
  installments_total?: number;
  installment_number?: number;
  original_amount?: number;
  parent_transaction_id?: string;
  credit_card_id?: string;
}

interface TransactionFilters {
  searchTerm: string;
  type: 'all' | 'income' | 'expense';
  bankId?: string | null;
}

interface TransactionContextData {
  transactions: Transaction[];
  isLoading: boolean;
  hasMore: boolean;
  loadTransactions: (filters: TransactionFilters) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'category'>) => Promise<{ error: any }>;
  updateTransaction: (id: string, updates: Omit<Transaction, 'id' | 'user_id' | 'category'>) => Promise<{ error: any }>;
  removeTransaction: (id: string) => Promise<{ error: any }>;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextData | undefined>(undefined);

const TRANSACTIONS_PER_PAGE = 20;

// Criamos um evento personalizado para notificar atualizações de transações
export const transactionUpdatedEvent = new CustomEvent('transaction-updated');

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { refreshAccounts } = useBankAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>({
    searchTerm: '',
    type: 'all',
  });

  const internalFetch = useCallback(async (filters: TransactionFilters, page: number) => {
    if (!user) return { data: [], error: null };

    let query = supabase
      .from('transactions')
      .select(`
        id, description, amount, date, type, user_id, category_id, bank_id, credit_card_id,
        categories (name)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(page * TRANSACTIONS_PER_PAGE, (page + 1) * TRANSACTIONS_PER_PAGE - 1);

    if (filters.searchTerm) {
      query = query.ilike('description', `%${filters.searchTerm}%`);
    }
    if (filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters.bankId) {
      query = query.eq('bank_id', filters.bankId);
    }

    return await query;
  }, [user]);

  const formatTransactions = (data: any[]): Transaction[] => {
    return data.map(t => ({
      ...t,
      id: t.id!,
      userId: t.user_id!,
      type: t.type as 'income' | 'expense',
      category: t.categories?.name || 'Sem Categoria',
      category_id: t.category_id,
    }));
  };

  const loadTransactions = useCallback(async (filters: TransactionFilters) => {
    setCurrentFilters(filters);
    setCurrentPage(0);
    setIsLoading(true);
    try {
      const { data, error } = await internalFetch(filters, 0);
      if (error) throw error;

      const formatted = formatTransactions(data || []);
      setTransactions(formatted);
      setHasMore(formatted.length === TRANSACTIONS_PER_PAGE);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [internalFetch]);
  
  const loadMoreTransactions = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const nextPage = currentPage + 1;
    setIsLoading(true); // Re-using isLoading for simplicity, could be isLoadingMore
    try {
      const { data, error } = await internalFetch(currentFilters, nextPage);
      if (error) throw error;
      
      const formatted = formatTransactions(data || []);
      setTransactions(prev => [...prev, ...formatted]);
      setHasMore(formatted.length === TRANSACTIONS_PER_PAGE);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Erro ao carregar mais transações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [internalFetch, currentFilters, currentPage, hasMore, isLoading]);

  useEffect(() => {
    loadTransactions({ searchTerm: '', type: 'all' });
  }, [loadTransactions]);
  
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'category'>) => {
    if (!user) {
      const err = new Error("Usuário não autenticado");
      return { error: err };
    }
    
    // Criar uma cópia segura da transação
    const safeTransaction = { ...transaction, user_id: user.id };
    
    console.log('Enviando transação completa:', safeTransaction);
    
    const { error } = await supabase
      .from('transactions')
      .insert([safeTransaction]);

    if (error) {
      console.error('Erro ao adicionar transação:', error);
      return { error };
    }
    
    // Atualizar as contas bancárias para refletir as mudanças
    if (transaction.bank_id) {
      console.log('Atualizando contas bancárias após transação PIX...');
      try {
        await refreshAccounts();
        console.log('Contas bancárias atualizadas com sucesso!');
      } catch (refreshError) {
        console.error('Erro ao atualizar contas bancárias:', refreshError);
      }
    }
    
    await loadTransactions(currentFilters);
    
    // Disparar um evento para notificar que uma transação foi adicionada
    // Isso permitirá que outros componentes reajam à mudança
    document.dispatchEvent(transactionUpdatedEvent);
    
    return { error: null };
  };

  const updateTransaction = async (id: string, updates: Omit<Transaction, 'id' | 'user_id' | 'category'>) => {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar transação:', error);
      return { error };
    }

    await loadTransactions(currentFilters);
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

  const refreshTransactions = useCallback(async () => {
    await loadTransactions(currentFilters);
  }, [loadTransactions, currentFilters]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        isLoading,
        hasMore,
        loadTransactions,
        loadMoreTransactions,
        addTransaction,
        updateTransaction,
        removeTransaction,
        refreshTransactions,
      }}
    >
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
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

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  transactionCount: number;
  totalAmount: number;
}

interface CategoryContextData {
  categories: Category[];
  isLoading: boolean;
  addCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<{ error: any }>;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'user_id'>>) => Promise<{ error: any }>;
  removeCategory: (id: string) => Promise<{ error: any }>;
}

const CategoryContext = createContext<CategoryContextData | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // @ts-ignore
      const { data, error } = await supabase
        .rpc('get_categories_with_stats', { p_user_id: user.id });

      if (error) {
        throw error;
      }
      
      const responseData = Array.isArray(data) ? data : [];

      const formattedData = responseData.map(c => ({
        ...c,
        id: c.id,
        user_id: c.user_id,
        name: c.name,
        type: c.type as 'income' | 'expense',
        transactionCount: c.transaction_count,
        totalAmount: c.total_amount,
      }));

      setCategories(formattedData as Category[]);
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  const addCategory = async (category: Omit<Category, 'id' | 'user_id'>) => {
    if (!user) {
      const err = new Error("Usuário não autenticado");
      return { error: err };
    }
    const { error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: user.id }]);

    if (error) {
      console.error('Erro ao adicionar categoria:', error);
      return { error };
    }
    
    await fetchCategories();
    return { error: null };
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'user_id'>>) => {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      return { error };
    }
    
    await fetchCategories();
    return { error: null };
  };

  const removeCategory = async (id: string) => {
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (transactionsError) {
      console.error('Erro ao verificar transações da categoria:', transactionsError);
      return { error: transactionsError };
    }

    if (transactions && transactions.length > 0) {
      const err = new Error("Não é possível excluir a categoria, pois ela está sendo usada em transações.");
      return { error: err };
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover categoria:', error);
      return { error };
    }
    
    setCategories(prev => prev.filter(c => c.id !== id));
    return { error: null };
  };

  return (
    <CategoryContext.Provider value={{ categories, isLoading, addCategory, updateCategory, removeCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories deve ser usado dentro de um CategoryProvider');
  }
  return context;
}; 
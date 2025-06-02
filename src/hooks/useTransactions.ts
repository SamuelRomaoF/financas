import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type InsertTransaction = Database['public']['Tables']['transactions']['Insert'];
type UpdateTransaction = Database['public']['Tables']['transactions']['Update'];

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    bankId?: string;
    categoryId?: string;
    status?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select(`
          *,
          banks (
            id,
            name,
            color
          ),
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .order('date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.bankId) {
        query = query.eq('bank_id', filters.bankId);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = useCallback(async (transaction: InsertTransaction) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select(`
          *,
          banks (
            id,
            name,
            color
          ),
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .single();

      if (error) throw error;

      // Atualiza o saldo do banco
      if (transaction.bank_id) {
        const { error: bankError } = await supabase.rpc('update_bank_balance', {
          bank_id: transaction.bank_id,
          amount: transaction.amount,
          transaction_type: transaction.type
        });

        if (bankError) throw bankError;
      }

      setTransactions(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return { data: null, error };
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, transaction: UpdateTransaction) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .select(`
          *,
          banks (
            id,
            name,
            color
          ),
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .single();

      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return { data: null, error };
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      return { error };
    }
  }, []);

  return {
    transactions,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
} 
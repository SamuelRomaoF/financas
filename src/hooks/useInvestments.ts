import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Investment = Database['public']['Tables']['investments']['Row'];
type InsertInvestment = Database['public']['Tables']['investments']['Insert'];
type UpdateInvestment = Database['public']['Tables']['investments']['Update'];

export function useInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestments = useCallback(async (filters?: {
    type?: string;
    bankId?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('investments')
        .select(`
          *,
          banks (
            id,
            name,
            color
          )
        `)
        .order('name');

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.bankId) {
        query = query.eq('bank_id', filters.bankId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvestment = useCallback(async (investment: InsertInvestment) => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .insert(investment)
        .select(`
          *,
          banks (
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      setInvestments(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar investimento:', error);
      return { data: null, error };
    }
  }, []);

  const updateInvestment = useCallback(async (id: string, investment: UpdateInvestment) => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .update(investment)
        .eq('id', id)
        .select(`
          *,
          banks (
            id,
            name,
            color
          )
        `)
        .single();

      if (error) throw error;
      setInvestments(prev => prev.map(i => i.id === id ? data : i));
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar investimento:', error);
      return { data: null, error };
    }
  }, []);

  const deleteInvestment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInvestments(prev => prev.filter(i => i.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar investimento:', error);
      return { error };
    }
  }, []);

  return {
    investments,
    loading,
    fetchInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
  };
} 
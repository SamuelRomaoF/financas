import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Bank = Database['public']['Tables']['banks']['Row'];
type InsertBank = Database['public']['Tables']['banks']['Insert'];
type UpdateBank = Database['public']['Tables']['banks']['Update'];

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('name');

      if (error) throw error;
      setBanks(data || []);
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBank = useCallback(async (bank: InsertBank) => {
    try {
      const { data, error } = await supabase
        .from('banks')
        .insert(bank)
        .select()
        .single();

      if (error) throw error;
      setBanks(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar banco:', error);
      return { data: null, error };
    }
  }, []);

  const updateBank = useCallback(async (id: string, bank: UpdateBank) => {
    try {
      const { data, error } = await supabase
        .from('banks')
        .update(bank)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setBanks(prev => prev.map(b => b.id === id ? data : b));
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar banco:', error);
      return { data: null, error };
    }
  }, []);

  const deleteBank = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('banks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBanks(prev => prev.filter(b => b.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar banco:', error);
      return { error };
    }
  }, []);

  return {
    banks,
    loading,
    fetchBanks,
    createBank,
    updateBank,
    deleteBank,
  };
} 
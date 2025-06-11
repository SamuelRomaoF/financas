import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
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
      toast.success('Conta bancária criada com sucesso!');
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar banco:', error);
      toast.error('Erro ao criar conta bancária.');
      return { data: null, error };
    }
  }, []);

  const updateBank = useCallback(async (id: string, bank: UpdateBank) => {
    try {
      console.log('Atualizando banco:', id, bank);
      
      const { data, error } = await supabase
        .from('banks')
        .update(bank)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Atualiza o estado local
      setBanks(prev => prev.map(b => b.id === id ? data : b));
      
      // Dispara evento para atualizar outras partes da UI
      document.dispatchEvent(new Event('bank-updated'));
      
      toast.success('Conta bancária atualizada com sucesso!');
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar banco:', error);
      toast.error('Erro ao atualizar conta bancária.');
      return { data: null, error };
    }
  }, []);

  const deleteBank = useCallback(async (id: string) => {
    try {
      // Verificar se há transações vinculadas a este banco
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('bank_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error(`Não é possível excluir esta conta pois há ${count} transações vinculadas a ela.`);
        return { error: new Error(`Conta possui ${count} transações vinculadas`) };
      }

      const { error } = await supabase
        .from('banks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBanks(prev => prev.filter(b => b.id !== id));
      toast.success('Conta bancária removida com sucesso!');
      
      // Dispara evento para atualizar outras partes da UI
      document.dispatchEvent(new Event('bank-updated'));
      
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar banco:', error);
      toast.error('Erro ao remover conta bancária.');
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
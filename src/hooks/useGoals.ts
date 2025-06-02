import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Goal = Database['public']['Tables']['goals']['Row'];
type InsertGoal = Database['public']['Tables']['goals']['Insert'];
type UpdateGoal = Database['public']['Tables']['goals']['Update'];

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('goals')
        .select('*')
        .order('deadline');

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (goal: InsertGoal) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      return { data: null, error };
    }
  }, []);

  const updateGoal = useCallback(async (id: string, goal: UpdateGoal) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(goal)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === id ? data : g));
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      return { data: null, error };
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
      return { error };
    }
  }, []);

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
} 
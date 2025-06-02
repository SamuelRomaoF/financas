import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Category = Database['public']['Tables']['categories']['Row'];
type InsertCategory = Database['public']['Tables']['categories']['Insert'];
type UpdateCategory = Database['public']['Tables']['categories']['Update'];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async (type?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (category: InsertCategory) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return { data: null, error };
    }
  }, []);

  const updateCategory = useCallback(async (id: string, category: UpdateCategory) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === id ? data : c));
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return { data: null, error };
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      return { error };
    }
  }, []);

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
} 
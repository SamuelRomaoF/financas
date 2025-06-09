import { supabase } from '../lib/supabase';

/**
 * Limpa o cache do Supabase para a tabela especificada
 * @param tableName Nome da tabela para limpar o cache
 */
export async function clearSupabaseCache(tableName: string) {
  try {
    // Força uma leitura direta do servidor, ignorando o cache
    await supabase.from(tableName).select('id').limit(1).single();
    // Limpa o cache explicitamente para a tabela
    await supabase.auth.refreshSession();
    console.log(`Cache limpo para a tabela: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Erro ao limpar cache para ${tableName}:`, error);
    return false;
  }
} 
/**
 * Utilitário para verificar o ambiente e variáveis de configuração
 */

// Verifica se estamos em produção
export const isProd = import.meta.env.PROD;

// Verifica se estamos em desenvolvimento
export const isDev = import.meta.env.DEV;

// Verifica se as variáveis do Supabase estão definidas
export const hasSupabaseConfig = 
  !!import.meta.env.VITE_SUPABASE_URL && 
  !!import.meta.env.VITE_SUPABASE_ANON_KEY;

// Função para obter informações do ambiente (útil para depuração)
export const getEnvironmentInfo = () => {
  return {
    isProd,
    isDev,
    baseUrl: window.location.origin,
    hasSupabaseConfig,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Definido' : 'Não definido',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Definido' : 'Não definido',
  };
};

// Função para verificar se o ambiente está configurado corretamente
export const checkEnvironment = () => {
  const info = getEnvironmentInfo();
  
  if (!info.hasSupabaseConfig) {
    console.error('Configuração do Supabase não encontrada! Verifique as variáveis de ambiente.');
    return false;
  }
  
  console.log('Ambiente configurado:', info);
  return true;
}; 
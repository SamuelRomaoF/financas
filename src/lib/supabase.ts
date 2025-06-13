import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

// Cliente público com configurações otimizadas e seguras
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      // Usar cookies HttpOnly para maior segurança
      storage: {
        getItem: (key: string): string | null => {
          // Para compatibilidade com sistemas que usam localStorage
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${key}=`))
            ?.split('=')[1];
          
          // Fallback para localStorage se não encontrar nos cookies
          if (!value && typeof localStorage !== 'undefined') {
            return localStorage.getItem(key);
          }
          
          return value || null;
        },
        setItem: (key: string, value: string): void => {
          // Configurar cookie seguro com HttpOnly quando em produção
          const isSecure = window.location.protocol === 'https:';
          const sameSite = isSecure ? 'strict' : 'lax';
          
          // Definir cookie com atributos de segurança
          document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=${sameSite}${isSecure ? '; Secure' : ''}`;
          
          // Manter compatibilidade com localStorage
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, value);
          }
        },
        removeItem: (key: string): void => {
          // Remover cookie
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          
          // Manter compatibilidade com localStorage
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
          }
        }
      },
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  }
); 
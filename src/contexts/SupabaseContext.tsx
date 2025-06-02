import { SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SupabaseContextType {
    supabase: SupabaseClient;
    user: any;
    loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
    supabase,
    user: null,
    loading: true,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verifica o usuário atual
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        // Escuta mudanças na autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <SupabaseContext.Provider value={{ supabase, user, loading }}>
            {children}
        </SupabaseContext.Provider>
    );
}

export function useSupabase() {
    return useContext(SupabaseContext);
} 
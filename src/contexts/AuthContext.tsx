import { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'basic' | 'premium';
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação em diferentes storages
    const sessionUser = sessionStorage.getItem('user');
    const localUser = localStorage.getItem('user');
    
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    } else if (localUser) {
      setUser(JSON.parse(localUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    
    try {
      // Simulando resposta de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulando diferentes tipos de plano baseado no email
      const plan = email.includes('premium') 
        ? 'premium' 
        : email.includes('basic') 
          ? 'basic' 
          : 'free';

      const mockUser: User = {
        id: '1',
        name: 'Usuário Teste',
        email,
        plan,
        avatar: 'https://i.pravatar.cc/150?img=11',
      };
      
      setUser(mockUser);
      
      // Armazenar dados com base na opção "Lembrar de mim"
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(mockUser));
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.removeItem('user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulando resposta de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        name,
        email,
        plan: 'free',
      };
      
      setUser(mockUser);
      // Por padrão, novos registros são salvos na sessão
      sessionStorage.setItem('user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
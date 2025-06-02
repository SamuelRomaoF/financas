import { LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  openMobileSidebar: () => void;
}

export default function Header({ openMobileSidebar }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
        <div className="flex-1 px-4 flex justify-between">
          <div className="flex-1 flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={openMobileSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Botão de tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Menu do usuário */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {user?.user_metadata?.name || 'Usuário'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Dropdown (movido para fora do header) */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" onClick={() => setUserMenuOpen(false)} />
          <div className="absolute right-4 top-16 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <div>
              <a 
                onClick={() => {
                  navigate('/conta');
                  setUserMenuOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Minha Conta
                </div>
              </a>
            </div>
            <div>
              <a 
                onClick={() => {
                  navigate('/configuracoes');
                  setUserMenuOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </div>
              </a>
            </div>
            <div>
              <a
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
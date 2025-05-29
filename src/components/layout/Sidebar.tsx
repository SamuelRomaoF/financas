import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  Home, 
  LogOut, 
  PieChart, 
  Plus, 
  Settings, 
  Target, 
  Wallet, 
  Smartphone, 
  BadgePercent 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

interface SidebarProps {
  closeMobileSidebar?: () => void;
}

export default function Sidebar({ closeMobileSidebar }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLinkClick = () => {
    if (closeMobileSidebar) {
      closeMobileSidebar();
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Transações', href: '/app/transacoes', icon: Wallet },
    { name: 'Categorias', href: '/app/categorias', icon: PieChart },
    { name: 'Metas', href: '/app/metas', icon: Target },
    { name: 'Alertas', href: '/app/alertas', icon: Calendar },
    { name: 'Relatórios', href: '/app/relatorios', icon: BarChart3 },
    { name: 'Config. WhatsApp', href: '/app/whatsapp', icon: Smartphone },
    { name: 'Planos', href: '/app/planos', icon: BadgePercent },
    { name: 'Configurações', href: '/app/configuracoes', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <Link to="/app/dashboard" className="flex items-center space-x-2" onClick={handleLinkClick}>
          <Wallet className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">Finanças</span>
        </Link>
      </div>

      <div className="px-4 py-4">
        <button className="btn btn-primary w-full">
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive(item.href)
                    ? 'bg-primary-100 dark:bg-primary-800/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                )}
              >
                <Icon className={cn(
                  'mr-3 flex-shrink-0 h-5 w-5',
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <LogOut className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
          Sair
        </button>
      </div>
    </div>
  );
}
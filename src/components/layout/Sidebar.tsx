import {
    ArrowLeftRight,
    BarChart2,
    Bell,
    Building2,
    LayoutDashboard,
    MessageSquareText,
    Settings,
    Tags,
    Target,
    TrendingUp,
    Wallet
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  closeMobileSidebar?: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    title: 'Carteira',
    icon: Wallet,
    href: '/carteira'
  },
  {
    title: 'Bancos',
    icon: Building2,
    href: '/bancos'
  },
  {
    title: 'Transações',
    icon: ArrowLeftRight,
    href: '/transacoes'
  },
  {
    title: 'Categorias',
    icon: Tags,
    href: '/categorias'
  },
  {
    title: 'Investimentos',
    icon: TrendingUp,
    href: '/investimentos'
  },
  {
    title: 'Metas',
    icon: Target,
    href: '/metas'
  },
  {
    title: 'Alertas',
    icon: Bell,
    href: '/alertas'
  },
  {
    title: 'Relatórios',
    icon: BarChart2,
    href: '/relatorios'
  },
  {
    title: 'WhatsApp',
    icon: MessageSquareText,
    href: '/whatsapp'
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/configuracoes'
  }
];

export default function Sidebar({ closeMobileSidebar }: SidebarProps) {
  const handleLinkClick = () => {
    if (closeMobileSidebar) {
      closeMobileSidebar();
    }
  };

  return (
    <div className="h-full w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Finanças
          </h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={handleLinkClick}
              className={({ isActive }) => `
                flex items-center px-3 py-2 rounded-md text-sm font-medium
                ${isActive 
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400' 
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }
              `}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
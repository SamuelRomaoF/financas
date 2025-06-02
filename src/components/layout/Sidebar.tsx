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
    Wallet,
    CreditCard
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSubscription, SubscriptionPlan } from '../../hooks/useSubscription';

interface SidebarProps {
  closeMobileSidebar?: () => void;
}

const allMenuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    allowedPlans: ['free', 'basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'Carteira',
    icon: Wallet,
    href: '/carteira',
    allowedPlans: ['premium'] as SubscriptionPlan[]
  },
  {
    title: 'Bancos',
    icon: Building2,
    href: '/bancos',
    allowedPlans: ['premium'] as SubscriptionPlan[] 
  },
  {
    title: 'Transações',
    icon: ArrowLeftRight,
    href: '/transacoes',
    allowedPlans: ['free', 'basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'Categorias',
    icon: Tags,
    href: '/categorias',
    allowedPlans: ['free', 'basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'Investimentos',
    icon: TrendingUp,
    href: '/investimentos',
    allowedPlans: ['premium'] as SubscriptionPlan[]
  },
  {
    title: 'Metas',
    icon: Target,
    href: '/metas',
    allowedPlans: ['basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'Alertas',
    icon: Bell,
    href: '/alertas',
    allowedPlans: ['basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'Relatórios',
    icon: BarChart2,
    href: '/relatorios',
    allowedPlans: ['free', 'basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'WhatsApp',
    icon: MessageSquareText,
    href: '/whatsapp',
    allowedPlans: ['free', 'basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/configuracoes',
    allowedPlans: ['free', 'basic', 'premium'] as SubscriptionPlan[]
  },
  {
    title: 'Planos',
    icon: CreditCard,
    href: '/planos',
    allowedPlans: ['free', 'basic', 'premium'] as SubscriptionPlan[]
  }
];

export default function Sidebar({ closeMobileSidebar }: SidebarProps) {
  const { subscription, isLoading: subscriptionIsLoading } = useSubscription();

  const handleLinkClick = () => {
    if (closeMobileSidebar) {
      closeMobileSidebar();
    }
  };

  const SKELETON_ITEM_COUNT = 5;
  if (subscriptionIsLoading) {
    return (
      <div className="h-full w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
        <div className="p-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <nav className="flex-1 px-3 space-y-2">
          {Array.from({ length: SKELETON_ITEM_COUNT }).map((_, index) => (
            <div key={index} className="h-9 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          ))}
        </nav>
      </div>
    );
  }
  
  const currentPlan = subscription?.plan || 'free';

  const menuItems = allMenuItems.filter(item => 
    item.allowedPlans.includes(currentPlan)
  );

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
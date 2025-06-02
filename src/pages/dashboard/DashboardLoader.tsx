import { useSubscription } from '../../hooks/useSubscription';
import GratisDashboard from './GratisDashboard';
import BasicoDashboard from './BasicoDashboard';
import PremiumDashboard from './PremiumDashboard';
import { Navigate } from 'react-router-dom';

export default function DashboardLoader() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const plan = subscription?.plan;

  switch (plan) {
    case 'free':
      return <GratisDashboard />;
    case 'basic':
      return <BasicoDashboard />;
    case 'premium':
      return <PremiumDashboard />;
    default:
      console.warn(`Plano atual é "${plan}" ou assinatura não encontrada. Redirecionando para /planos.`);
      return <Navigate to="/planos" replace />;
  }
} 
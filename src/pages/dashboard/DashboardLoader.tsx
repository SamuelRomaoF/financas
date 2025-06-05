// console.log('DashboardLoader.tsx: ARQUIVO SENDO CARREGADO NO NAVEGADOR - INÍCIO');
import { useSubscription } from '../../hooks/useSubscription';
import GratisDashboard from './GratisDashboard';
import BasicoDashboard from './BasicoDashboard';
import PremiumDashboard from './PremiumDashboard';
import { Navigate } from 'react-router-dom';

export default function DashboardLoader() {
  // console.log('DashboardLoader: FUNÇÃO SENDO CHAMADA');
  const { subscription, isLoading } = useSubscription();
  // console.log(`DashboardLoader: useSubscription retornou. isLoading: ${isLoading}, subscription:`, subscription);

  if (isLoading) {
    // console.log('DashboardLoader: isLoading é TRUE. Retornando spinner.');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // console.log('DashboardLoader: isLoading é FALSE.');
  const plan = subscription?.plan;
  // console.log(`DashboardLoader: Plano extraído: ${plan}. subscription era:`, subscription);

  switch (plan) {
    case 'free':
      // console.log('DashboardLoader: Plano é FREE. Renderizando GratisDashboard.');
      return <GratisDashboard />;
    case 'basic':
      // console.log('DashboardLoader: Plano é BASIC. Renderizando BasicoDashboard.');
      return <BasicoDashboard />;
    case 'premium':
      // console.log('DashboardLoader: Plano é PREMIUM. Renderizando PremiumDashboard.');
      return <PremiumDashboard />;
    default:
      // console.log(`DashboardLoader: Entrou no DEFAULT CASE do switch. Plan: ${plan}`);
      // console.warn(`Plano atual é "${plan}" ou assinatura não encontrada. Redirecionando para / (Landing Page) como teste.`);
      return <Navigate to="/" replace />;
  }
} 
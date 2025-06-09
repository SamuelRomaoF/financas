// console.log('DashboardLoader.tsx: ARQUIVO SENDO CARREGADO NO NAVEGADOR - INÍCIO');
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import BasicoDashboard from './BasicoDashboard';
import ForceReload from './ForceReload';
import GratisDashboard from './GratisDashboard';
import PremiumDashboard from './PremiumDashboard';

export default function DashboardLoader() {
  console.log('DashboardLoader: FUNÇÃO SENDO CHAMADA');
  const { subscription, isLoading } = useSubscription();
  const [needsReload, setNeedsReload] = useState(false);
  const [targetPlan, setTargetPlan] = useState<string | null>(null);
  console.log(`DashboardLoader: useSubscription retornou. isLoading: ${isLoading}, subscription:`, subscription);

  // Verificar se o plano atual corresponde ao esperado
  useEffect(() => {
    if (!isLoading && subscription) {
      const currentPlan = subscription.plan;
      console.log(`Plano atual carregado: ${currentPlan}`);
      
      // Verificar se o plano é válido (free, basic ou premium)
      if (!['free', 'basic', 'premium'].includes(currentPlan)) {
        console.log(`Plano inconsistente detectado! Recebido: '${currentPlan}'`);
        setNeedsReload(true);
        setTargetPlan('basic'); // Fallback para o plano básico
      }
    }
  }, [isLoading, subscription]);

  if (isLoading) {
    console.log('DashboardLoader: isLoading é TRUE. Retornando spinner.');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Mostrar componente de recarregamento se necessário
  if (needsReload && targetPlan) {
    return (
      <>
        <ForceReload targetPlan={targetPlan} />
        <BasicoDashboard />
      </>
    );
  }

  console.log('DashboardLoader: isLoading é FALSE.');
  const plan = subscription?.plan;
  console.log(`DashboardLoader: Plano extraído: ${plan}. subscription era:`, subscription);

  // Renderizar o dashboard apropriado com base no plano
  switch (plan) {
    case 'free':
      console.log('DashboardLoader: Plano é FREE. Renderizando GratisDashboard.');
      return <GratisDashboard />;
    case 'basic':
      console.log('DashboardLoader: Plano é BASIC. Renderizando BasicoDashboard.');
      return <BasicoDashboard />;
    case 'premium':
      console.log('DashboardLoader: Plano é PREMIUM. Renderizando PremiumDashboard.');
      return <PremiumDashboard />;
    default:
      console.log(`DashboardLoader: Entrou no DEFAULT CASE do switch. Plan: ${plan}`);
      console.warn(`Plano atual é "${plan}" ou assinatura não encontrada. Redirecionando para / (Landing Page).`);
      return <Navigate to="/" replace />;
  }
} 
import { Navigate, Outlet } from 'react-router-dom';
import { useSubscription, SubscriptionPlan } from '../../hooks/useSubscription';
import FeatureNotAvailablePage from '../layout/FeatureNotAvailablePage';
import LoadingSpinner from '../ui/LoadingSpinner'; // Supondo que você tenha um componente de spinner

interface RestrictedFeatureRouteProps {
  allowedPlans: SubscriptionPlan[];
  children?: React.ReactNode;
}

export default function RestrictedFeatureRoute({ allowedPlans, children }: RestrictedFeatureRouteProps) {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const userPlan = subscription?.plan;

  if (!userPlan) {
    // Se não houver plano (ex: usuário não completamente carregado ou erro),
    // pode redirecionar para o login ou mostrar uma página de erro/carregamento.
    // Por ora, vamos redirecionar para /login como exemplo, ou pode ser uma página de erro.
    // Ou, se for esperado que o usuário esteja autenticado aqui, mostrar FeatureNotAvailablePage.
    // Para este caso, se não há plano, é provável que seja um estado inesperado pós-login.
    // Consideraremos como não permitido.
    return <FeatureNotAvailablePage />;
  }

  if (allowedPlans.includes(userPlan)) {
    return children ? <>{children}</> : <Outlet />;
  }

  return <FeatureNotAvailablePage />;
} 
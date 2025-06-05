// console.log('ProtectedRoute.tsx: ARQUIVO SENDO CARREGADO NO NAVEGADOR - INÍCIO');
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription, SubscriptionPlan } from '../hooks/useSubscription';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedPlans?: SubscriptionPlan[];
}

export function ProtectedRoute({ children, allowedPlans }: ProtectedRouteProps) {
  const location = useLocation();
  // console.log(`ProtectedRoute: FUNÇÃO SENDO CHAMADA. Path atual: ${location.pathname}. Props allowedPlans:`, allowedPlans);

  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionIsLoading } = useSubscription();

  // console.log(`ProtectedRoute (${location.pathname}): Status -> authLoading: ${authLoading}, subscriptionIsLoading: ${subscriptionIsLoading}, User presente: ${!!user}, Subscription presente: ${!!subscription}, Plano: ${subscription?.plan}`);

  if (authLoading || subscriptionIsLoading) {
    // console.log(`ProtectedRoute (${location.pathname}): MOSTRANDO SPINNER porque authLoading (${authLoading}) ou subscriptionIsLoading (${subscriptionIsLoading}) é true.`);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // console.log(`ProtectedRoute (${location.pathname}): REDIRECIONANDO PARA /login porque !user. Estado da localização para redirecionamento:`, { from: location });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // console.log(`ProtectedRoute (${location.pathname}): Usuário autenticado: ${user.id}. Verificando allowedPlans.`);

  if (allowedPlans && allowedPlans.length > 0) {
    const currentPlan = subscription?.plan;
    // console.log(`ProtectedRoute (${location.pathname}): Verificando allowedPlans. currentPlan: ${currentPlan}, allowedPlans:`, allowedPlans);
    if (!currentPlan || !allowedPlans.includes(currentPlan)) {
      // console.warn(`ProtectedRoute (${location.pathname}): Plano NÃO permitido. currentPlan: ${currentPlan}. REDIRECIONANDO PARA /dashboard (que o DashboardLoader tratará).`);
    return <Navigate to="/dashboard" replace />;
  }
    // console.log(`ProtectedRoute (${location.pathname}): Plano PERMITIDO. currentPlan: ${currentPlan}. Renderizando children.`);
  } else {
    // console.log(`ProtectedRoute (${location.pathname}): Sem allowedPlans específicos para esta rota ou para o wrapper do AppLayout. Permitindo acesso e renderizando children.`);
  }

  // console.log(`ProtectedRoute (${location.pathname}): RENDERIZANDO CHILDREN.`);
  return <>{children}</>;
} 
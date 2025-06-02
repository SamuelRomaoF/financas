import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();

  if (authLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sempre permite acesso ao dashboard e planos
  if (location.pathname === '/dashboard' || location.pathname === '/planos') {
    return <>{children}</>;
  }

  // Se o usuário acabou de fazer login, redireciona para o dashboard
  if (location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  const hasValidSubscription = subscription && (
    subscription.plan !== 'free' || 
    (subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date())
  );

  if (!hasValidSubscription) {
    return <Navigate to="/planos" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 
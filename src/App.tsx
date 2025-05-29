import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import GoalsPage from './pages/goals/GoalsPage';
import AlertsPage from './pages/alerts/AlertsPage';
import ReportsPage from './pages/reports/ReportsPage';
import WhatsAppConfigPage from './pages/whatsapp/WhatsAppConfigPage';
import PlansPage from './pages/plans/PlansPage';
import SettingsPage from './pages/settings/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Página inicial (Landing Page) */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Rotas públicas */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/app/dashboard" />} />
      <Route path="/registro" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/app/dashboard" />} />
      
      {/* Rotas protegidas */}
      <Route path="/app" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="transacoes" element={<TransactionsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="alertas" element={<AlertsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="whatsapp" element={<WhatsAppConfigPage />} />
        <Route path="planos" element={<PlansPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      
      {/* Rota 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
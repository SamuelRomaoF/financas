import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import AccountPage from './pages/account/AccountPage';
import AlertsPage from './pages/alerts/AlertsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BanksPage from './pages/banks/BanksPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import DashboardLoader from './pages/dashboard/DashboardLoader';
import GoalsPage from './pages/goals/GoalsPage';
import InvestmentsPage from './pages/Investimentos';
import LandingPage from './pages/landing/LandingPage';
import PlansPage from './pages/plans/PlansPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import WalletPage from './pages/wallet/WalletPage';
import WhatsAppConfigPage from './pages/whatsapp/WhatsAppConfigPage';
import RestrictedFeatureRoute from './components/routes/RestrictedFeatureRoute';
import { SubscriptionPlan } from './hooks/useSubscription';

export default function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#059669',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#DC2626',
            },
          },
        }}
      />
      
      <Routes>
        {/* Página inicial (Landing Page) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardLoader />} />
          <Route path="/transacoes" element={<TransactionsPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/conta" element={<AccountPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          {/* Rotas agora permitidas para todos os planos logados (incluindo free) */}
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/whatsapp" element={<WhatsAppConfigPage />} />

          {/* Rotas restritas APENAS para basic e premium */}
          <Route element={<RestrictedFeatureRoute allowedPlans={['basic', 'premium'] as SubscriptionPlan[]} />}>
            <Route path="/bancos" element={<BanksPage />} />
            <Route path="/investimentos" element={<InvestmentsPage />} />
            <Route path="/metas" element={<GoalsPage />} />
            <Route path="/carteira" element={<WalletPage />} />
            <Route path="/alertas" element={<AlertsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
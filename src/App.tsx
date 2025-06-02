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
import DashboardPage from './pages/dashboard/DashboardPage';
import GoalsPage from './pages/goals/GoalsPage';
import InvestmentsPage from './pages/Investimentos';
import LandingPage from './pages/landing/LandingPage';
import PlansPage from './pages/plans/PlansPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import WalletPage from './pages/wallet/WalletPage';
import WhatsAppConfigPage from './pages/whatsapp/WhatsAppConfigPage';

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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bancos" element={<BanksPage />} />
          <Route path="/transacoes" element={<TransactionsPage />} />
          <Route path="/investimentos" element={<InvestmentsPage />} />
          <Route path="/metas" element={<GoalsPage />} />
          <Route path="/carteira" element={<WalletPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/alertas" element={<AlertsPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/whatsapp" element={<WhatsAppConfigPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/conta" element={<AccountPage />} />
        </Route>
      </Routes>
    </>
  );
}
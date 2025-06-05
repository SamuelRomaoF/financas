import { useEffect, useState } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import ResumoFinanceiro from '../../components/dashboard/ResumoFinanceiro';
import GraficosDashboard from '../../components/dashboard/GraficosDashboard';
import AlertasSection from '../../components/dashboard/AlertasSection';

// Dados mockados para o dashboard
const mockTransactionData = [
  { name: 'Alimentação', value: 1250, color: '#EF4444' },
  { name: 'Transporte', value: 800, color: '#F59E0B' },
  { name: 'Moradia', value: 2300, color: '#10B981' },
  { name: 'Lazer', value: 650, color: '#3B82F6' },
  { name: 'Outros', value: 450, color: '#8B5CF6' },
];

const mockMonthlyData = [
  { name: 'Jan', receitas: 5500, despesas: 4200 },
  { name: 'Fev', receitas: 5800, despesas: 4500 },
  { name: 'Mar', receitas: 6000, despesas: 4800 },
  { name: 'Abr', receitas: 5900, despesas: 4600 },
  { name: 'Mai', receitas: 6200, despesas: 4300 },
  { name: 'Jun', receitas: 6500, despesas: 4400 },
];

const mockAlerts = [
  { id: '1', title: 'Conta de água vence amanhã', type: 'bill_due', priority: 'high' },
  { id: '2', title: 'Meta de economia quase atingida', type: 'goal_milestone', priority: 'medium' },
  { id: '3', title: 'Limite de orçamento para Alimentação excedido', type: 'budget_exceeded', priority: 'high' },
];

export default function BasicoDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSummaryData({
        balance: 5450,
        income: 8500,
        expenses: 4350,
        savings: 1300,
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader planName="Básico" />
      <ResumoFinanceiro summaryData={summaryData} />
      <GraficosDashboard transactionData={mockTransactionData} monthlyData={mockMonthlyData} />
      <AlertasSection alerts={mockAlerts} />
      {/* AlertasSection, CreditCardManager, LoanManager não são incluídos no plano Básico */}
    </div>
  );
} 
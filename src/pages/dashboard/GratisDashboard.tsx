import { useCallback, useMemo } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import GraficosDashboard from '../../components/dashboard/GraficosDashboard';
import ResumoFinanceiro from '../../components/dashboard/ResumoFinanceiro';
import { useTransactions } from '../../contexts/TransactionContext';
import { CATEGORY_COLORS } from '../../utils/categoryColors';

export default function GratisDashboard() {
  const { transactions, isLoading, refreshTransactions } = useTransactions();

  const summaryData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expenses;

    return { income, expenses, balance, savings: 0 }; // Savings não é usado no plano grátis
  }, [transactions]);
  
  const expenseByCategoryData = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Outros';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(expensesByCategory).map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[name.toLowerCase()] || CATEGORY_COLORS['outros']
    }));
  }, [transactions]);

  // Função para atualizar o dashboard
  const refreshDashboard = useCallback(async () => {
    if (refreshTransactions) {
      await refreshTransactions();
    }
  }, [refreshTransactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader planName="Gratuito" onRefresh={refreshDashboard} />
      <ResumoFinanceiro summaryData={summaryData} showSavings={false} /> 
      <GraficosDashboard 
        transactionData={expenseByCategoryData} 
        monthlyData={[]} // Gráfico de barras não usado no plano grátis
        showPieChart={true} 
        showBarChart={false} 
      />
    </div>
  );
} 
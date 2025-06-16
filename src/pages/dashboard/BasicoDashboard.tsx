import { useEffect, useState } from 'react';
import AlertasSection from '../../components/dashboard/AlertasSection';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import GraficosDashboard from '../../components/dashboard/GraficosDashboard';
import ResumoFinanceiro from '../../components/dashboard/ResumoFinanceiro';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CATEGORY_COLORS } from '../../utils/categoryColors';

// Tipos para os dados do dashboard
interface SummaryData {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
}

interface TransactionDataPoint {
  name: string;
  value: number;
  color: string;
}

interface MonthlyDataPoint {
  name: string;
  receitas: number;
  despesas: number;
}

interface Alert {
  id: string;
  title: string;
  type: string;
  priority: string;
}

// Função auxiliar para obter a cor da categoria
const getCategoryColor = (categoryName: string): string => {
  // Normaliza o nome da categoria para minúsculas e remove acentos
  const normalizedName = categoryName.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  // Tenta encontrar a cor exata ou uma correspondência parcial
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    const normalizedKey = key.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    if (normalizedName === normalizedKey || normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      return color;
    }
  }
  
  // Cores de fallback para garantir que sempre tenha uma cor
  const fallbackColors = [
    '#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', 
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#D946EF'
  ];
  
  // Gera um índice baseado no nome da categoria para ter uma cor consistente
  const hashCode = categoryName.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return fallbackColors[hashCode % fallbackColors.length];
};

// Função para determinar a prioridade do alerta
const getAlertPriority = (alertType: string): string => {
  switch (alertType) {
    case 'bill':
      return 'high';
    case 'goal':
      return 'medium';
    case 'expense':
      return 'high';
    case 'balance':
      return 'medium';
    case 'income':
      return 'low';
    default:
      return 'medium';
  }
};

// Função para mapear tipos de alerta do banco para tipos de exibição
const mapAlertTypeToDisplay = (dbType: string): string => {
  switch (dbType) {
    case 'bill':
      return 'bill_due';
    case 'goal':
      return 'goal_milestone';
    case 'expense':
      return 'budget_exceeded';
    case 'balance':
      return 'balance_low';
    case 'income':
      return 'income_received';
    default:
      return 'general';
  }
};

export default function BasicoDashboard() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
  });
  const [transactionData, setTransactionData] = useState<TransactionDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      fetchUserAlerts();
    }
  }, [user]);

  const fetchUserAlerts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, title, type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      // Transformar os dados do banco para o formato esperado pelo componente AlertasSection
      const formattedAlerts = data.map(alert => ({
        id: alert.id,
        title: alert.title,
        type: mapAlertTypeToDisplay(alert.type),
        priority: getAlertPriority(alert.type)
      }));
      
      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Erro ao buscar alertas do usuário:', error);
      // Em caso de erro, não mostramos nenhum alerta
      setAlerts([]);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      // 1. Carregar dados de despesas por categoria
      console.log(`Chamando RPC get_expenses_by_category com ID: ${user.id}`);
      const { data: categoryData, error: categoryError } = await supabase.rpc(
        'get_expenses_by_category',
        { user_id_param: user.id }
      );

      if (categoryError) {
        console.error('Erro na chamada RPC get_expenses_by_category:', categoryError);
        // Calcular dados de categoria manualmente como fallback
        console.log('Calculando dados de categoria manualmente devido a erro na RPC:', categoryError);
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        // Calcular despesas por categoria usando o valor das parcelas (amount)
        // Para transações parceladas, isso garante que apenas o valor da parcela
        // seja contabilizado, não o valor total da compra
        const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
          // Na interface Transaction, category é uma string
          const categoryName = transaction.category || 'Outros';
          
          if (!acc[categoryName]) {
            acc[categoryName] = 0;
          }
          acc[categoryName] += transaction.amount;
          return acc;
        }, {} as Record<string, number>);
        
        const formattedData = Object.entries(expensesByCategory).map(([name, value]) => ({
          name,
          value,
          color: getCategoryColor(name)
        }));
        
        setTransactionData(formattedData);
      } else {
        // Formatar dados retornados pela RPC
        const formattedData = categoryData.map((item: any) => ({
          name: item.category_name,
          value: Number(item.total_amount),
          color: getCategoryColor(item.category_name)
        }));
        
        setTransactionData(formattedData);
      }
      
      // 2. Carregar resumo financeiro mensal
      console.log(`Chamando RPC get_monthly_summary com ID: ${user.id}`);
      const { data: monthlyData, error: monthlyError } = await supabase.rpc(
        'get_monthly_summary',
        { user_id_param: user.id }
      );

      if (monthlyError) {
        console.error('Erro na chamada RPC get_monthly_summary:', monthlyError);
        // Usar dados mockados como fallback
        const mockMonthlyData = [
          { name: 'Jan', receitas: 5500, despesas: 4200 },
          { name: 'Fev', receitas: 5800, despesas: 4500 },
          { name: 'Mar', receitas: 6000, despesas: 4800 },
          { name: 'Abr', receitas: 5900, despesas: 4600 },
          { name: 'Mai', receitas: 6200, despesas: 4300 },
          { name: 'Jun', receitas: 6500, despesas: 4400 },
        ];
        setMonthlyData(mockMonthlyData);
      } else {
        // Formatar dados retornados pela RPC
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const formattedMonthlyData = monthlyData.map((item: any) => ({
          name: monthNames[parseInt(item.month) - 1],
          receitas: Number(item.income),
          despesas: Number(item.expenses)
        }));
        
        setMonthlyData(formattedMonthlyData);
      }
      
      // 3. Calcular resumo financeiro
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Filtrar transações do mês atual
      const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      });

      // Buscar empréstimos ativos para calcular pagamentos mensais
      const { data: activeLoans, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'quitado');

      if (loanError) {
        console.error('Erro ao buscar empréstimos ativos:', loanError);
      }

      // Calcular pagamentos de empréstimos do mês atual (usando o valor da parcela)
      const loanExpenses = (activeLoans || []).reduce((acc, loan) => {
        // Verificar se o próximo pagamento está no mês atual
        const nextPayment = new Date(loan.next_payment_date);
        if (nextPayment.getMonth() === currentMonth && nextPayment.getFullYear() === currentYear) {
          return acc + loan.installment_value;
        }
        return acc;
      }, 0);

      // Calcular receitas e despesas das transações normais
      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

      // Calcular despesas - usando apenas o valor da parcela (amount)
      // Para transações parceladas, o campo amount já contém o valor da parcela individual
      // e não o valor total da compra (que estaria em original_amount)
      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      // Adicionar pagamentos de empréstimos às despesas
      const totalExpenses = expenses + loanExpenses;

      // Calcular saldo e economia sugerida
      const balance = income - totalExpenses;
      const savings = income * 0.1; // 10% da renda como economia sugerida

      setSummaryData({
        balance,
        income,
        expenses: totalExpenses,
        savings
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader planName="Básico" onRefresh={loadDashboardData} />
      <ResumoFinanceiro summaryData={summaryData} />
      <GraficosDashboard transactionData={transactionData} monthlyData={monthlyData} />
      <AlertasSection alerts={alerts} />
    </div>
  );
} 
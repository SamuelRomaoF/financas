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
  pagamentosEfetuados?: number;
  despesasAgendadas?: number;
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
  const { transactions, isLoading: isLoadingTransactions, refreshTransactions } = useTransactions();
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
    pagamentosEfetuados: 0,
    despesasAgendadas: 0,
  });
  const [transactionData, setTransactionData] = useState<TransactionDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (user && !isLoadingTransactions) {
      loadDashboardData();
      fetchUserAlerts();
    }
  }, [user, isLoadingTransactions]);

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

  const loadDashboardData = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Buscar empréstimos ativos
      const { data: activeLoans, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'quitado');
        
      if (loanError) {
        console.error('Erro ao buscar empréstimos ativos:', loanError);
      }
      
      // Obter data atual
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Filtrar transações do mês atual
      const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });
      
      // Calcular pagamentos de empréstimos do mês atual
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
      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
        
      // Adicionar pagamentos de empréstimos às despesas
      const totalExpenses = expenses + loanExpenses;
      
      // Calcular saldo e economia sugerida
      const balance = income - totalExpenses;
      const savings = income * 0.1; // 10% da renda como economia sugerida
      
      // Separar pagamentos efetuados e despesas agendadas
      const paidTransactions = monthlyTransactions.filter(t => 
        t.type === 'expense' && (t as any).status === 'pago'
      );
      
      const scheduledTransactions = monthlyTransactions.filter(t => 
        t.type === 'expense' && (t as any).status !== 'pago'
      );
      
      const pagamentosEfetuados = paidTransactions.reduce((acc, t) => acc + t.amount, 0);
      const despesasAgendadas = scheduledTransactions.reduce((acc, t) => acc + t.amount, 0) + loanExpenses;
      
      setSummaryData({
        balance,
        income,
        expenses: totalExpenses,
        savings,
        pagamentosEfetuados,
        despesasAgendadas
      });
      
      // Calcular despesas por categoria
      const expensesByCategory: Record<string, number> = {};
      
      // Adicionar despesas das transações
      monthlyTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const categoryName = t.category || 'Outros';
          if (!expensesByCategory[categoryName]) {
            expensesByCategory[categoryName] = 0;
          }
          expensesByCategory[categoryName] += t.amount;
        });
        
      // Adicionar despesas de empréstimos na categoria "Empréstimos"
      if (loanExpenses > 0) {
        if (!expensesByCategory['Empréstimos']) {
          expensesByCategory['Empréstimos'] = 0;
        }
        expensesByCategory['Empréstimos'] += loanExpenses;
      }
      
      // Formatar dados para o gráfico de categorias
      const formattedCategoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name.toLowerCase()] || CATEGORY_COLORS['outros']
      }));
      
      setTransactionData(formattedCategoryData);
      
      // Preparar dados para o gráfico mensal
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
      const monthlyDataMap = new Map<string, { receitas: number; despesas: number }>();
      
      // Inicializar os últimos 6 meses (Básico mostra menos meses que o Premium)
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = monthNames[month.getMonth()];
        monthlyDataMap.set(monthKey, { receitas: 0, despesas: 0 });
      }
      
      // Preencher com dados reais das transações
      transactions.forEach(t => {
        const date = new Date(t.date);
        // Verificar se está nos últimos 6 meses
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 5);
        
        if (date >= sixMonthsAgo && date <= today) {
          const monthKey = monthNames[date.getMonth()];
          
          if (monthlyDataMap.has(monthKey)) {
            const monthData = monthlyDataMap.get(monthKey)!;
            if (t.type === 'income') {
              monthData.receitas += t.amount;
            } else {
              monthData.despesas += t.amount;
            }
          }
        }
      });
      
      // Adicionar parcelas de empréstimos aos dados mensais
      if (activeLoans && activeLoans.length > 0) {
        activeLoans.forEach(loan => {
          // Calcular os meses de pagamento do empréstimo
          const startDate = new Date(loan.start_date);
          const installments = loan.installments;
          const installmentValue = loan.installment_value;
          
          // Adicionar cada parcela ao mês correspondente
          for (let i = 0; i < installments; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i);
            
            // Verificar se o mês está dentro do período que estamos exibindo (últimos 6 meses)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 5);
            
            if (paymentDate >= sixMonthsAgo && paymentDate <= today) {
              const monthKey = monthNames[paymentDate.getMonth()];
              if (monthlyDataMap.has(monthKey)) {
                const monthData = monthlyDataMap.get(monthKey)!;
                // Adicionar o valor da parcela às despesas do mês
                monthData.despesas += installmentValue;
              }
            }
          }
        });
      }
      
      // Converter para array
      const formattedMonthlyData = Array.from(monthlyDataMap.entries()).map(([name, data]) => ({
        name,
        receitas: data.receitas,
        despesas: data.despesas
      }));
      
      setMonthlyData(formattedMonthlyData);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para atualizar o dashboard
  const refreshDashboard = async (): Promise<void> => {
    if (refreshTransactions) {
      await refreshTransactions();
      loadDashboardData();
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
      <DashboardHeader planName="Básico" onRefresh={refreshDashboard} />
      <ResumoFinanceiro summaryData={summaryData} showSavings={true} showNewFields={true} />
      <GraficosDashboard 
        transactionData={transactionData} 
        monthlyData={monthlyData}
      />
      <AlertasSection alerts={alerts} />
    </div>
  );
} 
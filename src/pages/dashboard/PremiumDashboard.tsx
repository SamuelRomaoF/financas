import { useEffect, useState } from 'react';
import CreditCardManager from '../../components/credit-cards/CreditCardManager';
import AlertasSection from '../../components/dashboard/AlertasSection';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import GraficosDashboard from '../../components/dashboard/GraficosDashboard';
import ResumoFinanceiro from '../../components/dashboard/ResumoFinanceiro';
import LoanManager from '../../components/loans/LoanManager';
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
  pagamentosEfetuados: number;
  despesasAgendadas: number;
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

// Função para calcular dados mensais a partir das transações e empréstimos
const calculateMonthlyData = (transactions: any[], loans: any[] = []) => {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyDataMap = new Map<string, { receitas: number; despesas: number }>();
  
  // Inicializar os últimos 12 meses (Premium mostra mais meses)
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = monthNames[month.getMonth()];
    monthlyDataMap.set(monthKey, { receitas: 0, despesas: 0 });
  }
  
  // Preencher com dados reais das transações
  transactions?.forEach(t => {
    const date = new Date(t.date);
    const monthKey = monthNames[date.getMonth()];
    
    if (monthlyDataMap.has(monthKey)) {
      const monthData = monthlyDataMap.get(monthKey)!;
      if (t.type === 'income') {
        monthData.receitas += t.amount;
      } else {
        monthData.despesas += t.amount;
      }
    }
  });
  
  // Adicionar parcelas de empréstimos aos dados mensais
  if (loans && loans.length > 0) {
    loans.forEach(loan => {
      // Calcular os meses de pagamento do empréstimo
      const startDate = new Date(loan.start_date);
      const installments = loan.installments;
      const installmentValue = loan.installment_value;
      
      // Adicionar cada parcela ao mês correspondente
      for (let i = 0; i < installments; i++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);
        
        // Verificar se o mês está dentro do período que estamos exibindo (últimos 12 meses)
        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 11);
        
        if (paymentDate >= twelveMonthsAgo && paymentDate <= now) {
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
  return Array.from(monthlyDataMap.entries()).map(([name, data]) => ({
    name,
    receitas: data.receitas,
    despesas: data.despesas
  }));
};

export default function PremiumDashboard() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
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
        .limit(5); // Premium mostra mais alertas
        
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
      
      // Buscar transações
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
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
      const monthlyTransactions = transactions?.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      }) || [];
      
      // Calcular receitas e despesas
      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
        
      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
        
      // Calcular pagamentos de empréstimos do mês atual
      const loanExpenses = (activeLoans || []).reduce((acc, loan) => {
        // Verificar se o próximo pagamento está no mês atual
        const nextPayment = new Date(loan.next_payment_date);
        const isPendingPayment = nextPayment.getMonth() === currentMonth && 
                                nextPayment.getFullYear() === currentYear;
        
        // Também verificar se houve algum pagamento já realizado neste mês
        // (isso acontece quando editamos um empréstimo com data no passado)
        const hasPaidThisMonth = loan.paid_installments > 0 && 
                               loan.installments > 0 &&
                               ((new Date(loan.start_date).getMonth() === currentMonth && 
                                 new Date(loan.start_date).getFullYear() === currentYear) ||
                               (loan.last_payment_date && 
                                new Date(loan.last_payment_date).getMonth() === currentMonth &&
                                new Date(loan.last_payment_date).getFullYear() === currentYear));
                                
        console.log(`Empréstimo ${loan.name}: Próximo pagamento no mês atual: ${isPendingPayment}, Pagamento já realizado este mês: ${hasPaidThisMonth}`);
                               
        // Adicionar o valor ao total se houver pagamento pendente ou já realizado neste mês
        if (isPendingPayment || hasPaidThisMonth) {
          return acc + loan.installment_value;
        }
        return acc;
      }, 0);
      
      // Verificar pagamentos já registrados em transações
      // (isso é necessário para empréstimos que são pagos com transações regulares)
      const loanRelatedTransactions = monthlyTransactions.filter(t => 
        t.is_loan_payment === true || 
        t.type === 'expense' && t.description?.toLowerCase().includes('empréstimo') ||
        t.is_card_bill_payment === true // Incluir também pagamentos de fatura de cartão
      );
      
      const existingLoanPayments = loanRelatedTransactions.reduce((acc, t) => acc + t.amount, 0);
      console.log(`Pagamentos de empréstimos já registrados em transações: ${existingLoanPayments}`);
      
      // Evitar duplicação: usar apenas o maior valor entre os empréstimos calculados e as transações já registradas
      const finalLoanExpenses = Math.max(loanExpenses, existingLoanPayments);
      console.log(`Despesas finais de empréstimos: ${finalLoanExpenses}`);
      
      // Adicionar pagamentos de empréstimos às despesas totais
      const totalExpenses = expenses + finalLoanExpenses;
      
      // Calcular saldo e economia
      const balance = income - totalExpenses;
      const savings = income * 0.2; // 20% da renda como economia sugerida
      
      // Separar pagamentos efetuados e despesas agendadas
      const paidTransactions = monthlyTransactions.filter(t => 
        t.type === 'expense' && (t as any).status === 'pago'
      );
      
      const scheduledTransactions = monthlyTransactions.filter(t => 
        t.type === 'expense' && (t as any).status !== 'pago'
      );
      
      const pagamentosEfetuados = paidTransactions.reduce((acc, t) => acc + t.amount, 0);
      const despesasAgendadas = scheduledTransactions.reduce((acc, t) => acc + t.amount, 0) + loanExpenses;
      
      // Atualizar dados do resumo financeiro
      setSummaryData({
        balance,
        income,
        expenses: totalExpenses,
        savings,
        pagamentosEfetuados,
        despesasAgendadas
      });
      
      // Buscar dados para o gráfico de despesas por categoria
      try {
        const { data: expensesByCategory, error: expensesByCategoryError } = await supabase.rpc(
          'get_expenses_by_category',
          {
            user_id_param: user?.id
          }
        );

        if (expensesByCategoryError) {
          console.error('Erro na chamada RPC get_expenses_by_category:', expensesByCategoryError);
          throw expensesByCategoryError;
        }
        
        // Formatar dados da RPC
        const formattedCategoryData = expensesByCategory.map((item: any) => ({
          name: item.category_name,
          value: Number(item.total_amount),
          color: CATEGORY_COLORS[item.category_name.toLowerCase()] || CATEGORY_COLORS['outros']
        }));
        
        // Adicionar despesas de empréstimos na categoria "Empréstimos"
        if (finalLoanExpenses > 0) {
          const loanCategoryIndex = formattedCategoryData.findIndex((c: { name: string }) => c.name === 'Empréstimos');
          if (loanCategoryIndex >= 0) {
            formattedCategoryData[loanCategoryIndex].value += finalLoanExpenses;
          } else {
            formattedCategoryData.push({
              name: 'Empréstimos',
              value: finalLoanExpenses,
              color: CATEGORY_COLORS['empréstimos'] || CATEGORY_COLORS['outros']
            });
          }
        }
        
        setTransactionData(formattedCategoryData);
      } catch (categoryError) {
        console.error('Erro ao processar dados de categorias:', categoryError);
      }
      
      // Buscar resumo mensal
      try {
        const { data: monthlySummary, error: monthlySummaryError } = await supabase.rpc(
          'get_monthly_summary',
          {
            user_id_param: user?.id
          }
        );

        if (monthlySummaryError) {
          console.error('Erro na chamada RPC get_monthly_summary:', monthlySummaryError);
          throw monthlySummaryError;
        }
        
        // Processar dados do resumo mensal
        if (monthlySummary && monthlySummary.length > 0) {
          // Formatar dados para o gráfico
          const formattedMonthlyData = monthlySummary.map((item: any) => ({
            name: item.month_name,
            receitas: Number(item.income),
            despesas: Number(item.expenses)
          }));
          setMonthlyData(formattedMonthlyData);
        } else {
          // Usar dados calculados localmente como alternativa
          const monthlyDataCalculated = calculateMonthlyData(monthlyTransactions || [], activeLoans || []);
          setMonthlyData(monthlyDataCalculated);
        }
      } catch (error) {
        console.error('Erro ao processar resumo mensal:', error);
        
        // Fallback para cálculo local
        const monthlyDataCalculated = calculateMonthlyData(monthlyTransactions || [], activeLoans || []);
        setMonthlyData(monthlyDataCalculated);
      }
      
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
      <DashboardHeader planName="Premium" onRefresh={loadDashboardData} />
      <ResumoFinanceiro summaryData={summaryData} showNewFields={true} />
      <GraficosDashboard 
        transactionData={transactionData} 
        monthlyData={monthlyData} 
        showPieChart={true}
        showBarChart={true}
      />
      <AlertasSection alerts={alerts} />
      
      <CreditCardManager />
      <LoanManager />
    </div>
  );
} 
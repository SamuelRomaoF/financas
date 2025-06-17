import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import GraficosDashboard from '../../components/dashboard/GraficosDashboard';
import ResumoFinanceiro from '../../components/dashboard/ResumoFinanceiro';
import { useBankAccounts } from '../../contexts/BankAccountContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CATEGORY_COLORS } from '../../utils/categoryColors';

export default function GratisDashboard() {
  const { transactions, isLoading, refreshTransactions } = useTransactions();
  const { accounts } = useBankAccounts();
  const { user } = useAuth();
  const [loanExpenses, setLoanExpenses] = useState(0);
  
  // Buscar parcelas de empréstimo ao carregar o componente
  useEffect(() => {
    const fetchLoanExpenses = async () => {
      if (!user) return;
      
      try {
        // Obter data atual
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Buscar empréstimos ativos
        const { data: activeLoans, error } = await supabase
          .from('loans')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'quitado');
          
        if (error) {
          console.error('Erro ao buscar empréstimos ativos:', error);
          return;
        }
        
        // Calcular pagamentos de empréstimos do mês atual
        const totalLoanExpenses = (activeLoans || []).reduce((acc, loan) => {
          // Verificar se o próximo pagamento está no mês atual
          const nextPayment = new Date(loan.next_payment_date);
          if (nextPayment.getMonth() === currentMonth && nextPayment.getFullYear() === currentYear) {
            return acc + loan.installment_value;
          }
          return acc;
        }, 0);
        
        setLoanExpenses(totalLoanExpenses);
      } catch (error) {
        console.error('Erro ao buscar despesas de empréstimos:', error);
      }
    };
    
    fetchLoanExpenses();
  }, [user]);

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

    // Calcular despesas - usando apenas o valor da parcela (amount)
    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
      
    // Adicionar despesas de empréstimos
    const totalExpenses = expenses + loanExpenses;

    // Separar pagamentos efetuados e despesas agendadas
    const paidTransactions = monthlyTransactions.filter(t => 
      t.type === 'expense' && (t as any).status === 'pago'
    );
    
    const scheduledTransactions = monthlyTransactions.filter(t => 
      t.type === 'expense' && (t as any).status !== 'pago'
    );
    
    const pagamentosEfetuados = paidTransactions.reduce((acc, t) => acc + t.amount, 0);
    const despesasAgendadas = scheduledTransactions.reduce((acc, t) => acc + t.amount, 0) + loanExpenses;

    const bankBalance = accounts.reduce((total, account) => total + account.balance, 0);

    const balance = accounts.length > 0 ? bankBalance : income - totalExpenses;

    return { 
      income, 
      expenses: totalExpenses, 
      balance, 
      savings: 0,
      pagamentosEfetuados,
      despesasAgendadas
    }; // Savings não é usado no plano grátis
  }, [transactions, accounts, loanExpenses]);
  
  const expenseByCategoryData = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Calcular despesas por categoria
    const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Outros';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Adicionar despesas de empréstimos na categoria "Empréstimos"
    if (loanExpenses > 0) {
      if (!expensesByCategory['Empréstimos']) {
        expensesByCategory['Empréstimos'] = 0;
      }
      expensesByCategory['Empréstimos'] += loanExpenses;
    }

    return Object.entries(expensesByCategory).map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[name.toLowerCase()] || CATEGORY_COLORS['outros']
    }));
  }, [transactions, loanExpenses]);

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
      <ResumoFinanceiro summaryData={summaryData} showSavings={false} showNewFields={true} /> 
      <GraficosDashboard 
        transactionData={expenseByCategoryData} 
        monthlyData={[]} // Gráfico de barras não usado no plano grátis
        showPieChart={true} 
        showBarChart={false} 
      />
    </div>
  );
} 
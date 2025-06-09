import { BarChart3, Calendar, Download, LineChart, PieChart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { CATEGORY_COLORS } from '../../utils/categoryColors';
import { formatCurrency } from '../../utils/formatCurrency';

// Tipos para os dados do dashboard (importados do BasicoDashboard)
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

interface Report {
  id: string;
  title: string;
  description: string;
  type: 'expense' | 'income' | 'balance' | 'category' | 'trend';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastGenerated?: string;
  format: 'pdf' | 'excel' | 'csv';
}

const ALL_PERIOD_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
] as const;

const FREE_PLAN_PERIOD_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
] as const;

const BASICO_PLAN_PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
] as const;

// Função auxiliar para obter a cor da categoria (copiada do BasicoDashboard)
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

export default function ReportsPage() {
  const { subscription, isLoading: subscriptionIsLoading } = useSubscription();
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<Report['period']>('weekly');
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dados do dashboard
  const [summaryData, setSummaryData] = useState<SummaryData>({
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
  });
  const [transactionData, setTransactionData] = useState<TransactionDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);

  const periodOptions = useMemo(() => {
    if (subscriptionIsLoading) return [];
    const plan = subscription?.plan;
    if (plan === 'free') {
      return FREE_PLAN_PERIOD_OPTIONS;
    }
    if (plan === 'basic') {
      return BASICO_PLAN_PERIOD_OPTIONS;
    }
    return ALL_PERIOD_OPTIONS;
  }, [subscription?.plan, subscriptionIsLoading]);

  useEffect(() => {
    const currentSelectedIsValid = periodOptions.some(option => option.value === selectedPeriod);
    if (!currentSelectedIsValid && periodOptions.length > 0) {
      setSelectedPeriod(periodOptions[0].value as Report['period']);
    }
  }, [periodOptions, selectedPeriod]);

  useEffect(() => {
    if (!user || !transactions.length) {
      setIsLoading(false);
      return;
    }
    
    loadDashboardData();
  }, [user, transactions, selectedPeriod]);

  // Função para carregar os dados do dashboard (adaptado do BasicoDashboard)
  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // 1. Carregar dados de despesas por categoria
      const { data: categoryData, error: categoryError } = await supabase.rpc(
        'get_expenses_by_category',
        { user_id_param: user.id }
      );

      if (categoryError) {
        // Calcular dados de categoria manualmente como fallback
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
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
      const { data: monthlyData, error: monthlyError } = await supabase.rpc(
        'get_monthly_summary',
        { user_id_param: user.id }
      );

      if (monthlyError) {
        // Usar dados calculados como fallback
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyDataMap = new Map<string, { receitas: number; despesas: number }>();
        
        // Inicializar os últimos 6 meses
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = monthNames[month.getMonth()];
          monthlyDataMap.set(monthKey, { receitas: 0, despesas: 0 });
        }
        
        // Preencher com dados reais
        transactions.forEach(t => {
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
        
        // Converter para array
        const formattedMonthlyData = Array.from(monthlyDataMap.entries()).map(([name, data]) => ({
          name,
          receitas: data.receitas,
          despesas: data.despesas
        }));
        
        setMonthlyData(formattedMonthlyData);
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
      const savings = income * 0.1; // 10% da renda como economia sugerida

      setSummaryData({
        balance,
        income,
        expenses,
        savings
      });
      
      // Gerar relatórios com base nos dados carregados
      generateReports();
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Não foi possível carregar os dados para os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReports = () => {
    try {
      // Gerar relatórios com base nos dados do dashboard
      const generatedReports: Report[] = [];
      const now = new Date();
      
      // 1. Relatório de Despesas
      generatedReports.push({
        id: `expense-${selectedPeriod}-${Date.now()}`,
        title: `Relatório de Despesas (${getPeriodLabel(selectedPeriod)})`,
        description: `Análise detalhada de todas as despesas por categoria - ${getPeriodDescription(selectedPeriod)}`,
        type: 'expense',
        period: selectedPeriod,
        lastGenerated: now.toISOString(),
        format: 'pdf'
      });
      
      // 2. Relatório de Receitas
      generatedReports.push({
        id: `income-${selectedPeriod}-${Date.now()}`,
        title: `Relatório de Receitas (${getPeriodLabel(selectedPeriod)})`,
        description: `Análise detalhada de todas as receitas - ${getPeriodDescription(selectedPeriod)}`,
        type: 'income',
        period: selectedPeriod,
        lastGenerated: now.toISOString(),
        format: 'pdf'
      });
      
      // 3. Análise de Categorias (apenas para períodos maiores que diário)
      if (selectedPeriod !== 'daily') {
        generatedReports.push({
          id: `category-${selectedPeriod}-${Date.now()}`,
          title: `Análise de Categorias (${getPeriodLabel(selectedPeriod)})`,
          description: `Distribuição de gastos por categoria - ${getPeriodDescription(selectedPeriod)}`,
          type: 'category',
          period: selectedPeriod,
          lastGenerated: now.toISOString(),
          format: 'excel'
        });
      }
      
      // 4. Balanço Financeiro
      generatedReports.push({
        id: `balance-${selectedPeriod}-${Date.now()}`,
        title: `Balanço Financeiro (${getPeriodLabel(selectedPeriod)})`,
        description: `Resumo completo de entradas e saídas - ${getPeriodDescription(selectedPeriod)}`,
        type: 'balance',
        period: selectedPeriod,
        lastGenerated: now.toISOString(),
        format: 'pdf'
      });
      
      setReports(generatedReports);
    } catch (error) {
      console.error('Erro ao gerar relatórios:', error);
      toast.error('Não foi possível gerar os relatórios');
    }
  };

  const getPeriodLabel = (period: Report['period']): string => {
    switch (period) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return 'Personalizado';
    }
  };

  const getPeriodDescription = (period: Report['period']): string => {
    const currentDate = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    
    switch (period) {
      case 'daily':
        return `${currentDate.toLocaleDateString('pt-BR', options)}`;
      case 'weekly': {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('pt-BR')} a ${endOfWeek.toLocaleDateString('pt-BR')}`;
      }
      case 'monthly':
        return `${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
      case 'yearly':
        return `${currentDate.getFullYear()}`;
      default:
        return 'Período personalizado';
    }
  };

  const getReportIcon = (type: Report['type']) => {
    switch (type) {
      case 'expense':
      case 'income':
        return <BarChart3 className="h-6 w-6 text-primary-500" />;
      case 'category':
        return <PieChart className="h-6 w-6 text-primary-500" />;
      case 'trend':
      case 'balance':
        return <LineChart className="h-6 w-6 text-primary-500" />;
      default:
        return <BarChart3 className="h-6 w-6 text-primary-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca gerado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDownload = (report: Report) => {
    toast.success(`Gerando relatório ${report.title}...`);
    
    try {
      // Gerar o conteúdo do relatório com base no tipo
      if (report.format === 'pdf') {
        generatePDFReport(report);
      } else if (report.format === 'excel') {
        generateExcelReport(report);
      }
      
      toast.success(`Relatório ${report.title} baixado com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Não foi possível gerar o relatório');
    }
  };

  // Gerar relatório em PDF usando os dados do dashboard
  const generatePDFReport = (report: Report) => {
    // Criar um elemento para o conteúdo do PDF
    const element = document.createElement('div');
    element.style.padding = '20px';
    
    // Cabeçalho do relatório
    const header = document.createElement('h1');
    header.textContent = report.title;
    element.appendChild(header);
    
    const description = document.createElement('p');
    description.textContent = report.description;
    element.appendChild(description);
    
    // Adicionar dados com base no tipo de relatório
    if (report.type === 'expense') {
      // Gráfico de despesas por categoria
      const categoriesDiv = document.createElement('div');
      categoriesDiv.innerHTML = '<h2>Despesas por Categoria</h2>';
      
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '20px';
      
      // Cabeçalho da tabela
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Categoria', 'Valor', 'Porcentagem'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.border = '1px solid #ddd';
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Corpo da tabela
      const tbody = document.createElement('tbody');
      const totalValue = transactionData.reduce((sum, item) => sum + item.value, 0);
      
      transactionData.forEach(item => {
        const row = document.createElement('tr');
        
        const categoryCell = document.createElement('td');
        categoryCell.textContent = item.name;
        categoryCell.style.border = '1px solid #ddd';
        categoryCell.style.padding = '8px';
        row.appendChild(categoryCell);
        
        const valueCell = document.createElement('td');
        valueCell.textContent = formatCurrency(item.value);
        valueCell.style.border = '1px solid #ddd';
        valueCell.style.padding = '8px';
        row.appendChild(valueCell);
        
        const percentCell = document.createElement('td');
        const percent = (item.value / totalValue) * 100;
        percentCell.textContent = `${percent.toFixed(2)}%`;
        percentCell.style.border = '1px solid #ddd';
        percentCell.style.padding = '8px';
        row.appendChild(percentCell);
        
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      categoriesDiv.appendChild(table);
      element.appendChild(categoriesDiv);
      
    } else if (report.type === 'income') {
      // Resumo de receitas
      const incomeDiv = document.createElement('div');
      incomeDiv.innerHTML = `
        <h2>Resumo de Receitas</h2>
        <p>Total de Receitas: ${formatCurrency(summaryData.income)}</p>
        <p>Economia Sugerida (10%): ${formatCurrency(summaryData.savings)}</p>
      `;
      element.appendChild(incomeDiv);
      
    } else if (report.type === 'balance') {
      // Balanço financeiro
      const balanceDiv = document.createElement('div');
      balanceDiv.innerHTML = `
        <h2>Balanço Financeiro</h2>
        <p>Total de Receitas: ${formatCurrency(summaryData.income)}</p>
        <p>Total de Despesas: ${formatCurrency(summaryData.expenses)}</p>
        <p>Saldo: ${formatCurrency(summaryData.balance)}</p>
        <p>Economia Sugerida: ${formatCurrency(summaryData.savings)}</p>
      `;
      
      // Adicionar gráfico mensal
      const monthlyDiv = document.createElement('div');
      monthlyDiv.innerHTML = '<h2>Evolução Mensal</h2>';
      
      const monthlyTable = document.createElement('table');
      monthlyTable.style.width = '100%';
      monthlyTable.style.borderCollapse = 'collapse';
      monthlyTable.style.marginTop = '20px';
      
      // Cabeçalho da tabela
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Mês', 'Receitas', 'Despesas', 'Saldo'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.border = '1px solid #ddd';
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      monthlyTable.appendChild(thead);
      
      // Corpo da tabela
      const tbody = document.createElement('tbody');
      
      monthlyData.forEach(item => {
        const row = document.createElement('tr');
        
        const monthCell = document.createElement('td');
        monthCell.textContent = item.name;
        monthCell.style.border = '1px solid #ddd';
        monthCell.style.padding = '8px';
        row.appendChild(monthCell);
        
        const incomeCell = document.createElement('td');
        incomeCell.textContent = formatCurrency(item.receitas);
        incomeCell.style.border = '1px solid #ddd';
        incomeCell.style.padding = '8px';
        row.appendChild(incomeCell);
        
        const expenseCell = document.createElement('td');
        expenseCell.textContent = formatCurrency(item.despesas);
        expenseCell.style.border = '1px solid #ddd';
        expenseCell.style.padding = '8px';
        row.appendChild(expenseCell);
        
        const balanceCell = document.createElement('td');
        const balance = item.receitas - item.despesas;
        balanceCell.textContent = formatCurrency(balance);
        balanceCell.style.border = '1px solid #ddd';
        balanceCell.style.padding = '8px';
        balanceCell.style.color = balance >= 0 ? 'green' : 'red';
        row.appendChild(balanceCell);
        
        tbody.appendChild(row);
      });
      
      monthlyTable.appendChild(tbody);
      monthlyDiv.appendChild(monthlyTable);
      
      element.appendChild(balanceDiv);
      element.appendChild(monthlyDiv);
    }
    
    // Simulando o download
    simulateFileDownload(`${report.title.replace(/\s+/g, '_')}.pdf`);
  };

  // Gerar relatório em Excel usando os dados do dashboard
  const generateExcelReport = (report: Report) => {
    // Para relatórios de categoria
    if (report.type === 'category') {
      // Criar dados para Excel
      const data = [
        ['Categoria', 'Valor', 'Porcentagem']
      ];
      
      const totalValue = transactionData.reduce((sum, item) => sum + item.value, 0);
      
      transactionData.forEach(item => {
        const percent = (item.value / totalValue) * 100;
        data.push([
          item.name,
          item.value.toFixed(2),
          `${percent.toFixed(2)}%`
        ]);
      });
      
      // Adicionar total
      data.push(['Total', totalValue.toFixed(2), '100%']);
    }
    
    // Simulando o download
    simulateFileDownload(`${report.title.replace(/\s+/g, '_')}.xlsx`);
  };

  // Simular download de arquivo
  const simulateFileDownload = (filename: string) => {
    // Criar um elemento de link para download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent('Conteúdo do relatório simulado'));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gere e visualize relatórios detalhados das suas finanças
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as Report['period'])}
            className="form-select rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Button onClick={loadDashboardData}>
            <Calendar className="h-4 w-4 mr-2" />
            Atualizar Relatórios
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getReportIcon(report.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {report.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Última geração: {formatDate(report.lastGenerated)}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDownload(report)}
              >
                <Download className="h-4 w-4 mr-2" />
                {report.format.toUpperCase()}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum relatório disponível para o período selecionado
          </p>
        </div>
      )}
    </div>
  );
} 
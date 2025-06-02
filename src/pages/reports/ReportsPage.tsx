import { useState, useMemo, useEffect } from 'react';
import { BarChart3, PieChart, LineChart, Download, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useSubscription } from '../../hooks/useSubscription';

interface Report {
  id: string;
  title: string;
  description: string;
  type: 'expense' | 'income' | 'balance' | 'category' | 'trend';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastGenerated?: string;
  format: 'pdf' | 'excel' | 'csv';
}

const mockReports: Report[] = [
  {
    id: '1',
    title: 'Relatório de Despesas (Mensal)',
    description: 'Análise detalhada de todas as despesas por categoria',
    type: 'expense',
    period: 'monthly',
    lastGenerated: '2024-03-15',
    format: 'pdf'
  },
  {
    id: '2',
    title: 'Relatório de Despesas (Semanal)',
    description: 'Análise semanal de todas as despesas por categoria',
    type: 'expense',
    period: 'weekly',
    lastGenerated: '2024-03-18',
    format: 'pdf'
  },
  {
    id: '5',
    title: 'Relatório de Receitas (Diário)',
    description: 'Análise diária de todas as receitas',
    type: 'income',
    period: 'daily',
    lastGenerated: '2024-03-19',
    format: 'pdf'
  },
  {
    id: '3',
    title: 'Análise de Categorias',
    description: 'Distribuição de gastos por categoria',
    type: 'category',
    period: 'monthly',
    lastGenerated: '2024-03-10',
    format: 'excel'
  },
  {
    id: '4',
    title: 'Tendências Financeiras',
    description: 'Análise de tendências de gastos e receitas',
    type: 'trend',
    period: 'monthly',
    lastGenerated: '2024-03-15',
    format: 'pdf'
  }
];

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

export default function ReportsPage() {
  const { subscription, isLoading: subscriptionIsLoading } = useSubscription();
  const [selectedPeriod, setSelectedPeriod] = useState<Report['period']>('weekly');
  const [reports] = useState<Report[]>(mockReports);

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
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Selecionar Período
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports
          .filter(report => report.period === selectedPeriod)
          .map((report) => (
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
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {report.format.toUpperCase()}
                </Button>
              </div>
            </div>
          ))}
      </div>

      {reports.filter(report => report.period === selectedPeriod).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum relatório disponível para o período selecionado
          </p>
        </div>
      )}
    </div>
  );
} 
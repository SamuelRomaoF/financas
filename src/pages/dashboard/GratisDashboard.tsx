import { BarChart3, PlusCircle, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
// CreditCardManager e LoanManager removidos pois não fazem parte do plano gratuito no dashboard principal
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

// Dados mockados para o dashboard (mantidos por enquanto para visualização)
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

// mockAlerts e getAlertIcon removidos pois Alertas Recentes não faz parte do plano gratuito

export default function GratisDashboard() { // Nome da função alterado
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

  // getAlertIcon removido

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard (Plano Gratuito)</h1>
        <Button variant="primary" className="flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Atual</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(summaryData.balance)}</h3>
              </div>
              <div className="h-12 w-12 bg-primary-100 dark:bg-primary-800/30 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receitas do Mês</p>
                <h3 className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{formatCurrency(summaryData.income)}</h3>
              </div>
              <div className="h-12 w-12 bg-success-100 dark:bg-success-800/30 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Despesas do Mês</p>
                <h3 className="text-2xl font-bold text-error-600 dark:text-error-400 mt-1">{formatCurrency(summaryData.expenses)}</h3>
              </div>
              <div className="h-12 w-12 bg-error-100 dark:bg-error-800/30 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-error-600 dark:text-error-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Economias</p>
                <h3 className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{formatCurrency(summaryData.savings)}</h3>
              </div>
              <div className="h-12 w-12 bg-warning-100 dark:bg-warning-800/30 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockTransactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockTransactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockMonthlyData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="#2E7D32" />
                  <Bar dataKey="despesas" name="Despesas" fill="#D32F2F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Alertas Recentes removida */}
      {/* Seções CreditCardManager e LoanManager removidas */}

    </div>
  );
} 
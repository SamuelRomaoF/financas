import { BarChart3, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

interface SummaryData {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
}

interface ResumoFinanceiroProps {
  summaryData: SummaryData;
  showSavings?: boolean;
}

export default function ResumoFinanceiro({ summaryData, showSavings = true }: ResumoFinanceiroProps) {
  return (
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

      {showSavings && (
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
      )}
    </div>
  );
} 
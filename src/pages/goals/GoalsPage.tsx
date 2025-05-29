import { useState } from 'react';
import { Target, Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'investment' | 'debt' | 'purchase';
  status: 'active' | 'completed' | 'cancelled';
}

const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Fundo de emergência',
    targetAmount: 10000,
    currentAmount: 6500,
    deadline: '2024-12-31',
    category: 'savings',
    status: 'active'
  },
  {
    id: '2',
    title: 'Entrada do apartamento',
    targetAmount: 50000,
    currentAmount: 15000,
    deadline: '2025-06-30',
    category: 'savings',
    status: 'active'
  },
  {
    id: '3',
    title: 'Investimento em ações',
    targetAmount: 5000,
    currentAmount: 5000,
    deadline: '2024-06-30',
    category: 'investment',
    status: 'completed'
  }
];

export default function GoalsPage() {
  const [goals] = useState<Goal[]>(mockGoals);

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-success-500';
    if (percentage >= 75) return 'bg-primary-500';
    if (percentage >= 50) return 'bg-warning-500';
    return 'bg-error-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Metas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe e gerencie suas metas financeiras
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Meta: {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="text-gray-400 hover:text-error-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(goal.currentAmount)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(goal.currentAmount, goal.targetAmount)} transition-all`}
                  style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Prazo: {formatDate(goal.deadline)}
              </span>
              {goal.status === 'completed' && (
                <span className="flex items-center text-success-600 dark:text-success-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Concluída
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
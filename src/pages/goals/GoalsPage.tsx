import { CheckCircle, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NewGoalModal from '../../components/goals/NewGoalModal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { useGoals } from '../../hooks/useGoals';
import { useSubscription } from '../../hooks/useSubscription';
import { Database } from '../../types/supabase';

// Definindo o tipo de meta conforme o banco de dados
type GoalFromDB = Database['public']['Tables']['goals']['Row'];

// Interface para uso no componente com valores não-nulos
interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  color: string;
  status: string;
  user_id: string;
}

const BASICO_GOALS_LIMIT = 3;

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals: goalsFromDB, loading, fetchGoals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { subscription } = useSubscription();
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  
  // Processar as metas do banco de dados para garantir valores não-nulos
  const goals: Goal[] = goalsFromDB.map(goal => ({
    id: goal.id,
    name: goal.name,
    target_amount: goal.target_amount,
    current_amount: goal.current_amount || 0,
    deadline: goal.deadline || new Date().toISOString().split('T')[0],
    color: goal.color || '#3B82F6',
    status: goal.status || 'active',
    user_id: goal.user_id || '',
  }));
  
  const userPlan = subscription?.plan;
  const isBasicoPlan = userPlan === 'basic';
  const goalsCount = goals.length;
  const basicoGoalsLimitReached = isBasicoPlan && goalsCount >= BASICO_GOALS_LIMIT;

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user, fetchGoals]);

  const handleNewGoal = () => {
    if (basicoGoalsLimitReached) {
      toast.error(`Você atingiu o limite de ${BASICO_GOALS_LIMIT} metas para o plano Básico. Faça upgrade para metas ilimitadas.`);
    } else {
      setGoalToEdit(null);
      setIsNewGoalModalOpen(true);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsNewGoalModalOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setGoalToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      const { error } = await deleteGoal(goalToDelete);
      if (error) {
        toast.error('Erro ao excluir meta');
      } else {
        toast.success('Meta excluída com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast.error('Erro ao excluir meta');
    }
  };

  const handleSubmitGoal = async (data: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    color: string;
    status: string;
  }) => {
    if (!user) return;

    try {
      if (goalToEdit) {
        // Atualizar meta existente
        const { error } = await updateGoal(goalToEdit.id, {
          ...data,
          user_id: user.id
        });

        if (error) {
          toast.error('Erro ao atualizar meta');
        } else {
          toast.success('Meta atualizada com sucesso');
        }
      } else {
        // Criar nova meta
        const { error } = await createGoal({
          ...data,
          user_id: user.id
        });

        if (error) {
          toast.error('Erro ao criar meta');
        } else {
          toast.success('Meta criada com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast.error('Erro ao salvar meta');
    }
  };

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
        <Button onClick={handleNewGoal} disabled={basicoGoalsLimitReached}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {basicoGoalsLimitReached && (
        <p className="text-sm text-center text-yellow-600 dark:text-yellow-400 mb-4">
          Você atingiu o limite de {BASICO_GOALS_LIMIT} metas para o plano Básico. 
          <a href="/planos" className="underline hover:text-yellow-500 ml-1">Faça upgrade</a> para metas ilimitadas.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Target className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Nenhuma meta definida</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando sua primeira meta financeira
          </p>
          <div className="mt-6">
            <Button onClick={handleNewGoal} disabled={basicoGoalsLimitReached}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Meta
            </Button>
          </div>
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                    <Target className="h-6 w-6" style={{ color: goal.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {goal.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                      Meta: {formatCurrency(goal.target_amount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                  <button 
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={() => handleEditGoal(goal)}
                  >
                  <Pencil className="h-4 w-4" />
                </button>
                  <button 
                    className="text-gray-400 hover:text-error-500"
                    onClick={() => openDeleteDialog(goal.id)}
                  >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(goal.current_amount)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getProgressColor(goal.current_amount, goal.target_amount)} transition-all`}
                    style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
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
      )}

      {/* Modal para adicionar/editar meta */}
      {isNewGoalModalOpen && (
        <NewGoalModal
          isOpen={isNewGoalModalOpen}
          onClose={() => setIsNewGoalModalOpen(false)}
          goalToEdit={goalToEdit}
          onSubmit={handleSubmitGoal}
        />
      )}

      {/* Diálogo de confirmação para excluir meta */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteGoal}
        title="Excluir Meta"
        message="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
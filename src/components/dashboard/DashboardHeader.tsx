import { PlusCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCategories } from '../../contexts/CategoryContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAuth } from '../../hooks/useAuth';
import NewTransactionModal from '../transactions/NewTransactionModal';
import Button from '../ui/Button';

interface DashboardHeaderProps {
  planName: string;
  onRefresh?: () => Promise<void>;
}

export default function DashboardHeader({ planName, onRefresh }: DashboardHeaderProps) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { categories } = useCategories();
  const { addTransaction } = useTransactions();

  const handleRefreshDashboard = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success("Dashboard atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar dashboard:", error);
      toast.error("Erro ao atualizar dashboard. Tente novamente.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenTransactionModal = () => {
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
  };

  const handleTransactionSubmit = async (transactionData: any) => {
    const result = await addTransaction(transactionData);
    if (!result.error) {
      toast.success('Transação adicionada com sucesso!');
      if (onRefresh) {
        await onRefresh(); // Atualizar dashboard após adicionar transação
      }
    } else {
      toast.error('Erro ao adicionar transação. Tente novamente.');
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard (Plano {planName})
        </h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefreshDashboard}
          disabled={refreshing}
          title="Atualizar dashboard"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <Button 
        variant="primary" 
        className="flex items-center"
        onClick={handleOpenTransactionModal}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Nova Transação
      </Button>

      {isTransactionModalOpen && (
        <NewTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          onSubmit={handleTransactionSubmit}
          categories={categories}
          transactionToEdit={null}
        />
      )}
    </div>
  );
} 
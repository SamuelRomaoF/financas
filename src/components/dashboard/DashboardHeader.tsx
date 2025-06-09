import { PlusCircle, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import NewTransactionModal from '../transactions/NewTransactionModal';
import { useCategories } from '../../contexts/CategoryContext';
import { useTransactions } from '../../contexts/TransactionContext';

interface DashboardHeaderProps {
  planName: string;
}

export default function DashboardHeader({ planName }: DashboardHeaderProps) {
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { categories } = useCategories();
  const { addTransaction } = useTransactions();

  const handleForceBasicPlan = async () => {
    if (!user) return;
    
    setResetting(true);
    try {
      // Atualizar o plano para básico
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ 
          plan: 'basic',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (subError) throw subError;
      
      // Atualizar o plano do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({ current_plan: 'basic' })
        .eq('id', user.id);
        
      if (userError) throw userError;
      
      toast.success("Plano básico definido com sucesso. Recarregando...");
      
      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao redefinir plano:", error);
      toast.error("Erro ao redefinir plano. Tente novamente.");
    } finally {
      setResetting(false);
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
          onClick={handleForceBasicPlan}
          disabled={resetting}
          title="Redefinir para plano básico"
        >
          <RefreshCcw className="h-4 w-4" />
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
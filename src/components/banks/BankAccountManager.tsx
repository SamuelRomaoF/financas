import { History, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useBanks } from '../../hooks/useBanks';
import { supabase } from '../../lib/supabase';
import { BankAccount, SaveableBankAccountData } from '../../types/finances';
import Button from '../ui/Button';
import AddBankAccountModal from './AddBankAccountModal';
import BankCard from './BankCard';

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status?: string;
}

// Extender o tipo BankAccount para incluir recentTransactions
interface ExtendedBankAccount extends BankAccount {
  recentTransactions: Transaction[];
  pendingTransactionsCount: number;
  scheduledTransactionsCount: number;
}

const BANK_LOGOS = {
  nubank: '/bank-logos/nubank.svg',
  inter: '/bank-logos/inter.svg',
  itau: '/bank-logos/itau.svg',
  bradesco: '/bank-logos/bradesco.svg',
  santander: '/bank-logos/santander.svg',
  bb: '/bank-logos/bb.svg',
  caixa: '/bank-logos/caixa.svg',
  default: '/bank-logos/bank-icon.svg',
};

interface BankAccountManagerProps {
  refreshTrigger?: number;
}

export default function BankAccountManager({ refreshTrigger = 0 }: BankAccountManagerProps) {
  const [showTransactions, setShowTransactions] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ExtendedBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { deleteBank } = useBanks();

  // Buscar contas bancárias do usuário
  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      
      console.log("Buscando contas bancárias...");
      
      // Buscar contas bancárias
      const { data: bankData, error: bankError } = await supabase
        .from('banks')
        .select('*')
        .order('name');
      
      if (bankError) {
        console.error('Erro ao buscar contas bancárias:', bankError);
        return;
      }
      
      console.log("Contas bancárias encontradas:", bankData);
      
      // Verificar e atualizar transações programadas cujas datas já passaram
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar para início do dia
      
      // Buscar transações agendadas cuja data já passou
      const { data: overdueTransactions, error: overdueError } = await supabase
        .from('transactions')
        .select('*')
        .lt('date', today.toISOString().split('T')[0])
        .eq('status', 'pending');
        
      if (overdueError) {
        console.error('Erro ao buscar transações vencidas:', overdueError);
      } else if (overdueTransactions && overdueTransactions.length > 0) {
        console.log(`Encontradas ${overdueTransactions.length} transações vencidas para atualizar`);
        
        // Atualizar o status das transações vencidas
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .in('id', overdueTransactions.map(t => t.id));
          
        if (updateError) {
          console.error('Erro ao atualizar status das transações:', updateError);
        } else {
          console.log(`${overdueTransactions.length} transações atualizadas para status 'completed'`);
        }
      }
      
      // Para cada conta, buscar as transações recentes
      const accountsWithTransactions = await Promise.all(
        (bankData || []).map(async (bank) => {
          // Buscar as 5 transações mais recentes para esta conta
          const { data: transactionData, error: transactionError } = await supabase
            .from('transactions')
            .select('*')
            .eq('bank_id', bank.id)
            .order('date', { ascending: false })
            .limit(5);
          
          // Buscar transações pendentes (status = pending)
          const { count: pendingCount, error: pendingError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('bank_id', bank.id)
            .eq('status', 'pending');
          
          if (pendingError) {
            console.error(`Erro ao buscar transações pendentes para o banco ${bank.id}:`, pendingError);
          }
          
          // Buscar transações agendadas (date > hoje)
          const today = new Date().toISOString().split('T')[0];
          const { count: scheduledCount, error: scheduledError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('bank_id', bank.id)
            .gt('date', today);
          
          if (scheduledError) {
            console.error(`Erro ao buscar transações agendadas para o banco ${bank.id}:`, scheduledError);
          }
          
          // Garantir que os valores não sejam nulos
          const pendingTransactionsCount = pendingCount || 0;
          const scheduledTransactionsCount = scheduledCount || 0;
          
          console.log(`Banco ${bank.name}: ${pendingTransactionsCount} pendentes, ${scheduledTransactionsCount} agendadas`);
          
          if (transactionError) {
            console.error(`Erro ao buscar transações para o banco ${bank.id}:`, transactionError);
            return {
              id: bank.id,
              userId: bank.user_id || '',
              bankName: bank.name,
              accountType: (bank.type || 'corrente') as 'checking' | 'savings' | 'investment',
              accountNumber: bank.account || 'Sem número',
              balance: bank.balance || 0,
              currency: 'BRL', // Padrão para Brasil
              color: bank.color || '#333333',
              agency: bank.agency || 'N/A',
              recentTransactions: [],
              pendingTransactionsCount,
              scheduledTransactionsCount
            };
          }
          
          console.log(`Banco: ${bank.name}, Saldo: ${bank.balance}`);
          
          return {
            id: bank.id,
            userId: bank.user_id || '',
            bankName: bank.name,
            accountType: (bank.type || 'corrente') as 'checking' | 'savings' | 'investment',
            accountNumber: bank.account || 'Sem número',
            balance: bank.balance || 0,
            currency: 'BRL', // Padrão para Brasil
            color: bank.color || '#333333',
            agency: bank.agency || 'N/A',
            recentTransactions: transactionData || [],
            pendingTransactionsCount,
            scheduledTransactionsCount
          };
        })
      );
      
      setAccounts(accountsWithTransactions);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Efeito para buscar os dados na montagem do componente e quando o refreshTrigger mudar
  useEffect(() => {
    fetchBankAccounts();
    console.log("Atualização acionada com refreshTrigger:", refreshTrigger);
  }, [refreshTrigger]);

  const toggleTransactions = (accountId: string) => {
    setShowTransactions(showTransactions === accountId ? null : accountId);
  };

  // Função para atualizar o saldo de uma conta bancária
  const refreshAccounts = async () => {
    try {
      setLoading(true);
      
      // Buscar contas bancárias novamente
      const { data: bankData, error: bankError } = await supabase
        .from('banks')
        .select('*')
        .order('name');
      
      if (bankError) {
        console.error('Erro ao buscar contas bancárias:', bankError);
        return;
      }
      
      // Atualizar as contas sem buscar transações novamente para evitar muitas requisições
      const updatedAccounts = bankData.map(bank => {
        // Encontrar a conta atual para manter suas transações
        const currentAccount = accounts.find(acc => acc.id === bank.id);
        
        return {
          id: bank.id,
          userId: bank.user_id || '',
          bankName: bank.name,
          accountType: (bank.type || 'corrente') as 'checking' | 'savings' | 'investment',
          accountNumber: bank.account || 'Sem número',
          balance: bank.balance || 0,
          currency: 'BRL', // Padrão para Brasil
          color: bank.color || '#333333',
          agency: bank.agency || 'N/A',
          recentTransactions: currentAccount?.recentTransactions || [],
          pendingTransactionsCount: currentAccount?.pendingTransactionsCount || 0,
          scheduledTransactionsCount: currentAccount?.scheduledTransactionsCount || 0
        };
      });
      
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error('Erro ao atualizar contas bancárias:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Configurar atualização automática a cada 10 segundos
    const refreshInterval = setInterval(() => {
      refreshAccounts();
    }, 10000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(refreshInterval);
  }, [accounts]);

  // Criar um ouvinte para o evento de atualização de banco
  useEffect(() => {
    const handleBankUpdated = () => {
      fetchBankAccounts();
    };

    // Adicionar ouvinte
    document.addEventListener('bank-updated', handleBankUpdated);

    // Limpar ouvinte ao desmontar
    return () => {
      document.removeEventListener('bank-updated', handleBankUpdated);
    };
  }, []);

  const handleRemoveBank = async (bankId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta conta bancária?')) {
      const result = await deleteBank(bankId);
      if (!result.error) {
        // Atualizar a lista de bancos
        fetchBankAccounts();
      }
    }
  };

  const handleSaveAccount = async (accountData: SaveableBankAccountData) => {
    try {
      const { data, error } = await supabase
        .from('banks')
        .insert({
          name: accountData.bankName,
          type: accountData.accountType === 'checking' ? 'corrente' : 
                accountData.accountType === 'savings' ? 'poupanca' : 
                'investimento',
          account: accountData.accountNumber,
          agency: accountData.agency,
          balance: accountData.balance,
          color: accountData.color,
          user_id: accountData.userId
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Conta bancária adicionada com sucesso!');
      fetchBankAccounts();
    } catch (error) {
      console.error('Erro ao adicionar conta bancária:', error);
      toast.error('Erro ao adicionar conta bancária');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Contas Bancárias
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={refreshAccounts}
          >
            <History className="h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" />
            Adicionar Conta
          </Button>
        </div>
      </div>

      {loading && accounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Carregando contas bancárias...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Você ainda não possui contas bancárias cadastradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <BankCard 
              key={account.id}
              bank={account}
              onViewTransactions={() => toggleTransactions(account.id)}
              onRemoveRequest={handleRemoveBank}
            />
          ))}
        </div>
      )}
      
      {/* Modal para adicionar nova conta */}
      <AddBankAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveAccount={handleSaveAccount}
      />
    </div>
  );
} 
      {loading && accounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Carregando contas bancárias...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Você ainda não possui contas bancárias cadastradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <BankCard 
              key={account.id}
              bank={account}
              onViewTransactions={() => toggleTransactions(account.id)}
              onRemoveRequest={handleRemoveBank}
            />
          ))}
        </div>
      )}
      
      {/* Modal para adicionar nova conta */}
      <AddBankAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveAccount={handleSaveAccount}
      />
    </div>
  );
} 
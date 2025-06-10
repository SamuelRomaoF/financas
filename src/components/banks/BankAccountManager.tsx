import { ArrowDownRight, ArrowUpRight, Building2, History, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  balance: number;
  color: string;
  recentTransactions: Transaction[];
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
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

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
          
          if (transactionError) {
            console.error(`Erro ao buscar transações para o banco ${bank.id}:`, transactionError);
            return {
              id: bank.id,
              bankName: bank.name,
              accountType: bank.type || 'corrente',
              accountNumber: bank.account || 'Sem número',
              balance: bank.balance || 0,
              color: bank.color || '#333333',
              recentTransactions: []
            };
          }
          
          console.log(`Banco: ${bank.name}, Saldo: ${bank.balance}`);
          
          return {
            id: bank.id,
            bankName: bank.name,
            accountType: bank.type || 'corrente',
            accountNumber: bank.account || 'Sem número',
            balance: bank.balance || 0,
            color: bank.color || '#333333',
            recentTransactions: transactionData || []
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
          bankName: bank.name,
          accountType: bank.type || 'corrente',
          accountNumber: bank.account || 'Sem número',
          balance: bank.balance || 0,
          color: bank.color || '#333333',
          recentTransactions: currentAccount?.recentTransactions || []
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
            <Card key={account.id} className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 flex items-center justify-center rounded-lg"
                      style={{ backgroundColor: account.color || '#f3f4f6' }}
                    >
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {account.bankName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {account.accountType === 'corrente' ? 'Conta Corrente' : 
                         account.accountType === 'poupanca' ? 'Poupança' : 
                         account.accountType === 'investimento' ? 'Investimentos' : 
                         account.accountType}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTransactions(account.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <History className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Disponível</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Conta: {account.accountNumber}
                  </div>

                  {showTransactions === account.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Transações Recentes
                      </h4>
                      
                      {account.recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                          {account.recentTransactions.map(transaction => (
                            <div 
                              key={transaction.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                  ${transaction.type === 'income' 
                                    ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                                    : 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400'
                                  }`}
                                >
                                  {transaction.type === 'income' 
                                    ? <ArrowUpRight className="h-4 w-4" />
                                    : <ArrowDownRight className="h-4 w-4" />
                                  }
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {transaction.description || 'Sem descrição'}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <p className={`font-medium
                                ${transaction.type === 'income'
                                  ? 'text-success-600 dark:text-success-400'
                                  : 'text-error-600 dark:text-error-400'
                                }`}
                              >
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma transação recente encontrada.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 
import { Edit, Loader2, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NewTransactionModal from '../../components/transactions/NewTransactionModal';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useBankAccounts } from '../../contexts/BankAccountContext';
import { useCategories } from '../../contexts/CategoryContext';
import { Transaction, useTransactions } from '../../contexts/TransactionContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useSubscription } from '../../hooks/useSubscription';
import { formatCurrency } from '../../utils/formatCurrency';

const GRATIS_TRANSACTION_LIMIT = 50;
const BASICO_TRANSACTION_LIMIT = 100;

type TransactionType = 'all' | 'income' | 'expense';

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const bankIdParam = searchParams.get('bankId');
  const bankNameParam = searchParams.get('bankName');
  
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('all');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(bankIdParam);
  const { subscription } = useSubscription();
  const { accounts } = useBankAccounts();
  const { 
    transactions, 
    isLoading, 
    hasMore,
    loadTransactions,
    loadMoreTransactions,
    addTransaction,
    removeTransaction,
    updateTransaction
  } = useTransactions();
  const { categories: allCategories } = useCategories();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Efeito para carregar transações com filtros
  useEffect(() => {
    loadTransactions({ 
      searchTerm: debouncedSearchTerm, 
      type: selectedType,
      bankId: selectedBankId
    });
  }, [debouncedSearchTerm, selectedType, selectedBankId, loadTransactions]);

  // Efeito para inicializar o filtro de banco da URL
  useEffect(() => {
    if (bankIdParam) {
      setSelectedBankId(bankIdParam);
    }
  }, [bankIdParam]);

  const handleOpenModal = (transaction: Transaction | null = null) => {
    setTransactionToEdit(transaction);
    setIsNewTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'user_id' | 'category'>) => {
    if (transactionToEdit) {
      await updateTransaction(transactionToEdit.id, data);
    } else {
      await addTransaction(data);
    }
    setIsNewTransactionModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleClearBankFilter = () => {
    setSelectedBankId(null);
    // Remover os parâmetros bankId e bankName da URL
    searchParams.delete('bankId');
    searchParams.delete('bankName');
    setSearchParams(searchParams);
  };

  const userPlan = subscription?.plan;
  const isGratisPlan = userPlan === 'free';
  const transactionsCount = transactions.length;
  const gratisLimitReached = isGratisPlan && transactionsCount >= GRATIS_TRANSACTION_LIMIT;

  const isBasicoPlan = userPlan === 'basic';
  const basicoLimitReached = isBasicoPlan && transactionsCount >= BASICO_TRANSACTION_LIMIT;

  const getPaymentMethodDetails = (transaction: Transaction) => {
    return transaction.type === 'income' ? 'Entrada' : 'Saída';
  };

  // Encontrar o nome do banco selecionado
  const selectedBankName = useMemo(() => {
    if (!selectedBankId) return null;
    
    // Primeiro, verificar se temos o nome do banco na URL
    if (bankNameParam && bankIdParam === selectedBankId) {
      return decodeURIComponent(bankNameParam);
    }
    
    // Caso contrário, procurar nas contas carregadas
    const bank = accounts.find(account => account.id === selectedBankId);
    return bank?.bankName || 'Banco';
  }, [selectedBankId, bankNameParam, bankIdParam, accounts]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transações
        </h1>
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          disabled={gratisLimitReached || basicoLimitReached}
        >
          + Nova Transação
        </Button>
      </div>
      {gratisLimitReached && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
          Você atingiu o limite de {GRATIS_TRANSACTION_LIMIT} transações do plano Gratuito. 
          <a href="/planos" className="underline hover:text-yellow-500">Faça upgrade</a> para transações ilimitadas.
        </p>
      )}
      {basicoLimitReached && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
          Você atingiu o limite de {BASICO_TRANSACTION_LIMIT} transações do plano Básico. 
          <a href="/planos" className="underline hover:text-yellow-500">Faça upgrade</a> para o plano Premium para transações ilimitadas.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Pesquisar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TransactionType)}
            >
              <option value="all">Todos os tipos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </Select>
          </div>

          {/* Filtro de Banco */}
          {selectedBankId && selectedBankName && (
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Filtrado por conta:</span>
              <div className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm flex items-center">
                {selectedBankName}
                <button 
                  onClick={handleClearBankFilter}
                  className="ml-2 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {transactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{transaction.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getPaymentMethodDetails(transaction)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(transaction)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeTransaction(transaction.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              !isLoading && (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada.</p>
                  <p className="text-sm text-gray-400">Tente ajustar os filtros ou adicione uma nova transação.</p>
                </div>
              )
            )}
            {isLoading && transactions.length === 0 && (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMoreTransactions}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Carregar Mais'}
          </Button>
        </div>
      )}

      {isNewTransactionModalOpen && (
        <NewTransactionModal
          isOpen={isNewTransactionModalOpen}
          onClose={() => {
            setIsNewTransactionModalOpen(false);
            setTransactionToEdit(null);
          }}
          onSubmit={handleSaveTransaction}
          categories={allCategories}
          transactionToEdit={transactionToEdit}
          preselectedBankId={selectedBankId} // Pré-selecionar o banco filtrado
        />
      )}
    </div>
  );
}
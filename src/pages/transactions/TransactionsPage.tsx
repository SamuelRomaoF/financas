import { Search } from 'lucide-react';
import { ChangeEvent, useState, useMemo } from 'react';
import NewTransactionModal from '../../components/transactions/NewTransactionModal';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSubscription } from '../../hooks/useSubscription';
import { useTransactions } from '../../contexts/TransactionContext';
import { Transaction } from '../../contexts/TransactionContext';

const GRATIS_TRANSACTION_LIMIT = 50;
const BASICO_TRANSACTION_LIMIT = 100;

export default function TransactionsPage() {
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const { subscription } = useSubscription();
  const { transactions, isLoading, addTransaction, removeTransaction } = useTransactions();

  const categories = useMemo(() => {
    const allCategories = transactions.map(t => t.category);
    return [...new Set(allCategories)];
  }, [transactions]);

  const handleNewTransaction = async (data: Omit<Transaction, 'id' | 'user_id'>) => {
    await addTransaction(data);
    setIsNewTransactionModalOpen(false);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  };

  const handlePaymentMethodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaymentMethod(e.target.value);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
    const matchesType = !selectedType || transaction.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const userPlan = subscription?.plan;
  const isGratisPlan = userPlan === 'free';
  const transactionsCount = transactions.length;
  const gratisLimitReached = isGratisPlan && transactionsCount >= GRATIS_TRANSACTION_LIMIT;

  const isBasicoPlan = userPlan === 'basic';
  const basicoLimitReached = isBasicoPlan && transactionsCount >= BASICO_TRANSACTION_LIMIT;

  const getPaymentMethodDetails = (transaction: Transaction) => {
    return transaction.type === 'income' ? 'Entrada' : 'Saída';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transações
        </h1>
        <Button
          variant="primary"
          onClick={() => setIsNewTransactionModalOpen(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Pesquisar transações..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <Search className="h-4 w-4" />
              </div>
            </div>
              <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              >
                <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              </Select>
              <Select
              value={selectedType}
              onChange={handleTypeChange}
              >
                <option value="">Todos os tipos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </Select>
            <Select
              value={selectedPaymentMethod}
              onChange={handlePaymentMethodChange}
            >
              <option value="">Todas as formas de pagamento</option>
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
              </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredTransactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{transaction.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getPaymentMethodDetails(transaction)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada.</p>
                <p className="text-sm text-gray-400">Tente ajustar os filtros ou adicione uma nova transação.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isNewTransactionModalOpen && (
        <NewTransactionModal
          isOpen={isNewTransactionModalOpen}
          onClose={() => setIsNewTransactionModalOpen(false)}
          onSubmit={handleNewTransaction}
          categories={categories}
        />
      )}
    </div>
  );
}
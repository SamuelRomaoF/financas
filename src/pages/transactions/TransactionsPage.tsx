import { Search } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import NewTransactionModal from '../../components/transactions/NewTransactionModal';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency } from '../../utils/formatCurrency';

interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'corrente' | 'poupanca' | 'investimento';
  accountNumber: string;
  balance: number;
  color: string;
}

interface CreditCard {
  id: string;
  name: string;
  number: string;
  limit: number;
  currentSpending: number;
  dueDate: number;
  closingDate: number;
  color: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex';
}

interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod?: 'pix' | 'dinheiro' | 'debito' | 'credito';
  bankAccountId?: string;
  creditCardId?: string;
}

export default function TransactionsPage() {
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // Dados de exemplo - Contas Bancárias
  const [bankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: 'Nubank',
      accountType: 'corrente',
      accountNumber: '1234-5',
      balance: 5000,
      color: '#8A05BE'
    },
    {
      id: '2',
      bankName: 'Itaú',
      accountType: 'poupanca',
      accountNumber: '9876-5',
      balance: 10000,
      color: '#EC7000'
    }
  ]);

  // Dados de exemplo - Cartões de Crédito
  const [creditCards] = useState<CreditCard[]>([
    {
      id: '1',
      name: 'Nubank',
      number: '**** **** **** 1234',
      limit: 5000,
      currentSpending: 1500,
      dueDate: 10,
      closingDate: 3,
      color: '#8A05BE',
      brand: 'mastercard'
    },
    {
      id: '2',
      name: 'Itaú',
      number: '**** **** **** 5678',
      limit: 8000,
      currentSpending: 2500,
      dueDate: 15,
      closingDate: 8,
      color: '#EC7000',
      brand: 'visa'
    }
  ]);

  // Dados de exemplo - Transações
  const [transactions, setTransactions] = useState<Transaction[]>([
  {
    id: '1',
      type: 'entrada',
    description: 'Salário',
    amount: 5000,
    category: 'Receitas',
      date: '2024-03-28',
      paymentMethod: 'pix'
  },
  {
    id: '2',
      type: 'saida',
    description: 'Aluguel',
    amount: 1500,
    category: 'Moradia',
      date: '2024-03-27',
      paymentMethod: 'debito',
      bankAccountId: '1'
  },
  {
    id: '3',
      type: 'saida',
    description: 'Supermercado',
    amount: 800,
    category: 'Alimentação',
      date: '2024-03-26',
      paymentMethod: 'credito',
      creditCardId: '1'
    }
  ]);

  const categories = [
    'Alimentação',
    'Compras Online',
    'Combustível',
    'Educação',
    'Lazer',
    'Moradia',
    'Receitas',
    'Saúde',
    'Streaming',
    'Transporte',
    'Outros'
  ];

  const handleNewTransaction = (data: {
    type: 'entrada' | 'saida';
    description: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod: 'pix' | 'dinheiro' | 'debito' | 'credito';
    bankAccountId?: string;
    creditCardId?: string;
  }) => {
    const newTransaction: Transaction = {
      ...data,
      id: String(Date.now()) // Gera um ID único baseado no timestamp
    };

    setTransactions(prev => [newTransaction, ...prev]);
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

  // Filtra as transações
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
    const matchesType = !selectedType || transaction.type === selectedType;
    const matchesPaymentMethod = !selectedPaymentMethod || transaction.paymentMethod === selectedPaymentMethod;

    return matchesSearch && matchesCategory && matchesType && matchesPaymentMethod;
  });

  // Função para obter detalhes do método de pagamento
  const getPaymentMethodDetails = (transaction: Transaction) => {
    if (!transaction.paymentMethod) return '';

    let bankAccount;
    let creditCard;

    switch (transaction.paymentMethod) {
      case 'pix':
        return 'PIX';
      case 'dinheiro':
        return 'Dinheiro';
      case 'debito':
        bankAccount = bankAccounts.find(acc => acc.id === transaction.bankAccountId);
        return bankAccount ? `Débito - ${bankAccount.bankName}` : 'Débito';
      case 'credito':
        creditCard = creditCards.find(card => card.id === transaction.creditCardId);
        return creditCard ? `Crédito - ${creditCard.name}` : 'Crédito';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transações
        </h1>
        <Button
          variant="primary"
          onClick={() => setIsNewTransactionModalOpen(true)}
        >
          + Nova Transação
        </Button>
      </div>

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
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
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
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Forma de Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {getPaymentMethodDetails(transaction)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.type === 'entrada' 
                        ? 'text-success-600 dark:text-success-400' 
                        : 'text-error-600 dark:text-error-400'
                    }`}>
                      {transaction.type === 'entrada' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <NewTransactionModal
        isOpen={isNewTransactionModalOpen}
        onClose={() => setIsNewTransactionModalOpen(false)}
        onSubmit={handleNewTransaction}
        bankAccounts={bankAccounts}
        creditCards={creditCards}
      />
    </div>
  );
}
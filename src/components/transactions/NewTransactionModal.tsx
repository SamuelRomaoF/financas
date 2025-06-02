import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

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

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: 'entrada' | 'saida';
    description: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod: 'pix' | 'dinheiro' | 'debito' | 'credito';
    bankAccountId?: string;
    creditCardId?: string;
  }) => void;
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
}

export default function NewTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  bankAccounts,
  creditCards
}: NewTransactionModalProps) {
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'debito' | 'credito'>('pix');
  const [bankAccountId, setBankAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      type,
      description,
      amount: Number(amount),
      category,
      date,
      paymentMethod,
      ...(paymentMethod === 'debito' && { bankAccountId }),
      ...(paymentMethod === 'credito' && { creditCardId })
    });

    // Limpa o formulário
    setType('entrada');
    setDescription('');
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('pix');
    setBankAccountId('');
    setCreditCardId('');

    onClose();
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nova Transação
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tipo de Transação */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`
                  flex items-center gap-2 justify-center p-4 rounded-lg border-2 transition-colors
                  ${type === 'entrada'
                    ? 'border-success-600 bg-success-50 text-success-600 dark:border-success-400 dark:bg-success-900/30 dark:text-success-400'
                    : 'border-gray-200 hover:border-success-600 dark:border-gray-700 dark:hover:border-success-400'
                  }
                `}
                onClick={() => setType('entrada')}
              >
                <ArrowDownLeft className="h-5 w-5" />
                Entrada
              </button>
              <button
                type="button"
                className={`
                  flex items-center gap-2 justify-center p-4 rounded-lg border-2 transition-colors
                  ${type === 'saida'
                    ? 'border-error-600 bg-error-50 text-error-600 dark:border-error-400 dark:bg-error-900/30 dark:text-error-400'
                    : 'border-gray-200 hover:border-error-600 dark:border-gray-700 dark:hover:border-error-400'
                  }
                `}
                onClick={() => setType('saida')}
              >
                <ArrowUpRight className="h-5 w-5" />
                Saída
              </button>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label 
                htmlFor="description"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Descrição
              </label>
              <Input
                id="description"
                placeholder="Ex: Salário, Aluguel, etc."
                value={description}
                onChange={handleDescriptionChange}
                required
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <label 
                htmlFor="amount"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  R$
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="pl-10"
                  value={amount}
                  onChange={handleAmountChange}
                  required
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <label 
                htmlFor="category"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Categoria
              </label>
              <Select
                id="category"
                value={category}
                onChange={handleCategoryChange}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label 
                htmlFor="date"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Data
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={handleDateChange}
                required
              />
            </div>

            {/* Forma de Pagamento */}
            {type === 'saida' && (
              <div className="space-y-2">
                <label 
                  htmlFor="paymentMethod"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Forma de Pagamento
                </label>
                <Select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setPaymentMethod(e.target.value as 'pix' | 'dinheiro' | 'debito' | 'credito');
                    setBankAccountId('');
                    setCreditCardId('');
                  }}
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </Select>
              </div>
            )}

            {/* Conta Bancária (para débito) */}
            {type === 'saida' && paymentMethod === 'debito' && (
              <div className="space-y-2">
                <label 
                  htmlFor="bankAccount"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Conta Bancária
                </label>
                <Select
                  id="bankAccount"
                  value={bankAccountId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setBankAccountId(e.target.value)}
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Cartão de Crédito */}
            {type === 'saida' && paymentMethod === 'credito' && (
              <div className="space-y-2">
                <label 
                  htmlFor="creditCard"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cartão de Crédito
                </label>
                <Select
                  id="creditCard"
                  value={creditCardId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setCreditCardId(e.target.value)}
                  required
                >
                  <option value="">Selecione um cartão</option>
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.name} - {card.number}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Adicionar Transação
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
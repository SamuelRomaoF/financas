import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useBankAccounts } from '../../contexts/BankAccountContext';
import { Transaction } from '../../contexts/TransactionContext';
import { Category } from '../../contexts/CategoryContext';
import { useSubscription } from '../../hooks/useSubscription';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'user_id' | 'category'>) => void;
  categories: Category[]; 
  transactionToEdit?: Transaction | null;
}

export default function NewTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  transactionToEdit,
}: NewTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState<string | undefined>(undefined);
  
  // Simplificado por enquanto - no futuro, isso pode ser um campo no form
  // const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'debito' | 'credito'>('pix');
  // const [bankAccountId, setBankAccountId] = useState('');
  
  const { accounts } = useBankAccounts();
  const { subscription } = useSubscription();
  const isFreePlan = subscription?.plan === 'free';
  const isEditMode = !!transactionToEdit;

  useState(() => {
    if (isEditMode && transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.category_id);
      setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
      setBankAccountId(transactionToEdit.bank_id);
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      alert("Por favor, selecione uma categoria.");
      return;
    }

    if (type === 'expense' && !isFreePlan && !bankAccountId) {
      alert("Por favor, selecione uma conta para pagar a despesa.");
      return;
    }

    onSubmit({
      type,
      description,
      amount: Number(amount),
      date,
      bank_id: bankAccountId,
      category_id: categoryId,
    });

    // Limpa o formulário
    setType('expense');
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setBankAccountId(undefined);
    onClose();
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
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
              {isEditMode ? 'Editar Transação' : 'Nova Transação'}
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
                  ${type === 'income' // Corrigido
                    ? 'border-success-600 bg-success-50 text-success-600 dark:border-success-400 dark:bg-success-900/30 dark:text-success-400'
                    : 'border-gray-200 hover:border-success-600 dark:border-gray-700 dark:hover:border-success-400'
                  }
                `}
                onClick={() => setType('income')} // Corrigido
              >
                <ArrowDownLeft className="h-5 w-5" />
                Entrada
              </button>
              <button
                type="button"
                className={`
                  flex items-center gap-2 justify-center p-4 rounded-lg border-2 transition-colors
                  ${type === 'expense' // Corrigido
                    ? 'border-error-600 bg-error-50 text-error-600 dark:border-error-400 dark:bg-error-900/30 dark:text-error-400'
                    : 'border-gray-200 hover:border-error-600 dark:border-gray-700 dark:hover:border-error-400'
                  }
                `}
                onClick={() => setType('expense')} // Corrigido
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
                value={categoryId}
                onChange={handleCategoryChange}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories
                  .filter(c => c.type === type)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </Select>
            </div>

            {/* Conta Bancária (para despesas) */}
            {type === 'expense' && !isFreePlan && (
              <div className="space-y-2">
                <label htmlFor="bankAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pagar com
                </label>
                <Select
                  id="bankAccountId"
                  value={bankAccountId || ''}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  required={!isFreePlan}
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName}
                    </option>
                  ))}
                </Select>
              </div>
            )}

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
                {isEditMode ? 'Salvar Alterações' : 'Adicionar Transação'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import { useBankAccounts } from '../../contexts/BankAccountContext';
import { Category } from '../../contexts/CategoryContext';
import { Transaction } from '../../contexts/TransactionContext';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Select from '../ui/Select';

interface CreditCard {
  id: string;
  name: string;
  lastFourDigits?: string;
}

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'user_id' | 'category'>) => void;
  categories: Category[]; 
  transactionToEdit?: Transaction | null;
  preselectedBankId?: string | null;
}

export default function NewTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  transactionToEdit,
  preselectedBankId,
}: NewTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>(preselectedBankId || '');
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>(preselectedBankId ? 'pix' : 'card');
  const [isInstallment, setIsInstallment] = useState<boolean>(false);
  const [installmentsTotal, setInstallmentsTotal] = useState<number>(1);
  const { accounts } = useBankAccounts();
  
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const isFreePlan = subscription?.plan === 'free';
  const isEditMode = !!transactionToEdit;

  // Adicionar bankId ao formState
  const [formState, setFormState] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    bankId: preselectedBankId || '',
  });

  // Efeito para aplicar o bankId pré-selecionado
  useEffect(() => {
    if (preselectedBankId && !isEditMode) {
      setSelectedBankId(preselectedBankId);
      setPaymentMethod('pix');
    }
  }, [preselectedBankId, isEditMode]);

  // Carregar cartões de crédito
  useEffect(() => {
    const fetchCreditCards = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('credit_cards')
          .select('id, name, last_four_digits')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setCreditCards(data.map(card => ({
          id: card.id,
          name: card.name,
          lastFourDigits: card.last_four_digits
        })));
      } catch (error) {
        console.error('Erro ao buscar cartões:', error);
      }
    };
    
    if (isOpen) {
      fetchCreditCards();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isEditMode && transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.category_id);
      setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
      
      // Definir corretamente o cartão de crédito ou conta bancária
      if (transactionToEdit.credit_card_id) {
        setSelectedCardId(transactionToEdit.credit_card_id);
        setSelectedBankId(transactionToEdit.bank_id || '');
        setPaymentMethod('card');
      } else if (transactionToEdit.bank_id) {
        setSelectedCardId('');
        setSelectedBankId(transactionToEdit.bank_id);
        setPaymentMethod('pix');
      } else {
        setSelectedCardId('');
        // Se não houver banco na transação, mas tiver um pré-selecionado, use-o
        setSelectedBankId(preselectedBankId || '');
        setPaymentMethod(preselectedBankId ? 'pix' : 'card');
      }
      
      // Configurar parcelamento se for uma transação parcelada
      if (transactionToEdit.installments_total && transactionToEdit.installments_total > 1) {
        setIsInstallment(true);
        setInstallmentsTotal(transactionToEdit.installments_total);
      } else {
        setIsInstallment(false);
        setInstallmentsTotal(1);
      }
    } else if (!isEditMode && preselectedBankId) {
      // Se não estiver editando mas tiver um banco pré-selecionado
      setSelectedBankId(preselectedBankId);
      setPaymentMethod('pix');
    }
  }, [isEditMode, transactionToEdit, preselectedBankId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      alert("Por favor, selecione uma categoria.");
      return;
    }

    // Definir o bank_id ou credit_card_id com base no método de pagamento e seleção
    let bankId = null; // Para contas bancárias
    let creditCardId = null; // Para cartões de crédito
    
    // Definir cartão de crédito se for o método de pagamento escolhido
    if (paymentMethod === 'card' && selectedCardId && selectedCardId.trim() !== '') {
      creditCardId = selectedCardId;
      console.log("Transação vinculada ao cartão de crédito:", selectedCardId);
    }
    
    // Definir conta bancária se foi selecionada
    if (selectedBankId && selectedBankId.trim() !== '') {
      bankId = selectedBankId;
      console.log("Transação vinculada à conta bancária:", selectedBankId);
    }
    
    // Para método PIX, garantir que a conta bancária seja usada
    if (paymentMethod === 'pix' && selectedBankId && selectedBankId.trim() !== '') {
      bankId = selectedBankId;
      console.log("Transação PIX vinculada à conta bancária:", selectedBankId);
    }
    
    // Log para debug
    console.log('Método de pagamento:', paymentMethod);
    console.log('Cartão selecionado:', selectedCardId);
    console.log('Banco selecionado:', selectedBankId);
    console.log('Bank ID final:', bankId);
    console.log('Credit Card ID final:', creditCardId);

    // Converter o valor para número, tratando tanto vírgula quanto ponto
    let numericAmount = amount;
    // Substitui a vírgula por ponto para cálculos
    numericAmount = numericAmount.replace(',', '.');
    // Remove pontos extras (separadores de milhar)
    numericAmount = numericAmount.replace(/\.(?=.*\.)/g, '');
    
    // Valor numérico parseado
    const parsedAmount = parseFloat(numericAmount);
    
    // Preparar os dados para envio
    const transactionData: any = {
      type,
      description,
      amount: parsedAmount,
      date,
      category_id: categoryId,
    };
    
    // Adicionar bank_id se um valor válido foi selecionado
    if (bankId && typeof bankId === 'string' && bankId.trim() !== '') {
      transactionData.bank_id = bankId;
    }
    
    // Adicionar credit_card_id se um valor válido foi selecionado
    if (creditCardId && typeof creditCardId === 'string' && creditCardId.trim() !== '') {
      transactionData.credit_card_id = creditCardId;
    }
    
    // Adicionar informações de parcelamento se for parcelado
    if (paymentMethod === 'card' && isInstallment && installmentsTotal > 1) {
      // Adicionar detalhes do parcelamento
      transactionData.description = `${description} (Parcela 1/${installmentsTotal})`;
      transactionData.installments_total = installmentsTotal;
      
      // Calculamos o valor de cada parcela dividindo o valor total pelo número de parcelas
      // Armazenamos o valor original (valor total) para uso posterior
      const totalValue = parsedAmount;
      const installmentValue = totalValue / installmentsTotal;
      
      // Atualizamos o valor da transação para ser o valor da parcela
      transactionData.amount = parseFloat(installmentValue.toFixed(2));
      transactionData.original_amount = totalValue;
      
      console.log(`Transação parcelada: ${installmentsTotal}x de ${transactionData.amount}, Total: ${totalValue}`);
    }

    console.log('Enviando transação:', transactionData); // Log para debug
    onSubmit(transactionData);

    // Limpa o formulário
    setType('expense');
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedCardId('');
    setPaymentMethod('card');
    setIsInstallment(false);
    setInstallmentsTotal(1);
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
                  ${type === 'income' 
                    ? 'border-success-600 bg-success-50 text-success-600 dark:border-success-400 dark:bg-success-900/30 dark:text-success-400'
                    : 'border-gray-200 hover:border-success-600 dark:border-gray-700 dark:hover:border-success-400'
                  }
                `}
                onClick={() => setType('income')}
              >
                <ArrowDownLeft className="h-5 w-5" />
                Entrada
              </button>
              <button
                type="button"
                className={`
                  flex items-center gap-2 justify-center p-4 rounded-lg border-2 transition-colors
                  ${type === 'expense'
                    ? 'border-error-600 bg-error-50 text-error-600 dark:border-error-400 dark:bg-error-900/30 dark:text-error-400'
                    : 'border-gray-200 hover:border-error-600 dark:border-gray-700 dark:hover:border-error-400'
                  }
                `}
                onClick={() => setType('expense')}
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
                  placeholder="0,00"
                  className="pl-10"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Validação para permitir apenas números e um único separador decimal (vírgula ou ponto)
                    const hasComma = value.includes(',');
                    const hasDot = value.includes('.');
                    
                    // Verifica se está tentando adicionar um separador incompatível
                    if ((hasComma && e.target.value.endsWith('.')) || 
                        (hasDot && e.target.value.endsWith(','))) {
                      // Não permite adicionar um tipo diferente de separador
                      return;
                    }
                    
                    // Conta o número de separadores decimais
                    const commaCount = (value.match(/,/g) || []).length;
                    const dotCount = (value.match(/\./g) || []).length;
                    
                    // Se já existe mais de um separador do mesmo tipo, não permite adicionar mais
                    if ((commaCount > 1) || (dotCount > 1)) {
                      return;
                    }
                    
                    // Permite apenas números e um único separador decimal
                    const sanitizedValue = value.replace(/[^\d.,]/g, '');
                    setAmount(sanitizedValue);
                  }}
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

            {/* Método de Pagamento (para despesas) */}
            {type === 'expense' && (
              <div className="space-y-2">
                <label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Método de Pagamento (opcional)
                </label>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    className={`py-2 px-4 text-sm rounded-md ${paymentMethod === 'card' 
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    Cartão de Crédito
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-4 text-sm rounded-md ${paymentMethod === 'pix' 
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
                    onClick={() => setPaymentMethod('pix')}
                  >
                    PIX
                  </button>
                </div>
                
                {paymentMethod === 'card' && (
                  <>
                    <Select
                      id="cardId"
                      value={selectedCardId}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                    >
                      <option value="">Selecione um cartão</option>
                      {creditCards.map(card => (
                        <option key={card.id} value={card.id}>
                          {card.name} {card.lastFourDigits ? `(${card.lastFourDigits})` : ''}
                        </option>
                      ))}
                    </Select>
                    
                    {/* Opção de Parcelamento */}
                    <div className="mt-4">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all">
                        <input
                          type="checkbox"
                          id="isInstallment"
                          checked={isInstallment}
                          onChange={(e) => setIsInstallment(e.target.checked)}
                          className="h-5 w-5 rounded-md border-2 border-gray-300 checked:border-primary-500 checked:bg-primary-500 text-white focus:ring-primary-500 focus:ring-offset-1 focus:ring-2 transition-colors appearance-none relative after:absolute after:content-['✓'] after:text-white after:font-bold after:text-sm after:top-[-1px] after:left-[3px] after:opacity-0 checked:after:opacity-100"
                        />
                        <label htmlFor="isInstallment" className="flex items-center ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                          <span className="mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                          </span>
                          Compra Parcelada
                        </label>
                      </div>
                      
                      {isInstallment && (
                        <div className="mt-3 ml-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <label htmlFor="installmentsTotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número de Parcelas
                          </label>
                          <Select
                            id="installmentsTotal"
                            value={installmentsTotal.toString()}
                            onChange={(e) => setInstallmentsTotal(parseInt(e.target.value))}
                            required={isInstallment}
                            className="border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200 rounded-md shadow-sm"
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i + 2} value={i + 2}>
                                {i + 2}x {amount ? `de ${formatCurrency(parseFloat(amount.replace(',', '.')) / (i + 2))}` : ''}
                              </option>
                            ))}
                          </Select>
                          <p className="text-xs text-gray-500 mt-2 flex items-center">
                            <span className="mr-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                            </span>
                            Valor total: {amount ? formatCurrency(parseFloat(amount.replace(',', '.'))) : 'R$ 0,00'}
                          </p>
                          <p className="text-xs text-amber-600 mt-2">
                            <span>⚠️</span> O valor total da compra (acima) será descontado do limite do cartão.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
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

            {/* Conta Bancária */}
            <div className="space-y-1">
              <Label htmlFor="bankId">
                Conta Bancária {paymentMethod === 'card' ? '(opcional)' : ''}
              </Label>
              <Select
                id="bankId"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                required={paymentMethod !== 'card'} // Torna obrigatório apenas se não for cartão
              >
                <option value="">Nenhuma (sem vínculo com conta)</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {paymentMethod === 'card' 
                  ? 'Opcional para pagamentos com cartão de crédito' 
                  : 'Selecione "Nenhuma" se não quiser vincular a uma conta'}
              </p>
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
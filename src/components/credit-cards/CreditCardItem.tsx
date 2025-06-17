import { Check, Clock, CreditCard, Edit, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { supabase } from '../../lib/supabase';
import { CreditCardData } from '../../types/finances';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';

interface CreditCardItemProps {
  card: CreditCardData;
  onEdit: () => void;
  onRemove: () => void;
}

export default function CreditCardItem({ card, onEdit, onRemove }: CreditCardItemProps) {
  // Log para debug
  console.log(`Renderizando cartão ${card.name} com gasto atual: ${card.currentSpending} e limite: ${card.limit}`);
  
  const { user } = useAuth();
  const { payCardBill } = useTransactions();
  
  const [currentSpending, setCurrentSpending] = useState(card.currentSpending || 0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchCardTransactions = async () => {
      try {
        // Buscar transações associadas a este cartão especificamente
        const { data, error } = await supabase
          .from('transactions')
          .select('id, description, amount, date, installments_total, installment_number, original_amount, status')
          .eq('credit_card_id', card.id)
          .eq('type', 'expense')
          .order('date', { ascending: false })
          .limit(5); // Aumentando para 5 transações recentes
          
        if (error) {
          console.error('Erro ao buscar transações do cartão:', error);
          return;
        }
        
        console.log(`Transações encontradas para o cartão ${card.name}:`, data);
        
        if (data && data.length > 0) {
          // Transformar os dados para incluir informações de parcelamento
          const formattedTransactions = data.map(t => ({
            ...t,
            isInstallment: Boolean(t.installments_total && t.installments_total > 1),
            installmentInfo: t.installment_number && t.installments_total ? 
              `${t.installment_number}/${t.installments_total}` : '',
            installmentNumber: t.installment_number,
            status: t.status || 'pending'
          }));
          
          setRecentTransactions(formattedTransactions);
          
          // Calcular o total gasto considerando todas as transações
          const { data: allTransactions, error: allError } = await supabase
            .from('transactions')
            .select('amount, original_amount, installment_number, installments_total')
            .eq('credit_card_id', card.id)
            .eq('type', 'expense');
            
          if (!allError && allTransactions) {
            // Na aba cartão, usamos o valor total (original_amount) para transações parceladas
            // em vez do valor das parcelas (amount)
            const total = allTransactions.reduce((sum, t) => {
              // Se for uma transação parcelada (tem original_amount e installment_number === 1)
              // usamos o valor total da compra
              if (t.original_amount && t.installment_number === 1) {
                return sum + t.original_amount;
              }
              // Para transações parceladas que não são a primeira parcela, ignoramos
              // para evitar contar duas vezes
              else if (t.installment_number && t.installment_number > 1) {
                return sum;
              }
              // Para transações normais, usamos o valor normal
              else {
                return sum + t.amount;
              }
            }, 0);
            
          setCurrentSpending(total);
          console.log(`Total gasto no cartão ${card.name}: ${total}`);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      }
    };
    
    fetchCardTransactions();
    
    // Adicionar listener para atualizar quando novas transações forem adicionadas
    const handleTransactionUpdated = () => {
      console.log(`Evento de atualização recebido para o cartão ${card.name}`);
      fetchCardTransactions();
    };
    
    document.addEventListener('transaction-updated', handleTransactionUpdated);
    
    return () => {
      document.removeEventListener('transaction-updated', handleTransactionUpdated);
    };
  }, [card.id, card.name]);
  
  // Calcular o limite disponível
  const availableLimit = card.limit - currentSpending;
  
  // Função para buscar contas bancárias do usuário
  const fetchBankAccounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('id, name, balance')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setBankAccounts(data || []);
      
      // Selecionar a primeira conta bancária por padrão
      if (data && data.length > 0) {
        setSelectedBankId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      toast.error('Erro ao carregar contas bancárias');
    }
  };
  
  const handlePayDialogOpen = () => {
    fetchBankAccounts();
    setIsPayDialogOpen(true);
  };
  
  const handlePayBill = async () => {
    if (!selectedBankId) {
      toast.error('Selecione uma conta bancária para pagar a fatura');
      return;
    }
    
    // Verificar se a conta bancária tem saldo suficiente
    const selectedBank = bankAccounts.find(bank => bank.id === selectedBankId);
    if (selectedBank && selectedBank.balance < currentSpending) {
      toast.error(`Saldo insuficiente na conta ${selectedBank.name}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await payCardBill(card.id, selectedBankId, currentSpending);
      
      if (result.error) {
        throw result.error;
      }
      
      setIsPayDialogOpen(false);
      // A UI será atualizada pelo evento transaction-updated
    } catch (error) {
      console.error('Erro ao pagar fatura:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="h-3" style={{ backgroundColor: card.color }}></div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{card.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                •••• {card.lastFourDigits || '****'}
              </p>
            </div>
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Editar cartão"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                aria-label="Remover cartão"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Limite</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(card.limit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Utilizado</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(currentSpending)}
                </p>
              </div>
            </div>
            
            {card.limit > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>0%</span>
                  <span>{Math.round((currentSpending / card.limit) * 100)}%</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (currentSpending / card.limit) * 100)}%`,
                      backgroundColor: card.color
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Vencimento: dia {card.dueDate}</span>
              <span>•</span>
              <span>Fechamento: dia {card.closingDate}</span>
            </div>
            
            {recentTransactions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transações Recentes:</p>
                <div className="space-y-2">
                  {recentTransactions.map(transaction => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1">
                          {transaction.status === 'completed' ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-amber-500" />
                          )}
                          <p className="text-sm text-gray-900 dark:text-white">
                            {transaction.description}
                            {transaction.isInstallment && (
                              <span className="ml-1 text-xs px-1.5 py-0.5 bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-md">
                                {transaction.installmentInfo}
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                          <span className="ml-2">
                            {transaction.status === 'completed' ? 
                              'Concluída' : 
                              'Pendente'}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {transaction.isInstallment ? 
                          formatCurrency(transaction.original_amount || transaction.amount) :
                          formatCurrency(transaction.amount)
                        }
                      </p>
                        {transaction.isInstallment && transaction.original_amount && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Parcela: {formatCurrency(transaction.amount)}
                      </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentSpending > 0 && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handlePayDialogOpen}
                >
                  <CreditCard className="h-4 w-4" />
                  Pagar Fatura
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Modal para pagamento da fatura */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar fatura do cartão {card.name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Valor da fatura</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(currentSpending)}
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="bank-account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selecione a conta bancária
              </label>
              
              {bankAccounts.length === 0 ? (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  Você não possui contas bancárias cadastradas. Adicione uma conta antes de pagar a fatura.
                </p>
              ) : (
                <select
                  id="bank-account"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                >
                  {bankAccounts.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - Saldo: {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              O valor será debitado da conta bancária selecionada e a fatura do cartão será considerada como paga.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPayDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handlePayBill}
              disabled={isLoading || bankAccounts.length === 0}
            >
              {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
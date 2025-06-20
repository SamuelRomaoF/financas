import { Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { SaveableCreditCardData } from '../../types/finances';
import { formatCurrency } from '../../utils/formatCurrency';
import AddCardModal from './AddCardModal';

export interface CreditCard {
  id: string;
  name: string;
  number: string;
  lastDigits: string;
  limit: number;
  availableLimit: number;
  currentSpending: number;
  dueDate: number;
  closingDate: number;
  color: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex';
  currentInvoice: number;
  nextInvoice: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    isInstallment: boolean;
    installmentInfo: string;
    originalAmount: number;
    installmentNumber?: number;
    status?: string;
  }>;
  selected?: boolean;
}

export default function CreditCardManager() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Handler para o evento de atualização de transação
  const handleTransactionUpdated = useCallback(() => {
    console.log('Evento de atualização de transação detectado no CreditCardManager');
    fetchCreditCards();
  }, []);
  
  // Função para verificar e processar pagamentos automáticos
  const checkAutomaticPayments = async () => {
    if (!user) return;
    
    try {
      // Buscar todos os cartões do usuário
      const { data: cards, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Data atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Verificar cada cartão
      for (const card of cards) {
        // Verificar se hoje é o dia de vencimento da fatura
        const dueDate = new Date();
        dueDate.setDate(card.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        // Verificar se a fatura venceu hoje ou em dias anteriores e ainda não foi paga
        if (dueDate <= today && card.current_invoice > 0) {
          console.log(`Fatura do cartão ${card.name} venceu em ${dueDate.toLocaleDateString()}. Verificando pagamento automático...`);
          
          // Verificar se já existe um pagamento registrado para esta fatura neste mês
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          const { data: existingPayments, error: paymentError } = await supabase
            .from('transactions')
            .select('*')
            .eq('credit_card_id', card.id)
            .eq('is_card_bill_payment', true)
            .gte('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);
            
          if (paymentError) {
            console.error(`Erro ao verificar pagamentos existentes para o cartão ${card.name}:`, paymentError);
            continue;
          }
          
          // Se não houver pagamento registrado para este mês, registrar automaticamente
          if (!existingPayments || existingPayments.length === 0) {
            console.log(`Nenhum pagamento registrado para a fatura do cartão ${card.name} neste mês. Registrando pagamento automático...`);
            
            // Buscar a conta bancária principal do usuário
            const { data: bankAccounts, error: bankError } = await supabase
              .from('banks')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_primary', true);
              
            if (bankError || !bankAccounts || bankAccounts.length === 0) {
              console.error('Erro ao buscar conta bancária principal:', bankError);
              toast.error(`Não foi possível registrar o pagamento automático da fatura do cartão ${card.name}. Conta bancária não encontrada.`);
              continue;
            }
            
            const primaryAccount = bankAccounts[0];
            
            // Registrar o pagamento automático
            const paymentData = {
              user_id: user.id,
              description: `Pagamento automático da fatura do cartão ${card.name}`,
              amount: card.current_invoice,
              date: today.toISOString().split('T')[0],
              type: "expense",
              category_id: null, // Categoria padrão para pagamentos
              bank_id: primaryAccount.id,
              credit_card_id: card.id,
              is_card_bill_payment: true,
              status: 'pago'
            };
            
            // Inserir a transação
            const { error: insertError } = await supabase
              .from('transactions')
              .insert(paymentData);
              
            if (insertError) {
              console.error(`Erro ao registrar pagamento automático para o cartão ${card.name}:`, insertError);
              toast.error(`Erro ao registrar pagamento automático da fatura do cartão ${card.name}`);
              continue;
            }
            
            // Atualizar o valor gasto do cartão
            const { error: updateError } = await supabase
              .from('credit_cards')
              .update({ current_invoice: 0 })
              .eq('id', card.id);
              
            if (updateError) {
              console.error(`Erro ao atualizar valor da fatura do cartão ${card.name}:`, updateError);
              continue;
            }
            
            toast.success(`Pagamento automático da fatura do cartão ${card.name} registrado com sucesso!`);
            
            // Atualizar os cartões
            fetchCreditCards();
          } else {
            console.log(`Já existe pagamento registrado para a fatura do cartão ${card.name} neste mês.`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos automáticos:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCreditCards();
      
      // Adiciona um listener para o evento de atualização de transação
      document.addEventListener('transaction-updated', handleTransactionUpdated);
      
      // Verificar pagamentos automáticos ao carregar o componente
      checkAutomaticPayments();
      
      return () => {
        document.removeEventListener('transaction-updated', handleTransactionUpdated);
      };
    }
  }, [user, handleTransactionUpdated]);

  const fetchCreditCards = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Verificar e atualizar transações de cartão de crédito cujas datas já passaram
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar para início do dia
      
      // Buscar transações de cartão de crédito agendadas cuja data já passou
      const { data: overdueCardTransactions, error: overdueError } = await supabase
        .from('transactions')
        .select('*')
        .lt('date', today.toISOString().split('T')[0])
        .eq('status', 'pending')
        .not('credit_card_id', 'is', null); // Apenas transações com cartão de crédito
        
      if (overdueError) {
        console.error('Erro ao buscar transações de cartão vencidas:', overdueError);
      } else if (overdueCardTransactions && overdueCardTransactions.length > 0) {
        console.log(`Encontradas ${overdueCardTransactions.length} transações de cartão vencidas para atualizar`);
        
        // Atualizar o status das transações vencidas
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .in('id', overdueCardTransactions.map(t => t.id));
          
        if (updateError) {
          console.error('Erro ao atualizar status das transações de cartão:', updateError);
        } else {
          console.log(`${overdueCardTransactions.length} transações de cartão atualizadas para status 'completed'`);
        }
      }
      
      // Buscar cartões de crédito
      const { data: cardsData, error: cardsError } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id);
        
      if (cardsError) throw cardsError;
      
      // Transformar os dados do banco para o formato CreditCard
      const formattedCards: CreditCard[] = cardsData.map(card => {
        // Valores padrão para fatura atual e próxima
        const currentInvoice = 0;
        const nextInvoice = 0;
        
        // Calcular gasto atual (usamos o valor armazenado no banco)
        const currentSpending = card.current_spending || 0;
        
        // Calcular limite disponível
        const availableLimit = card.limit - currentSpending;
        
        return {
          id: card.id,
          name: card.name,
          number: `•••• •••• •••• ${card.last_four_digits || 'XXXX'}`,
          lastDigits: card.last_four_digits || 'XXXX',
          limit: card.limit,
          availableLimit: availableLimit > 0 ? availableLimit : 0,
          currentSpending,
          dueDate: card.due_date,
          closingDate: card.closing_date,
          color: card.color || '#6366F1',
          brand: card.brand as 'visa' | 'mastercard' | 'elo' | 'amex',
          currentInvoice,
          nextInvoice,
          recentTransactions: [], // Inicialmente sem transações
          selected: false, // Inicialmente não selecionado
        };
      });
      
      // Buscar todas as transações do usuário
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, description, amount, date, bank_id, credit_card_id, installments_total, installment_number, original_amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .order('date', { ascending: false })
        .limit(100); // Aumentado para 100 para garantir que temos transações suficientes
      
      console.log("Transações carregadas:", allTransactions);
      
      if (transactionsError) {
        console.error('Erro ao buscar transações:', transactionsError);
      } else if (allTransactions && allTransactions.length > 0) {
        // Associar as transações aos respectivos cartões usando credit_card_id com prioridade
        const cardsWithTransactions = formattedCards.map(card => {
          console.log(`Procurando transações para o cartão ${card.name} (ID: ${card.id})`);
          
          // Filtrar as transações que correspondem a este cartão específico
          // Priorizar credit_card_id para cartões de crédito
          const cardTransactions = allTransactions
            .filter(t => {
              // Verificar apenas pelo credit_card_id para garantir que estamos pegando apenas transações deste cartão
              return t.credit_card_id === card.id;
            })
            .slice(0, 5) // Mostrar até 5 transações recentes por cartão
            .map(t => ({
              id: t.id,
              description: t.description || 'Transação',
              amount: t.amount,
              date: t.date,
              isInstallment: Boolean(t.installments_total && t.installments_total > 1),
              installmentInfo: t.installment_number && t.installments_total ? 
                `${t.installment_number}/${t.installments_total}` : '',
              originalAmount: t.original_amount,
              installmentNumber: t.installment_number
            }));
            
          console.log(`Cartão ${card.name}: encontradas ${cardTransactions.length} transações`);
          
          // Calcular fatura atual (soma das transações vinculadas a este cartão)
          // Na aba cartão, usamos o valor total (original_amount) para transações parceladas
          const currentInvoice = cardTransactions.reduce((sum, t) => {
            if (t.isInstallment && t.originalAmount) {
              // Se for uma transação parcelada com installment_number === 1, usamos o valor total
              return t.installmentNumber === 1 ? sum + t.originalAmount : sum;
            } else {
              // Para transações normais, usamos o valor normal
              return sum + t.amount;
            }
          }, 0);
          
          // Para o limite utilizado, precisamos buscar todas as transações (não apenas as 5 recentes)
          // para calcular corretamente
          const allCardTransactions = allTransactions.filter(t => t.credit_card_id === card.id);
          
          // Calcular o valor correto para o limite utilizado do cartão:
          // Na aba cartão, usamos o valor total (original_amount) para transações parceladas
          // em vez do valor das parcelas (amount)
          const currentSpending = allCardTransactions.reduce((sum, t) => {
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
            
          return {
            ...card,
            recentTransactions: cardTransactions,
            currentInvoice: currentInvoice,
            // Atualizar o gasto atual para mostrar o valor total das compras parceladas
            currentSpending: currentSpending,
          };
        });
        
        setCreditCards(cardsWithTransactions);
      } else {
        setCreditCards(formattedCards);
      }
    } catch (error) {
      console.error('Erro ao buscar cartões de crédito:', error);
      toast.error('Erro ao carregar cartões de crédito');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (cardDataFromModal: SaveableCreditCardData) => {
    if (!user) return;
    
    try {
      // Salvar o cartão no banco de dados
      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: user.id,
          name: cardDataFromModal.name,
          last_four_digits: cardDataFromModal.lastFourDigits,
          limit: cardDataFromModal.limit,
          due_date: cardDataFromModal.dueDate,
          closing_date: cardDataFromModal.closingDate,
          color: cardDataFromModal.color,
          brand: cardDataFromModal.brand
        })
        .select();
        
      if (error) throw error;
      
      // Recarregar cartões
      fetchCreditCards();
      toast.success('Cartão adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar cartão:', error);
      toast.error('Erro ao adicionar cartão');
    }
  };

  const toggleCardSelection = (cardId: string) => {
    setCreditCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, selected: !card.selected } 
          : card
      )
    );
  };

  // Componente para seleção de cartões
  const CardSelectionModal = () => {
    if (!isManageModalOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-lg font-bold mb-4">Gerenciar Cartões</h2>
          
          <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
            {creditCards.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Você ainda não tem cartões cadastrados.</p>
            ) : (
              creditCards.map(card => (
                <div 
                  key={card.id}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <input 
                    type="checkbox"
                    id={`card-${card.id}`}
                    checked={card.selected}
                    onChange={() => toggleCardSelection(card.id)}
                    className="mr-3"
                  />
                  <label 
                    htmlFor={`card-${card.id}`}
                    className="flex flex-1 cursor-pointer"
                  >
                    <div 
                      className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white"
                      style={{ backgroundColor: card.color }}
                    >
                      {card.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{card.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{card.number}</p>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-primary-600 hover:text-primary-700"
            >
              Adicionar Novo Cartão
            </button>
            
            <div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 ml-2"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cartões de Crédito (Manager)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe seus gastos e limites detalhadamente</p>
        </div>
        <button
          onClick={() => setIsManageModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Settings className="h-5 w-5 mr-2" />
          Gerenciar Cartões
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {creditCards.length === 0 ? (
          <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Você ainda não tem cartões de crédito cadastrados.
            </p>
          </div>
        ) : creditCards.filter(card => card.selected).length === 0 ? (
          <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Selecione os cartões que deseja visualizar clicando em "Gerenciar Cartões".
            </p>
          </div>
        ) : (
          creditCards.filter(card => card.selected).map((card) => (
            <div
              key={card.id}
              className="rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <div 
                className="p-4 flex justify-between items-center text-white"
                style={{ background: card.color }}
              >
                <div>
                  <h3 className="font-semibold">{card.name}</h3>
                  <p className="opacity-80 text-sm">{card.number}</p>
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Limite Utilizado</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(card.currentSpending)} / {formatCurrency(card.limit)}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(card.currentSpending / card.limit) * 100}%`,
                      backgroundColor: card.color 
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 border-t border-gray-200 dark:border-gray-800">
                <div className="p-3 text-center border-r border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">Dia {card.dueDate}</p>
                </div>
                <div className="p-3 text-center border-r border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fechamento</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">Dia {card.closingDate}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Disponível</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{formatCurrency(card.availableLimit)}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-2">
                  <div className="p-3 border-r border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fatura Atual</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{formatCurrency(card.currentInvoice)}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Próxima Fatura</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{formatCurrency(card.nextInvoice)}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Transações Recentes</p>
                <div className="space-y-2">
                  {card.recentTransactions.length > 0 ? (
                    card.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {transaction.description}
                            {transaction.isInstallment && (
                              <span className="ml-1 text-xs px-1.5 py-0.5 bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-md">
                                {transaction.installmentInfo}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</p>
                          {transaction.isInstallment && transaction.originalAmount && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Total: {formatCurrency(transaction.originalAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nenhuma transação recente</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <AddCardModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsManageModalOpen(true); // Reabrir o modal de gerenciamento após adicionar
          }}
          onSaveCard={handleAddCard}
          cardToEdit={null}
        />
      )}
      
      <CardSelectionModal />
    </div>
  );
} 
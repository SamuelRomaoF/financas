import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { SaveableCreditCardData } from '../../types/finances';
import { formatCurrency } from '../../utils/formatCurrency';
import AddCardModal from './AddCardModal';

interface CreditCard {
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
  }>;
}

export default function CreditCardManager() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar cartões de crédito do usuário
  useEffect(() => {
    if (user) {
      fetchCreditCards();
    }
  }, [user]);

  const fetchCreditCards = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
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
          recentTransactions: [] // Inicialmente sem transações
        };
      });
      
      // Buscar todas as transações do usuário
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, description, amount, date, payment_method')
        .eq('user_id', user.id)
        .eq('payment_method', 'card')
        .order('date', { ascending: false })
        .limit(10); // Limitar a 10 transações recentes
      
      if (transactionsError) {
        console.error('Erro ao buscar transações:', transactionsError);
      } else if (allTransactions && allTransactions.length > 0) {
        // Distribuir as transações entre os cartões (simplificado)
        // Como não temos o credit_card_id, vamos distribuir as transações igualmente entre os cartões
        const cardsWithTransactions = formattedCards.map((card, index) => {
          // Dividir as transações entre os cartões
          const cardTransactions = allTransactions
            .filter((_, i) => i % formattedCards.length === index)
            .slice(0, 2) // Limitar a 2 transações por cartão
            .map(t => ({
              id: t.id,
              description: t.description || 'Transação',
              amount: t.amount,
              date: t.date
            }));
            
          return {
            ...card,
            recentTransactions: cardTransactions,
            // Calcular fatura atual (soma das transações recentes)
            currentInvoice: cardTransactions.reduce((sum, t) => sum + t.amount, 0)
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
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {creditCards.length === 0 ? (
          <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Você ainda não tem cartões de crédito cadastrados.
            </p>
          </div>
        ) : (
          creditCards.map((card) => (
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
                      <p className="text-sm text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</p>
                  </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma transação recente</p>
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
          onClose={() => setIsAddModalOpen(false)}
          onSaveCard={handleAddCard}
          cardToEdit={null}
        />
      )}
    </div>
  );
} 
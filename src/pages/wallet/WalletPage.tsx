import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AddCardModal from '../../components/credit-cards/AddCardModal';
import CreditCardItem from '../../components/credit-cards/CreditCardItem';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { CreditCardData, SaveableCreditCardData } from '../../types/finances';
import { formatCurrency } from '../../utils/formatCurrency';

// Limite de cartões para o plano básico
const BASIC_PLAN_CARD_LIMIT = 3;

export default function WalletPage() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const isPremium = subscription?.plan === 'premium';
  const isBasic = subscription?.plan === 'basic';

  const [cardsData, setCardsData] = useState<CreditCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCardData | null>(null);
  const [isConfirmRemoveCardModalOpen, setIsConfirmRemoveCardModalOpen] = useState(false);
  const [cardToRemoveId, setCardToRemoveId] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchCreditCards();
  }, [user, navigate]);

  // Adicionar listener para o evento de atualização de transação
  useEffect(() => {
    // Função para lidar com o evento de atualização de transação
    const handleTransactionUpdated = () => {
      console.log("WalletPage: Evento de transação atualizada detectado");
      console.log("WalletPage: Recarregando dados dos cartões...");
      fetchCreditCards(); // Recarregar os dados dos cartões quando uma transação for atualizada
    };

    // Adicionar listener
    document.addEventListener('transaction-updated', handleTransactionUpdated);

    // Remover listener quando o componente for desmontado
    return () => {
      document.removeEventListener('transaction-updated', handleTransactionUpdated);
    };
  }, []);

  const fetchCreditCards = async () => {
    if (!user) return;
    
    try {
      console.log("WalletPage: Iniciando carregamento de cartões de crédito...");
      setIsLoading(true);
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      console.log("WalletPage: Dados dos cartões recebidos:", data);
      
      // Converter os dados para o formato CreditCardData
      const formattedCards: CreditCardData[] = data.map(card => {
        console.log(`WalletPage: Processando cartão ${card.name}, saldo atual: ${card.current_spending}, limite: ${card.limit}`);
        return {
          id: card.id,
          name: card.name,
          brand: card.brand || 'outro',
          lastFourDigits: card.last_four_digits,
          limit: card.limit || 0,
          currentSpending: card.current_spending || 0,
          dueDate: card.due_date || 1,
          closingDate: card.closing_date || 1,
          color: card.color || '#6366F1'
        };
      });
      
      // Buscar todas as transações do usuário para calcular o valor total das compras parceladas
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, amount, credit_card_id, installments_total, installment_number, original_amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .order('date', { ascending: false })
        .limit(100); // Aumentado para 100 para garantir que temos transações suficientes
      
      if (transactionsError) {
        console.error('Erro ao buscar transações:', transactionsError);
      } else if (allTransactions && allTransactions.length > 0) {
        // Atualizar o currentSpending de cada cartão com base nas transações
        const updatedCards = formattedCards.map(card => {
          // Filtrar transações deste cartão
          const cardTransactions = allTransactions.filter(t => t.credit_card_id === card.id);
          
          // Calcular o valor correto para o limite utilizado do cartão:
          // Na aba cartão, usamos o valor total (original_amount) para transações parceladas
          // em vez do valor das parcelas (amount)
          const currentSpending = cardTransactions.reduce((sum, t) => {
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
            currentSpending: currentSpending
          };
        });
        
        setCardsData(updatedCards);
        
        // Log para debug
        const total = updatedCards.reduce((total, card) => total + (card.limit || 0), 0);
        const available = updatedCards.reduce((total, card) => total + ((card.limit || 0) - (card.currentSpending || 0)), 0);
        
        console.log(`WalletPage: Limite total atualizado: ${total}, Disponível: ${available}`);
      } else {
      setCardsData(formattedCards);
      
        // Log para debug
      const total = formattedCards.reduce((total, card) => total + (card.limit || 0), 0);
      const available = formattedCards.reduce((total, card) => total + ((card.limit || 0) - (card.currentSpending || 0)), 0);
      
      console.log(`WalletPage: Limite total atualizado: ${total}, Disponível: ${available}`);
      }
      
    } catch (error) {
      console.error('Erro ao buscar cartões de crédito:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCardClick = () => {
    // Verificar se o usuário do plano básico já atingiu o limite de cartões
    if (isBasic && cardsData.length >= BASIC_PLAN_CARD_LIMIT) {
      setIsUpgradeModalOpen(true);
      return;
    }
    
    setCardToEdit(null);
    setIsAddCardModalOpen(true);
  };

  const handleEditCard = (card: CreditCardData) => {
    setCardToEdit(card);
      setIsAddCardModalOpen(true);
  };

  const handleRemoveCardClick = (cardId: string) => {
    setCardToRemoveId(cardId);
    setIsConfirmRemoveCardModalOpen(true);
  };

  const handleConfirmRemoveCard = async () => {
    if (!cardToRemoveId || !user) return;
    
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', cardToRemoveId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setCardsData(prev => prev.filter(card => card.id !== cardToRemoveId));
      toast.success("Cartão removido com sucesso");
    } catch (error) {
      console.error('Erro ao remover cartão:', error);
      toast.error("Erro ao remover cartão");
    } finally {
    setIsConfirmRemoveCardModalOpen(false);
    setCardToRemoveId(null);
    }
  };

  const handleSaveCard = async (cardData: SaveableCreditCardData) => {
    if (!user) return;
    
    try {
      if (cardToEdit) {
        // Atualizar cartão existente
        const { error } = await supabase
          .from('credit_cards')
          .update({
            name: cardData.name,
            last_four_digits: cardData.lastFourDigits,
            limit: cardData.limit,
            closing_date: cardData.closingDate,
            due_date: cardData.dueDate,
            color: cardData.color,
            brand: cardData.brand
          })
          .eq('id', cardToEdit.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        toast.success("Cartão atualizado com sucesso");
      } else {
        // Verificar novamente o limite para o plano básico
        if (isBasic && cardsData.length >= BASIC_PLAN_CARD_LIMIT) {
          toast.error(`Limite de ${BASIC_PLAN_CARD_LIMIT} cartões atingido no plano Básico`);
          return;
        }
        
        // Adicionar novo cartão
        const { error } = await supabase
          .from('credit_cards')
          .insert({
            user_id: user.id,
            name: cardData.name,
            last_four_digits: cardData.lastFourDigits,
            limit: cardData.limit,
            closing_date: cardData.closingDate,
            due_date: cardData.dueDate,
            color: cardData.color,
            brand: cardData.brand
          });
          
        if (error) throw error;
        toast.success("Cartão adicionado com sucesso");
      }
      
      // Recarregar dados
      fetchCreditCards();
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      toast.error("Erro ao salvar cartão");
    } finally {
    setIsAddCardModalOpen(false);
      setCardToEdit(null);
    }
  };

  // Calcular o limite total dos cartões
  const totalCardLimit = cardsData.reduce(
    (total, card) => total + (card.limit || 0),
    0
  );

  // Calcular o limite total disponível (limite total - gastos atuais)
  // Usamos currentSpending que já considera o valor total das compras parceladas
  const totalAvailableLimit = cardsData.reduce(
    (total, card) => total + ((card.limit || 0) - (card.currentSpending || 0)),
    0
  );

  // Verificar se o usuário do plano básico atingiu o limite de cartões
  const hasReachedCardLimit = isBasic && cardsData.length >= BASIC_PLAN_CARD_LIMIT;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Minha Carteira</h1>
          
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Limite Total</h2>
          <p className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">
            {formatCurrency(totalAvailableLimit)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Em todos os cartões
          </p>
        </Card>
        
        {/* Mensagem sobre contas bancárias para planos não premium */}
        {!isPremium && (
          <Card className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-100 dark:border-primary-800">
            <h2 className="text-lg font-semibold mb-2">Contas Bancárias</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              A funcionalidade de contas bancárias é exclusiva para assinantes do plano Premium.
              </p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/subscription')}
              className="w-full sm:w-auto"
            >
              Fazer upgrade para Premium
            </Button>
                </Card>
          )}
        </div>

      
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Cartões de Crédito</h2>
            {isBasic && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {cardsData.length} de {BASIC_PLAN_CARD_LIMIT} cartões (Plano Básico)
            </p>
            )}
          </div>
          
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleAddCardClick}
            className="flex items-center gap-2"
            disabled={hasReachedCardLimit}
          >
            <Plus className="h-4 w-4" />
            Adicionar Cartão
          </Button>
        </div>

        {hasReachedCardLimit && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Você atingiu o limite de {BASIC_PLAN_CARD_LIMIT} cartões disponíveis no plano Básico.{' '}
              <button 
                onClick={() => navigate('/subscription')}
                className="text-primary-600 dark:text-primary-400 underline hover:text-primary-800"
              >
                Faça upgrade para o plano Premium
              </button>{' '}
              para adicionar cartões ilimitados.
                  </p>
                </div>
        )}

        {cardsData.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Você ainda não adicionou nenhum cartão de crédito.
            </p>
                <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddCardClick}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Adicionar Cartão
                </Button>
            </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsData.map((card) => (
              <CreditCardItem
                key={card.id}
                card={card}
                onEdit={() => handleEditCard(card)}
                onRemove={() => handleRemoveCardClick(card.id)}
              />
          ))}
        </div>
        )}
      

      {/* Modais */}
        <AddCardModal 
          isOpen={isAddCardModalOpen}
          onClose={() => setIsAddCardModalOpen(false)}
          onSaveCard={handleSaveCard}
        cardToEdit={cardToEdit}
        />

      <ConfirmModal
          isOpen={isConfirmRemoveCardModalOpen}
        onClose={() => setIsConfirmRemoveCardModalOpen(false)}
        onConfirm={handleConfirmRemoveCard}
        title="Remover Cartão"
        description="Tem certeza que deseja remover este cartão? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onConfirm={() => navigate('/subscription')}
        title="Limite de Cartões Atingido"
        description={`Você já possui ${BASIC_PLAN_CARD_LIMIT} cartões, que é o limite para o plano Básico. Para adicionar mais cartões, faça upgrade para o plano Premium.`}
        confirmText="Ver Planos"
        cancelText="Cancelar"
        variant="primary"
      />
    </div>
  );
} 
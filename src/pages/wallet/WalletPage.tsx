import { Building2, CreditCard, DollarSign, Plus, Wallet, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import BankAccountDetailsModal from '../../components/banks/BankAccountDetailsModal';
import CreditCardDetailsModal from '../../components/credit-cards/CreditCardDetailsModal';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';
import AddCardModal from '../../components/credit-cards/AddCardModal';
import SelectHighlightedBanksModal from '../../components/banks/SelectHighlightedBanksModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useBankAccounts } from '../../contexts/BankAccountContext';
import { BankAccount, CreditCardData, SaveableCreditCardData } from '../../types/finances';

const getBankInitials = (bankName: string): string => {
  if (!bankName) return '??';
  const words = bankName.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + (words[1][0] || '')).toUpperCase();
  } else if (words.length === 1 && bankName.length >= 2) {
    return bankName.substring(0, 2).toUpperCase();
  } else if (bankName.length > 0) {
    return bankName.substring(0, 1).toUpperCase();
  }
  return '??';
};

export default function WalletPage() {
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<BankAccount | null>(null);
  const [selectedCard, setSelectedCard] = useState<CreditCardData | null>(null);
  const { subscription } = useSubscription();
  const currentPlan = subscription?.plan;

  const { accounts: allUserAccounts, highlightedAccountIds, setHighlightedAccountIds, getAccountById } = useBankAccounts();

  const [cardsData, setCardsData] = useState<CreditCardData[]>([
    {
      id: '1',
      name: 'Nubank',
      lastFourDigits: '1234',
      limit: 5000,
      currentSpending: 2350,
      dueDate: 15,
      closingDate: 8,
      color: '#820AD1',
      brand: 'mastercard'
    },
    {
      id: '2',
      name: 'Inter',
      lastFourDigits: '5678',
      limit: 3000,
      currentSpending: 1200,
      dueDate: 20,
      closingDate: 13,
      color: '#FF7A00',
      brand: 'visa'
    }
  ]);

  const [isSelectBanksModalOpen, setIsSelectBanksModalOpen] = useState(false);

  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isConfirmRemoveCardModalOpen, setIsConfirmRemoveCardModalOpen] = useState(false);
  const [cardToRemoveId, setCardToRemoveId] = useState<string | null>(null);

  const displayedCards = currentPlan === 'basic' ? cardsData.slice(0, 2) : cardsData;
  const displayedHighlightedAccounts = allUserAccounts.filter(account => highlightedAccountIds.includes(account.id));

  const totalBalance = allUserAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalCreditLimit = cardsData.reduce((sum, card) => sum + card.limit, 0);
  const totalCreditUsed = cardsData.reduce((sum, card) => sum + (card.currentSpending || 0), 0);

  const handleAddCardClick = () => {
    if (currentPlan === 'basic' && displayedCards.length >= 2) {
      toast.error('Você atingiu o limite de 2 cartões para o Plano Básico. Faça upgrade para adicionar mais!');
    } else {
      setIsAddCardModalOpen(true);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setCardToRemoveId(cardId);
    setIsConfirmRemoveCardModalOpen(true);
  };

  const executeRemoveCard = () => {
    if (cardToRemoveId) {
      setCardsData(prevCards => prevCards.filter(card => card.id !== cardToRemoveId));
      toast.success("Cartão removido com sucesso!");
    }
    setIsConfirmRemoveCardModalOpen(false);
    setCardToRemoveId(null);
  };

  const handleSaveCard = (cardDataFromModal: SaveableCreditCardData) => {
    const newCardWithId: CreditCardData = {
      id: Date.now().toString(),
      name: cardDataFromModal.name,
      lastFourDigits: cardDataFromModal.lastFourDigits,
      limit: cardDataFromModal.limit,
      currentSpending: 0,
      dueDate: cardDataFromModal.dueDate,
      closingDate: cardDataFromModal.closingDate,
      color: cardDataFromModal.color,
      brand: cardDataFromModal.brand,
    };
    setCardsData(prevCards => [...prevCards, newCardWithId]);
    setIsAddCardModalOpen(false);
    toast.success("Cartão adicionado com sucesso!");
  };

  const handleSaveHighlightedBanks = (selectedIds: string[]) => {
    setHighlightedAccountIds(selectedIds);
    setIsSelectBanksModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-400 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Carteira Digital</h1>
          <p className="mt-2 text-primary-100">Gerencie suas contas e cartões em um só lugar</p>
          
          <div className={`mt-6 grid grid-cols-1 ${currentPlan !== 'basic' ? 'md:grid-cols-3' : ''} gap-6`}>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-primary-100">Saldo Total</p>
                  <p className="text-xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            </div>

            {currentPlan !== 'basic' && (
              <>
                <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-2">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-100">Limite Total</p>
                      <p className="text-xl font-bold">{formatCurrency(totalCreditLimit)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/20 p-2">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-100">Limite Usado</p>
                      <p className="text-xl font-bold">{formatCurrency(totalCreditUsed)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4">
          <div className="h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4">
          <div className="h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        </div>
      </div>

      {currentPlan === 'premium' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Contas Bancárias Destacadas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Suas contas principais ({displayedHighlightedAccounts.length} de até 3). Gerencie todas as suas contas na seção 'Bancos'.
              </p>
            </div>
            <Button 
              variant="outline"
              size="sm" 
              className="mt-2 sm:mt-0 flex items-center gap-2"
              onClick={() => setIsSelectBanksModalOpen(true)}
            >
              <Building2 className="h-4 w-4" />
              Gerenciar Destaques
            </Button>
          </div>

          {displayedHighlightedAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {displayedHighlightedAccounts.map(account => (
                <Card 
                  key={account.id} 
                  className="group hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl group-hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: `${account.color}20`, color: account.color }}
                        >
                          {getBankInitials(account.bankName)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{account.bankName}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {account.accountType === 'corrente' ? 'Conta Corrente' : account.accountType === 'poupanca' ? 'Poupança' : 'Investimentos'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Disponível</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-500 dark:text-gray-400">Conta: {account.accountNumber}</p>
                        <button 
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          onClick={() => setSelectedAccountDetails(account)}
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Nenhuma conta para destacar. Adicione contas na seção 'Bancos' e selecione seus destaques aqui.
            </p>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cartões de Crédito
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Acompanhe seus gastos e limites
            </p>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handleAddCardClick}
          >
            <Plus className="h-4 w-4" />
            Adicionar Cartão
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCards.map(card => (
            <Card 
              key={card.id} 
              className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden bg-white dark:bg-gray-800"
            >
              <div 
                className="h-24 p-6 flex items-center justify-between"
                style={{ 
                  background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`
                }}
              >
                <div>
                  <h3 className="font-semibold text-white">
                    {card.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    •••• •••• •••• {card.lastFourDigits || 'XXXX'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-white" />
                  <Trash2 
                    className="h-5 w-5 text-white/70 hover:text-white cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCard(card.id);
                    }}
                  />
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Limite Utilizado</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(card.currentSpending || 0)} / {formatCurrency(card.limit)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full" 
                      style={{ width: `${((card.currentSpending || 0) / card.limit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dia {card.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fechamento</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dia {card.closingDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Disponível</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(card.limit - (card.currentSpending || 0))}
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50"
                  onClick={() => setSelectedCard(card)}
                >
                  Ver Fatura Detalhada
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedAccountDetails && (
        <BankAccountDetailsModal 
          isOpen={true}
          account={selectedAccountDetails}
          onClose={() => setSelectedAccountDetails(null)}
        />
      )}
      {selectedCard && (
        <CreditCardDetailsModal
          isOpen={true}
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {isAddCardModalOpen && (
        <AddCardModal 
          isOpen={isAddCardModalOpen}
          onClose={() => setIsAddCardModalOpen(false)}
          onSaveCard={handleSaveCard}
        />
      )}

      {isConfirmRemoveCardModalOpen && cardToRemoveId && (
        <ConfirmationModal
          isOpen={isConfirmRemoveCardModalOpen}
          onClose={() => {
            setIsConfirmRemoveCardModalOpen(false);
            setCardToRemoveId(null);
          }}
          onConfirm={executeRemoveCard}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja remover este cartão? Esta ação não poderá ser desfeita.`}
          confirmButtonText="Excluir Cartão"
          confirmButtonIntent="destructive"
          cancelButtonText="Cancelar"
        />
      )}

      {currentPlan === 'premium' && (
          <SelectHighlightedBanksModal 
            isOpen={isSelectBanksModalOpen}
            onClose={() => setIsSelectBanksModalOpen(false)}
            allUserAccounts={allUserAccounts}
            currentHighlightedIds={highlightedAccountIds}
            onSaveSelection={handleSaveHighlightedBanks}
            maxSelectionLimit={3}
          />
      )}
    </div>
  );
} 
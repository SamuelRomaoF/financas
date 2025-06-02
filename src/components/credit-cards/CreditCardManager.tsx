import { Plus } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import AddCreditCardModal from './AddCreditCardModal';

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
  brand: 'visa' | 'mastercard';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Mock data para cartões de crédito
  const creditCards: CreditCard[] = [
    {
      id: '1',
      name: 'Nubank',
      number: '•••• •••• •••• 1234',
      lastDigits: '1234',
      limit: 5000,
      availableLimit: 2650,
      currentSpending: 2350,
      dueDate: 15,
      closingDate: 8,
      color: '#820AD1',
      brand: 'mastercard',
      currentInvoice: 1250.50,
      nextInvoice: 1099.50,
      recentTransactions: [
        {
          id: '1',
          description: 'Supermercado Extra',
          amount: 350.75,
          date: '2024-02-20'
        },
        {
          id: '2',
          description: 'Netflix',
          amount: 39.90,
          date: '2024-02-19'
        }
      ]
    },
    {
      id: '2',
      name: 'Inter',
      number: '•••• •••• •••• 5678',
      lastDigits: '5678',
      limit: 3000,
      availableLimit: 1800,
      currentSpending: 1200,
      dueDate: 20,
      closingDate: 13,
      color: '#FF7A00',
      brand: 'visa',
      currentInvoice: 800.00,
      nextInvoice: 400.00,
      recentTransactions: [
        {
          id: '1',
          description: 'Amazon Prime',
          amount: 14.90,
          date: '2024-02-20'
        },
        {
          id: '2',
          description: 'Posto Shell',
          amount: 200.00,
          date: '2024-02-18'
        }
      ]
    }
  ];

  const handleAddCard = (cardData: { 
    name: string;
    number: string;
    limit: number;
    dueDate: number;
    closingDate: number;
    color: string;
  }) => {
    const newCard: CreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      ...cardData,
      lastDigits: cardData.number.slice(-4),
      availableLimit: cardData.limit,
      currentSpending: 0,
      brand: cardData.number.startsWith('4') ? 'visa' : 'mastercard',
      number: '•••• •••• •••• ' + cardData.number.slice(-4),
      currentInvoice: 0,
      nextInvoice: 0,
      recentTransactions: []
    };
    console.log('Novo cartão:', newCard);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cartões de Crédito</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe seus gastos e limites</p>
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
        {creditCards.map((card) => (
          <div
            key={card.id}
            className="rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            {/* Cabeçalho do cartão */}
            <div 
              className="p-4 flex justify-between items-center text-white"
              style={{ 
                background: card.color,
              }}
            >
              <div>
                <h3 className="font-semibold">{card.name}</h3>
                <p className="opacity-80 text-sm">{card.number}</p>
              </div>
              <img 
                src={`/card-brands/${card.brand}.svg`}
                alt={card.brand}
                className="h-6"
              />
            </div>

            {/* Barra de progresso do limite */}
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

            {/* Informações em grid */}
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

            {/* Faturas */}
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

            {/* Transações Recentes */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Transações Recentes</p>
              <div className="space-y-2">
                {card.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de adicionar cartão */}
      {isAddModalOpen && (
        <AddCreditCardModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddCard}
        />
      )}
    </div>
  );
} 
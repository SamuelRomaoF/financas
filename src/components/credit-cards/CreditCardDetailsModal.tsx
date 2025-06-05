import { CreditCard, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { CreditCardData, Purchase } from '../../types/finances';

interface CreditCardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCardData;
}

export default function CreditCardDetailsModal({
  isOpen,
  onClose,
  card
}: CreditCardDetailsModalProps) {
  const [selectedTab, setSelectedTab] = useState<'atual' | 'anterior'>('atual');

  // Dados de exemplo de compras
  const currentInvoice: Purchase[] = [
    {
      id: '1',
      description: 'Amazon',
      amount: 459.90,
      date: '2024-03-28',
      category: 'Compras Online',
      installments: {
        current: 2,
        total: 6,
        amount: 459.90
      }
    },
    {
      id: '2',
      description: 'Netflix',
      amount: 39.90,
      date: '2024-03-27',
      category: 'Streaming'
    },
    {
      id: '3',
      description: 'Posto Shell',
      amount: 200.00,
      date: '2024-03-26',
      category: 'Combustível'
    }
  ];

  const previousInvoice: Purchase[] = [
    {
      id: '4',
      description: 'Supermercado Extra',
      amount: 350.90,
      date: '2024-02-28',
      category: 'Alimentação'
    },
    {
      id: '5',
      description: 'Cinema',
      amount: 60.00,
      date: '2024-02-25',
      category: 'Lazer'
    }
  ];

  if (!isOpen) return null;

  const invoiceData = selectedTab === 'atual' ? currentInvoice : previousInvoice;
  const invoiceTotal = invoiceData.reduce((sum, purchase) => sum + purchase.amount, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          {/* Cabeçalho com gradiente */}
          <div 
            className="p-6"
            style={{ 
              background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CreditCard className="h-8 w-8 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {card.name}
                  </h2>
                  <p className="text-white/80">
                    •••• •••• •••• {card.lastFourDigits || 'XXXX'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/80 text-sm">Limite Total</p>
                <p className="text-white text-lg font-bold mt-1">
                  {formatCurrency(card.limit)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/80 text-sm">Limite Utilizado</p>
                <p className="text-white text-lg font-bold mt-1">
                  {formatCurrency(card.currentSpending || 0)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/80 text-sm">Vencimento</p>
                <p className="text-white text-lg font-bold mt-1">
                  Dia {card.dueDate}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-white/80 text-sm">Fechamento</p>
                <p className="text-white text-lg font-bold mt-1">
                  Dia {card.closingDate}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedTab === 'atual'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                `}
                onClick={() => setSelectedTab('atual')}
              >
                Fatura Atual
              </button>
              <button
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedTab === 'anterior'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                `}
                onClick={() => setSelectedTab('anterior')}
              >
                Fatura Anterior
              </button>
            </div>

            {/* Lista de Compras */}
            <div className="space-y-4">
              {invoiceData.map(purchase => (
                <div 
                  key={purchase.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {purchase.description}
                        </p>
                        {purchase.installments && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400 rounded-full">
                            {purchase.installments.current}/{purchase.installments.total}x
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(purchase.date).toLocaleDateString('pt-BR')} • {purchase.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(purchase.amount)}
                    </p>
                    {purchase.installments && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {formatCurrency(purchase.installments.amount * purchase.installments.total)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo da Fatura */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total da Fatura
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(invoiceTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Vencimento
                  </p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTab === 'atual' 
                      ? `${card.dueDate}/04/2024`
                      : `${card.dueDate}/03/2024`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                onClick={() => {/* Implementar exportação */}}
              >
                Exportar Fatura
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
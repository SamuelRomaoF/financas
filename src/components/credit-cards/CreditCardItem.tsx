import { Trash2 } from 'lucide-react';
import { CreditCardData } from '../../types/finances';
import { formatCurrency } from '../../utils/formatCurrency';
import { Card, CardContent } from '../ui/Card';

interface CreditCardItemProps {
  card: CreditCardData;
  onEdit: () => void;
  onRemove: () => void;
}

export default function CreditCardItem({ card, onEdit, onRemove }: CreditCardItemProps) {
  return (
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
                {formatCurrency(card.currentSpending || 0)}
              </p>
            </div>
          </div>
          
          {card.currentSpending !== undefined && card.limit > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>0%</span>
                <span>{Math.round((card.currentSpending / card.limit) * 100)}%</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (card.currentSpending / card.limit) * 100)}%`,
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
          
          <div className="flex justify-between pt-2">
            <button
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              onClick={onEdit}
            >
              Editar
            </button>
            <button
              className="text-sm text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
import { Building2, Clock, CreditCard, Eye, EyeOff, History, Pencil } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

interface BankCardProps {
  bank: {
    id: string;
    name: string;
    type: 'corrente' | 'poupanca' | 'investimento';
    accountNumber: string;
    agency: string;
    balance: number;
    color: string;
    transactions?: {
      pending: number;
      future: number;
    };
  };
  onEdit: (bankId: string) => void;
  onViewTransactions: (bankId: string) => void;
}

export default function BankCard({ bank, onEdit, onViewTransactions }: BankCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  const getAccountTypeLabel = (type: 'corrente' | 'poupanca' | 'investimento') => {
    switch (type) {
      case 'corrente':
        return 'Conta Corrente';
      case 'poupanca':
        return 'Conta Poupança';
      case 'investimento':
        return 'Conta Investimento';
    }
  };

  return (
    <div className="relative group">
      <div 
        className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${bank.color}22 0%, ${bank.color}44 100%)`,
          borderLeft: `4px solid ${bank.color}`
        }}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5" style={{ color: bank.color }} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {bank.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getAccountTypeLabel(bank.type)}
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(bank.id)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Editar conta"
            >
              <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => onViewTransactions(bank.id)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Ver transações"
            >
              <History className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Informações da Conta */}
        <div className="space-y-4">
          {/* Saldo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Saldo Disponível
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {showBalance ? formatCurrency(bank.balance) : 'R$ ••••••'}
            </div>
          </div>

          {/* Dados da Conta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                Agência
              </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {bank.agency}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                Conta
              </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {bank.accountNumber}
              </span>
            </div>
          </div>

          {/* Transações Pendentes e Futuras */}
          {bank.transactions && (
            <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 block">
                    Pendentes
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {bank.transactions.pending}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 block">
                    Agendadas
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {bank.transactions.future}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
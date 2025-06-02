import { ArrowDownLeft, ArrowUpRight, Building2, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  date: string;
  category: string;
}

interface BankAccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: string;
    bankName: string;
    accountType: 'corrente' | 'poupanca' | 'investimento';
    accountNumber: string;
    balance: number;
    color: string;
  };
}

export default function BankAccountDetailsModal({ 
  isOpen, 
  onClose, 
  account 
}: BankAccountDetailsModalProps) {
  // Dados de exemplo de transações
  const transactions: Transaction[] = [
    {
      id: '1',
      description: 'Salário',
      amount: 5000,
      type: 'entrada',
      date: '2024-03-28',
      category: 'Receitas'
    },
    {
      id: '2',
      description: 'Aluguel',
      amount: 1500,
      type: 'saida',
      date: '2024-03-27',
      category: 'Moradia'
    },
    {
      id: '3',
      description: 'Supermercado',
      amount: 450.75,
      type: 'saida',
      date: '2024-03-26',
      category: 'Alimentação'
    },
    {
      id: '4',
      description: 'Freelance',
      amount: 2000,
      type: 'entrada',
      date: '2024-03-25',
      category: 'Receitas'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${account.color}20` }}
              >
                <Building2 
                  className="h-6 w-6"
                  style={{ color: account.color }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {account.bankName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {account.accountType === 'corrente' ? 'Conta Corrente' : 
                   account.accountType === 'poupanca' ? 'Poupança' : 'Investimentos'} - 
                  {account.accountNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Atual</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(account.balance)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Entradas (30 dias)</p>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                  {formatCurrency(7000)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Saídas (30 dias)</p>
                <p className="text-2xl font-bold text-error-600 dark:text-error-400 mt-1">
                  {formatCurrency(3950.75)}
                </p>
              </div>
            </div>

            {/* Lista de Transações */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Últimas Transações
              </h3>
              <div className="space-y-4">
                {transactions.map(transaction => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${transaction.type === 'entrada' 
                          ? 'bg-success-100 dark:bg-success-900/30' 
                          : 'bg-error-100 dark:bg-error-900/30'}
                      `}>
                        {transaction.type === 'entrada' ? (
                          <ArrowDownLeft className={`
                            h-5 w-5 text-success-600 dark:text-success-400
                          `} />
                        ) : (
                          <ArrowUpRight className={`
                            h-5 w-5 text-error-600 dark:text-error-400
                          `} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')} • {transaction.category}
                        </p>
                      </div>
                    </div>
                    <p className={`
                      font-medium
                      ${transaction.type === 'entrada'
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-error-600 dark:text-error-400'}
                    `}>
                      {transaction.type === 'entrada' ? '+' : '-'} 
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 mt-8">
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
                Exportar Extrato
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
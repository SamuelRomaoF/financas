import { ArrowDownRight, ArrowUpRight, Building2, History, Plus } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  description: string;
  amount: number;
  date: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'corrente' | 'poupanca' | 'investimento';
  accountNumber: string;
  balance: number;
  logo: string;
  recentTransactions: Transaction[];
}

const BANK_LOGOS = {
  nubank: '/bank-logos/nubank.svg',
  inter: '/bank-logos/inter.svg',
  itau: '/bank-logos/itau.svg',
  bradesco: '/bank-logos/bradesco.svg',
  santander: '/bank-logos/santander.svg',
  bb: '/bank-logos/bb.svg',
  caixa: '/bank-logos/caixa.svg',
};

export default function BankAccountManager() {
  const [showTransactions, setShowTransactions] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: 'Nubank',
      accountType: 'corrente',
      accountNumber: '0000000-0',
      balance: 5432.10,
      logo: BANK_LOGOS.nubank,
      recentTransactions: [
        {
          id: '1',
          type: 'entrada',
          description: 'Salário',
          amount: 5000,
          date: '2024-03-28'
        },
        {
          id: '2',
          type: 'saida',
          description: 'Supermercado',
          amount: 350.90,
          date: '2024-03-27'
        }
      ]
    },
    {
      id: '2',
      bankName: 'Inter',
      accountType: 'corrente',
      accountNumber: '1111111-1',
      balance: 3789.45,
      logo: BANK_LOGOS.inter,
      recentTransactions: [
        {
          id: '1',
          type: 'entrada',
          description: 'Transferência recebida',
          amount: 1200,
          date: '2024-03-28'
        },
        {
          id: '2',
          type: 'saida',
          description: 'Conta de luz',
          amount: 189.90,
          date: '2024-03-26'
        }
      ]
    }
  ]);

  const toggleTransactions = (accountId: string) => {
    setShowTransactions(showTransactions === accountId ? null : accountId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Contas Bancárias
        </h2>
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Card key={account.id} className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {account.bankName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {account.accountType === 'corrente' ? 'Conta Corrente' : 
                       account.accountType === 'poupanca' ? 'Poupança' : 'Investimentos'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleTransactions(account.id)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <History className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(account.balance)}
                  </p>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Conta: {account.accountNumber}
                </div>

                {showTransactions === account.id && account.recentTransactions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Transações Recentes
                    </h4>
                    <div className="space-y-3">
                      {account.recentTransactions.map(transaction => (
                        <div 
                          key={transaction.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                              ${transaction.type === 'entrada' 
                                ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                                : 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400'
                              }`}
                            >
                              {transaction.type === 'entrada' 
                                ? <ArrowUpRight className="h-4 w-4" />
                                : <ArrowDownRight className="h-4 w-4" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <p className={`font-medium
                            ${transaction.type === 'entrada'
                              ? 'text-success-600 dark:text-success-400'
                              : 'text-error-600 dark:text-error-400'
                            }`}
                          >
                            {transaction.type === 'entrada' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
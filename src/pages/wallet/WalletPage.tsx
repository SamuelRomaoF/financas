import { Building2, CreditCard, DollarSign, Plus, Wallet } from 'lucide-react';
import { useState } from 'react';
import BankAccountDetailsModal from '../../components/banks/BankAccountDetailsModal';
import CreditCardDetailsModal from '../../components/credit-cards/CreditCardDetailsModal';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'corrente' | 'poupanca' | 'investimento';
  accountNumber: string;
  balance: number;
  logo: string;
  color: string;
}

interface CreditCard {
  id: string;
  name: string;
  number: string;
  limit: number;
  currentSpending: number;
  dueDate: number;
  closingDate: number;
  color: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex';
}

export default function WalletPage() {
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

  const [accounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: 'Nubank',
      accountType: 'corrente',
      accountNumber: '0000000-0',
      balance: 5432.10,
      logo: '/bank-logos/nubank.svg',
      color: '#820AD1'
    },
    {
      id: '2',
      bankName: 'Inter',
      accountType: 'corrente',
      accountNumber: '1111111-1',
      balance: 3789.45,
      logo: '/bank-logos/inter.svg',
      color: '#FF7A00'
    }
  ]);

  const [cards] = useState<CreditCard[]>([
    {
      id: '1',
      name: 'Nubank',
      number: '•••• •••• •••• 1234',
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
      number: '•••• •••• •••• 5678',
      limit: 3000,
      currentSpending: 1200,
      dueDate: 20,
      closingDate: 13,
      color: '#FF7A00',
      brand: 'visa'
    }
  ]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalCreditLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const totalCreditUsed = cards.reduce((sum, card) => sum + card.currentSpending, 0);

  return (
    <div className="space-y-8">
      {/* Cabeçalho com resumo financeiro */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-400 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Carteira Digital</h1>
          <p className="mt-2 text-primary-100">Gerencie suas contas e cartões em um só lugar</p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
        </div>
        
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4">
          <div className="h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4">
          <div className="h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        </div>
      </div>

      {/* Contas Bancárias */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contas Bancárias
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie suas contas e acompanhe seus saldos
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Conta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <Card 
              key={account.id} 
              className="group hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${account.color}20` }}
                  >
                    <Building2 
                      className="h-8 w-8 transition-transform group-hover:scale-110 duration-200" 
                      style={{ color: account.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {account.bankName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {account.accountType === 'corrente' ? 'Conta Corrente' : 
                       account.accountType === 'poupanca' ? 'Poupança' : 'Investimentos'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Disponível</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                      Conta: {account.accountNumber}
                    </p>
                    <button 
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      onClick={() => setSelectedAccount(account)}
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cartões de Crédito */}
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
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Cartão
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <Card 
              key={card.id} 
              className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden bg-white dark:bg-gray-800"
            >
              {/* Cabeçalho do cartão com gradiente */}
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
                    {card.number}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-white" />
                  <img 
                    src={`/card-brands/${card.brand}.svg`} 
                    alt={card.brand} 
                    className="h-8"
                  />
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Barra de progresso do limite */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Limite Utilizado</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(card.currentSpending)} / {formatCurrency(card.limit)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-in-out"
                        style={{ 
                          width: `${(card.currentSpending / card.limit) * 100}%`,
                          backgroundColor: card.color 
                        }}
                      />
                    </div>
                  </div>

                  {/* Informações do cartão */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        Dia {card.dueDate}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fechamento</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        Dia {card.closingDate}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Disponível</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(card.limit - card.currentSpending)}
                      </p>
                    </div>
                  </div>

                  {/* Botão de detalhes */}
                  <button 
                    className="w-full py-2 text-sm text-center text-primary-600 dark:text-primary-400 
                             hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    onClick={() => setSelectedCard(card)}
                  >
                    Ver Fatura Detalhada
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modais */}
      <BankAccountDetailsModal
        isOpen={selectedAccount !== null}
        onClose={() => setSelectedAccount(null)}
        account={selectedAccount!}
      />

      <CreditCardDetailsModal
        isOpen={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        card={selectedCard!}
      />
    </div>
  );
} 
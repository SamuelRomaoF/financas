import { useState } from 'react';
import BankCard from '../../components/banks/BankCard';
import BankFormModal from '../../components/banks/BankFormModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';

interface Bank {
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
}

export default function BanksPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(false);

  // Dados de exemplo
  const [banks, setBanks] = useState<Bank[]>([
    {
      id: '1',
      name: 'Nubank',
      type: 'corrente',
      accountNumber: '0000000-0',
      agency: '0001',
      balance: 5432.10,
      color: '#8A05BE',
      transactions: {
        pending: 3,
        future: 2
      }
    },
    {
      id: '2',
      name: 'Inter',
      type: 'corrente',
      accountNumber: '1111111-1',
      agency: '0001',
      balance: 3789.45,
      color: '#FF7A00',
      transactions: {
        pending: 1,
        future: 0
      }
    },
    {
      id: '3',
      name: 'Itaú',
      type: 'poupanca',
      accountNumber: '2222222-2',
      agency: '1234',
      balance: 10000,
      color: '#EC7000',
      transactions: {
        pending: 0,
        future: 1
      }
    }
  ]);

  const handleNewBank = (data: Omit<Bank, 'id' | 'transactions'>) => {
    const newBank: Bank = {
      ...data,
      id: String(Date.now()),
      transactions: {
        pending: 0,
        future: 0
      }
    };

    setBanks(prev => [...prev, newBank]);
  };

  const handleEditBank = (data: Omit<Bank, 'id' | 'transactions'>) => {
    if (!editingBank) return;

    setBanks(prev => prev.map(bank => {
      if (bank.id === editingBank.id) {
        return {
          ...bank,
          ...data
        };
      }
      return bank;
    }));

    setEditingBank(null);
  };

  const handleEdit = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    if (bank) {
      setEditingBank(bank);
      setIsFormModalOpen(true);
    }
  };

  const handleViewTransactions = (bankId: string) => {
    // Implementar navegação para a página de transações filtrada por banco
    console.log('Ver transações do banco:', bankId);
  };

  const totalBalance = banks.reduce((total, bank) => total + bank.balance, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Minhas Contas</h1>
        <button
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          onClick={() => {/* TODO: Implementar adição de conta */}}
        >
          Nova Conta
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Saldo Total
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Total de Contas
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {banks.length}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Transações Pendentes
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {banks.reduce((total, bank) => total + (bank.transactions?.pending || 0), 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Bancos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map(bank => (
              <BankCard
                key={bank.id}
                bank={bank}
                onEdit={handleEdit}
                onViewTransactions={handleViewTransactions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal de Formulário */}
      <BankFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingBank(null);
        }}
        onSubmit={editingBank ? handleEditBank : handleNewBank}
        initialData={editingBank || undefined}
      />
    </div>
  );
} 
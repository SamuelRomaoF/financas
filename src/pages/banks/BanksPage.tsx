import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Wallet } from 'lucide-react';

import BankCard from '../../components/banks/BankCard';
import AddBankAccountModal from '../../components/banks/AddBankAccountModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatCurrency';
import { useBankAccounts } from '../../contexts/BankAccountContext';
import type { SaveableBankAccountData } from '../../types/finances';
import type { BankAccount } from '../../types/finances';

const PREMIUM_ACCOUNT_LIMIT = 5;

export default function BanksPage() {
  const { accounts, addAccount, removeAccount } = useBankAccounts();
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isConfirmRemoveModalOpen, setIsConfirmRemoveModalOpen] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<BankAccount | null>(null);
  const [loading] = useState(false);

  const handleAddAccountClick = () => {
    if (accounts.length >= PREMIUM_ACCOUNT_LIMIT) {
      toast.error(`Você atingiu o limite de ${PREMIUM_ACCOUNT_LIMIT} contas para o seu plano.`);
    } else {
      setIsAddAccountModalOpen(true);
    }
  };

  const handleSaveAccount = (data: SaveableBankAccountData) => {
    addAccount(data);
    setIsAddAccountModalOpen(false);
  };

  const handleOpenRemoveConfirmationModal = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setAccountToRemove(account);
      setIsConfirmRemoveModalOpen(true);
    }
  };

  const executeRemoveAccount = () => {
    if (!accountToRemove) return;
    removeAccount(accountToRemove.id);
    setIsConfirmRemoveModalOpen(false);
    setAccountToRemove(null);
  };

  const handleViewTransactions = (bankId: string) => {
    const bank = accounts.find(acc => acc.id === bankId);
    toast(`Visualizar transações para ${bank?.bankName || 'conta'}: ${bankId} - Em breve!`);
  };

  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
  const totalPending = accounts.reduce((total, acc) => total + (acc.pendingTransactionsCount || 0), 0);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Minhas Contas</h1>
        <button
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-150 shadow hover:shadow-md"
          onClick={handleAddAccountClick}
        >
          <Plus size={20} />
          Nova Conta
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">Resumo Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    Saldo Total
                  </span>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(totalBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    Total de Contas
                  </span>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                    {accounts.length} / {PREMIUM_ACCOUNT_LIMIT}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                    Transações Pendentes
                  </span>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                    {totalPending}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {accounts.map(account => (
                <BankCard
                  key={account.id}
                  bank={account}
                  onRemoveRequest={handleOpenRemoveConfirmationModal}
                  onViewTransactions={handleViewTransactions}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <Wallet className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhuma conta bancária cadastrada.</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Adicione sua primeira conta para começar a gerenciar suas finanças.
              </p>
              <button
                className="flex items-center gap-2 mx-auto bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-150 shadow hover:shadow-md"
                onClick={handleAddAccountClick}
              >
                <Plus size={20} />
                Adicionar Nova Conta
              </button>
            </div>
          )}
        </div>
      )}

      <AddBankAccountModal 
        isOpen={isAddAccountModalOpen} 
        onClose={() => setIsAddAccountModalOpen(false)} 
        onSaveAccount={handleSaveAccount} 
      />
      
      <ConfirmationModal 
        isOpen={isConfirmRemoveModalOpen} 
        onClose={() => {
          setIsConfirmRemoveModalOpen(false);
          setAccountToRemove(null);
        }} 
        onConfirm={executeRemoveAccount} 
        title="Confirmar Remoção de Conta" 
        message={accountToRemove ? `Tem certeza que deseja remover a conta ${accountToRemove.bankName} (Ag: ${accountToRemove.agency || '-'}, CC: ${accountToRemove.accountNumber || '-'})?` : ''} 
        confirmButtonIntent="destructive" 
        confirmButtonText="Sim, Remover"
        cancelButtonText="Cancelar"
      />
    </div>
  );
}
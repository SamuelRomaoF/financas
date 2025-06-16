import { Clock, CreditCard, Eye, EyeOff, History, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useBankAccounts } from '../../contexts/BankAccountContext';
import type { BankAccount } from '../../types/finances';
import { formatCurrency } from '../../utils/formatCurrency';
import { getBankInitials } from '../../utils/strings';
import BankFormModal from './BankFormModal';
import BankHistoryModal from './BankHistoryModal';

interface BankCardProps {
  bank: BankAccount;
  onViewTransactions: (bankId: string) => void;
  onRemoveRequest: (bankId: string) => void;
}

export default function BankCard({ bank, onViewTransactions, onRemoveRequest }: BankCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { updateAccount } = useBankAccounts();

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking':
        return 'Conta Corrente';
      case 'savings':
        return 'Conta Poupança';
      case 'investment':
        return 'Conta Investimento';
      default:
        return type;
    }
  };

  const handleViewTransactions = () => {
    // Abre o modal de histórico em vez de chamar a função original
    setShowHistoryModal(true);
  };

  const handleEditBank = async (formData: {
    name: string;
    type: 'corrente' | 'poupanca' | 'investimento';
    accountNumber: string;
    agency: string;
    balance: number;
    color: string;
  }) => {
    try {
      // Mapear os tipos de conta para o formato esperado pela API
      const accountTypeMapping: Record<string, 'checking' | 'savings' | 'investment'> = {
        'corrente': 'checking',
        'poupanca': 'savings',
        'investimento': 'investment'
      };

      // Adaptar os dados do formulário para o formato esperado pelo banco de dados
      const bankData = {
        bankName: formData.name,
        accountType: accountTypeMapping[formData.type],
        accountNumber: formData.accountNumber,
        agency: formData.agency,
        balance: formData.balance,
        color: formData.color
      };

      // Chamar a função de atualização
      await updateAccount(bank.id, bankData);
      
      // Fechar o modal
      setShowEditModal(false);
    } catch (error) {
      console.error('Erro ao atualizar banco:', error);
    }
  };

  return (
    <div className="relative group">
      <div 
        className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg dark:shadow-gray-700/50"
        style={{
          backgroundColor: (bank.color || '#000000') + '20',
          borderColor: bank.color || '#000000',
          borderWidth: '1px 0 0 4px',
          borderStyle: 'solid'
        }}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: bank.color || '#000000' }}
            >
              {getBankInitials(bank.bankName)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {bank.bankName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getAccountTypeLabel(bank.accountType)}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-700/50 transition-colors"
              title="Editar conta"
            >
              <Pencil className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </button>
            <button
              onClick={() => onRemoveRequest(bank.id)}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-700/50 transition-colors"
              title="Remover conta"
            >
              <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
            </button>
            <button
              onClick={handleViewTransactions}
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
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Saldo Disponível
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
            <div className={`text-2xl font-bold text-gray-800 dark:text-white ${!showBalance ? 'blur-sm' : ''}`}>
              {showBalance ? formatCurrency(bank.balance) : 'R$ ••••••'}
            </div>
          </div>

          {/* Dados da Conta */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">Agência</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {bank.agency || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">Conta</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {bank.accountNumber || 'N/A'}
              </span>
            </div>
          </div>

          {/* Transações Pendentes e Futuras */}
          {(bank.pendingTransactionsCount !== undefined || bank.scheduledTransactionsCount !== undefined) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 mt-3 border-t border-gray-200 dark:border-gray-700/50 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Pendentes</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {bank.pendingTransactionsCount ?? 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Agendadas</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {bank.scheduledTransactionsCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Histórico */}
      <BankHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        bank={bank}
      />

      {/* Modal de Edição */}
      <BankFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditBank}
        initialData={{
          name: bank.bankName,
          // Mapear os tipos de conta para o formato esperado pelo formulário
          type: bank.accountType === 'checking' ? 'corrente' : 
                bank.accountType === 'savings' ? 'poupanca' : 
                bank.accountType === 'investment' ? 'investimento' : 'corrente',
          accountNumber: bank.accountNumber || '',
          agency: bank.agency || '',
          balance: bank.balance || 0,
          color: bank.color || '#000000'
        }}
      />
    </div>
  );
} 
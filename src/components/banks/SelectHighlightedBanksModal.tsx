import { useState, useEffect, ChangeEvent } from 'react';
import { X, ListChecks, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import type { BankAccount } from '../../types/finances'; // Importação corrigida
import { getBankInitials } from '../../utils/strings'; // Importar getBankInitials

interface SelectHighlightedBanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUserAccounts: BankAccount[];
  currentHighlightedIds: string[];
  onSaveSelection: (selectedIds: string[]) => void;
  maxSelectionLimit: number;
}

export default function SelectHighlightedBanksModal({
  isOpen,
  onClose,
  allUserAccounts,
  currentHighlightedIds,
  onSaveSelection,
  maxSelectionLimit
}: SelectHighlightedBanksModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentHighlightedIds);
    }
  }, [isOpen, currentHighlightedIds]);

  const handleCheckboxChange = (accountId: string) => {
    setSelectedIds(prevSelectedIds => {
      if (prevSelectedIds.includes(accountId)) {
        return prevSelectedIds.filter(id => id !== accountId);
      } else {
        if (prevSelectedIds.length < maxSelectionLimit) {
          return [...prevSelectedIds, accountId];
        } else {
          toast.error(`Você pode selecionar no máximo ${maxSelectionLimit} contas para destacar.`);
          return prevSelectedIds;
        }
      }
    });
  };

  const handleSave = () => {
    onSaveSelection(selectedIds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-1 flex items-center text-gray-800 dark:text-white">
          <ListChecks className="mr-2 h-6 w-6 text-primary-500" /> Selecionar Contas Destacadas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Escolha até {maxSelectionLimit} contas para exibir em destaque na sua Carteira.
        </p>

        {allUserAccounts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              Você ainda não possui contas bancárias cadastradas.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Adicione contas na seção "Bancos" para poder selecioná-las aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {allUserAccounts.map(account => (
              <label 
                key={account.id} 
                htmlFor={`highlight-bank-${account.id}`}
                className="flex items-center p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
              >
                <input 
                  type="checkbox" 
                  id={`highlight-bank-${account.id}`}
                  checked={selectedIds.includes(account.id)}
                  onChange={() => handleCheckboxChange(account.id)}
                  className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-500 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                />
                <div 
                  className="ml-3 mr-2 h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                  style={{ backgroundColor: account.color }}
                >
                  {getBankInitials(account.bankName)} {/* Usando getBankInitials */}
                </div>
                <div className="flex-grow">
                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">{account.bankName}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {account.accountType === 'corrente' ? 'Conta Corrente' : 'Poupança'} - Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                  </span>
                </div>
                {selectedIds.includes(account.id) && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-100 text-xs font-medium">
                    Destacada
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-8">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={allUserAccounts.length === 0}
          >
            Salvar Seleção
          </Button>
        </div>
      </div>
    </div>
  );
} 
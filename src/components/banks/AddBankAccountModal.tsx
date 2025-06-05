import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { X, Landmark } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import toast from 'react-hot-toast';
import { SaveableBankAccountData } from '../../types/finances'; // Importar de types/finances

// Interface para os dados que o modal envia para WalletPage
// Alinhada com BankAccount de WalletPage, mas sem o ID
// E simplificando/ajustando campos como `logo` e `accountNumber` para o formulário
// export interface SaveableBankAccountData { // Definição removida
//   bankName: string; 
//   accountType: 'corrente' | 'poupanca' | 'investimento';
//   accountNumber?: string; 
//   balance: number;
//   logo: string; // Será um caminho para o logo ou um placeholder
//   color: string;
//   agency?: string; // Novo campo para Agência
// }

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAccount: (accountData: SaveableBankAccountData) => void; // Agora usa o tipo importado
}

const predefinedBanks = [
  { name: 'Nubank', logo: '/bank-logos/nubank.svg', color: '#820AD1' },
  { name: 'Inter', logo: '/bank-logos/inter.svg', color: '#FF7A00' },
  { name: 'Itaú', logo: '/bank-logos/itau.svg', color: '#EC7000' }, // Supondo que itau.svg exista
  { name: 'Bradesco', logo: '/bank-logos/bradesco.svg', color: '#CC092F' }, // Supondo que bradesco.svg exista
  { name: 'Santander', logo: '/bank-logos/santander.svg', color: '#EC0000' }, // Supondo que santander.svg exista
  { name: 'Banco do Brasil', logo: '/bank-logos/bb.svg', color: '#0033A0' }, // Supondo que bb.svg exista
  { name: 'Outro', logo: '/bank-logos/default.svg', color: '#6B7280' } // Um logo genérico
];

const defaultBankColor = '#6B7280'; // Cinza padrão

export default function AddBankAccountModal({ isOpen, onClose, onSaveAccount }: AddBankAccountModalProps) {
  const [selectedPredefinedBankName, setSelectedPredefinedBankName] = useState(predefinedBanks[0].name);
  const [customBankName, setCustomBankName] = useState('');
  const [accountType, setAccountType] = useState<'corrente' | 'poupanca' | 'investimento'>('corrente');
  const [accountNumber, setAccountNumber] = useState('');
  const [agency, setAgency] = useState(''); // Novo estado para Agência
  const [balance, setBalance] = useState<number | '' >('');
  const [color, setColor] = useState(predefinedBanks[0].color || defaultBankColor);

  useEffect(() => {
    if (isOpen) {
      // Resetar para o primeiro banco da lista ou um default seguro
      const initialBank = predefinedBanks[0] || { name: 'Outro', color: defaultBankColor, logo: '/bank-logos/default.svg' };
      setSelectedPredefinedBankName(initialBank.name);
      setCustomBankName('');
      setAccountType('corrente');
      setAccountNumber('');
      setAgency(''); // Resetar agência
      setBalance('');
      setColor(initialBank.color);
    } else {
      // Pode-se adicionar lógica de reset aqui também se necessário ao fechar, 
      // mas o reset ao abrir geralmente cobre a necessidade de um formulário limpo.
    }
  }, [isOpen]);

  const handleBankChange = (newBankName: string) => {
    setSelectedPredefinedBankName(newBankName);
    const bankDetails = predefinedBanks.find(b => b.name === newBankName);
    setColor(bankDetails?.color || defaultBankColor);
    if (newBankName !== 'Outro') {
      setCustomBankName('');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (balance === '' || (selectedPredefinedBankName === 'Outro' && !customBankName.trim())) {
      toast.error('Por favor, preencha o saldo inicial e o nome do banco (se "Outro" for selecionado).');
      return;
    }

    const finalBankName = selectedPredefinedBankName === 'Outro' ? customBankName.trim() : selectedPredefinedBankName;
    const bankDetails = predefinedBanks.find(b => b.name === selectedPredefinedBankName);
    
    const accountData: SaveableBankAccountData = {
      bankName: finalBankName,
      accountType,
      accountNumber: accountNumber || undefined,
      agency: agency.trim() || undefined, // Adicionar agência
      balance: Number(balance),
      color: color, // A cor já está sendo gerenciada pelo estado `color`
      logo: bankDetails?.logo || '/bank-logos/default.svg' // Usa o logo do banco ou default
    };

    onSaveAccount(accountData);
    onClose(); // Fechar o modal após salvar
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800 dark:text-white">
          <Landmark className="mr-2 h-6 w-6 text-primary-500" /> Adicionar Nova Conta Bancária
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco</label>
            <Select 
              id="bankName"
              value={selectedPredefinedBankName}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBankChange(e.target.value)}
              className="w-full"
            >
              {predefinedBanks.map(bank => (
                <option key={bank.name} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </Select>
          </div>

          {selectedPredefinedBankName === 'Outro' && (
            <div>
              <label htmlFor="customBankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Banco (Customizado)</label>
              <Input 
                id="customBankName" 
                value={customBankName} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomBankName(e.target.value)} 
                placeholder="Ex: Banco XPTO S.A."
                required={selectedPredefinedBankName === 'Outro'}
              />
            </div>
          )}

          <div>
            <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Conta</label>
            <Select 
              id="accountType"
              value={accountType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setAccountType(e.target.value as typeof accountType)}
              className="w-full"
            >
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="investimento">Conta Investimento</option>
            </Select>
          </div>

          <div>
            <label htmlFor="agency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agência (Opcional)</label>
            <Input 
              id="agency" 
              value={agency} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAgency(e.target.value)} 
              placeholder="Ex: 0001"
              maxLength={10} // Adicionando um maxLength para agência
            />
          </div>

          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número da Conta (Opcional)</label>
            <Input 
              id="accountNumber" 
              value={accountNumber} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAccountNumber(e.target.value)} 
              placeholder="Ex: 12345-6"
              maxLength={30}
            />
          </div>

          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saldo Inicial (R$)</label>
            <Input 
              id="balance" 
              type="number" 
              value={balance} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setBalance(e.target.value === '' ? '' : parseFloat(e.target.value))} 
              placeholder="Ex: 1000.00"
              required
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor do Card</label>
            <Input 
              id="color" 
              type="color" 
              value={color} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setColor(e.target.value)} 
              className="w-full h-10 p-1"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar Conta</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
import { Landmark, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SaveableBankAccountData } from '../../types/finances';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAccount: (accountData: SaveableBankAccountData) => void;
}

// Banco de dados predefinidos com cores e logos
const predefinedBanks = [
  { name: 'Nubank', logo: '/bank-logos/nubank.svg', color: '#820AD1' },
  { name: 'Inter', logo: '/bank-logos/inter.svg', color: '#FF7A00' },
  { name: 'Itaú', logo: '/bank-logos/itau.svg', color: '#EC7000' },
  { name: 'Bradesco', logo: '/bank-logos/bradesco.svg', color: '#CC092F' },
  { name: 'Santander', logo: '/bank-logos/santander.svg', color: '#EC0000' },
  { name: 'Banco do Brasil', logo: '/bank-logos/bb.svg', color: '#0033A0' },
  { name: 'Outro', logo: '/bank-logos/default.svg', color: '#6B7280' }
];

const defaultBankColor = '#6B7280'; // Cinza padrão

// Mapeamento de tipos de conta para o formato esperado pelo backend
const accountTypeMapping = {
  'corrente': 'checking',
  'poupanca': 'savings',
  'investimento': 'investment'
};

export default function AddBankAccountModal({ isOpen, onClose, onSaveAccount }: AddBankAccountModalProps) {
  const [selectedPredefinedBankName, setSelectedPredefinedBankName] = useState(predefinedBanks[0].name);
  const [customBankName, setCustomBankName] = useState('');
  const [accountType, setAccountType] = useState<'corrente' | 'poupanca' | 'investimento'>('corrente');
  const [accountNumber, setAccountNumber] = useState('');
  const [agency, setAgency] = useState('');
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
      setAgency('');
      setBalance('');
      setColor(initialBank.color);
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
    
    // Mapear o tipo de conta para o formato esperado pelo backend
    const mappedAccountType = accountTypeMapping[accountType] as 'checking' | 'savings' | 'investment';
    
    const accountData: SaveableBankAccountData = {
      bankName: finalBankName,
      accountType: mappedAccountType,
      accountNumber: accountNumber || undefined,
      agency: agency.trim() || undefined,
      balance: Number(balance),
      color: color,
      currency: 'BRL', // Definindo a moeda padrão como BRL
      userId: '' // Este campo será preenchido pelo backend/contexto
    };

    onSaveAccount(accountData);
    onClose();
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
              maxLength={10}
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
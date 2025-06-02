import { X } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface BankFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: 'corrente' | 'poupanca' | 'investimento';
    accountNumber: string;
    agency: string;
    balance: number;
    color: string;
  }) => void;
  initialData?: {
    name: string;
    type: 'corrente' | 'poupanca' | 'investimento';
    accountNumber: string;
    agency: string;
    balance: number;
    color: string;
  };
}

const bankColors = [
  { name: 'Roxo', value: '#8A05BE' },
  { name: 'Laranja', value: '#EC7000' },
  { name: 'Azul', value: '#0070E0' },
  { name: 'Verde', value: '#00A857' },
  { name: 'Vermelho', value: '#E74C3C' },
  { name: 'Rosa', value: '#E91E63' },
  { name: 'Amarelo', value: '#F1C40F' },
  { name: 'Ciano', value: '#00BCD4' }
];

export default function BankFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: BankFormModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'corrente' | 'poupanca' | 'investimento'>(
    initialData?.type || 'corrente'
  );
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  const [agency, setAgency] = useState(initialData?.agency || '');
  const [balance, setBalance] = useState(initialData?.balance?.toString() || '');
  const [color, setColor] = useState(initialData?.color || bankColors[0].value);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      name,
      type,
      accountNumber,
      agency,
      balance: Number(balance),
      color
    });

    // Limpa o formulário
    setName('');
    setType('corrente');
    setAccountNumber('');
    setAgency('');
    setBalance('');
    setColor(bankColors[0].value);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nome do Banco */}
            <div className="space-y-2">
              <label 
                htmlFor="name"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nome do Banco
              </label>
              <Input
                id="name"
                placeholder="Ex: Nubank, Itaú, etc."
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
              />
            </div>

            {/* Tipo de Conta */}
            <div className="space-y-2">
              <label 
                htmlFor="type"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tipo de Conta
              </label>
              <Select
                id="type"
                value={type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  setType(e.target.value as 'corrente' | 'poupanca' | 'investimento')}
                required
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Conta Poupança</option>
                <option value="investimento">Conta Investimento</option>
              </Select>
            </div>

            {/* Agência e Conta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="agency"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Agência
                </label>
                <Input
                  id="agency"
                  placeholder="0000"
                  value={agency}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAgency(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="accountNumber"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Conta
                </label>
                <Input
                  id="accountNumber"
                  placeholder="00000-0"
                  value={accountNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Saldo Inicial */}
            <div className="space-y-2">
              <label 
                htmlFor="balance"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Saldo Inicial
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  R$
                </span>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="pl-10"
                  value={balance}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBalance(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <label 
                className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3"
              >
                Cor
              </label>
              <div className="flex flex-wrap gap-3">
                {bankColors.map(bankColor => (
                  <button
                    key={bankColor.value}
                    type="button"
                    onClick={() => setColor(bankColor.value)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === bankColor.value 
                        ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 scale-110' 
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: bankColor.value }}
                    title={bankColor.name}
                  />
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {initialData ? 'Salvar Alterações' : 'Adicionar Conta'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
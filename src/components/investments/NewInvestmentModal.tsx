import { X } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';

interface NewInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvestmentFormData) => void;
}

interface InvestmentFormData {
  type: 'renda-fixa' | 'renda-variavel' | 'cripto';
  name: string;
  amount: number;
  expectedReturn?: number;
  details?: string;
}

export default function NewInvestmentModal({ isOpen, onClose, onSubmit }: NewInvestmentModalProps) {
  const [formData, setFormData] = useState<InvestmentFormData>({
    type: 'renda-fixa',
    name: '',
    amount: 0,
    expectedReturn: 0,
    details: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Novo Investimento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo de Investimento</Label>
            <select
              id="type"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as InvestmentFormData['type'] })}
            >
              <option value="renda-fixa">Renda Fixa</option>
              <option value="renda-variavel">Renda Variável</option>
              <option value="cripto">Criptomoeda</option>
            </select>
          </div>

          <div>
            <Label htmlFor="name">Nome do Investimento</Label>
            <Input
              id="name"
              type="text"
              placeholder={formData.type === 'renda-fixa' ? "Ex: CDB Banco XYZ" : 
                formData.type === 'renda-variavel' ? "Ex: PETR4" : "Ex: Bitcoin"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Valor Investido</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="R$ 0,00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="expectedReturn">
              {formData.type === 'renda-fixa' ? 'Taxa de Retorno (% a.a.)' : 
               formData.type === 'renda-variavel' ? 'Retorno Esperado (%)' : 
               'Valorização Esperada (%)'}
            </Label>
            <Input
              id="expectedReturn"
              type="number"
              step="0.01"
              placeholder="0%"
              value={formData.expectedReturn}
              onChange={(e) => setFormData({ ...formData, expectedReturn: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="details">Detalhes Adicionais</Label>
            <textarea
              id="details"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Informações adicionais sobre o investimento..."
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar Investimento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
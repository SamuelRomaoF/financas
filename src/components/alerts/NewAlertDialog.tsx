import { X } from 'lucide-react';
import { ChangeEvent, FormEvent, useState, useMemo } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { SubscriptionPlan } from '../../hooks/useSubscription';

// Definindo os tipos de alerta e seus rótulos amigáveis
const ALL_ALERT_TYPES = [
  { value: 'expense', label: 'Limite de gastos' },
  { value: 'balance', label: 'Saldo baixo' },
  { value: 'bill', label: 'Fatura do cartão/Vencimento de conta' }, // Combinado para simplicidade, usuário diferencia no título
  { value: 'income', label: 'Receitas' }, // Premium
  { value: 'goal', label: 'Metas' }      // Premium
] as const;

export type AlertTypeOptionValue = typeof ALL_ALERT_TYPES[number]['value'];

interface NewAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    type: AlertTypeOptionValue;
    // Adicionar outros campos relevantes se necessário, ex: conditionValue, etc.
  }) => void;
  userPlan: SubscriptionPlan | null;
}

export default function NewAlertDialog({
  isOpen,
  onClose,
  onSubmit,
  userPlan
}: NewAlertDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AlertTypeOptionValue>(ALL_ALERT_TYPES[0].value);

  const availableAlertTypes = useMemo(() => {
    if (userPlan === 'basic') {
      return ALL_ALERT_TYPES.filter(t => ['expense', 'balance', 'bill'].includes(t.value));
    }
    if (userPlan === 'premium') {
      return ALL_ALERT_TYPES;
    }
    return []; // Nenhum tipo para plano gratuito ou desconhecido
  }, [userPlan]);

  // Atualiza o tipo selecionado se ele não estiver mais disponível após mudança de plano/lógica
  useState(() => {
    if (availableAlertTypes.length > 0 && !availableAlertTypes.find(at => at.value === type)) {
      setType(availableAlertTypes[0].value);
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!type) {
        alert('Por favor, selecione um tipo de alerta.');
        return;
    }
    onSubmit({
      title,
      description,
      type,
    });
    // Limpar formulário e fechar
    setTitle('');
    setDescription('');
    setType(availableAlertTypes.length > 0 ? availableAlertTypes[0].value : ALL_ALERT_TYPES[0].value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Alerta</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Alerta</label>
              <Select id="type" value={type} onChange={(e) => setType(e.target.value as AlertTypeOptionValue)} required disabled={availableAlertTypes.length === 0}>
                {availableAlertTypes.length === 0 && <option value="">Nenhum tipo disponível para seu plano</option>}
                {availableAlertTypes.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={availableAlertTypes.length === 0}>Criar Alerta</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
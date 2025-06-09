import { X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  color: string;
  status: string;
  user_id: string;
}

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
  onSubmit: (data: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    color: string;
    status: string;
  }) => Promise<void>;
}

const GOAL_COLORS = [
  { value: '#10B981', label: 'Verde' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
];

export default function NewGoalModal({ isOpen, onClose, goalToEdit, onSubmit }: NewGoalModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    color: GOAL_COLORS[0].value,
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preencher o formulário se estiver editando uma meta existente
  useEffect(() => {
    if (goalToEdit) {
      setFormData({
        name: goalToEdit.name,
        target_amount: goalToEdit.target_amount.toString(),
        current_amount: goalToEdit.current_amount.toString(),
        deadline: goalToEdit.deadline,
        color: goalToEdit.color,
        status: goalToEdit.status,
      });
    }
  }, [goalToEdit]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Converter valores numéricos
      const data = {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || '0'),
        deadline: formData.deadline,
        color: formData.color,
        status: formData.status,
      };
      
      await onSubmit(data);
      onClose();
      
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular progresso para a visualização
  const progress = formData.target_amount && formData.current_amount 
    ? Math.min((parseFloat(formData.current_amount) / parseFloat(formData.target_amount)) * 100, 100)
    : 0;

  // Formatar para moeda brasileira
  const formatCurrency = (value: string) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const isEditing = Boolean(goalToEdit);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Meta' : 'Nova Meta'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Meta
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Fundo de emergência"
              required
            />
          </div>
          
          <div>
            <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Alvo
            </label>
            <Input
              id="target_amount"
              name="target_amount"
              value={formData.target_amount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, target_amount: value }));
              }}
              placeholder="Ex: 10000"
              required
            />
          </div>
          
          <div>
            <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Atual (opcional)
            </label>
            <Input
              id="current_amount"
              name="current_amount"
              value={formData.current_amount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, current_amount: value }));
              }}
              placeholder="Ex: 2500"
            />
          </div>
          
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prazo
            </label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cor
            </label>
            <Select
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              required
            >
              {GOAL_COLORS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </Select>
          </div>
          
          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Ativa</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </Select>
            </div>
          )}
          
          {/* Visualização do progresso */}
          {formData.target_amount && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formData.current_amount ? formatCurrency(formData.current_amount) : 'R$ 0,00'} de {formatCurrency(formData.target_amount)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Meta' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
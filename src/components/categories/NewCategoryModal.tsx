import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Category } from '../../contexts/CategoryContext';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, 'id' | 'user_id'>, id?: string) => Promise<void>;
  categoryToEdit?: Category | null;
}

export default function NewCategoryModal({ isOpen, onClose, onSubmit, categoryToEdit }: NewCategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!categoryToEdit;

  useEffect(() => {
    if (isEditMode) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
    } else {
      setName('');
      setType('expense');
    }
  }, [categoryToEdit, isEditMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    await onSubmit({ name, type }, categoryToEdit?.id);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{isEditMode ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">Nome</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mercado, Salário"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === 'expense' ? 'danger' : 'outline'}
                onClick={() => setType('expense')}
              >
                Despesa
              </Button>
              <Button
                type="button"
                variant={type === 'income' ? 'success' : 'outline'}
                onClick={() => setType('income')}
              >
                Receita
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Salvar Categoria'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
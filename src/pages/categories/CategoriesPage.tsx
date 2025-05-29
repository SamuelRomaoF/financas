import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  description?: string;
  transactionCount: number;
  totalAmount: number;
};

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Alimentação',
    type: 'expense',
    color: '#EF4444',
    description: 'Gastos com alimentação, restaurantes e delivery',
    transactionCount: 45,
    totalAmount: 1250.00
  },
  {
    id: '2',
    name: 'Transporte',
    type: 'expense',
    color: '#F59E0B',
    description: 'Gastos com combustível, transporte público e apps',
    transactionCount: 30,
    totalAmount: 800.00
  },
  {
    id: '3',
    name: 'Salário',
    type: 'income',
    color: '#10B981',
    description: 'Rendimentos mensais do trabalho',
    transactionCount: 6,
    totalAmount: 5500.00
  },
  {
    id: '4',
    name: 'Freelance',
    type: 'income',
    color: '#3B82F6',
    description: 'Trabalhos extras como freelancer',
    transactionCount: 3,
    totalAmount: 1200.00
  }
];

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const filteredCategories = mockCategories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || category.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    // Aqui implementaríamos a lógica real de deleção
    console.log('Categoria deletada:', categoryToDelete?.name);
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h1>
        <Button variant="primary" className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'primary' : 'outline'}
                onClick={() => setSelectedType('all')}
              >
                Todas
              </Button>
              <Button
                variant={selectedType === 'income' ? 'success' : 'outline'}
                onClick={() => setSelectedType('income')}
              >
                Receitas
              </Button>
              <Button
                variant={selectedType === 'expense' ? 'error' : 'outline'}
                onClick={() => setSelectedType('expense')}
              >
                Despesas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Transações</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${category.type === 'income'
                            ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                            : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                          }`}
                      >
                        {category.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {category.description || '-'}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                      {category.transactionCount}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      <span
                        className={category.type === 'income'
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-error-600 dark:text-error-400'
                        }
                      >
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(category.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-2"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                          title="Excluir"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-error-100 dark:bg-error-900/30 rounded-full p-3">
                  <AlertCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  Confirmar exclusão
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"? 
                Esta ação não pode ser desfeita e todas as transações associadas serão descategorizadas.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="error"
                  onClick={handleDeleteConfirm}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { AlertTriangle, User, X } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

export default function AccountPage() {
  const { user, deleteAccount } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      // TODO: Mostrar mensagem de erro para o usuário
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Conta</h1>

      {/* Informações do Usuário */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.user_metadata?.name || 'Usuário'}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zona Perigosa</h3>
          <p className="text-gray-600 mb-4">
            Uma vez excluída, não será possível recuperar sua conta e todos os dados serão perdidos permanentemente.
          </p>
          <Button 
            variant="error"
            onClick={() => setShowDeleteModal(true)}
          >
            Excluir minha conta
          </Button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Excluir Conta</h3>
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Você tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão perdidos permanentemente.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Todas as suas transações serão excluídas</li>
                <li>• Suas configurações serão perdidas</li>
                <li>• Você perderá acesso ao histórico financeiro</li>
                <li>• A integração com WhatsApp será removida</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="error"
                className="flex-1"
                onClick={handleDeleteAccount}
                isLoading={isDeleting}
              >
                Sim, excluir minha conta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
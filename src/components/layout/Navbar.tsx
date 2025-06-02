import { AlertTriangle, BrainCircuit, LogOut, Menu, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  variant?: 'public' | 'auth' | 'app';
}

export default function Navbar({ variant = 'public' }: NavbarProps) {
  const { user, signOut, deleteAccount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Estado do usuário na Navbar:', user);
  }, [user]);

  const handleDeleteAccount = async () => {
    const deletePromise = new Promise<string>((resolve, reject) => {
      deleteAccount()
        .then(() => {
          setIsDeleting(false);
          setShowAccountModal(false);
          setShowDeleteConfirm(false);
          resolve('Conta excluída com sucesso!');
        })
        .catch((error) => {
          console.error('Erro ao deletar conta:', error);
          setIsDeleting(false);
          reject(new Error('Não foi possível excluir sua conta. Por favor, tente novamente mais tarde.'));
        });
    });

    setIsDeleting(true);
    toast.promise(deletePromise, {
      loading: 'Excluindo sua conta...',
      success: (message) => message,
      error: (error: Error) => error.message,
    });
  };

  const renderAccountModal = () => {
    if (!showAccountModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
          {/* Botão de fechar */}
          <button 
            onClick={() => {
              setShowAccountModal(false);
              setShowDeleteConfirm(false);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>

          {/* Conteúdo do modal */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Minha Conta</h2>
            
            {/* Informações do usuário */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-gray-900">{user?.user_metadata?.name || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Plano Atual</label>
                <p className="text-gray-900">Gratuito</p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Excluir minha conta
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Tem certeza que deseja excluir sua conta?</h4>
                      <p className="text-sm text-red-600 mt-1">Esta ação não poderá ser desfeita e todos os seus dados serão perdidos.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isDeleting ? 'Excluindo...' : 'Sim, excluir conta'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNavItems = () => {
    if (variant === 'public') {
      return (
        <>
          <a href="#recursos" className="text-neutral-600 hover:text-primary-500 text-sm font-medium">
            Recursos
          </a>
          <a href="#como-funciona" className="text-neutral-600 hover:text-primary-500 text-sm font-medium">
            Como funciona
          </a>
          <a href="#planos" className="text-neutral-600 hover:text-primary-500 text-sm font-medium">
            Planos
          </a>
          <a href="#perguntas" className="text-neutral-600 hover:text-primary-500 text-sm font-medium">
            Perguntas
          </a>
        </>
      );
    }
    return null;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  const renderAuthButtons = () => {
    if (user) {
      return (
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-sm text-gray-700">
              {user.user_metadata?.name || 'Usuário'}
            </span>
          </button>

          {/* Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 divide-y divide-gray-100 z-50">
              <div>
                <a 
                  onClick={() => {
                    setShowAccountModal(true);
                    setUserMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Minha Conta
                  </div>
                </a>
              </div>
              <div>
                <a
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3">
        <Link to="/login" className="text-neutral-700 hover:text-primary-600 text-sm font-medium">
          Entrar
        </Link>
        <Link to="/register" className="btn-primary">
          Começar grátis
        </Link>
      </div>
    );
  };

  return (
    <>
      <header className="fixed w-full top-0 z-40 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <BrainCircuit size={32} className="text-primary-500" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Finanças Simplificadas
                </span>
              </Link>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              {renderNavItems()}
              {renderAuthButtons()}
            </nav>
            
            {/* Mobile Nav Button */}
            <button 
              className="md:hidden text-neutral-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-white border-t border-gray-200">
            <nav className="flex flex-col space-y-3">
              {variant === 'public' && (
                <>
                  <a 
                    href="#recursos" 
                    className="text-neutral-600 hover:text-primary-500 py-2 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Recursos
                  </a>
                  <a 
                    href="#como-funciona" 
                    className="text-neutral-600 hover:text-primary-500 py-2 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Como funciona
                  </a>
                  <a 
                    href="#planos" 
                    className="text-neutral-600 hover:text-primary-500 py-2 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Planos
                  </a>
                  <a 
                    href="#perguntas" 
                    className="text-neutral-600 hover:text-primary-500 py-2 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Perguntas
                  </a>
                </>
              )}
              
              {user ? (
                <>
                  <div className="flex items-center space-x-2 py-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-700">
                      {user.user_metadata?.name || 'Usuário'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowAccountModal(true);
                    }}
                    className="text-neutral-700 hover:text-primary-600 py-2 text-base font-medium text-left w-full"
                  >
                    Minha Conta
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-neutral-700 hover:text-primary-600 py-2 text-base font-medium text-left w-full border-t border-gray-100 mt-2"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-neutral-700 hover:text-primary-600 py-2 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn-primary w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Começar grátis
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Modal de conta */}
      {renderAccountModal()}
    </>
  );
} 
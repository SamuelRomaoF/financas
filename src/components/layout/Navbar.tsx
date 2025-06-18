import { AlertTriangle, BrainCircuit, LogOut, Menu, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Estilos CSS personalizados para animações
const customStyles = `
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fade-in-down {
    0% {
      opacity: 0;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
  }
  
  .animate-fade-in-down {
    animation: fade-in-down 0.3s ease-out forwards;
  }
`;

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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Detectar rolagem da página para mudar aparência da navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-up">
          {/* Botão de fechar */}
          <button 
            onClick={() => {
              setShowAccountModal(false);
              setShowDeleteConfirm(false);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-300"
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
                  className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-all duration-300"
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
          <a href="#recursos" className="text-neutral-600 hover:text-primary-500 font-medium transition-colors duration-300 relative group">
            Recursos
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#como-funciona" className="text-neutral-600 hover:text-primary-500 font-medium transition-colors duration-300 relative group">
            Como funciona
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#planos" className="text-neutral-600 hover:text-primary-500 font-medium transition-colors duration-300 relative group">
            Planos
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#perguntas" className="text-neutral-600 hover:text-primary-500 font-medium transition-colors duration-300 relative group">
            Perguntas
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
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
            className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-all duration-300"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user.user_metadata?.name || 'Usuário'}
            </span>
          </button>

          {/* Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 divide-y divide-gray-100 z-50 animate-fade-in-down backdrop-blur-sm">
              <div>
                <Link
                  to="/dashboard"
                  onClick={() => setUserMenuOpen(false)}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" />
                    Dashboard
                  </div>
                </Link>
                <a 
                  onClick={() => {
                    setShowAccountModal(true);
                    setUserMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 cursor-pointer transition-colors duration-200"
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
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 cursor-pointer transition-colors duration-200"
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
      <div className="flex items-center space-x-4">
        <Link 
          to="/login" 
          className="text-neutral-700 hover:text-primary-600 font-medium transition-colors duration-300 relative group"
        >
          Entrar
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
        </Link>
        <Link 
          to="/register" 
          className="bg-primary-500 hover:bg-primary-600 px-4 py-2 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.03]"
        >
          Começar grátis
        </Link>
      </div>
    );
  };

  // Estilos do header baseados na rolagem da página
  const headerClasses = scrolled 
    ? "fixed w-full top-0 z-40 bg-white/90 backdrop-blur-sm shadow-md border-b border-gray-200/50 transition-all duration-300"
    : "fixed w-full top-0 z-40 bg-white border-b border-gray-200 transition-all duration-300";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <header className={headerClasses}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="bg-primary-500/10 rounded-full p-2 group-hover:bg-primary-500/20 transition-all duration-300">
                  <BrainCircuit size={28} className="text-primary-500" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
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
              className="md:hidden text-neutral-500 hover:text-neutral-800 transition-colors duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 animate-fade-in-down">
            <nav className="flex flex-col space-y-3">
              {variant === 'public' && (
                <>
                  <a 
                    href="#recursos" 
                    className="text-neutral-600 hover:text-primary-500 py-2 font-medium transition-colors duration-300 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Recursos
                  </a>
                  <a 
                    href="#como-funciona" 
                    className="text-neutral-600 hover:text-primary-500 py-2 font-medium transition-colors duration-300 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Como funciona
                  </a>
                  <a 
                    href="#planos" 
                    className="text-neutral-600 hover:text-primary-500 py-2 font-medium transition-colors duration-300 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Planos
                  </a>
                  <a 
                    href="#perguntas" 
                    className="text-neutral-600 hover:text-primary-500 py-2 font-medium transition-colors duration-300 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Perguntas
                  </a>
                </>
              )}
              
              {user ? (
                <>
                  <div className="flex items-center space-x-2 py-2 border-b border-gray-100">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.user_metadata?.name || 'Usuário'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowAccountModal(true);
                    }}
                    className="text-neutral-700 hover:text-primary-600 py-2 font-medium text-left w-full transition-colors duration-300 border-b border-gray-100"
                  >
                    Minha Conta
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-neutral-700 hover:text-primary-600 py-2 font-medium text-left w-full transition-colors duration-300"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-neutral-700 hover:text-primary-600 py-2 font-medium transition-colors duration-300 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-primary-500 hover:bg-primary-600 mt-2 px-4 py-2 text-center text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
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

      {/* Espaçador para compensar o header fixo */}
      <div className="h-16"></div>
    </>
  );
} 
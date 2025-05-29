import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

interface NavbarProps {
  variant?: 'public' | 'auth' | 'app';
}

export default function Navbar({ variant = 'public' }: NavbarProps) {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderNavItems = () => {
    if (variant === 'public') {
      return (
        <>
          <a href="#recursos" className="text-neutral-600 hover:text-primary-500 text-sm font-medium">
            Recursos
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

  const renderAuthButtons = () => {
    if (isAuthenticated) {
      if (user?.plan === 'free') {
        return (
          <div className="flex items-center space-x-3">
            <Link to="/app/planos" className="btn-primary">
              Assinar agora
            </Link>
          </div>
        );
      }
      return (
        <div className="flex items-center space-x-3">
          <Link to="/app/dashboard" className="btn-primary">
            Ir para Dashboard
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3">
        <Link to="/login" className="text-neutral-700 hover:text-primary-600 text-sm font-medium">
          Entrar
        </Link>
        <Link to="/registro" className="btn-primary">
          Começar grátis
        </Link>
      </div>
    );
  };

  return (
    <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BrainCircuit size={32} className="text-primary-500" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
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
        <div className="md:hidden px-4 py-3 bg-white dark:bg-gray-800 border-t border-neutral-100 dark:border-gray-700">
          <nav className="flex flex-col space-y-3">
            {variant === 'public' && (
              <>
                <a 
                  href="#recursos" 
                  className="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Recursos
                </a>
                <a 
                  href="#planos" 
                  className="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Planos
                </a>
                <a 
                  href="#perguntas" 
                  className="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Perguntas
                </a>
              </>
            )}
            <div className="pt-3 flex flex-col space-y-3 border-t border-neutral-100 dark:border-gray-700">
              {isAuthenticated ? (
                user?.plan === 'free' ? (
                  <Link 
                    to="/app/planos" 
                    className="btn-primary w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Assinar agora
                  </Link>
                ) : (
                  <Link 
                    to="/app/dashboard" 
                    className="btn-primary w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Ir para Dashboard
                  </Link>
                )
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 py-2 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link 
                    to="/registro" 
                    className="btn-primary w-full justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Começar grátis
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
} 
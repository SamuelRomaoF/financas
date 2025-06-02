import { AuthError } from '@supabase/supabase-js';
import { Mail, UserPlus, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import PasswordInput from '../../components/ui/PasswordInput';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setRegisterError(null);
    
    try {
      const { error } = await signUp(data.email, data.password, data.name);
      
      if (error) {
        throw error;
      }

      setRegisteredEmail(data.email);
      setShowConfirmationModal(true);
    } catch (error) {
      if (error instanceof AuthError) {
        setRegisterError(error.message);
      } else if (error instanceof Error) {
        setRegisterError(error.message);
      } else {
        setRegisterError('Erro ao criar conta. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmationModal(false);
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center">
            <Wallet className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Finanças Simplificadas</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Crie sua conta e comece a gerenciar suas finanças
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {registerError && (
            <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-md">
              <p className="text-sm text-error-600 dark:text-error-400">{registerError}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="name" required>Nome completo</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name', { 
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'O nome deve ter pelo menos 3 caracteres'
                  }
                })}
                error={errors.name?.message}
              />
            </div>
            
            <div>
              <Label htmlFor="email" required>Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', { 
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Email inválido'
                  }
                })}
                error={errors.email?.message}
              />
            </div>
            
            <div>
              <Label htmlFor="password" required>Senha</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                {...register('password', { 
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'A senha deve ter pelo menos 6 caracteres'
                  }
                })}
                error={errors.password?.message}
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" required>Confirmar senha</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...register('confirmPassword', { 
                  required: 'Confirmação de senha é obrigatória',
                  validate: value => value === password || 'As senhas não coincidem'
                })}
                error={errors.confirmPassword?.message}
              />
            </div>
            
            <div>
              <Button
                type="submit"
                className="w-full flex justify-center"
                isLoading={isLoading}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Criar conta
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                Entre aqui
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900">
                <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Confirme seu email
              </h3>
              
              <div className="mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enviamos um link de confirmação para
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {registeredEmail}
                </p>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Por favor, verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.
                </p>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleCloseModal}
                >
                  Entendi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
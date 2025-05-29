import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import { Wallet, UserPlus } from 'lucide-react';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setRegisterError(null);
    
    try {
      await registerUser(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setRegisterError('Erro ao criar conta. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
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
              <Input
                id="password"
                type="password"
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
              <Input
                id="confirmPassword"
                type="password"
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
    </div>
  );
}
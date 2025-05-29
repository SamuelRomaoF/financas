import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import { Wallet, LogIn, TestTube2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: false
    }
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/app/dashboard');
    } catch (error) {
      setLoginError('Email ou senha inválidos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setValue('email', 'teste@exemplo.com');
    setValue('password', 'senha123');
  };
  
  return (
    <>
      <Navbar variant="auth" />
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center">
              <Wallet className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Bem-vindo de volta</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Entre com sua conta para gerenciar suas finanças
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {loginError && (
              <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-md">
                <p className="text-sm text-error-600 dark:text-error-400">{loginError}</p>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                <div className="flex justify-between">
                  <Label htmlFor="password" required>Senha</Label>
                  <Link to="/recuperar-senha" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
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

              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 cursor-pointer">
                  Lembrar de mim
                </label>
              </div>
              
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full flex justify-center"
                  isLoading={isLoading}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Entrar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex justify-center"
                  onClick={fillTestCredentials}
                >
                  <TestTube2 className="h-5 w-5 mr-2" />
                  Usar conta de teste
                </Button>
              </div>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Ou
                  </span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <Link to="/registro" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                    Registre-se aqui
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
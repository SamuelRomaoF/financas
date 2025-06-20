import { AuthError } from '@supabase/supabase-js';
import { LogIn, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import PasswordInput from '../../components/ui/PasswordInput';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { checkRateLimit, clearRateLimit, formatRemainingTime, incrementRateLimit } from '../../utils/rateLimiter';
import { sanitizeObject, sanitizeUrl } from '../../utils/sanitizeInput';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const { /* user, */ signIn } = useAuth();
  const { checkAccess, createTrialSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState('');
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: true,
      email: localStorage.getItem('rememberedEmail') || ''
    }
  });

  const rememberMe = watch('rememberMe');
  const email = watch('email');
  
  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem('rememberedEmail', email);
    } else if (!rememberMe) {
      localStorage.removeItem('rememberedEmail');
    }
  }, [rememberMe, email]);
  
  const onSubmit = async (data: LoginFormData) => {
    // Sanitizar entradas para prevenir XSS
    const formData = sanitizeObject(data);
    
    // Verificar rate limit
    const rateLimit = checkRateLimit(formData.email);
    if (rateLimit.blocked) {
      setIsBlocked(true);
      setBlockTimeRemaining(formatRemainingTime(rateLimit.remainingMs));
      setLoginError(`Muitas tentativas de login. Tente novamente em ${formatRemainingTime(rateLimit.remainingMs)}.`);
      return;
    }
    
    setIsLoading(true);
    setLoginError(null);
    setIsEmailNotConfirmed(false);
    
    try {
      const { data: authData, error } = await signIn(formData.email, formData.password, formData.rememberMe);
      
      if (error) {
        // Incrementar contador de tentativas
        incrementRateLimit(formData.email);
        
        // Verificar se agora está bloqueado
        const newRateLimit = checkRateLimit(formData.email);
        if (newRateLimit.blocked) {
          setIsBlocked(true);
          setBlockTimeRemaining(formatRemainingTime(newRateLimit.remainingMs));
          throw new Error(`Muitas tentativas de login. Tente novamente em ${formatRemainingTime(newRateLimit.remainingMs)}.`);
        } else if (newRateLimit.attemptsLeft > 0) {
          throw new Error(`Credenciais inválidas. Você tem mais ${newRateLimit.attemptsLeft} tentativa(s).`);
        } else {
          // Verificar se é erro de email não confirmado
        if (error instanceof AuthError && error.message.includes('Email not confirmed')) {
          setIsEmailNotConfirmed(true);
          throw new Error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
        }
        throw error;
      }
      }
      
      // Login bem-sucedido, limpar rate limit
      clearRateLimit(formData.email);

      const hasAccess = await checkAccess();

      if (!hasAccess) {
        console.log('Usuário não tem acesso, criando assinatura de teste...');
        let subscriptionError = null;
        for (let i = 0; i < 3; i++) {
          if (!authData || !authData.user) {
            subscriptionError = new Error('Usuário não encontrado');
            continue;
          }
          const { error: trialError } = await createTrialSubscription(authData.user);
          if (!trialError) {
            subscriptionError = null;
            break;
          }
          subscriptionError = trialError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (subscriptionError) {
          throw subscriptionError;
        }
      }

      // Redirecionar para a página correta
      const redirectTo = searchParams.get('redirectTo');
      // Sanitizar URL de redirecionamento
      navigate(sanitizeUrl(redirectTo || '/dashboard'));
      
    } catch (error) {
      if (error instanceof AuthError) {
        setLoginError(error.message);
      } else if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError('Erro ao fazer login. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
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
              <div className={`mb-4 p-3 ${isEmailNotConfirmed ? 'bg-warning-50 dark:bg-warning-900/30 border-warning-200 dark:border-warning-800' : 'bg-error-50 dark:bg-error-900/30 border-error-200 dark:border-error-800'} border rounded-md`}>
                <p className={`text-sm ${isEmailNotConfirmed ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400'}`}>{loginError}</p>
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
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  {...register('password', { 
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 8,
                      message: 'A senha deve ter pelo menos 8 caracteres'
                    }
                  })}
                  error={errors.password?.message}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Manter conectado
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
                  <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
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
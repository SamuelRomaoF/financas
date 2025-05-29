import { useState } from 'react';
import { Check, Crown, Star, CreditCard } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    period: 'monthly',
    features: [
      'Até 50 transações por mês',
      'Categorização básica',
      'Relatórios mensais',
      'Suporte por email'
    ]
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 19.90,
    period: 'monthly',
    features: [
      'Transações ilimitadas',
      'Categorização avançada',
      'Relatórios detalhados',
      'Alertas personalizados',
      'Suporte prioritário',
      'Exportação de dados'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 39.90,
    period: 'monthly',
    features: [
      'Todas as features do plano Básico',
      'Múltiplas contas',
      'Planejamento financeiro',
      'Consultoria financeira mensal',
      'API de integração',
      'Suporte 24/7'
    ]
  }
];

export default function PlansPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Simulando uma data de expiração para demonstração
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const getPlanDetails = (planId: string) => {
    return plans.find(plan => plan.id === planId);
  };

  const currentPlan = getPlanDetails(user?.plan || 'free');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Escolha o melhor plano para suas necessidades
        </p>
      </div>

      {/* Plano atual */}
      <div className="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Crown className="h-5 w-5 text-primary-500 mr-2" />
              Seu Plano Atual
            </h2>
            <div className="mt-2">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {currentPlan?.name}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Expira em: {formatDate(expirationDate)}
              </p>
            </div>
          </div>
          {user?.plan === 'free' && (
            <Button>
              <Star className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Seletor de período */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedPeriod === 'monthly'
                ? 'bg-primary-500 text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setSelectedPeriod('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedPeriod === 'yearly'
                ? 'bg-primary-500 text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Anual
            <span className="ml-1 text-xs text-success-600 dark:text-success-400">-20%</span>
          </button>
        </div>
      </div>

      {/* Lista de planos */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = selectedPeriod === 'yearly' ? plan.price * 0.8 * 12 : plan.price;
          const isCurrentPlan = user?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
                plan.recommended
                  ? 'border-primary-500 dark:border-primary-500'
                  : 'border-gray-200 dark:border-gray-700'
              } p-6`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(price)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    /{selectedPeriod === 'yearly' ? 'ano' : 'mês'}
                  </span>
                </div>

                <ul className="mt-6 space-y-4 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-success-500 flex-shrink-0 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrentPlan ? 'outline' : 'primary'}
                  className="mt-8 w-full"
                  disabled={isCurrentPlan}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isCurrentPlan ? 'Plano Atual' : 'Assinar Agora'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
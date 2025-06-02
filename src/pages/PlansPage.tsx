import { Check, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useSubscription } from '../hooks/useSubscription';

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
      'Integração com WhatsApp',
      'Categorização básica',
      'Relatório semanal',
      'Limite de 50 transações',
      'Suporte por email',
      'Período de 7 dias'
    ]
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 39.90,
    period: 'monthly',
    features: [
      'Integração com WhatsApp',
      'Categorização automática',
      'Metas financeiras',
      'Limite de 100 transações/mês',
      'Suporte prioritário',
      'Exportação de dados'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 69.90,
    period: 'monthly',
    features: [
      'Todas as features do plano Básico',
      'Transações ilimitadas',
      'Múltiplas contas',
      'Análise de investimentos',
      'Insiders de economia',
      'Suporte 24/7'
    ]
  }
];

export function PlansPage() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePlanSelect = (planId: string) => {
    navigate(`/register?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-lg text-gray-600">
            {subscription?.plan === 'free' 
              ? 'Aproveite seu período gratuito ou escolha um plano premium'
              : 'Comece gratuitamente e atualize quando precisar de mais recursos'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-lg border p-8 shadow-sm
                ${plan.recommended ? 'border-primary' : 'border-gray-200'}
                ${subscription?.plan === plan.id ? 'ring-2 ring-primary' : ''}
              `}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-sm font-medium px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-gray-600">/mês</span>
                </div>

                <ul className="mt-6 space-y-4 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-success-500 flex-shrink-0 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={subscription?.plan === plan.id ? 'outline' : 'primary'}
                  className="mt-8 w-full"
                  disabled={subscription?.plan === plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {subscription?.plan === plan.id ? 'Plano Atual' : 'Assinar Agora'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
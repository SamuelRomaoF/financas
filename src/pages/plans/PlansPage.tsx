import { Check, CreditCard, Crown, Star } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription, SubscriptionPlan } from '../../hooks/useSubscription';

interface Plan {
  id: SubscriptionPlan;
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
    price: 69.90,
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
  const { subscription, createTrialSubscription, updateSubscription, isLoading: loadingSubscription } = useSubscription();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan || !user) return;

    setIsProcessing(true);

    try {
      let result;
      if (!subscription || subscription.status !== 'active') {
        result = await createTrialSubscription(user);
      } else {
        result = await updateSubscription(selectedPlan.id as SubscriptionPlan);
      }

      if (result.error) {
        throw result.error;
      }

      toast.success(`Você agora está no plano ${selectedPlan.name}!`);

    } catch (error: any) {
      console.error("Erro ao processar assinatura:", error);
      toast.error(error.message || `Houve um erro ao processar sua assinatura. Tente novamente.`);
    } finally {
      setIsProcessing(false);
      setIsConfirmationModalOpen(false);
      setSelectedPlan(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanDetails = (planId: string | null | undefined) => {
    if (!planId) return plans.find(plan => plan.id === 'free');
    return plans.find(plan => plan.id === planId);
  };

  const currentPlanDetails = getPlanDetails(subscription?.plan);
  const currentPlanIsTrial = subscription?.plan === 'free' && subscription?.status === 'active' && subscription?.trial_ends_at;

  const filteredPlansToDisplay = plans.filter(plan => {
    if (subscription?.status === 'active') {
      if (subscription.plan === 'basic') {
        return plan.id === 'premium';
      }
      if (subscription.plan === 'premium') {
        return false;
      }
    }
    return true;
  });

  if (loadingSubscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Carregando informações do plano...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Escolha o melhor plano para suas necessidades
        </p>
      </div>

      <div className="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Crown className="h-5 w-5 text-primary-500 mr-2" />
              Seu Plano Atual
            </h2>
            <div className="mt-2">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {currentPlanDetails?.name} {currentPlanIsTrial ? "(Trial)" : ""}
              </p>
              {subscription?.trial_ends_at && currentPlanIsTrial && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Trial expira em: {formatDate(subscription.trial_ends_at)}
                </p>
              )}
              {subscription?.plan !== 'free' && subscription?.current_period_ends_at && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                   Expira em: {formatDate(subscription.current_period_ends_at)}
              </p>
              )}
            </div>
          </div>
          {subscription?.plan === 'free' && (
            <Button>
              <Star className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
        </div>
      </div>

      {!(subscription?.status === 'active' && subscription?.plan === 'premium') && filteredPlansToDisplay.length > 0 && (
        <>
          {!(subscription?.status === 'active' && subscription?.plan === 'basic') && (
            <div className="flex justify-center py-4">
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
          )}

          {filteredPlansToDisplay.length === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 place-items-center">
              <div className="hidden md:block"></div>
              {filteredPlansToDisplay.map((plan) => {
                const price = selectedPeriod === 'yearly' && plan.id !== 'free' ? plan.price * 0.8 * 12 : plan.price;
                const buttonText = 
                  (subscription?.plan === 'free' && plan.id !== 'free') ? 'Assinar Agora' :
                  (subscription?.plan === 'basic' && plan.id === 'premium') ? 'Fazer Upgrade' :
                  'Assinar Agora';

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md`}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {plan.id === 'free' ? 'R$ 0,00' : formatCurrency(price)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          /{selectedPeriod === 'yearly' && plan.id !== 'free' ? 'ano' : 'mês'}
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
                        variant={'primary'} 
                        className="mt-8 w-full"
                        onClick={() => handleSelectPlan(plan)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {buttonText}
                      </Button>
                    </div>
                  </div>
                );
              })}
               <div className="hidden md:block"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlansToDisplay.map((plan) => {
                  const price = selectedPeriod === 'yearly' && plan.id !== 'free' ? plan.price * 0.8 * 12 : plan.price;
                  if (subscription?.plan === plan.id && subscription?.status === 'active') {
                    return null; 
                  }
                  const buttonText = 
                    (subscription?.plan === 'free' && plan.id !== 'free') ? 'Assinar Agora' :
                    (subscription?.plan === 'basic' && plan.id === 'premium') ? 'Fazer Upgrade' :
                    'Assinar Agora';

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
                            {plan.id === 'free' ? 'R$ 0,00' : formatCurrency(price)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                            /{selectedPeriod === 'yearly' && plan.id !== 'free' ? 'ano' : 'mês'}
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
                          variant={'primary'} 
                          className="mt-8 w-full"
                          onClick={() => handleSelectPlan(plan)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {buttonText}
                        </Button>
              </div>
            </div>
          );
        })}
      </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmSubscription}
        title={`Confirmar Plano ${selectedPlan?.name}`}
        message={
          selectedPlan?.id === 'free'
            ? 'Você está prestes a iniciar seu período de teste no plano Gratuito. Deseja continuar?'
            : `Você está prestes a assinar o plano ${selectedPlan?.name}. Um valor correspondente será cobrado. Deseja continuar?`
        }
        confirmButtonText={isProcessing ? "Processando..." : "Sim, Confirmar"}
        cancelButtonText="Cancelar"
        isConfirmDisabled={isProcessing}
      />
    </div>
  );
} 
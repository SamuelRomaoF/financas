import { useState } from 'react';
import { Bell, Plus, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import NewAlertDialog, { AlertTypeOptionValue } from '../../components/alerts/NewAlertDialog';
import { useSubscription } from '../../hooks/useSubscription';

const alertTypeMapping: Record<AlertTypeOptionValue, Alert['type']> = {
  expense: 'expense',
  balance: 'balance',
  bill: 'bill',
  income: 'income',
  goal: 'goal',
};

interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'expense' | 'income' | 'balance' | 'goal' | 'bill';
  status: 'active' | 'disabled';
  condition: string;
  createdAt: string;
  nextCheck: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'Limite de gastos',
    description: 'Alerta quando os gastos mensais ultrapassarem R$ 3.000',
    type: 'expense',
    status: 'active',
    condition: 'monthly_expense > 3000',
    createdAt: '2024-03-15',
    nextCheck: '2024-04-01'
  },
  {
    id: '2',
    title: 'Saldo baixo',
    description: 'Alerta quando o saldo da conta ficar abaixo de R$ 1.000',
    type: 'balance',
    status: 'active',
    condition: 'balance < 1000',
    createdAt: '2024-03-10',
    nextCheck: '2024-03-20'
  },
  {
    id: '3',
    title: 'Fatura do cartão',
    description: 'Lembrete 5 dias antes do vencimento da fatura',
    type: 'bill',
    status: 'active',
    condition: 'credit_card_due_date - 5 days',
    createdAt: '2024-02-28',
    nextCheck: '2024-03-25'
  }
];

const BASICO_ALERTS_LIMIT = 10;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isNewAlertDialogOpen, setIsNewAlertDialogOpen] = useState(false);
  const { subscription } = useSubscription();
  const userPlan = subscription?.plan;

  const handleNewAlertSubmit = (data: {
    title: string;
    description: string;
    type: AlertTypeOptionValue;
  }) => {
    const newAlert: Alert = {
      id: String(Date.now()),
      title: data.title,
      description: data.description,
      type: alertTypeMapping[data.type],
      status: 'active',
      condition: 'N/A',
      createdAt: new Date().toISOString().split('T')[0],
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
    setIsNewAlertDialogOpen(false);
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  };

  const isBasicoPlan = userPlan === 'basic';
  const alertsCount = alerts.length;
  const basicoAlertsLimitReached = isBasicoPlan && alertsCount >= BASICO_ALERTS_LIMIT;

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'expense':
        return <TrendingDown className="h-5 w-5 text-error-500" />;
      case 'income':
        return <TrendingUp className="h-5 w-5 text-success-500" />;
      case 'balance':
        return <DollarSign className="h-5 w-5 text-warning-500" />;
      case 'bill':
        return <Calendar className="h-5 w-5 text-info-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-primary-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure alertas personalizados para suas finanças
          </p>
        </div>
        <Button onClick={() => setIsNewAlertDialogOpen(true)} disabled={basicoAlertsLimitReached}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Alerta
        </Button>
      </div>
      {basicoAlertsLimitReached && (
        <p className="text-sm text-center text-yellow-600 dark:text-yellow-400 mb-4">
          Você atingiu o limite de {BASICO_ALERTS_LIMIT} alertas para o plano Básico. 
          <a href="/planos" className="underline hover:text-yellow-500">Faça upgrade</a> para alertas ilimitados.
        </p>
      )}

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {alert.title}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.status === 'active' 
                        ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {alert.status === 'active' ? 'Ativo' : 'Desativado'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-1 text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400"
                      aria-label="Excluir alerta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {alert.description}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Criado em: {formatDate(alert.createdAt)}</span>
                  <span>•</span>
                  <span>Próxima verificação: {formatDate(alert.nextCheck)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isNewAlertDialogOpen && (
        <NewAlertDialog
          isOpen={isNewAlertDialogOpen}
          onClose={() => setIsNewAlertDialogOpen(false)}
          onSubmit={handleNewAlertSubmit}
          userPlan={userPlan || null}
        />
      )}
    </div>
  );
} 
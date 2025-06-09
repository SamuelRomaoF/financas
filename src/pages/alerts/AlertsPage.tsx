import { AlertTriangle, Bell, Calendar, DollarSign, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NewAlertDialog, { AlertTypeOptionValue } from '../../components/alerts/NewAlertDialog';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';

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
  created_at: string;
  next_check: string;
  user_id: string;
}

const BASICO_ALERTS_LIMIT = 3;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewAlertDialogOpen, setIsNewAlertDialogOpen] = useState(false);
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const userPlan = subscription?.plan;

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setAlerts(data || []);
      } catch (error) {
        console.error('Erro ao buscar alertas:', error);
        toast.error('Não foi possível carregar seus alertas');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlerts();
  }, [user]);

  const handleNewAlertSubmit = async (data: {
    title: string;
    description: string;
    type: AlertTypeOptionValue;
  }) => {
    if (!user) return;
    
    try {
      const nextCheckDate = new Date();
      nextCheckDate.setDate(nextCheckDate.getDate() + 7);
      
      const newAlert = {
      title: data.title,
      description: data.description,
      type: alertTypeMapping[data.type],
      status: 'active',
      condition: 'N/A',
        user_id: user.id,
        created_at: new Date().toISOString(),
        next_check: nextCheckDate.toISOString(),
      };
      
      const { data: insertedAlert, error } = await supabase
        .from('alerts')
        .insert(newAlert)
        .select()
        .single();
        
      if (error) throw error;
      
      setAlerts(prevAlerts => [insertedAlert, ...prevAlerts]);
      toast.success('Alerta criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      toast.error('Não foi possível criar o alerta');
    } finally {
    setIsNewAlertDialogOpen(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);
        
      if (error) throw error;
      
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
      toast.success('Alerta excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir alerta:', error);
      toast.error('Não foi possível excluir o alerta');
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

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

      {alerts.length === 0 ? (
        <div className="text-center py-10">
          <Bell className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Nenhum alerta configurado</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure alertas para receber notificações sobre suas finanças
          </p>
        </div>
      ) : (
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
                    <span>Criado em: {formatDate(alert.created_at)}</span>
                  <span>•</span>
                    <span>Próxima verificação: {formatDate(alert.next_check)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

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
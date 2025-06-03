import { Bell, Target, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface Alert {
  id: string;
  title: string;
  type: string;
  priority: string;
}

interface AlertasSectionProps {
  alerts: Alert[];
}

export default function AlertasSection({ alerts }: AlertasSectionProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'bill_due':
        return <Bell className="h-5 w-5 text-error-500" />;
      case 'goal_milestone':
        return <Target className="h-5 w-5 text-success-500" />;
      case 'budget_exceeded':
        return <TrendingUp className="h-5 w-5 text-warning-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary-500" />;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alertas Recentes</CardTitle>
        <Button variant="outline" size="sm">Ver todos</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="mr-3">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {alert.title}
                </p>
              </div>
              <div className="ml-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      alert.priority === 'high'
                        ? 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                        : alert.priority === 'medium'
                        ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                        : 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                    }`}
                >
                  {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
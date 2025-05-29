export type AlertType = 'bill_due' | 'goal_milestone' | 'budget_exceeded' | 'custom';
export type AlertStatus = 'pending' | 'dismissed' | 'completed';

export type Alert = {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: AlertType;
  status: AlertStatus;
  priority: 'low' | 'medium' | 'high';
  relatedEntityId?: string;
  relatedEntityType?: 'transaction' | 'goal' | 'budget';
};
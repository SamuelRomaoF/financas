export type GoalStatus = 'in_progress' | 'completed' | 'failed';

export type Goal = {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  endDate: Date;
  status: GoalStatus;
  category?: string;
  icon?: string;
  color?: string;
};
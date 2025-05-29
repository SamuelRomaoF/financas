export type TransactionType = 'income' | 'expense';

export type TransactionCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod?: string;
  note?: string;
  isRecurring?: boolean;
  recurrenceInfo?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
};
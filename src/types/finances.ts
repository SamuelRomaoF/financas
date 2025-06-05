export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
}

export interface SaveableBankAccountData {
  bankName: string;
  accountType: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
  userId: string;
}

// Poderíamos adicionar outros tipos financeiros aqui no futuro,
// como CreditCardData, Transaction, Goal, etc.

export interface CreditCardData {
  id: string;
  name: string; // Apelido do cartão, ex: "Nubank Pessoal"
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'diners' | 'outro';
  lastFourDigits?: string; // Últimos 4 dígitos
  limit: number; // Limite do cartão
  currentSpending?: number; // Gasto atual (opcional, pode ser calculado)
  dueDate: number; // Dia do vencimento da fatura (1-31)
  closingDate: number; // Dia do fechamento da fatura (1-31)
  color: string; // Cor para UI, ex: #RRGGBB
  // Adicionar outros campos conforme necessário, ex: bandeiraLogo etc.
}

export interface SaveableCreditCardData {
  name: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'diners' | 'outro';
  lastFourDigits?: string;
  limit: number;
  dueDate: number;
  closingDate: number;
  color: string;
}

export interface Purchase {
  id: string;
  description: string;
  amount: number;
  date: string; // Pode ser string no formato ISO ou um objeto Date
  category: string;
  installments?: {
    current: number;
    total: number;
    amount: number; // Valor da parcela
  };
  // Futuramente: cardId?: string; accountId?: string; etc.
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ou Date
  category: string;
}
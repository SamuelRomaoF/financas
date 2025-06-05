import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BankAccount, SaveableBankAccountData } from '../types/finances';

// Reutilizando/redefinindo interfaces necessárias. Idealmente, mover para um arquivo de tipos global.
// export interface BankAccount {
//   id: string;
//   bankName: string;
//   accountType: 'corrente' | 'poupanca' | 'investimento';
//   accountNumber: string;
//   balance: number;
//   logo: string;
//   color: string;
//   agency?: string;
//   pendingTransactionsCount?: number;
//   scheduledTransactionsCount?: number;
// }

// export interface SaveableBankAccountData {
//   bankName: string; 
//   accountType: 'corrente' | 'poupanca' | 'investimento';
//   accountNumber?: string; 
//   balance: number;
//   logo: string; 
//   color: string;
//   agency?: string;
// }

interface BankAccountContextType {
  accounts: BankAccount[];
  highlightedAccountIds: string[];
  isLoadingAccounts: boolean;
  addAccount: (accountData: SaveableBankAccountData) => void;
  removeAccount: (accountId: string) => void;
  setHighlightedAccountIds: (ids: string[]) => void;
  getAccountById: (accountId: string) => BankAccount | undefined;
}

const BankAccountContext = createContext<BankAccountContextType | undefined>(undefined);

const initialAccountsData: BankAccount[] = [
  {
    id: '1',
    bankName: 'Nubank',
    accountType: 'corrente',
    accountNumber: '0000000-0',
    agency: '0001',
    balance: 5432.10,
    color: '#8A05BE',
    logo: '/bank-logos/nubank.svg',
    pendingTransactionsCount: 3,
    scheduledTransactionsCount: 2,
  },
  {
    id: '2',
    bankName: 'Inter',
    accountType: 'corrente',
    accountNumber: '1111111-1',
    agency: '0001',
    balance: 3789.45,
    color: '#FF7A00',
    logo: '/bank-logos/inter.svg',
    pendingTransactionsCount: 1,
    scheduledTransactionsCount: 0,
  },
  {
    id: '3',
    bankName: 'Itaú Unibanco',
    accountType: 'poupanca',
    accountNumber: '2222222-2',
    agency: '1234',
    balance: 10000,
    color: '#EC7000',
    logo: '/bank-logos/itau.svg',
    pendingTransactionsCount: 0,
    scheduledTransactionsCount: 1,
  }
];

export const BankAccountProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccountsData);
  const [highlightedAccountIds, setHighlightedAccountIdsState] = useState<string[]>(() => {
    return initialAccountsData.length > 0 ? [initialAccountsData[0].id] : [];
  });
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const addAccount = (accountData: SaveableBankAccountData) => {
    const newAccount: BankAccount = {
      ...accountData,
      id: String(Date.now()),
      accountNumber: accountData.accountNumber || '',
      agency: accountData.agency || '',
      pendingTransactionsCount: 0,
      scheduledTransactionsCount: 0,
    };
    setAccounts(prevAccounts => [...prevAccounts, newAccount]);
    toast.success('Conta adicionada com sucesso!');
  };

  const removeAccount = (accountId: string) => {
    setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountId));
    setHighlightedAccountIdsState(prevHighlighted => prevHighlighted.filter(id => id !== accountId));
    toast.success('Conta removida com sucesso!');
  };

  const getAccountById = (accountId: string): BankAccount | undefined => {
    return accounts.find(account => account.id === accountId);
  };
  
  const setHighlightedAccountIds = (ids: string[]) => {
    setHighlightedAccountIdsState(ids);
  };

  return (
    <BankAccountContext.Provider 
      value={{
        accounts,
        highlightedAccountIds,
        isLoadingAccounts,
        addAccount,
        removeAccount,
        getAccountById,
        setHighlightedAccountIds
      }}
    >
      {children}
    </BankAccountContext.Provider>
  );
};

export const useBankAccounts = () => {
  const context = useContext(BankAccountContext);
  if (context === undefined) {
    throw new Error('useBankAccounts must be used within a BankAccountProvider');
  }
  return context;
}; 
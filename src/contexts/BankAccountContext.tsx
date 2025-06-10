import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BankAccount, SaveableBankAccountData } from '../types/finances';
import { AuthContext } from './AuthContext';

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
  addAccount: (accountData: SaveableBankAccountData) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  setHighlightedAccountIds: (ids: string[]) => void;
  getAccountById: (accountId: string) => BankAccount | undefined;
  refreshAccounts: () => Promise<void>;
}

const BankAccountContext = createContext<BankAccountContextType | undefined>(undefined);

export const BankAccountProvider = ({ children }: { children: ReactNode }) => {
  const authContext = useContext(AuthContext);

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [highlightedAccountIds, setHighlightedAccountIdsState] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  useEffect(() => {
    if (authContext && authContext.user) {
      fetchAccounts();
    } else if (authContext && !authContext.loading && !authContext.user) {
      setIsLoadingAccounts(false);
    }
  }, [authContext]);

  const fetchAccounts = async () => {
    if (!authContext || !authContext.user) return;

    try {
      setIsLoadingAccounts(true);
      const { data: accountsData, error } = await authContext.supabase
        .from('banks')
        .select('*')
        .eq('user_id', authContext.user.id);

      if (error) {
        throw error;
      }
      
      if (accountsData) {
        const mappedAccounts: BankAccount[] = accountsData.map(account => ({
          id: account.id,
          bankName: account.name,
          accountType: account.type as 'corrente' | 'poupanca' | 'investimento',
          accountNumber: account.account || '',
          balance: account.balance || 0,
          color: account.color || '#000000',
          agency: account.agency || '',
          logo: `/bank-logos/${account.name.toLowerCase().replace(/\s/g, '-')}.svg`,
          pendingTransactionsCount: 0,
          scheduledTransactionsCount: 0,
        }));
        setAccounts(mappedAccounts);
      }

    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      toast.error('Não foi possível carregar suas contas bancárias.');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const addAccount = async (accountData: SaveableBankAccountData) => {
    if (!authContext || !authContext.user) {
      toast.error('Você precisa estar logado para adicionar uma conta.');
      return;
    }

    try {
      // Mapeia os dados do formulário para o formato da tabela 'banks'
      const newAccountForSupabase = {
        user_id: authContext.user.id,
        name: accountData.bankName,
        type: accountData.accountType,
        account: accountData.accountNumber,
        balance: accountData.balance,
        color: accountData.color,
        agency: accountData.agency,
      };

      const { data, error } = await authContext.supabase
        .from('banks')
        .insert(newAccountForSupabase)
        .select() // .select() retorna o registro inserido
        .single(); // Esperamos inserir e retornar um único registro

      if (error) {
        // O erro de limite de contas (do trigger do DB) será capturado aqui
        console.error('Erro ao adicionar conta:', error.message);
        toast.error(error.message || 'Falha ao adicionar a conta.');
        return;
      }

      if (data) {
        // Mapeia o retorno do Supabase para o formato do frontend e atualiza o estado
        const addedAccount: BankAccount = {
            id: data.id,
            bankName: data.name,
            accountType: data.type as 'corrente' | 'poupanca' | 'investimento',
            accountNumber: data.account || '',
            balance: data.balance || 0,
            color: data.color || '#000000',
            agency: data.agency || '',
            logo: `/bank-logos/${data.name.toLowerCase().replace(/\s/g, '-')}.svg`,
            pendingTransactionsCount: 0, 
            scheduledTransactionsCount: 0,
        };
        setAccounts(prevAccounts => [...prevAccounts, addedAccount]);
        toast.success('Conta adicionada com sucesso!');
      }

    } catch (error) {
      console.error('Erro inesperado ao adicionar conta:', error);
      toast.error('Ocorreu um erro inesperado.');
    }
  };

  const removeAccount = async (accountId: string) => {
    if (!authContext || !authContext.user) {
      toast.error('Você precisa estar logado para remover uma conta.');
      return;
    }

    try {
        const { error } = await authContext.supabase
            .from('banks')
            .delete()
            .eq('id', accountId)
            .eq('user_id', authContext.user.id); // Dupla verificação por segurança

        if (error) {
            throw error;
        }

        setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountId));
        setHighlightedAccountIdsState(prevHighlighted => prevHighlighted.filter(id => id !== accountId));
        toast.success('Conta removida com sucesso!');

    } catch (error) {
        console.error('Erro ao remover conta:', error);
        toast.error('Não foi possível remover a conta.');
    }
  };

  const getAccountById = (accountId: string): BankAccount | undefined => {
    return accounts.find(account => account.id === accountId);
  };
  
  const setHighlightedAccountIds = (ids: string[]) => {
    setHighlightedAccountIdsState(ids);
  };

  // Expor a função fetchAccounts como refreshAccounts
  const refreshAccounts = async () => {
    return fetchAccounts();
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
        setHighlightedAccountIds,
        refreshAccounts
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
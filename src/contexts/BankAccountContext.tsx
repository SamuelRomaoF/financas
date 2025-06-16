import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { BankAccount } from '../types/finances';

interface BankAccountContextData {
  accounts: BankAccount[];
  loading: boolean;
  fetchAccounts: () => Promise<void>;
  createAccount: (account: Omit<BankAccount, 'id' | 'userId'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<BankAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccount: (id: string) => BankAccount | undefined;
  refreshAccounts: () => Promise<void>;
}

const BankAccountContext = createContext<BankAccountContextData>({} as BankAccountContextData);

// Chave para armazenar o cache no localStorage
const ACCOUNTS_CACHE_KEY = 'bank_accounts_cache';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutos em milissegundos

export function BankAccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [lastFetchTime, setLastFetchTime] = useState(0); // Controle de tempo de recarga
  const [forceRefresh, setForceRefresh] = useState(false); // Flag para forçar atualização

  // Buscar contas quando o usuário mudar
  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  // Ouvir eventos de atualização de transações para atualizar saldos
  useEffect(() => {
    const handleTransactionUpdate = () => {
      console.log("Evento transaction-updated detectado, atualizando contas bancárias");
      // Forçar atualização quando uma transação for adicionada/atualizada
      setForceRefresh(true);
      fetchAccounts();
    };

    document.addEventListener('transaction-updated', handleTransactionUpdate);
    
    return () => {
      document.removeEventListener('transaction-updated', handleTransactionUpdate);
    };
  }, []);

  // Função para salvar os dados das contas no cache local
  const saveAccountsToCache = (accountsData: BankAccount[]) => {
    if (!user) return;
    
    try {
      const cacheData = {
        accounts: accountsData,
        timestamp: Date.now(),
        userId: user.id
      };
      localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erro ao salvar cache de contas bancárias:', error);
    }
  };

  // Função para carregar os dados das contas do cache local
  const loadAccountsFromCache = (): { accounts: BankAccount[], isValid: boolean } => {
    if (!user) return { accounts: [], isValid: false };
    
    try {
      const cachedData = localStorage.getItem(ACCOUNTS_CACHE_KEY);
      if (!cachedData) return { accounts: [], isValid: false };
      
      const parsedData = JSON.parse(cachedData);
      
      // Verificar se o cache é do usuário atual e se ainda é válido
      const isValid = 
        parsedData.userId === user.id && 
        (Date.now() - parsedData.timestamp) < CACHE_EXPIRY_TIME;
      
      return { 
        accounts: isValid ? parsedData.accounts : [],
        isValid
      };
    } catch (error) {
      console.error('Erro ao carregar cache de contas bancárias:', error);
      return { accounts: [], isValid: false };
    }
  };

  const fetchAccounts = async () => {
    if (!user) return;
    
    // Verificar se podemos usar o cache
    const now = Date.now();
    const { accounts: cachedAccounts, isValid } = loadAccountsFromCache();
    
    // Se o cache for válido e não estamos forçando atualização, use-o
    if (isValid && !forceRefresh && now - lastFetchTime < 2000) {
      console.log("Usando cache de contas bancárias");
      setAccounts(cachedAccounts);
      setLoading(false);
      return;
    }
    
    // Evitar múltiplas recargas em um curto período de tempo (mínimo 2 segundos entre recargas)
    if (now - lastFetchTime < 2000 && !forceRefresh) {
      console.log("Ignorando recarga rápida de contas bancárias");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Buscando contas bancárias para o usuário:", user.id);
      
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Contas bancárias encontradas:", data?.length || 0);
      
      // Processar dados para o formato correto
      const processedAccounts: BankAccount[] = data?.map(account => ({
        id: account.id,
        userId: account.user_id,
        bankName: account.name,
        accountType: mapAccountType(account.type),
        accountNumber: account.account,
        agency: account.agency,
        balance: account.balance || 0,
        currency: 'BRL', // Definindo moeda padrão como BRL
        color: account.color || '#6366F1',
        pendingTransactionsCount: account.pending_count || 0,
        scheduledTransactionsCount: account.scheduled_count || 0
      })) || [];
      
      // Salvar no cache
      saveAccountsToCache(processedAccounts);
      
      setAccounts(processedAccounts);
      setLastFetchTime(now);
      setForceRefresh(false); // Resetar a flag de atualização forçada
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      toast.error('Erro ao carregar contas bancárias');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para mapear tipos de conta do banco de dados para os tipos do frontend
  const mapAccountType = (type: string): 'checking' | 'savings' | 'investment' => {
    switch (type) {
      case 'corrente':
        return 'checking';
      case 'poupanca':
        return 'savings';
      case 'investimento':
        return 'investment';
      default:
        return 'checking'; // Tipo padrão
    }
  };

  // Função auxiliar para mapear tipos de conta do frontend para o banco de dados
  const mapAccountTypeToDb = (type: 'checking' | 'savings' | 'investment'): string => {
    switch (type) {
      case 'checking':
        return 'corrente';
      case 'savings':
        return 'poupanca';
      case 'investment':
        return 'investimento';
      default:
        return 'corrente'; // Tipo padrão
    }
  };

  const createAccount = async (account: Omit<BankAccount, 'id' | 'userId'>) => {
    if (!user) return;
    
    try {
      console.log("Criando nova conta bancária:", account);
      
      const { data, error } = await supabase
        .from('banks')
        .insert({
          user_id: user.id,
          name: account.bankName,
          type: mapAccountTypeToDb(account.accountType),
          account: account.accountNumber,
          agency: account.agency,
          balance: account.balance || 0,
          color: account.color
        })
        .select();
        
      if (error) throw error;
      
      console.log("Conta bancária criada com sucesso:", data);
      
      // Adicionar a nova conta à lista
      if (data && data[0]) {
        const newAccount: BankAccount = {
          id: data[0].id,
          userId: data[0].user_id,
          bankName: data[0].name,
          accountType: mapAccountType(data[0].type),
          accountNumber: data[0].account,
          agency: data[0].agency,
          balance: data[0].balance || 0,
          currency: 'BRL',
          color: data[0].color || '#6366F1',
          pendingTransactionsCount: 0,
          scheduledTransactionsCount: 0
        };
        
        // Atualizar o estado e o cache
        const updatedAccounts = [newAccount, ...accounts];
        setAccounts(updatedAccounts);
        saveAccountsToCache(updatedAccounts);
      }
      
      toast.success('Conta bancária adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar conta bancária:', error);
      toast.error('Erro ao adicionar conta bancária');
    }
  };

  const updateAccount = async (id: string, account: Partial<BankAccount>) => {
    try {
      console.log("Atualizando conta bancária:", id, account);
      
      // Converter para o formato do banco de dados
      const dbAccount: any = {};
      
      if (account.bankName !== undefined) dbAccount.name = account.bankName;
      if (account.accountType !== undefined) dbAccount.type = mapAccountTypeToDb(account.accountType);
      if (account.accountNumber !== undefined) dbAccount.account = account.accountNumber;
      if (account.agency !== undefined) dbAccount.agency = account.agency;
      if (account.balance !== undefined) dbAccount.balance = account.balance;
      if (account.color !== undefined) dbAccount.color = account.color;
      
      const { error } = await supabase
        .from('banks')
        .update(dbAccount)
        .eq('id', id);
        
      if (error) throw error;
      
      // Atualizar a conta na lista e no cache
      const updatedAccounts = accounts.map(acc => 
        acc.id === id ? { ...acc, ...account } : acc
      );
      setAccounts(updatedAccounts);
      saveAccountsToCache(updatedAccounts);
      
      toast.success('Conta bancária atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar conta bancária:', error);
      toast.error('Erro ao atualizar conta bancária');
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      console.log("Excluindo conta bancária:", id);
      
      const { error } = await supabase
        .from('banks')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remover a conta da lista e atualizar o cache
      const updatedAccounts = accounts.filter(acc => acc.id !== id);
      setAccounts(updatedAccounts);
      saveAccountsToCache(updatedAccounts);
      
      toast.success('Conta bancária excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir conta bancária:', error);
      toast.error('Erro ao excluir conta bancária');
    }
  };

  const getAccount = (id: string) => {
    return accounts.find(account => account.id === id);
  };

  return (
    <BankAccountContext.Provider value={{
      accounts,
      loading,
      fetchAccounts,
      createAccount,
      updateAccount,
      deleteAccount,
      getAccount,
      refreshAccounts: () => {
        setForceRefresh(true); 
        return fetchAccounts();
      }
    }}>
      {children}
    </BankAccountContext.Provider>
  );
}

export function useBankAccounts() {
  return useContext(BankAccountContext);
} 
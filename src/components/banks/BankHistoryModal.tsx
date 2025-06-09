import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { BankAccount } from '../../types/finances';
import { formatCurrency } from '../../utils/formatCurrency';
import { getBankInitials } from '../../utils/strings';
import { CreditCard, Clock, Calendar, ArrowDownCircle, ArrowUpCircle, X, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Definindo o tipo da transação
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
}

interface BankHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: BankAccount | null;
}

// Interface estendida para adicionar propriedades necessárias ao BankAccount
interface ExtendedBankAccount extends BankAccount {
  color: string;
  agency?: string;
  accountNumber?: string;
  pendingTransactionsCount?: number;
  scheduledTransactionsCount?: number;
}

export default function BankHistoryModal({ isOpen, onClose, bank }: BankHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && bank && activeTab === 'history') {
      fetchTransactions();
    }
  }, [isOpen, bank, activeTab]);

  const fetchTransactions = async () => {
    if (!bank || !user) return;
    
    setIsLoading(true);
    try {
      // Primeiro, verificar se a coluna bank_id existe na tabela transactions
      const { data: columnExists, error: columnError } = await supabase
        .from('transactions')
        .select('bank_id')
        .limit(1);
      
      if (columnError) {
        console.error('Erro ao verificar coluna bank_id:', columnError);
        // Se houver erro, tentamos buscar todas as transações do usuário
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id, description, amount, date, type,
            categories (name)
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        const formattedTransactions = data?.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date,
          type: t.type as 'income' | 'expense',
          category: t.categories?.name || 'Sem categoria'
        })) || [];

        setTransactions(formattedTransactions);
        toast.error('Não foi possível filtrar por conta bancária. Mostrando todas as transações.');
        return;
      }

      // Se a coluna existe, buscar transações relacionadas a esta conta bancária
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, description, amount, date, type,
          categories (name)
        `)
        .eq('user_id', user.id)
        .eq('bank_id', bank.id)
        .order('date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar transações:', error);
        toast.error('Erro ao buscar transações');
        return;
      }

      // Formatar os dados
      const formattedTransactions = data?.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        date: t.date,
        type: t.type as 'income' | 'expense',
        category: t.categories?.name || 'Sem categoria'
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Erro ao processar transações:', error);
      toast.error('Ocorreu um erro ao buscar as transações');
    } finally {
      setIsLoading(false);
    }
  };

  if (!bank) return null;

  // Cast para o tipo estendido
  const extendedBank = bank as ExtendedBankAccount;

  const getAccountTypeLabel = (type: 'checking' | 'savings' | 'investment') => {
    switch (type) {
      case 'checking':
        return 'Conta Corrente';
      case 'savings':
        return 'Conta Poupança';
      case 'investment':
        return 'Conta Investimento';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {extendedBank.bankName}
            </DialogTitle>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('info')}
          >
            Informações da Conta
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Histórico de Transações
          </button>
        </div>

        {/* Conteúdo da Tab */}
        {activeTab === 'info' ? (
          <div className="space-y-6">
            {/* Card da Conta */}
            <div 
              className="p-6 rounded-xl shadow-md"
              style={{
                backgroundColor: extendedBank.color ? extendedBank.color + '20' : '#00000020',
                borderColor: extendedBank.color || '#000000',
                borderWidth: '1px 0 0 4px',
                borderStyle: 'solid'
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="h-14 w-14 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                  style={{ backgroundColor: extendedBank.color || '#000000' }}
                >
                  {getBankInitials(extendedBank.bankName)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {extendedBank.bankName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getAccountTypeLabel(extendedBank.accountType)}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                  Saldo Disponível
                </span>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">
                  {formatCurrency(extendedBank.balance)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Agência</span>
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {extendedBank.agency || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Conta</span>
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {extendedBank.accountNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary-500" />
                  <h4 className="font-medium">Transações Pendentes</h4>
                </div>
                <p className="text-2xl font-bold">{extendedBank.pendingTransactionsCount || 0}</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">Transações Agendadas</h4>
                </div>
                <p className="text-2xl font-bold">{extendedBank.scheduledTransactionsCount || 0}</p>
              </div>
            </div>

            {/* Detalhes Adicionais */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Detalhes da Conta</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tipo de Conta</span>
                  <span className="font-medium">{getAccountTypeLabel(extendedBank.accountType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Data de Abertura</span>
                  <span className="font-medium">01/01/2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Última Atualização</span>
                  <span className="font-medium">
                    {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Últimas Transações</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Saldo Atual: {formatCurrency(extendedBank.balance)}
              </span>
            </div>

            {/* Lista de Transações */}
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                <span className="ml-2 text-gray-500">Carregando transações...</span>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map(transaction => (
                  <div 
                    key={transaction.id}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {transaction.type === 'income' ? (
                        <ArrowDownCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <ArrowUpCircle className="h-8 w-8 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(transaction.date)}
                          </p>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                            {transaction.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold ${
                      transaction.type === 'income' 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada para esta conta.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  As transações aparecerão aqui quando você registrá-las para esta conta.
                </p>
              </div>
            )}

            {/* Botão para ver mais */}
            {transactions.length > 0 && (
              <div className="flex justify-center mt-4">
                <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                  Ver Todas as Transações
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 
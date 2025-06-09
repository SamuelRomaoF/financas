import { ArrowUpRight, DollarSign, History, PieChart, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NewInvestmentModal from '../components/investments/NewInvestmentModal';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useInvestments } from '../hooks/useInvestments';
import { formatCurrency } from '../utils/formatCurrency';

interface InvestmentFormData {
  type: 'renda-fixa' | 'renda-variavel' | 'cripto';
  name: string;
  amount: number;
  expectedReturn?: number;
  details?: string;
}

// Interface para agrupar investimentos por tipo
interface InvestmentSummary {
  totalAmount: number;
  rendaFixa: {
    amount: number;
    percentage: number;
    items: any[];
  };
  rendaVariavel: {
    amount: number;
    percentage: number;
    items: any[];
  };
  cripto: {
    amount: number;
    percentage: number;
    items: any[];
  };
}

export default function Investimentos() {
  const { user } = useAuth();
  const { investments, loading, fetchInvestments, createInvestment } = useInvestments();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<InvestmentSummary>({
    totalAmount: 0,
    rendaFixa: { amount: 0, percentage: 0, items: [] },
    rendaVariavel: { amount: 0, percentage: 0, items: [] },
    cripto: { amount: 0, percentage: 0, items: [] }
  });

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user, fetchInvestments]);

  // Processar os investimentos e calcular resumos quando os dados são carregados
  useEffect(() => {
    if (investments.length > 0) {
      // Agrupar por tipo
      const rendaFixa = investments.filter(inv => inv.type === 'renda-fixa');
      const rendaVariavel = investments.filter(inv => inv.type === 'renda-variavel');
      const cripto = investments.filter(inv => inv.type === 'cripto');

      // Calcular valores totais
      const rendaFixaAmount = rendaFixa.reduce((sum, inv) => sum + inv.amount, 0);
      const rendaVariavelAmount = rendaVariavel.reduce((sum, inv) => sum + inv.amount, 0);
      const criptoAmount = cripto.reduce((sum, inv) => sum + inv.amount, 0);
      const totalAmount = rendaFixaAmount + rendaVariavelAmount + criptoAmount;

      // Calcular percentuais
      const rendaFixaPercentage = totalAmount > 0 ? (rendaFixaAmount / totalAmount) * 100 : 0;
      const rendaVariavelPercentage = totalAmount > 0 ? (rendaVariavelAmount / totalAmount) * 100 : 0;
      const criptoPercentage = totalAmount > 0 ? (criptoAmount / totalAmount) * 100 : 0;

      setSummary({
        totalAmount,
        rendaFixa: {
          amount: rendaFixaAmount,
          percentage: rendaFixaPercentage,
          items: rendaFixa
        },
        rendaVariavel: {
          amount: rendaVariavelAmount,
          percentage: rendaVariavelPercentage,
          items: rendaVariavel
        },
        cripto: {
          amount: criptoAmount,
          percentage: criptoPercentage,
          items: cripto
        }
      });
    }
  }, [investments]);

  const handleNewInvestment = async (data: InvestmentFormData) => {
    if (!user) return;

    try {
      const investmentData = {
        user_id: user.id,
        type: data.type,
        name: data.name,
        amount: data.amount,
        expected_return: data.expectedReturn || null,
        details: data.details || null
      };

      const result = await createInvestment(investmentData);
      
      if (result.error) {
        toast.error('Erro ao adicionar investimento');
      } else {
        toast.success('Investimento adicionado com sucesso');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar investimento:', error);
      toast.error('Erro ao adicionar investimento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Investimentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie seus investimentos e acompanhe seu patrimônio
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Investimento
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Patrimônio Total</span>
            <DollarSign className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.totalAmount)}
            </span>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total investido</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Renda Fixa</span>
            <PieChart className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.rendaFixa.amount)}
            </span>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {summary.rendaFixa.percentage.toFixed(1)}% do total
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Renda Variável</span>
            <TrendingUp className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.rendaVariavel.amount)}
            </span>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {summary.rendaVariavel.percentage.toFixed(1)}% do total
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Criptomoedas</span>
            <History className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.cripto.amount)}
            </span>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {summary.cripto.percentage.toFixed(1)}% do total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias de Investimentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Renda Fixa</h3>
            <ArrowUpRight className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            CDBs, Tesouro Direto, LCIs, LCAs
          </p>
          <div className="space-y-3">
            {summary.rendaFixa.items.length > 0 ? (
              summary.rendaFixa.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                  <span className="font-medium text-success-500">
                    {item.expected_return ? `${item.expected_return}% a.a.` : formatCurrency(item.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">Nenhum investimento em renda fixa</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Renda Variável</h3>
            <ArrowUpRight className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Ações, FIIs, ETFs
          </p>
          <div className="space-y-3">
            {summary.rendaVariavel.items.length > 0 ? (
              summary.rendaVariavel.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                  <div className="flex items-center">
                    {item.current_return > 0 ? (
                      <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-error-500 mr-1" />
                    )}
                    <span className={`font-medium ${item.current_return > 0 ? 'text-success-500' : 'text-error-500'}`}>
                      {item.current_return ? `${item.current_return}%` : formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">Nenhum investimento em renda variável</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Criptomoedas</h3>
            <ArrowUpRight className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Bitcoin, Ethereum e outras criptomoedas
          </p>
          <div className="space-y-3">
            {summary.cripto.items.length > 0 ? (
              summary.cripto.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                  <div className="flex items-center">
                    {item.current_return > 0 ? (
                      <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-error-500 mr-1" />
                    )}
                    <span className={`font-medium ${item.current_return > 0 ? 'text-success-500' : 'text-error-500'}`}>
                      {item.current_return ? `${item.current_return}%` : formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">Nenhum investimento em criptomoedas</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Novo Investimento */}
      <NewInvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewInvestment}
      />
    </div>
  );
} 
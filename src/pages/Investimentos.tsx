import { ArrowUpRight, DollarSign, History, PieChart, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import NewInvestmentModal from '../components/investments/NewInvestmentModal';
import Button from '../components/ui/Button';

interface InvestmentFormData {
  type: 'renda-fixa' | 'renda-variavel' | 'cripto';
  name: string;
  amount: number;
  expectedReturn?: number;
  details?: string;
}

export default function Investimentos() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewInvestment = (data: InvestmentFormData) => {
    // TODO: Implementar lógica para salvar o investimento
    console.log('Novo investimento:', data);
  };

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
            <span className="text-2xl font-bold text-gray-900 dark:text-white">R$ 150.000,00</span>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
              <span className="text-sm text-success-500">+2.5%</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">este mês</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Renda Fixa</span>
            <PieChart className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">R$ 80.000,00</span>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">53.3% do total</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Renda Variável</span>
            <TrendingUp className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">R$ 50.000,00</span>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">33.3% do total</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Criptomoedas</span>
            <History className="h-5 w-5 text-primary-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">R$ 20.000,00</span>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">13.4% do total</span>
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">CDB Banco XYZ</span>
              <span className="font-medium text-success-500">12% a.a.</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Tesouro IPCA+</span>
              <span className="font-medium text-success-500">IPCA + 5.5%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">LCI Banco ABC</span>
              <span className="font-medium text-success-500">11% a.a.</span>
            </div>
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">PETR4</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                <span className="font-medium text-success-500">+5.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">HGLG11</span>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 text-error-500 mr-1" />
                <span className="font-medium text-error-500">-1.8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">BOVA11</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                <span className="font-medium text-success-500">+2.3%</span>
              </div>
            </div>
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Bitcoin</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                <span className="font-medium text-success-500">+12.5%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Ethereum</span>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                <span className="font-medium text-success-500">+8.7%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Cardano</span>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 text-error-500 mr-1" />
                <span className="font-medium text-error-500">-3.2%</span>
              </div>
            </div>
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
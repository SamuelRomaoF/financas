import { Calendar, Clock, DollarSign, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface LoanData {
  id: string;
  name: string;
  bank: string;
  totalAmount: number;
  remainingAmount: number;
  installments: number;
  remainingInstallments: number;
  installmentValue: number;
  nextPaymentDate: string;
  interestRate: number;
  status: 'em_dia' | 'atrasado' | 'quitado';
}

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (loan: Omit<LoanData, 'id' | 'remainingAmount' | 'remainingInstallments'>) => void;
}

function AddLoanModal({ isOpen, onClose, onAdd }: AddLoanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    totalAmount: '',
    installments: '',
    installmentValue: '',
    nextPaymentDate: '',
    interestRate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const loan = {
      name: formData.name,
      bank: formData.bank,
      totalAmount: parseFloat(formData.totalAmount),
      installments: parseInt(formData.installments),
      installmentValue: parseFloat(formData.installmentValue),
      nextPaymentDate: formData.nextPaymentDate,
      interestRate: parseFloat(formData.interestRate),
      status: 'em_dia' as const
    };

    onAdd(loan);
    onClose();
    setFormData({
      name: '',
      bank: '',
      totalAmount: '',
      installments: '',
      installmentValue: '',
      nextPaymentDate: '',
      interestRate: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Adicionar Empréstimo
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Empréstimo
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banco
              </label>
              <input
                type="text"
                required
                value={formData.bank}
                onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Total
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nº de Parcelas
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.installments}
                  onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor da Parcela
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.installmentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, installmentValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taxa de Juros (% a.m.)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data da Próxima Parcela
              </label>
              <input
                type="date"
                required
                value={formData.nextPaymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, nextPaymentDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Adicionar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoanManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loans, setLoans] = useState<LoanData[]>([
    {
      id: '1',
      name: 'Empréstimo Pessoal',
      bank: 'Nubank',
      totalAmount: 10000,
      remainingAmount: 7500,
      installments: 12,
      remainingInstallments: 9,
      installmentValue: 916.67,
      nextPaymentDate: '2024-04-15',
      interestRate: 1.99,
      status: 'em_dia'
    },
    {
      id: '2',
      name: 'Financiamento Carro',
      bank: 'Santander',
      totalAmount: 45000,
      remainingAmount: 38000,
      installments: 48,
      remainingInstallments: 42,
      installmentValue: 1250.00,
      nextPaymentDate: '2024-04-10',
      interestRate: 1.45,
      status: 'em_dia'
    }
  ]);

  const handleAddLoan = (newLoan: Omit<LoanData, 'id' | 'remainingAmount' | 'remainingInstallments'>) => {
    const loan: LoanData = {
      ...newLoan,
      id: (loans.length + 1).toString(),
      remainingAmount: newLoan.totalAmount,
      remainingInstallments: newLoan.installments
    };

    setLoans(prev => [...prev, loan]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Empréstimos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Acompanhe seus empréstimos e financiamentos
          </p>
        </div>
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Adicionar Empréstimo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loans.map(loan => (
          <Card key={loan.id} className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {loan.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {loan.bank}
                  </p>
                </div>
                <span 
                  className={`px-2.5 py-1 rounded-full text-xs font-medium
                    ${loan.status === 'em_dia' 
                      ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                      : loan.status === 'atrasado'
                        ? 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}
                >
                  {loan.status === 'em_dia' ? 'Em dia' : loan.status === 'atrasado' ? 'Atrasado' : 'Quitado'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Valor Pago</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(loan.totalAmount - loan.remainingAmount)} / {formatCurrency(loan.totalAmount)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all bg-primary-500"
                      style={{ 
                        width: `${((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Parcelas</p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {loan.remainingInstallments} / {loan.installments}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Valor Parcela</p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(loan.installmentValue)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Próximo Pagamento</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(loan.nextPaymentDate).toLocaleDateString('pt-BR')}
                        </p>
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {formatCurrency(loan.installmentValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de Juros</p>
                    <p className="font-medium text-gray-900 dark:text-white text-right">
                      {loan.interestRate}% a.m.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddLoanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddLoan}
      />
    </div>
  );
} 
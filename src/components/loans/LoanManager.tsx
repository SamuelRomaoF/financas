import { Calendar, Clock, DollarSign, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
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
                  type="text"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, totalAmount: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nº de Parcelas
                </label>
                <input
                  type="text"
                  required
                  value={formData.installments}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, installments: value }));
                  }}
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
                  type="text"
                  required
                  value={formData.installmentValue}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, installmentValue: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taxa de Juros (% a.m.)
                </label>
                <input
                  type="text"
                  required
                  value={formData.interestRate}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, '');
                    setFormData(prev => ({ ...prev, interestRate: value }));
                  }}
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
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user]);

  const fetchLoans = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Transformar os dados do banco para o formato LoanData
      const formattedLoans: LoanData[] = data.map(loan => {
        // Calcular parcelas restantes
        const startDate = new Date(loan.start_date);
        const nextPaymentDate = new Date(loan.next_payment_date);
        const monthsPassed = (nextPaymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                            (nextPaymentDate.getMonth() - startDate.getMonth());
        
        const remainingInstallments = Math.max(0, loan.installments - monthsPassed);
        const remainingAmount = remainingInstallments * loan.installment_value;
        
        return {
          id: loan.id,
          name: loan.name,
          bank: loan.bank,
          totalAmount: loan.total_amount,
          remainingAmount: remainingAmount,
          installments: loan.installments,
          remainingInstallments: remainingInstallments,
          installmentValue: loan.installment_value,
          nextPaymentDate: loan.next_payment_date,
          interestRate: loan.interest_rate,
          status: loan.status || 'em_dia'
        };
      });
      
      setLoans(formattedLoans);
    } catch (error) {
      console.error('Erro ao buscar empréstimos:', error);
      toast.error('Erro ao carregar empréstimos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLoan = async (newLoan: Omit<LoanData, 'id' | 'remainingAmount' | 'remainingInstallments'>) => {
    if (!user) return;
    
    try {
      // Calcular data de início (estimada com base na data do próximo pagamento e número de parcelas)
      const nextPaymentDate = new Date(newLoan.nextPaymentDate);
      const startDate = new Date(nextPaymentDate);
      startDate.setMonth(startDate.getMonth() - 1); // Assumindo que já pagou pelo menos 1 parcela
      
      // Inserir no banco de dados
      const { data, error } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          name: newLoan.name,
          bank: newLoan.bank,
          total_amount: newLoan.totalAmount,
          installments: newLoan.installments,
          installment_value: newLoan.installmentValue,
          next_payment_date: newLoan.nextPaymentDate,
          interest_rate: newLoan.interestRate,
          status: newLoan.status,
          start_date: startDate.toISOString().split('T')[0]
        })
        .select();
        
      if (error) throw error;
      
      // Recarregar empréstimos
      fetchLoans();
      toast.success('Empréstimo adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar empréstimo:', error);
      toast.error('Erro ao adicionar empréstimo');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Empréstimos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe seus empréstimos e financiamentos</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Empréstimo
        </Button>
      </div>

      {loans.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Você ainda não tem empréstimos cadastrados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loans.map((loan) => (
            <Card key={loan.id}>
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{loan.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{loan.bank}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      loan.status === 'em_dia' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                      loan.status === 'atrasado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {loan.status === 'em_dia' ? 'Em dia' : 
                       loan.status === 'atrasado' ? 'Atrasado' : 'Quitado'}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Valor Total</p>
                      <p className="font-medium">{formatCurrency(loan.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Valor Restante</p>
                      <p className="font-medium">{formatCurrency(loan.remainingAmount)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-primary-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Próximo Pagamento</p>
                        <p className="font-medium">{new Date(loan.nextPaymentDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-primary-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Valor da Parcela</p>
                        <p className="font-medium">{formatCurrency(loan.installmentValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-primary-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Parcelas</p>
                        <p className="font-medium">{loan.remainingInstallments} de {loan.installments}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de Juros</p>
                      <p className="font-medium">{loan.interestRate.toFixed(2)}% a.m.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddLoanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddLoan}
        />
      )}
    </div>
  );
} 
import { Calendar, Clock, DollarSign, Edit, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import ConfirmationModal from '../ui/ConfirmationModal';

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
  loanToEdit?: LoanData | null;
}

function AddLoanModal({ isOpen, onClose, onAdd, loanToEdit }: AddLoanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    totalAmount: '',
    installments: '',
    installmentValue: '',
    nextPaymentDate: '',
    interestRate: '',
    currentInstallment: ''
  });

  // Preencher o formulário se estiver editando
  useEffect(() => {
    if (loanToEdit) {
      setFormData({
        name: loanToEdit.name,
        bank: loanToEdit.bank,
        totalAmount: loanToEdit.totalAmount.toString(),
        installments: loanToEdit.installments.toString(),
        installmentValue: loanToEdit.installmentValue.toString(),
        nextPaymentDate: loanToEdit.nextPaymentDate,
        interestRate: loanToEdit.interestRate.toString(),
        currentInstallment: (loanToEdit.installments - loanToEdit.remainingInstallments).toString()
      });
    }
  }, [loanToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter valores para números, tratando tanto vírgula quanto ponto
    let totalAmount = formData.totalAmount.replace(',', '.');
    totalAmount = totalAmount.replace(/\.(?=.*\.)/g, '');
    
    let installmentValue = formData.installmentValue.replace(',', '.');
    installmentValue = installmentValue.replace(/\.(?=.*\.)/g, '');
    
    let interestRate = formData.interestRate.replace(',', '.');
    interestRate = interestRate.replace(/\.(?=.*\.)/g, '');
    
    // Calcular parcelas restantes com base na parcela atual
    const currentInstallment = parseInt(formData.currentInstallment || '0');
    const totalInstallments = parseInt(formData.installments);
    const remainingInstallments = Math.max(0, totalInstallments - currentInstallment);
    
    const loan = {
      name: formData.name,
      bank: formData.bank,
      totalAmount: parseFloat(totalAmount),
      installments: totalInstallments,
      installmentValue: parseFloat(installmentValue),
      nextPaymentDate: formData.nextPaymentDate,
      interestRate: parseFloat(interestRate),
      status: 'em_dia' as const,
      currentInstallment: currentInstallment
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
      interestRate: '',
      currentInstallment: ''
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
              {loanToEdit ? 'Editar Empréstimo' : 'Adicionar Empréstimo'}
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
                    const value = e.target.value;
                    // Validação para permitir apenas números e um único separador decimal (vírgula ou ponto)
                    const hasComma = value.includes(',');
                    const hasDot = value.includes('.');
                    
                    // Verifica se já existe um separador decimal
                    if ((hasComma && e.target.value.endsWith('.')) || 
                        (hasDot && e.target.value.endsWith(','))) {
                      // Não permite adicionar um tipo diferente de separador
                      return;
                    }
                    
                    // Conta o número de separadores decimais
                    const commaCount = (value.match(/,/g) || []).length;
                    const dotCount = (value.match(/\./g) || []).length;
                    
                    // Se já existe mais de um separador do mesmo tipo, não permite adicionar mais
                    if ((commaCount > 1) || (dotCount > 1)) {
                      return;
                    }
                    
                    // Permite apenas números e um único separador decimal
                    const sanitizedValue = value.replace(/[^\d.,]/g, '');
                    setFormData(prev => ({ ...prev, totalAmount: sanitizedValue }));
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
                    const value = e.target.value;
                    // Validação para permitir apenas números e um único separador decimal (vírgula ou ponto)
                    const hasComma = value.includes(',');
                    const hasDot = value.includes('.');
                    
                    // Verifica se já existe um separador decimal
                    if ((hasComma && e.target.value.endsWith('.')) || 
                        (hasDot && e.target.value.endsWith(','))) {
                      // Não permite adicionar um tipo diferente de separador
                      return;
                    }
                    
                    // Conta o número de separadores decimais
                    const commaCount = (value.match(/,/g) || []).length;
                    const dotCount = (value.match(/\./g) || []).length;
                    
                    // Se já existe mais de um separador do mesmo tipo, não permite adicionar mais
                    if ((commaCount > 1) || (dotCount > 1)) {
                      return;
                    }
                    
                    // Permite apenas números e um único separador decimal
                    const sanitizedValue = value.replace(/[^\d.,]/g, '');
                    setFormData(prev => ({ ...prev, installmentValue: sanitizedValue }));
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
                    const value = e.target.value;
                    // Validação para permitir apenas números e um único separador decimal (vírgula ou ponto)
                    const hasComma = value.includes(',');
                    const hasDot = value.includes('.');
                    
                    // Verifica se já existe um separador decimal
                    if ((hasComma && e.target.value.endsWith('.')) || 
                        (hasDot && e.target.value.endsWith(','))) {
                      // Não permite adicionar um tipo diferente de separador
                      return;
                    }
                    
                    // Conta o número de separadores decimais
                    const commaCount = (value.match(/,/g) || []).length;
                    const dotCount = (value.match(/\./g) || []).length;
                    
                    // Se já existe mais de um separador do mesmo tipo, não permite adicionar mais
                    if ((commaCount > 1) || (dotCount > 1)) {
                      return;
                    }
                    
                    // Permite apenas números e um único separador decimal
                    const sanitizedValue = value.replace(/[^\d.,]/g, '');
                    setFormData(prev => ({ ...prev, interestRate: sanitizedValue }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parcela Atual
                </label>
                <input
                  type="text"
                  required
                  value={formData.currentInstallment}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, currentInstallment: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                />
              </div>
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
                {loanToEdit ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal de confirmação para exclusão
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, loanName }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loanName: string;
}) {
  if (!isOpen) return null;
  
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmar Exclusão"
      message={`Tem certeza que deseja excluir o empréstimo ${loanName}? Esta ação não pode ser desfeita.`}
      confirmButtonText="Excluir"
      confirmButtonIntent="destructive"
    />
  );
}

export default function LoanManager() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loanToEdit, setLoanToEdit] = useState<LoanData | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<LoanData | null>(null);

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
        
        // Se temos current_installment, usamos esse valor
        const currentInstallment = loan.current_installment || monthsPassed;
        const remainingInstallments = Math.max(0, loan.installments - currentInstallment);
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

  const handleAddLoan = async (newLoan: any) => {
    if (!user) return;
    
    try {
      // Se estamos editando, atualizamos o empréstimo existente
      if (loanToEdit) {
        // Calcular data de início (estimada com base na data do próximo pagamento e número de parcelas)
        const nextPaymentDate = new Date(newLoan.nextPaymentDate);
        
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('loans')
          .update({
            name: newLoan.name,
            bank: newLoan.bank,
            total_amount: newLoan.totalAmount,
            installments: newLoan.installments,
            installment_value: newLoan.installmentValue,
            next_payment_date: newLoan.nextPaymentDate,
            interest_rate: newLoan.interestRate,
            status: newLoan.status,
            current_installment: newLoan.currentInstallment
          })
          .eq('id', loanToEdit.id);
          
        if (error) throw error;
        
        toast.success('Empréstimo atualizado com sucesso');
        setLoanToEdit(null);
      } else {
        // Calcular data de início (estimada com base na data do próximo pagamento e número de parcelas)
        const nextPaymentDate = new Date(newLoan.nextPaymentDate);
        const startDate = new Date(nextPaymentDate);
        startDate.setMonth(startDate.getMonth() - newLoan.currentInstallment); 
        
        // Inserir no banco de dados
        const { error } = await supabase
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
            start_date: startDate.toISOString().split('T')[0],
            current_installment: newLoan.currentInstallment
          });
          
        if (error) throw error;
        
        toast.success('Empréstimo adicionado com sucesso');
      }
      
      // Recarregar empréstimos
      fetchLoans();
    } catch (error) {
      console.error('Erro ao salvar empréstimo:', error);
      toast.error('Erro ao salvar empréstimo');
    }
  };

  const handleEditLoan = (loan: LoanData) => {
    setLoanToEdit(loan);
    setIsModalOpen(true);
  };

  const handleDeleteLoan = async () => {
    if (!loanToDelete || !user) return;
    
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanToDelete.id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Empréstimo excluído com sucesso');
      setLoanToDelete(null);
      fetchLoans();
    } catch (error) {
      console.error('Erro ao excluir empréstimo:', error);
      toast.error('Erro ao excluir empréstimo');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLoanToEdit(null);
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
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        loan.status === 'em_dia' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                        loan.status === 'atrasado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {loan.status === 'em_dia' ? 'Em dia' : 
                         loan.status === 'atrasado' ? 'Atrasado' : 'Quitado'}
                      </div>
                      <button 
                        onClick={() => handleEditLoan(loan)}
                        className="text-gray-500 hover:text-primary-500"
                        title="Editar empréstimo"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setLoanToDelete(loan)}
                        className="text-gray-500 hover:text-error-500"
                        title="Excluir empréstimo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                        <p className="font-medium">{loan.installments - loan.remainingInstallments} de {loan.installments}</p>
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
          onClose={handleCloseModal}
          onAdd={handleAddLoan}
          loanToEdit={loanToEdit}
        />
      )}

      {loanToDelete && (
        <DeleteConfirmationModal
          isOpen={!!loanToDelete}
          onClose={() => setLoanToDelete(null)}
          onConfirm={handleDeleteLoan}
          loanName={loanToDelete.name}
        />
      )}
    </div>
  );
} 
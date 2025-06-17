import { addMonths, parseISO } from 'date-fns';
import { Calendar, Check, Clock, DollarSign, Edit, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
    paidInstallments: '0'
  });

  // Preencher o formulário se estiver editando
  useEffect(() => {
    if (loanToEdit) {
      // Calcular parcelas pagas baseado nos dados do empréstimo
      const paidInstallments = loanToEdit.installments - loanToEdit.remainingInstallments;
      
      console.log("Preenchendo formulário para edição, data original:", loanToEdit.nextPaymentDate);
      console.log("Parcelas pagas calculadas para edição:", paidInstallments);
      
      setFormData({
        name: loanToEdit.name,
        bank: loanToEdit.bank,
        totalAmount: loanToEdit.totalAmount.toString(),
        installments: loanToEdit.installments.toString(),
        installmentValue: loanToEdit.installmentValue.toString(),
        nextPaymentDate: loanToEdit.nextPaymentDate,
        interestRate: loanToEdit.interestRate.toString(),
        paidInstallments: paidInstallments.toString()
      });
    } else {
      // Reset do formulário quando não estiver editando
      setFormData({
        name: '',
        bank: '',
        totalAmount: '',
        installments: '',
        installmentValue: '',
        nextPaymentDate: '',
        interestRate: '',
        paidInstallments: '0' // Garantir que inicie com 0
      });
    }
  }, [loanToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter valores para números, tratando tanto vírgula quanto ponto
    let totalAmount = formData.totalAmount.replace(',', '.');
    totalAmount = totalAmount.replace(/\.(?=.*\.)/g, '');
    
    let installmentValue = formData.installmentValue.replace(',', '.');
    installmentValue = installmentValue.replace(/\.(?=.*\.)/g, '');
    
    let interestRate = formData.interestRate.replace(',', '.');
    interestRate = interestRate.replace(/\.(?=.*\.)/g, '');
    
    // Garantir que parcelas pagas seja um número válido
    const paidInstallments = parseInt(formData.paidInstallments || '0');
    const totalInstallments = parseInt(formData.installments);
    
    // Validar que parcelas pagas não seja maior que o total de parcelas
    if (paidInstallments > totalInstallments) {
      toast.error('O número de parcelas pagas não pode ser maior que o total de parcelas');
      return;
    }
    
    const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
    
    // Garantir que a data está no formato correto (YYYY-MM-DD)
    const nextPaymentDate = formData.nextPaymentDate;
    console.log("Data selecionada no formulário:", nextPaymentDate);
    
    const loan = {
      name: formData.name,
      bank: formData.bank,
      totalAmount: parseFloat(totalAmount),
      installments: totalInstallments,
      installmentValue: parseFloat(installmentValue),
      nextPaymentDate: nextPaymentDate,
      interestRate: parseFloat(interestRate),
      status: 'em_dia' as const,
      paidInstallments: paidInstallments,
      remainingInstallments: remainingInstallments
    };

    console.log("Dados do empréstimo a serem enviados:", loan);
    onAdd(loan);
    onClose();
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
                  Parcelas Pagas
                </label>
                <input
                  type="text"
                  required
                  value={formData.paidInstallments}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData(prev => ({ ...prev, paidInstallments: value }));
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

  // Handler para o evento de atualização de transação
  const handleTransactionUpdated = useCallback(() => {
    console.log('Evento de atualização de transação detectado no LoanManager');
    fetchLoans();
  }, []);

  // Função para verificar e processar pagamentos automáticos de empréstimos
  const checkAutomaticLoanPayments = async () => {
    if (!user) return;
    
    try {
      // Buscar todos os empréstimos ativos do usuário
      const { data: activeLoans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'quitado');
        
      if (error) throw error;
      
      if (!activeLoans || activeLoans.length === 0) return;
      
      // Data atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Verificar cada empréstimo
      for (const loan of activeLoans) {
        // Verificar se a data de pagamento chegou ou passou
        const nextPaymentDate = parseISO(loan.next_payment_date);
        nextPaymentDate.setHours(0, 0, 0, 0);
        
        if (nextPaymentDate <= today) {
          console.log(`Empréstimo ${loan.name} com parcela vencida em ${loan.next_payment_date}. Verificando pagamento automático...`);
          
          // Verificar se já existe um pagamento registrado para esta parcela
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          const { data: existingPayments, error: paymentError } = await supabase
            .from('transactions')
            .select('*')
            .eq('loan_id', loan.id)
            .eq('is_loan_payment', true)
            .gte('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);
            
          if (paymentError) {
            console.error(`Erro ao verificar pagamentos existentes para o empréstimo ${loan.name}:`, paymentError);
            continue;
          }
          
          // Se não houver pagamento registrado para este mês, registrar automaticamente
          if (!existingPayments || existingPayments.length === 0) {
            console.log(`Nenhum pagamento registrado para o empréstimo ${loan.name} neste mês. Registrando pagamento automático...`);
            
            // Buscar a conta bancária principal do usuário
            const { data: bankAccounts, error: bankError } = await supabase
              .from('banks')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_primary', true);
              
            if (bankError || !bankAccounts || bankAccounts.length === 0) {
              console.error('Erro ao buscar conta bancária principal:', bankError);
              toast.error(`Não foi possível registrar o pagamento automático do empréstimo ${loan.name}. Conta bancária não encontrada.`);
              continue;
            }
            
            const primaryAccount = bankAccounts[0];
            
            // Registrar o pagamento automático
            const paymentData = {
              user_id: user.id,
              description: `Pagamento automático do empréstimo ${loan.name}`,
              amount: loan.installment_value,
              date: today.toISOString().split('T')[0],
              type: "expense",
              category_id: null, // Categoria padrão para pagamentos
              bank_id: primaryAccount.id,
              loan_id: loan.id,
              is_loan_payment: true,
              status: 'pago'
            };
            
            // Inserir a transação
            const { error: insertError } = await supabase
              .from('transactions')
              .insert(paymentData);
              
            if (insertError) {
              console.error(`Erro ao registrar pagamento automático para o empréstimo ${loan.name}:`, insertError);
              toast.error(`Erro ao registrar pagamento automático do empréstimo ${loan.name}`);
              continue;
            }
            
            // Calcular a próxima data de pagamento
            const newPaymentDate = addMonths(nextPaymentDate, 1);
            
            // Incrementar o número de parcelas pagas
            const paidInstallments = (loan.paid_installments || 0) + 1;
            
            // Verificar se todas as parcelas foram pagas
            let newStatus = loan.status;
            if (paidInstallments >= loan.installments) {
              newStatus = 'quitado';
            }
            
            // Atualizar o empréstimo
            const { error: updateError } = await supabase
              .from('loans')
              .update({
                next_payment_date: newPaymentDate.toISOString().split('T')[0],
                paid_installments: paidInstallments,
                status: newStatus,
                last_payment_date: today.toISOString().split('T')[0]
              })
              .eq('id', loan.id);
              
            if (updateError) {
              console.error(`Erro ao atualizar empréstimo ${loan.name}:`, updateError);
              continue;
            }
            
            toast.success(`Pagamento automático do empréstimo ${loan.name} registrado com sucesso!`);
          } else {
            console.log(`Já existe pagamento registrado para o empréstimo ${loan.name} neste mês.`);
          }
        }
      }
      
      // Recarregar os empréstimos após as atualizações
      fetchLoans();
    } catch (error) {
      console.error('Erro ao verificar pagamentos automáticos de empréstimos:', error);
    }
  };

  // Declaração da função fetchLoans para uso no updateLoansPaidInstallments
  const fetchLoans = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Verificar se há empréstimos que precisam ser atualizados
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar para início do dia
      
      const loansToUpdate = [];
      
      for (const loan of data) {
        // Garantir que estamos trabalhando com um objeto Date válido
        const nextPaymentDate = parseISO(loan.next_payment_date);
        nextPaymentDate.setHours(0, 0, 0, 0); // Normalizar para início do dia
        
        // Verificar se a data de pagamento já passou
        if (nextPaymentDate < today) {
          // Calcular quantos meses passaram desde a data de pagamento
          const monthsDiff = 
            (today.getFullYear() - nextPaymentDate.getFullYear()) * 12 + 
            (today.getMonth() - nextPaymentDate.getMonth());
          
          // Calcular a nova data de pagamento
          const newPaymentDate = addMonths(nextPaymentDate, monthsDiff + 1);
          
          // Verificar se ainda há parcelas a serem pagas
          const startDate = parseISO(loan.start_date);
          const totalMonthsPassed = 
            (newPaymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
            (newPaymentDate.getMonth() - startDate.getMonth());
          
          // Se já pagou todas as parcelas, marcar como quitado
          let newStatus = loan.status;
          if (totalMonthsPassed >= loan.installments) {
            newStatus = 'quitado';
          }
          
          // Adicionar à lista de empréstimos a atualizar
          loansToUpdate.push({
            id: loan.id,
            next_payment_date: newPaymentDate.toISOString().split('T')[0],
            status: newStatus
          });
        }
      }
      
      // Atualizar os empréstimos no banco de dados
      if (loansToUpdate.length > 0) {
        for (const loanUpdate of loansToUpdate) {
          await supabase
            .from('loans')
            .update({
              next_payment_date: loanUpdate.next_payment_date,
              status: loanUpdate.status
            })
            .eq('id', loanUpdate.id);
        }
        
        // Buscar os dados atualizados
        const { data: updatedData, error: updatedError } = await supabase
          .from('loans')
          .select('*')
          .eq('user_id', user.id);
          
        if (updatedError) throw updatedError;
        data.splice(0, data.length, ...updatedData);
      }
      
      // Transformar os dados do banco para o formato LoanData
      const formattedLoans: LoanData[] = data.map(loan => {
        console.log(`Processando empréstimo: ${loan.name}, parcelas totais: ${loan.installments}, parcelas pagas armazenadas: ${loan.paid_installments !== undefined ? loan.paid_installments : 'não disponível'}`);
        
        // Verificar se a data atual é posterior à data do próximo pagamento
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar para início do dia
        
        const nextPaymentDate = parseISO(loan.next_payment_date);
        nextPaymentDate.setHours(0, 0, 0, 0); // Normalizar para início do dia
        
        console.log(`Empréstimo ${loan.name}: Data atual: ${today.toISOString().split('T')[0]}, Data próximo pagamento: ${loan.next_payment_date}`);
        console.log(`Empréstimo ${loan.name}: Comparação: ${today > nextPaymentDate ? 'Data atual é POSTERIOR' : 'Data atual é ANTERIOR ou IGUAL'}`);
        
        // Usar o valor de parcelas pagas armazenado no banco, ou calcular se não existir
        let paidInstallments = 0;
        
        if (loan.paid_installments !== undefined && loan.paid_installments !== null) {
          // Se tiver o campo paid_installments, usar esse valor
          paidInstallments = loan.paid_installments;
          console.log(`Empréstimo ${loan.name}: Usando parcelas pagas do banco: ${paidInstallments}`);
        } else {
          // Se não tiver o campo paid_installments, calcular com base nas datas
          try {
            // Garantir que estamos trabalhando com objetos Date válidos
            const startDate = parseISO(loan.start_date);
            
            // Calcular parcelas pagas com base na data de início e próximo pagamento
            paidInstallments = Math.max(0, 
              (nextPaymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
              (nextPaymentDate.getMonth() - startDate.getMonth())
            );
            console.log(`Empréstimo ${loan.name}: Parcelas pagas calculadas por data: ${paidInstallments}`);
          } catch (error) {
            console.error(`Erro ao calcular parcelas pagas para ${loan.name}:`, error);
            paidInstallments = 0;
          }
        }
        
        // Se a data atual for posterior à data do próximo pagamento, incrementar parcelas pagas
        // e atualizar no banco de dados
        if (today > nextPaymentDate) {
          console.log(`Empréstimo ${loan.name}: Data atual (${today.toISOString().split('T')[0]}) é posterior à data do próximo pagamento (${loan.next_payment_date}). Incrementando parcelas pagas.`);
          paidInstallments += 1;
          
          // Garantir que parcelas pagas não exceda o total de parcelas
          paidInstallments = Math.min(paidInstallments, loan.installments);
          
          // Atualizar no banco de dados
          supabase
            .from('loans')
            .update({
              paid_installments: paidInstallments
            })
            .eq('id', loan.id)
            .then(({ error }) => {
              if (error) {
                console.error(`Erro ao atualizar parcelas pagas para ${loan.name}:`, error);
              } else {
                console.log(`Empréstimo ${loan.name}: Parcelas pagas atualizadas para ${paidInstallments}`);
                
                // Atualizar também a data do próximo pagamento
                const newNextPaymentDate = new Date(nextPaymentDate);
                newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + 1);
                
                supabase
                  .from('loans')
                  .update({
                    next_payment_date: newNextPaymentDate.toISOString().split('T')[0]
                  })
                  .eq('id', loan.id)
                  .then(({ error: updateError }) => {
                    if (updateError) {
                      console.error(`Erro ao atualizar data do próximo pagamento para ${loan.name}:`, updateError);
                    } else {
                      console.log(`Empréstimo ${loan.name}: Data do próximo pagamento atualizada para ${newNextPaymentDate.toISOString().split('T')[0]}`);
                    }
                  });
              }
            });
        }
        
        const remainingInstallments = Math.max(0, loan.installments - paidInstallments);
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
  }, [user]);

  // Função para atualizar manualmente os empréstimos com o campo paid_installments
  const updateLoansPaidInstallments = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Buscar todos os empréstimos
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Para cada empréstimo, calcular parcelas pagas e atualizar
      for (const loan of data) {
        // Calcular parcelas pagas com base na data de início e próximo pagamento
        const startDate = parseISO(loan.start_date);
        const nextPaymentDate = parseISO(loan.next_payment_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar para início do dia
        
        // Calcular meses passados entre a data de início e a próxima data de pagamento
        let monthsPassed = Math.max(0, 
          (nextPaymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
          (nextPaymentDate.getMonth() - startDate.getMonth())
        );
        
        // Se a data atual for posterior à data do próximo pagamento, incrementar parcelas pagas
        if (today > nextPaymentDate) {
          console.log(`Empréstimo ${loan.id}: Data atual (${today.toISOString().split('T')[0]}) é posterior à data do próximo pagamento (${loan.next_payment_date}). Incrementando parcelas pagas.`);
          monthsPassed += 1;
        }
        
        // Garantir que parcelas pagas não exceda o total de parcelas
        const paidInstallments = Math.min(monthsPassed, loan.installments);
        
        // Atualizar o empréstimo com o valor calculado
        const { error: updateError } = await supabase
          .from('loans')
          .update({
            paid_installments: loan.paid_installments !== undefined ? 
              Math.max(loan.paid_installments, paidInstallments) : // Usar o maior valor entre o existente e o calculado
              paidInstallments
          })
          .eq('id', loan.id);
          
        if (updateError) {
          console.error(`Erro ao atualizar empréstimo ${loan.id}:`, updateError);
        } else {
          console.log(`Empréstimo ${loan.id}: Parcelas pagas atualizadas para ${paidInstallments}`);
        }
      }
      
      // Recarregar empréstimos
      fetchLoans();
      toast.success('Empréstimos atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar empréstimos:', error);
      toast.error('Erro ao atualizar empréstimos');
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchLoans]);

  useEffect(() => {
    if (user) {
      fetchLoans();
      
      // Adiciona um listener para o evento de atualização de transação
      document.addEventListener('transaction-updated', handleTransactionUpdated);
      
      // Verificar pagamentos automáticos ao carregar o componente
      checkAutomaticLoanPayments();
      
      // Verificar se é necessário atualizar as parcelas pagas
      const checkAndUpdatePaidInstallments = async () => {
        try {
          // Primeiro, verificamos se a coluna existe tentando buscar apenas o ID
          const { data: loansData, error: loansError } = await supabase
            .from('loans')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
            
          if (loansError) {
            console.error('Erro ao verificar empréstimos:', loansError);
            return;
          }
          
          // Se não encontrou empréstimos, não há nada para atualizar
          if (!loansData || loansData.length === 0) {
            console.log('Nenhum empréstimo encontrado para atualizar');
            return;
          }
          
          // Agora tentamos buscar com a coluna paid_installments
          try {
            const { data, error } = await supabase
              .from('loans')
              .select('id, paid_installments')
              .eq('user_id', user.id)
              .limit(1);
              
            // Se não houver erro, a coluna existe
            if (!error) {
              // Verificar se é necessário atualizar as parcelas pagas
              if (data.some(loan => loan.paid_installments === undefined || loan.paid_installments === null)) {
                console.log('Atualizando parcelas pagas dos empréstimos...');
                await updateLoansPaidInstallments();
              }
            } else {
              // Se houver erro, provavelmente a coluna não existe
              console.log('A coluna paid_installments não existe. Usando cálculo baseado em datas.');
              // Continuamos normalmente, o código já lida com isso
            }
          } catch (error) {
            console.log('Erro ao verificar coluna paid_installments:', error);
            // Continuamos normalmente, o código já lida com isso
          }
        } catch (error) {
          console.error('Erro ao verificar empréstimos:', error);
        }
      };
      
      checkAndUpdatePaidInstallments();
      
      return () => {
        document.removeEventListener('transaction-updated', handleTransactionUpdated);
      };
    }
  }, [user, fetchLoans, handleTransactionUpdated, updateLoansPaidInstallments]);

  const handleAddLoan = async (newLoan: any) => {
    if (!user) return;
    
    try {
      console.log("Dados do empréstimo a serem salvos:", newLoan);
      
      // Verificar se a data de pagamento está no passado
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar para início do dia
      
      const nextPaymentDate = parseISO(newLoan.nextPaymentDate);
      nextPaymentDate.setHours(0, 0, 0, 0); // Normalizar para início do dia
      
      let paidInstallments = parseInt(newLoan.paidInstallments || '0');
      let adjustedNextPaymentDate = new Date(nextPaymentDate);
      
      // Se a data selecionada estiver no passado, calcular quantas parcelas já foram pagas
      // e ajustar a data para a próxima parcela futura (exatamente um mês após o atual)
      if (nextPaymentDate < today) {
        console.log("Data de pagamento selecionada está no passado:", newLoan.nextPaymentDate);
        
        // Calcular quantos meses passaram desde a data selecionada
        const monthsDiff = 
          (today.getFullYear() - nextPaymentDate.getFullYear()) * 12 + 
          (today.getMonth() - nextPaymentDate.getMonth());
          
        // Incrementar parcelas pagas
        paidInstallments += Math.max(1, monthsDiff);
        console.log("Parcelas pagas ajustadas para:", paidInstallments);
        
        // Garantir que não exceda o total de parcelas
        paidInstallments = Math.min(paidInstallments, parseInt(newLoan.installments));
        
        // Ajustar a data para a próxima parcela futura (exatamente um mês após o atual)
        adjustedNextPaymentDate = new Date(today);
        adjustedNextPaymentDate.setDate(nextPaymentDate.getDate()); // Manter o mesmo dia do mês
        adjustedNextPaymentDate.setMonth(today.getMonth() + 1); // Avançar para o próximo mês
        console.log("Data de pagamento ajustada para:", adjustedNextPaymentDate.toISOString().split('T')[0]);
      }
      
      // Se estamos editando, atualizamos o empréstimo existente
      if (loanToEdit) {
        console.log("Editando empréstimo existente, data selecionada:", newLoan.nextPaymentDate);
        console.log("Parcelas pagas ajustadas:", paidInstallments);
        
        try {
          // Primeiro tentamos atualizar com o campo paid_installments
          const { error } = await supabase
            .from('loans')
            .update({
              name: newLoan.name,
              bank: newLoan.bank,
              total_amount: newLoan.totalAmount,
              installments: newLoan.installments,
              installment_value: newLoan.installmentValue,
              next_payment_date: nextPaymentDate < today ? adjustedNextPaymentDate.toISOString().split('T')[0] : newLoan.nextPaymentDate,
              interest_rate: newLoan.interestRate,
              status: newLoan.status || 'em_dia',
              paid_installments: paidInstallments
            })
            .eq('id', loanToEdit.id);
            
          if (error && error.code === '42703') {
            // Se o erro for que a coluna não existe, tentamos sem o campo paid_installments
            console.log('Coluna paid_installments não existe, atualizando sem ela');
            const { error: error2 } = await supabase
              .from('loans')
              .update({
                name: newLoan.name,
                bank: newLoan.bank,
                total_amount: newLoan.totalAmount,
                installments: newLoan.installments,
                installment_value: newLoan.installmentValue,
                next_payment_date: nextPaymentDate < today ? adjustedNextPaymentDate.toISOString().split('T')[0] : newLoan.nextPaymentDate,
                interest_rate: newLoan.interestRate,
                status: newLoan.status || 'em_dia'
              })
              .eq('id', loanToEdit.id);
              
            if (error2) {
              console.error('Erro detalhado ao atualizar empréstimo (sem paid_installments):', error2);
              toast.error(`Erro ao atualizar empréstimo: ${error2.message}`);
              throw error2;
            }
          } else if (error) {
            console.error('Erro detalhado ao atualizar empréstimo:', error);
            toast.error(`Erro ao atualizar empréstimo: ${error.message}`);
            throw error;
          }
          
          toast.success('Empréstimo atualizado com sucesso');
          setLoanToEdit(null);
        } catch (error) {
          console.error('Erro ao atualizar empréstimo:', error);
          toast.error('Erro ao atualizar empréstimo');
        }
      } else {
        // Calcular data de início (estimada com base na data do próximo pagamento e número de parcelas pagas)
        const effectiveNextPaymentDate = nextPaymentDate < today ? adjustedNextPaymentDate : nextPaymentDate;
        const startDate = new Date(effectiveNextPaymentDate);
        startDate.setMonth(startDate.getMonth() - paidInstallments); 
        
        console.log("Data de início calculada:", startDate.toISOString().split('T')[0]);
        console.log("Parcelas pagas ajustadas:", paidInstallments);
        
        // Preparar dados para inserção, garantindo formatos corretos
        const loanData = {
          user_id: user.id,
          name: newLoan.name,
          bank: newLoan.bank,
          total_amount: parseFloat(newLoan.totalAmount.toString()),
          installments: parseInt(newLoan.installments.toString()),
          installment_value: parseFloat(newLoan.installmentValue.toString()),
          next_payment_date: nextPaymentDate < today ? adjustedNextPaymentDate.toISOString().split('T')[0] : newLoan.nextPaymentDate,
          interest_rate: parseFloat(newLoan.interestRate.toString()),
          status: newLoan.status || 'em_dia',
          start_date: startDate.toISOString().split('T')[0]
        };
        
        // Adicionar paid_installments se fornecido ou calculado
        if (paidInstallments > 0) {
          try {
            // Tentamos inserir com o campo paid_installments
            const loanDataWithPaid = {
              ...loanData,
              paid_installments: paidInstallments
            };
            
            console.log("Dados formatados para inserção com paid_installments:", loanDataWithPaid);
            
            const { data, error } = await supabase
              .from('loans')
              .insert(loanDataWithPaid)
              .select();
              
            if (error && error.code === '42703') {
              // Se o erro for que a coluna não existe, tentamos sem o campo paid_installments
              console.log('Coluna paid_installments não existe, inserindo sem ela');
              const { data: data2, error: error2 } = await supabase
                .from('loans')
                .insert(loanData)
                .select();
                
              if (error2) {
                console.error('Erro detalhado ao adicionar empréstimo (sem paid_installments):', error2);
                toast.error(`Erro ao adicionar empréstimo: ${error2.message}`);
                throw error2;
              }
              
              console.log("Empréstimo criado com sucesso (sem paid_installments):", data2);
            } else if (error) {
              console.error('Erro detalhado ao adicionar empréstimo:', error);
              toast.error(`Erro ao adicionar empréstimo: ${error.message}`);
              throw error;
            } else {
              console.log("Empréstimo criado com sucesso:", data);
            }
          } catch (error) {
            console.error('Erro ao adicionar empréstimo:', error);
            toast.error('Erro ao adicionar empréstimo');
            return;
          }
        } else {
          // Se não tiver paid_installments, inserir sem ele
          try {
            console.log("Dados formatados para inserção sem paid_installments:", loanData);
            
            const { data, error } = await supabase
              .from('loans')
              .insert(loanData)
              .select();
              
            if (error) {
              console.error('Erro detalhado ao adicionar empréstimo:', error);
              toast.error(`Erro ao adicionar empréstimo: ${error.message}`);
              throw error;
            }
            
            console.log("Empréstimo criado com sucesso:", data);
          } catch (error) {
            console.error('Erro ao adicionar empréstimo:', error);
            toast.error('Erro ao adicionar empréstimo');
            return;
          }
        }
        
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
        <div className="flex gap-2">
          <Button 
            onClick={updateLoansPaidInstallments}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Atualizar Parcelas
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Empréstimo
          </Button>
        </div>
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
                        <p className="font-medium">
                          {(() => {
                            try {
                              // Garantir formato correto da data (DD/MM/YYYY)
                              const dateParts = loan.nextPaymentDate.split('-');
                              if (dateParts.length === 3) {
                                // Se estiver no formato ISO (YYYY-MM-DD)
                                return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                              } else {
                                // Tentar o formato de data padrão
                                return new Date(loan.nextPaymentDate).toLocaleDateString();
                              }
                            } catch (error) {
                              console.error('Erro ao formatar data:', error);
                              return loan.nextPaymentDate;
                            }
                          })()}
                        </p>
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
                        <p className="font-medium">
                          {loan.installments - loan.remainingInstallments} de {loan.installments}
                          {loan.status === 'quitado' && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                              <Check className="h-4 w-4 inline" />
                            </span>
                          )}
                        </p>
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
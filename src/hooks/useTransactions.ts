import { addMonths } from 'date-fns';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type InsertTransaction = Database['public']['Tables']['transactions']['Insert'];
type UpdateTransaction = Database['public']['Tables']['transactions']['Update'];

// Adicionar uma interface estendida para as transações com campos adicionais
interface ExtendedTransaction extends Transaction {
  parent_transaction_id?: string;
  installment_number?: number;
  installments_total?: number;
  original_amount?: number;
  credit_card_id?: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    bankId?: string;
    categoryId?: string;
    status?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select(`
          *,
          banks (
            id,
            name,
            color
          ),
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .order('date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.bankId) {
        query = query.eq('bank_id', filters.bankId);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = useCallback(async (transaction: InsertTransaction & {
    credit_card_id?: string;
    installments_total?: number;
    installment_number?: number;
    original_amount?: number;
    parent_transaction_id?: string;
  }) => {
    if (!user) {
      return { error: new Error("Usuário não autenticado") };
    }
    
    try {
      // Verificar se é uma transação com cartão de crédito
      const isCardTransaction = !!transaction.credit_card_id;
      
      console.log(`Criando transação${isCardTransaction ? ' com cartão de crédito' : ''}`, transaction);
      
      // Cria uma cópia segura da transação
      const transactionData = { ...transaction };
      
      // Garante que bank_id seja undefined se não for fornecido (para usar o default do banco)
      if (!transactionData.bank_id || transactionData.bank_id === "") {
        delete transactionData.bank_id;
      } else {
        // Verificar se o banco existe antes de tentar inserir
        const { data: bankExists } = await supabase
          .from('banks')
          .select('id')
          .eq('id', transactionData.bank_id)
          .single();
          
        if (!bankExists) {
          console.log("Banco não encontrado, removendo bank_id:", transactionData.bank_id);
          delete transactionData.bank_id;
        }
      }
      
      // Verificar credit_card_id, se fornecido
      if (transactionData.credit_card_id) {
        // Verificar se o cartão existe
        const { data: cardExists } = await supabase
          .from('credit_cards')
          .select('id')
          .eq('id', transactionData.credit_card_id)
          .single();
          
        if (!cardExists) {
          console.log("Cartão não encontrado, removendo credit_card_id:", transactionData.credit_card_id);
          delete transactionData.credit_card_id;
        } else {
          console.log("Cartão encontrado, mantendo credit_card_id:", transactionData.credit_card_id);
        }
      }
      
      // Verifica se é uma transação parcelada
      const isInstallment = transactionData.installments_total && transactionData.installments_total > 1;
      
      // Se não for uma transação parcelada, processa normalmente
      if (!isInstallment) {
        console.log("Processando transação normal (não parcelada)");
        
        console.log("Dados processados para envio:", transactionData);
        
        const { data, error } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select(`
            *,
            banks (
              id,
              name,
              color
            ),
            categories (
              id,
              name,
              color,
              icon
            )
          `)
          .single();

        if (error) {
          console.error("Erro detalhado ao criar transação:", error);
          throw error;
        }

        // Se a transação envolver cartão de crédito, disparar o evento para atualizar a interface
        if (transactionData.credit_card_id) {
          console.log("Disparando evento transaction-updated após criar transação com cartão");
          document.dispatchEvent(new Event('transaction-updated'));
        }

        // Atualiza o saldo do banco, se a transação tiver um banco vinculado
        if (data && data.bank_id) {
          try {
            console.log("Atualizando saldo do banco diretamente:", data.bank_id, "com valor:", data.amount, "tipo:", data.type);
            
            // Chamar a função RPC do Supabase update_bank_balance
            const { error: rpcError } = await supabase.rpc('update_bank_balance', {
              bank_id: data.bank_id,
              amount: data.amount,
              transaction_type: data.type
            });
            
            if (rpcError) {
              console.error("Erro ao chamar função update_bank_balance:", rpcError);
              
              // Plano B: Atualizar diretamente se a RPC falhar
              console.log("Tentando atualizar manualmente...");
              
              // Obter o saldo atual da conta
              const { data: bankData, error: fetchError } = await supabase
                .from('banks')
                .select('balance, name')
                .eq('id', data.bank_id)
                .single();
                
              if (fetchError) {
                console.error("Erro ao buscar dados do banco:", fetchError);
                return;
              }
              
              if (!bankData) {
                console.error("Banco não encontrado:", data.bank_id);
                return;
              }
              
              console.log(`Banco encontrado: ${bankData.name}, Saldo atual: ${bankData.balance}`);
              
              // Calcular o novo saldo
              const currentBalance = bankData.balance || 0;
              let newBalance = currentBalance;
              
              if (data.type === 'income') {
                // Se for receita, aumenta o saldo
                newBalance = currentBalance + data.amount;
                console.log(`Aumentando saldo de ${currentBalance} para ${newBalance}`);
              } else if (data.type === 'expense') {
                // Se for despesa, diminui o saldo
                newBalance = currentBalance - data.amount;
                console.log(`Diminuindo saldo de ${currentBalance} para ${newBalance}`);
              }
              
              // Atualizar o saldo diretamente
              const { error: updateError } = await supabase
                .from('banks')
                .update({ balance: newBalance })
                .eq('id', data.bank_id);
                
              if (updateError) {
                console.error("Erro ao atualizar saldo do banco:", updateError);
              } else {
                console.log(`Saldo atualizado com sucesso para ${newBalance}`);
              }
            } else {
              console.log("Saldo bancário atualizado com sucesso via RPC");
            }
          } catch (bankUpdateError) {
            console.error("Exceção ao atualizar saldo do banco:", bankUpdateError);
            // Não lançamos o erro para não interromper o fluxo
          }
        } else {
          console.log("Transação sem banco vinculado, não atualizando saldo bancário:", data);
        }

        setTransactions(prev => [data, ...prev]);
        console.log("Transação criada com sucesso, disparando evento transaction-updated");
        document.dispatchEvent(new Event('transaction-updated'));
        return { data, error: null };
      } 
      // Caso seja uma transação parcelada
      else {
        console.log("Processando transação parcelada com", transactionData.installments_total, "parcelas");
        
        // Verificar se já temos o valor original e o valor da parcela
        const totalInstallments = transactionData.installments_total || 1;
        let originalAmount;
        let installmentAmount;
        
        if (transactionData.original_amount) {
          // Se já temos o valor original, usamos ele diretamente
          originalAmount = transactionData.original_amount;
          installmentAmount = parseFloat((transactionData.amount).toFixed(2));
          console.log("Usando valor original fornecido:", originalAmount);
        } else {
          // Calcular o valor de cada parcela (dividindo o valor total)
          installmentAmount = parseFloat((transactionData.amount).toFixed(2));
          // O valor original é o valor total de todas as parcelas
          originalAmount = installmentAmount * totalInstallments;
        }
        
        const originalDate = new Date(transactionData.date);
        
        console.log("Valor total do parcelamento:", originalAmount);
        console.log("Valor de cada parcela:", installmentAmount);
        console.log("Número total de parcelas:", totalInstallments);
        
        // Criar a primeira parcela
        const firstInstallmentData = {
          ...transactionData,
          amount: installmentAmount,
          installment_number: 1,
          original_amount: originalAmount
        };
        
        // Certificar-se de que a descrição da primeira parcela está correta
        if (firstInstallmentData.description && !firstInstallmentData.description.includes('(Parcela 1/')) {
          firstInstallmentData.description = `${firstInstallmentData.description.replace(/\s\(Parcela.*\)$/, '')} (Parcela 1/${totalInstallments})`;
        } else if (!firstInstallmentData.description) {
          firstInstallmentData.description = `Compra parcelada (Parcela 1/${totalInstallments})`;
        }
        
        console.log("Dados da primeira parcela:", firstInstallmentData);
        
        // Inserir a primeira parcela
        const { data: firstInstallment, error: firstInstallmentError } = await supabase
          .from('transactions')
          .insert(firstInstallmentData)
          .select(`
            *,
            banks (
              id,
              name,
              color
            ),
            categories (
              id,
              name,
              color,
              icon
            )
          `)
          .single();
          
        if (firstInstallmentError) {
          console.error("Erro ao criar a primeira parcela:", firstInstallmentError);
          throw firstInstallmentError;
        }
        
        // Se a primeira parcela foi criada com sucesso, criar as parcelas restantes
        if (firstInstallment) {
          // Atualize o saldo do cartão, se estiver usando cartão de crédito
          if (transactionData.credit_card_id) {
            try {
              console.log("Atualizando limite usado do cartão diretamente:", transactionData.credit_card_id);
              // Usamos o valor da parcela, não o valor total
              console.log("Valor a ser descontado do limite:", installmentAmount);
              
              // Buscar dados atuais do cartão
              const { data: cardData, error: fetchCardError } = await supabase
                .from('credit_cards')
                .select('name, current_spending, "limit"')
                .eq('id', transactionData.credit_card_id)
                .single();
                
              if (fetchCardError) {
                console.error("Erro ao buscar dados do cartão:", fetchCardError);
                return;
              }
              
              if (!cardData) {
                console.error("Cartão não encontrado:", transactionData.credit_card_id);
                return;
              }
              
              console.log(`Cartão encontrado: ${cardData.name}, Gasto atual: ${cardData.current_spending}, Limite: ${cardData.limit}`);
              
              // Calcular o novo valor de utilização - apenas somamos o valor da parcela, não o valor total
              const currentSpending = cardData.current_spending || 0;
              const newSpending = currentSpending + installmentAmount;
              
              console.log(`Atualizando gasto de ${currentSpending} para ${newSpending}`);
              
              // Verificar se ultrapassa o limite (apenas aviso)
              if (newSpending > cardData.limit) {
                console.warn(`AVISO: Limite do cartão ${cardData.name} excedido. Limite: ${cardData.limit}, Novo gasto: ${newSpending}`);
              }
              
              // Atualizar diretamente na tabela
              const { error: updateCardError } = await supabase
                .from('credit_cards')
                .update({ current_spending: newSpending })
                .eq('id', transactionData.credit_card_id);
                
              if (updateCardError) {
                console.error("Erro ao atualizar limite usado do cartão:", updateCardError);
              } else {
                console.log(`Limite do cartão atualizado com sucesso: ${currentSpending} -> ${newSpending}`);
                
                // Disparar evento de atualização para notificar outros componentes
                console.log("Disparando evento transaction-updated após atualização do cartão");
                document.dispatchEvent(new Event('transaction-updated'));
              }
            } catch (cardUpdateError) {
              console.error("Exceção ao atualizar uso do cartão:", cardUpdateError);
            }
          }
          
          // Criar as parcelas restantes
          const remainingInstallments = [];
          
          for (let i = 2; i <= totalInstallments; i++) {
            // Calcular a data da próxima parcela (1 mês a mais para cada parcela)
            const installmentDate = addMonths(originalDate, i - 1);
            
            // Criar objeto para a parcela atual
            const installmentData = {
              ...transactionData,
              description: `${transactionData.description?.replace(/\s\(\d+\/\d+\)$/, '') || 'Compra parcelada'} (${i}/${totalInstallments})`,
              date: installmentDate.toISOString().split('T')[0],
              amount: installmentAmount,
              installment_number: i,
              original_amount: originalAmount,
              parent_transaction_id: firstInstallment.id
            };
            
            delete installmentData.id; // Remove ID se existir, para criar novo registro
            
            remainingInstallments.push(installmentData);
          }
          
          // Inserir todas as parcelas restantes de uma vez
          if (remainingInstallments.length > 0) {
            try {
              const { data: createdInstallments, error: installmentsError } = await supabase
                .from('transactions')
                .insert(remainingInstallments)
                .select();
                
              if (installmentsError) {
                console.error("Erro ao criar parcelas restantes:", installmentsError);
                // Não impede o retorno bem-sucedido da primeira parcela
              } else {
                console.log(`${createdInstallments.length} parcelas adicionais criadas com sucesso`);
              }
            } catch (error) {
              console.error("Exceção ao criar parcelas restantes:", error);
            }
          }
          
          // Atualizar o estado com a primeira parcela
          setTransactions(prev => [firstInstallment, ...prev]);
          console.log("Transação criada com sucesso, disparando evento transaction-updated");
          document.dispatchEvent(new Event('transaction-updated'));
          return { data: firstInstallment, error: null };
        }
        
        return { data: null, error: new Error("Falha ao criar transação parcelada") };
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return { error };
    }
  }, [user]);

  const updateTransaction = useCallback(async (id: string, transaction: UpdateTransaction) => {
    try {
      console.log("Atualizando transação:", id, transaction);
      
      // Cria uma cópia segura da transação
      const transactionData = { ...transaction };
      
      // Garante que bank_id seja undefined se não for fornecido (para usar o default do banco)
      if (!transactionData.bank_id || transactionData.bank_id === "") {
        delete transactionData.bank_id;
      } else {
        // Verificar se o banco existe antes de tentar atualizar
        const { data: bankExists } = await supabase
          .from('banks')
          .select('id')
          .eq('id', transactionData.bank_id)
          .single();
          
        if (!bankExists) {
          console.log("Banco não encontrado, removendo bank_id:", transactionData.bank_id);
          delete transactionData.bank_id;
        }
      }
      
      console.log("Dados processados para atualização:", transactionData);
      
      // Verificar se a transação é parte de um grupo de parcelas
      const { data: currentTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
        
      // Se tiver parent_transaction_id ou tiver outras parcelas vinculadas a ela
      if (currentTransaction?.parent_transaction_id || (currentTransaction?.installments_total && currentTransaction?.installments_total > 1)) {
        const isParent = !currentTransaction.parent_transaction_id;
        const parentId = isParent ? id : currentTransaction.parent_transaction_id;
        
        // Perguntar se deseja atualizar todas as parcelas ou apenas esta
        const updateAllInstallments = window.confirm(
          "Esta transação faz parte de uma compra parcelada. Deseja atualizar todas as parcelas?"
        );
        
        if (updateAllInstallments) {
          // Atualizar todas as parcelas relacionadas
          if (isParent) {
            // Se for a transação pai, atualiza ela e todas as filhas
            const { error: updateError } = await supabase
              .from('transactions')
              .update(transactionData)
              .eq('id', id);
              
            if (updateError) throw updateError;
            
            // Atualizar todas as parcelas filhas
            const { error: childrenUpdateError } = await supabase
              .from('transactions')
              .update(transactionData)
              .eq('parent_transaction_id', id);
              
            if (childrenUpdateError) throw childrenUpdateError;
          } else {
            // Se for uma transação filha, atualiza o pai e todos os irmãos
            const { error: parentUpdateError } = await supabase
              .from('transactions')
              .update(transactionData)
              .eq('id', parentId);
              
            if (parentUpdateError) throw parentUpdateError;
            
            // Atualizar todas as parcelas irmãs (incluindo esta)
            const { error: siblingsUpdateError } = await supabase
              .from('transactions')
              .update(transactionData)
              .eq('parent_transaction_id', parentId);
              
            if (siblingsUpdateError) throw siblingsUpdateError;
          }
          
          // Buscar todas as transações atualizadas
          const { data: updatedTransactions, error: fetchError } = await supabase
            .from('transactions')
            .select(`
              *,
              banks (
                id,
                name,
                color
              ),
              categories (
                id,
                name,
                color,
                icon
              )
            `)
            .or(`id.eq.${parentId},parent_transaction_id.eq.${parentId}`);
            
          if (fetchError) throw fetchError;
          
          // Atualizar o estado com todas as transações modificadas
          if (updatedTransactions) {
            setTransactions(prev => {
              const filtered = prev.filter(t => 
                t.id !== parentId && (!(t as ExtendedTransaction).parent_transaction_id || (t as ExtendedTransaction).parent_transaction_id !== parentId)
              );
              return [...updatedTransactions, ...filtered];
            });
          }
          
          return { data: updatedTransactions?.[0] || null, error: null };
        }
      }
      
      // Atualizando apenas a transação atual (caminho padrão)
      const { data, error } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', id)
        .select(`
          *,
          banks (
            id,
            name,
            color
          ),
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .single();

      if (error) {
        console.error("Erro detalhado ao atualizar transação:", error);
        throw error;
      }
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return { data: null, error };
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      // Verificar se a transação é parte de um grupo de parcelas
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (!transaction) {
        throw new Error("Transação não encontrada");
      }
      
      // Antes de excluir, precisamos reverter o impacto no saldo bancário se for uma transação com bank_id
      if (transaction.bank_id) {
        try {
          console.log("Revertendo efeito no saldo bancário da transação:", transaction.id);
          
          // Para reverter, invertemos o tipo da transação:
          // - Se era uma despesa, tratamos como receita para adicionar o valor de volta
          // - Se era uma receita, tratamos como despesa para subtrair o valor
          const reversalType = transaction.type === 'income' ? 'expense' : 'income';
          
          // Chamar a função RPC do Supabase update_bank_balance para atualizar o saldo
          // mas com o tipo invertido para conseguir o efeito de reversão
          const { error: rpcError } = await supabase.rpc('update_bank_balance', {
            bank_id: transaction.bank_id,
            amount: transaction.amount,
            transaction_type: reversalType
          });
          
          if (rpcError) {
            console.error("Erro ao reverter saldo bancário via RPC:", rpcError);
            
            // Plano B: Atualizar diretamente se a RPC falhar
            console.log("Tentando reverter saldo manualmente...");
            
            // Obter o saldo atual da conta
            const { data: bankData, error: fetchError } = await supabase
              .from('banks')
              .select('balance, name')
              .eq('id', transaction.bank_id)
              .single();
              
            if (fetchError) {
              console.error("Erro ao buscar dados do banco para reversão:", fetchError);
              // Continuamos mesmo com erro para pelo menos tentar excluir a transação
            } else if (bankData) {
              console.log(`Banco encontrado: ${bankData.name}, Saldo atual: ${bankData.balance}`);
              
              // Calcular o novo saldo após a reversão
              const currentBalance = bankData.balance || 0;
              let newBalance = currentBalance;
              
              if (transaction.type === 'income') {
                // Se era receita, diminui o saldo (reversão)
                newBalance = currentBalance - transaction.amount;
                console.log(`Revertendo receita: ${currentBalance} - ${transaction.amount} = ${newBalance}`);
              } else if (transaction.type === 'expense') {
                // Se era despesa, aumenta o saldo (reversão)
                newBalance = currentBalance + transaction.amount;
                console.log(`Revertendo despesa: ${currentBalance} + ${transaction.amount} = ${newBalance}`);
              }
              
              // Atualizar o saldo diretamente
              const { error: updateError } = await supabase
                .from('banks')
                .update({ balance: newBalance })
                .eq('id', transaction.bank_id);
                
              if (updateError) {
                console.error("Erro ao reverter saldo do banco manualmente:", updateError);
              } else {
                console.log(`Saldo revertido com sucesso para ${newBalance}`);
              }
            }
          } else {
            console.log("Saldo bancário revertido com sucesso via RPC");
          }
        } catch (reversalError) {
          console.error("Exceção ao reverter saldo bancário:", reversalError);
          // Continuamos mesmo com erro para pelo menos tentar excluir a transação
        }
      }
      
      const isParent = !transaction.parent_transaction_id && transaction.installments_total > 1;
      const hasChildren = isParent;
      
      // Se for parte de um parcelamento
      if (isParent || transaction.parent_transaction_id) {
        const deleteAllInstallments = window.confirm(
          "Esta transação faz parte de uma compra parcelada. Deseja excluir todas as parcelas?"
        );
        
        if (deleteAllInstallments) {
          if (isParent) {
            // Excluir todas as parcelas filhas
            await supabase
              .from('transactions')
              .delete()
              .eq('parent_transaction_id', id);
              
            // Excluir a transação pai
            await supabase
              .from('transactions')
              .delete()
              .eq('id', id);
          } else {
            // Excluir a transação pai
            await supabase
              .from('transactions')
              .delete()
              .eq('id', transaction.parent_transaction_id);
              
            // Excluir todas as parcelas irmãs
            await supabase
              .from('transactions')
              .delete()
              .eq('parent_transaction_id', transaction.parent_transaction_id);
          }
          
          // Atualizar o estado removendo todas as transações excluídas
          if (isParent) {
            setTransactions(prev => prev.filter(t => 
              t.id !== id && (t as ExtendedTransaction).parent_transaction_id !== id
            ));
          } else {
            setTransactions(prev => prev.filter(t => 
              t.id !== transaction.parent_transaction_id && (t as ExtendedTransaction).parent_transaction_id !== transaction.parent_transaction_id
            ));
          }
          
          return { error: null };
        }
      }
      
      // Caminho padrão: excluir apenas a transação especificada
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      return { error };
    }
  }, []);

  // Adicionar uma nova função para pagar a fatura do cartão de crédito
  const payCardBill = async (cardId: string, bankId: string, amount: number) => {
    if (!user) return { error: new Error("Usuário não autenticado") };

    try {
      console.log(`Pagando fatura do cartão ${cardId} com a conta bancária ${bankId}, valor: ${amount}`);
      
      // 1. Criar uma transação de despesa para registrar o pagamento
      const paymentData = {
        user_id: user.id,
        description: "Pagamento de fatura de cartão de crédito",
        amount: amount,
        date: new Date().toISOString().split("T")[0],
        type: "expense" as const,
        category: "Pagamentos",
        bank_id: bankId,
        credit_card_id: cardId,
        is_card_bill_payment: true // Flag para identificar pagamento de fatura
      };
      
      // 2. Salvar a transação no banco de dados
      const { data: paymentTransaction, error: transactionError } = await supabase
        .from("transactions")
        .insert(paymentData)
        .select()
        .single();
        
      if (transactionError) {
        console.error("Erro ao registrar pagamento de fatura:", transactionError);
        return { error: transactionError };
      }
      
      // 3. Obter dados do cartão
      const { data: cardData, error: cardError } = await supabase
        .from("credit_cards")
        .select("current_spending, name")
        .eq("id", cardId)
        .single();
        
      if (cardError) {
        console.error("Erro ao obter dados do cartão:", cardError);
        return { error: cardError };
      }
      
      // 4. Atualizar o valor de current_spending do cartão para zero (ou reduzir pelo valor pago)
      const currentSpending = cardData.current_spending || 0;
      const newSpending = Math.max(0, currentSpending - amount);
      
      const { error: updateCardError } = await supabase
        .from("credit_cards")
        .update({ current_spending: newSpending })
        .eq("id", cardId);
        
      if (updateCardError) {
        console.error("Erro ao atualizar valor gasto do cartão:", updateCardError);
        return { error: updateCardError };
      }
      
      console.log(`Valor gasto do cartão atualizado: ${currentSpending} -> ${newSpending}`);
      
      // 5. Acionar o evento de atualização de transação para atualizar a UI
      console.log("Disparando evento transaction-updated após pagamento de fatura");
      document.dispatchEvent(new Event('transaction-updated'));
      
      toast.success(`Fatura do cartão ${cardData.name} paga com sucesso!`);
      
      return { data: paymentTransaction, error: null };
    } catch (error) {
      console.error("Erro ao processar pagamento de fatura:", error);
      toast.error("Erro ao processar pagamento da fatura");
      return { error };
    }
  };

  return {
    transactions,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    payCardBill,
  };
}
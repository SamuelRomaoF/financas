-- Função para atualizar o saldo de uma conta bancária
-- Esta função é chamada quando uma transação é criada/atualizada
-- e atualiza o saldo da conta bancária associada
-- Esta é uma versão simplificada que apenas atualiza o saldo sem verificações extras

CREATE OR REPLACE FUNCTION public.update_bank_balance(
  bank_id UUID,
  amount NUMERIC,
  transaction_type TEXT
)
RETURNS VOID AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Buscar o saldo atual
  SELECT balance INTO current_balance
  FROM public.banks
  WHERE id = bank_id;
  
  -- Se não encontrar o banco, lança erro
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Banco com ID % não encontrado', bank_id;
  END IF;
  
  -- Calcular o novo saldo com base no tipo de transação
  IF transaction_type = 'income' THEN
    -- Aumenta o saldo para receitas
    new_balance := current_balance + amount;
  ELSIF transaction_type = 'expense' THEN
    -- Diminui o saldo para despesas
    new_balance := current_balance - amount;
  ELSE
    -- Tipo inválido, lança erro
    RAISE EXCEPTION 'Tipo de transação inválido: %', transaction_type;
  END IF;
  
  -- Atualizar o saldo
  UPDATE public.banks
  SET balance = new_balance
  WHERE id = bank_id;
  
  -- Log para debugging
  RAISE LOG 'Banco: %, Saldo anterior: %, Valor: %, Tipo: %, Novo saldo: %', 
             bank_id, current_balance, amount, transaction_type, new_balance;
END;
$$ LANGUAGE plpgsql; 
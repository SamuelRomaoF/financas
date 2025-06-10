-- Trigger para atualizar automaticamente o saldo da conta bancária 
-- quando uma transação é excluída

-- Primeiro, criamos a função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION revert_bank_balance_on_delete() 
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a transação excluída tinha uma conta bancária associada
  IF OLD.bank_id IS NOT NULL THEN
    -- Chamar a função update_bank_balance com o tipo invertido para reverter o efeito
    -- Se era despesa, tratamos como receita para adicionar o valor de volta
    -- Se era receita, tratamos como despesa para subtrair o valor
    IF OLD.type = 'expense' THEN
      -- Reverter uma despesa: aumentar o saldo
      PERFORM update_bank_balance(OLD.bank_id, OLD.amount, 'income');
    ELSIF OLD.type = 'income' THEN
      -- Reverter uma receita: diminuir o saldo
      PERFORM update_bank_balance(OLD.bank_id, OLD.amount, 'expense');
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Agora criamos o trigger
DROP TRIGGER IF EXISTS transaction_delete_trigger ON transactions;

CREATE TRIGGER transaction_delete_trigger
BEFORE DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION revert_bank_balance_on_delete(); 
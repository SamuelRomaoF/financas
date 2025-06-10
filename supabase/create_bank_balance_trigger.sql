-- Trigger para atualizar automaticamente o saldo da conta bancária 
-- quando uma transação é criada ou atualizada

-- Primeiro, criamos a função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION update_bank_balance_trigger() 
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a transação tem uma conta bancária associada
  IF NEW.bank_id IS NOT NULL THEN
    -- Chamar a função update_bank_balance para atualizar o saldo
    PERFORM update_bank_balance(NEW.bank_id, NEW.amount, NEW.type);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Agora criamos o trigger
CREATE TRIGGER transaction_bank_balance_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_bank_balance_trigger();

-- Log de criação
RAISE NOTICE 'Trigger de atualização de saldo bancário criado com sucesso'; 
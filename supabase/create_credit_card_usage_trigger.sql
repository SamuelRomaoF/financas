-- Trigger para atualizar automaticamente o current_spending dos cartões de crédito
-- Este trigger é acionado quando uma transação com credit_card_id é criada ou atualizada

-- Primeiro, criamos a função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.update_credit_card_spending()
RETURNS TRIGGER AS $$
DECLARE
  card_id UUID;
  transaction_amount NUMERIC;
  current_card_spending NUMERIC;
  new_spending NUMERIC;
  card_name TEXT;
BEGIN
  -- Determinar qual operação está sendo realizada (INSERT, UPDATE, DELETE)
  IF TG_OP = 'DELETE' THEN
    -- Se for uma exclusão, pegamos os dados da linha antiga
    card_id := OLD.credit_card_id;
    transaction_amount := -OLD.amount; -- Negativo pois estamos removendo o valor
  ELSE
    -- Se for inserção ou atualização, pegamos os dados da linha nova
    card_id := NEW.credit_card_id;
    transaction_amount := NEW.amount;
    
    -- Se for uma atualização, também precisamos remover o valor antigo
    IF TG_OP = 'UPDATE' AND OLD.credit_card_id = NEW.credit_card_id THEN
      transaction_amount := NEW.amount - OLD.amount;
    ELSIF TG_OP = 'UPDATE' AND OLD.credit_card_id IS NOT NULL AND OLD.credit_card_id != NEW.credit_card_id THEN
      -- Se o cartão foi alterado, precisamos atualizar o cartão antigo também
      -- Primeiro, atualizamos o cartão antigo
      PERFORM public.update_credit_card_usage(OLD.credit_card_id, -OLD.amount);
    END IF;
  END IF;
  
  -- Se não houver cartão associado, não há nada a fazer
  IF card_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Buscar dados do cartão
  SELECT name, COALESCE(cc.current_spending, 0)
  INTO card_name, current_card_spending
  FROM public.credit_cards cc
  WHERE cc.id = card_id;
  
  -- Se o cartão não existir, retornamos sem fazer nada
  IF card_name IS NULL THEN
    RAISE WARNING 'Cartão com ID % não encontrado', card_id;
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calcular o novo valor de spending
  new_spending := GREATEST(0, current_card_spending + transaction_amount);
  
  -- Atualizar o cartão
  UPDATE public.credit_cards
  SET current_spending = new_spending
  WHERE id = card_id;
  
  RAISE NOTICE 'Cartão % atualizado: % -> %', card_name, current_card_spending, new_spending;
  
  -- Retornar a linha apropriada
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Agora criamos os triggers separados para INSERT/UPDATE e DELETE
-- Primeiro removemos os triggers existentes se houverem
DROP TRIGGER IF EXISTS credit_card_spending_insert_update_trigger ON public.transactions;
DROP TRIGGER IF EXISTS credit_card_spending_delete_trigger ON public.transactions;

-- Trigger para INSERT e UPDATE
CREATE TRIGGER credit_card_spending_insert_update_trigger
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
WHEN (NEW.credit_card_id IS NOT NULL AND NEW.type = 'expense')
EXECUTE FUNCTION public.update_credit_card_spending();

-- Trigger para DELETE
CREATE TRIGGER credit_card_spending_delete_trigger
AFTER DELETE ON public.transactions
FOR EACH ROW
WHEN (OLD.credit_card_id IS NOT NULL AND OLD.type = 'expense')
EXECUTE FUNCTION public.update_credit_card_spending();

-- Recalcular o current_spending para todos os cartões com base nas transações existentes
DO $$
DECLARE
  card_record RECORD;
  total_spending NUMERIC;
BEGIN
  -- Para cada cartão
  FOR card_record IN SELECT id, name FROM public.credit_cards LOOP
    -- Calcular o total de gastos para este cartão
    SELECT COALESCE(SUM(amount), 0)
    INTO total_spending
    FROM public.transactions
    WHERE credit_card_id = card_record.id
    AND type = 'expense';
    
    -- Atualizar o cartão com o valor correto
    UPDATE public.credit_cards
    SET current_spending = total_spending
    WHERE id = card_record.id;
    
    RAISE NOTICE 'Cartão % atualizado com gasto total: %', card_record.name, total_spending;
  END LOOP;
END $$; 
-- Função para atualizar o uso do cartão de crédito
-- Esta função atualiza o valor current_spending de um cartão de crédito
-- É usado quando uma transação parcelada é criada
-- Versão aprimorada com melhor tratamento de erros e logs

CREATE OR REPLACE FUNCTION public.update_credit_card_usage(
  card_id UUID,
  amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  current_spending NUMERIC;
  new_spending NUMERIC;
  card_name TEXT;
  card_limit NUMERIC;
BEGIN
  -- Verificar se o cartão existe e buscar dados relevantes
  SELECT 
    name,
    COALESCE(current_spending, 0),
    "limit"
  INTO 
    card_name,
    current_spending,
    card_limit
  FROM public.credit_cards
  WHERE id = card_id;
  
  -- Se não encontrar o cartão, lança erro
  IF card_name IS NULL THEN
    RAISE EXCEPTION 'Cartão de crédito com ID % não encontrado', card_id;
  END IF;
  
  -- Calcular o novo gasto
  new_spending := current_spending + amount;
  
  -- Verificar se ultrapassa o limite (apenas aviso, não impede)
  IF new_spending > card_limit THEN
    RAISE WARNING 'Limite do cartão % excedido. Limite: %, Gasto atual: %', 
                 card_name, card_limit, new_spending;
  END IF;
  
  -- Atualizar o gasto atual do cartão
  UPDATE public.credit_cards
  SET current_spending = new_spending
  WHERE id = card_id;
  
  -- Log para debugging
  RAISE LOG 'Cartão: %, Gasto anterior: %, Valor adicionado: %, Novo gasto: %', 
           card_name, current_spending, amount, new_spending;
END;
$$ LANGUAGE plpgsql; 
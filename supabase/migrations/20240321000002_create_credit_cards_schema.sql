-- Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_four_digits TEXT,
    limit NUMERIC NOT NULL,
    current_spending NUMERIC DEFAULT 0,
    due_date INTEGER NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
    closing_date INTEGER NOT NULL CHECK (closing_date >= 1 AND closing_date <= 31),
    color TEXT,
    brand TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Políticas RLS serão aplicadas para proteger os dados
    CONSTRAINT credit_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Políticas RLS para garantir que usuários só vejam seus próprios cartões
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios cartões"
  ON public.credit_cards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios cartões"
  ON public.credit_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios cartões"
  ON public.credit_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios cartões"
  ON public.credit_cards
  FOR DELETE
  USING (auth.uid() = user_id); 
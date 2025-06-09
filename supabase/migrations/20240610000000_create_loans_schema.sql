-- Tabela de empréstimos
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bank TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    installments INTEGER NOT NULL,
    installment_value NUMERIC NOT NULL,
    next_payment_date DATE NOT NULL,
    interest_rate NUMERIC NOT NULL,
    status TEXT DEFAULT 'em_dia',
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Políticas RLS serão aplicadas para proteger os dados
    CONSTRAINT loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Políticas RLS para garantir que usuários só vejam seus próprios empréstimos
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios empréstimos"
  ON public.loans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios empréstimos"
  ON public.loans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios empréstimos"
  ON public.loans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios empréstimos"
  ON public.loans
  FOR DELETE
  USING (auth.uid() = user_id); 
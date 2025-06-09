-- Script para criar explicitamente as tabelas

-- Remover tabelas antigas se existirem (opcional - use com cuidado)
-- DROP TABLE IF EXISTS public.alerts CASCADE;
-- DROP TABLE IF EXISTS public.credit_cards CASCADE;

-- Criar tabela de alertas
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'balance', 'goal', 'bill')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    condition TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    next_check TIMESTAMPTZ
);

-- Criar tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    last_four_digits TEXT,
    "limit" NUMERIC NOT NULL,
    current_spending NUMERIC DEFAULT 0,
    due_date INTEGER NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
    closing_date INTEGER NOT NULL CHECK (closing_date >= 1 AND closing_date <= 31),
    color TEXT,
    brand TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS para as tabelas
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para a tabela de alertas
CREATE POLICY "Usuários podem ver seus próprios alertas"
  ON public.alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios alertas"
  ON public.alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios alertas"
  ON public.alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios alertas"
  ON public.alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar políticas de segurança para a tabela de cartões de crédito
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
-- Tabela de alertas
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'balance', 'goal', 'bill')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    condition TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    next_check TIMESTAMPTZ,
    
    -- Políticas RLS serão aplicadas para proteger os dados
    CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Políticas RLS para garantir que usuários só vejam seus próprios alertas
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

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
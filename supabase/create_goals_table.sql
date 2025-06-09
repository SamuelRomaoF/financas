-- Script para criar a tabela de metas financeiras
-- Verificar se a tabela já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'goals') THEN
    -- Criar tabela de metas
    CREATE TABLE public.goals (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      target_amount NUMERIC NOT NULL,
      current_amount NUMERIC DEFAULT 0,
      deadline DATE,
      color VARCHAR(50),
      status VARCHAR(50) DEFAULT 'active',
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Adicionar comentários
    COMMENT ON TABLE public.goals IS 'Tabela para armazenar metas financeiras dos usuários';
    COMMENT ON COLUMN public.goals.id IS 'ID único da meta';
    COMMENT ON COLUMN public.goals.name IS 'Nome da meta';
    COMMENT ON COLUMN public.goals.target_amount IS 'Valor alvo da meta';
    COMMENT ON COLUMN public.goals.current_amount IS 'Valor atual já economizado/investido';
    COMMENT ON COLUMN public.goals.deadline IS 'Prazo para atingir a meta';
    COMMENT ON COLUMN public.goals.color IS 'Cor para representação visual da meta';
    COMMENT ON COLUMN public.goals.status IS 'Status da meta: active, completed, cancelled';
    COMMENT ON COLUMN public.goals.user_id IS 'ID do usuário dono da meta';
    
    -- Habilitar RLS (Row Level Security)
    ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
    
    -- Criar políticas RLS
    CREATE POLICY "Usuários podem ver suas próprias metas"
      ON public.goals
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem inserir suas próprias metas"
      ON public.goals
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem atualizar suas próprias metas"
      ON public.goals
      FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem excluir suas próprias metas"
      ON public.goals
      FOR DELETE
      USING (auth.uid() = user_id);
    
    -- Trigger para atualizar o campo updated_at
    CREATE OR REPLACE FUNCTION update_goals_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER goals_updated_at
      BEFORE UPDATE ON public.goals
      FOR EACH ROW
      EXECUTE FUNCTION update_goals_updated_at();
  END IF;
END
$$; 
-- Adicionar coluna 'cpf' na tabela clientes
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna cpf
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;

-- Criar índice para busca rápida por CPF
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);

-- Verificar se a coluna foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes' 
    AND table_schema = 'public'
    AND column_name = 'cpf';

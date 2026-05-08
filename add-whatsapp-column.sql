-- Adicionar coluna whatsapp na tabela clientes
-- Execute este script no SQL Editor do Supabase

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Verificar se a coluna foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes' 
    AND table_schema = 'public'
    AND column_name = 'whatsapp';

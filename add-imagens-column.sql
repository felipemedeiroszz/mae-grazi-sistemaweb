-- Adicionar coluna 'imagens' na tabela order_items
-- Execute este script no SQL Editor do Supabase

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS imagens JSONB DEFAULT '[]'::jsonb;

-- Verificar se a coluna foi adicionada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
    AND table_schema = 'public'
    AND column_name = 'imagens';

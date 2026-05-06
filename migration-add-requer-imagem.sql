-- Migration: Add requer_imagem column to trabalhos and rituais tables
-- Run this if your database was created before the requer_imagem feature

-- Add column to trabalhos table
ALTER TABLE trabalhos 
ADD COLUMN IF NOT EXISTS requer_imagem BOOLEAN DEFAULT false;

-- Add column to rituais table
ALTER TABLE rituais 
ADD COLUMN IF NOT EXISTS requer_imagem BOOLEAN DEFAULT false;

-- Update existing records to have an empty perguntas array if null
UPDATE trabalhos SET perguntas = '[]'::jsonb WHERE perguntas IS NULL;
UPDATE rituais SET perguntas = '[]'::jsonb WHERE perguntas IS NULL;

-- Update all_services view to include requer_imagem
DROP VIEW IF EXISTS all_services;

CREATE OR REPLACE VIEW all_services AS
SELECT 
    id,
    nome,
    descricao,
    valor,
    icon_url,
    perguntas,
    requer_imagem,
    'trabalho' as type,
    ativo,
    created_at,
    updated_at
FROM trabalhos
WHERE ativo = true

UNION ALL

SELECT 
    id,
    nome,
    descricao,
    valor,
    icon_url,
    perguntas,
    requer_imagem,
    'ritual' as type,
    ativo,
    created_at,
    updated_at
FROM rituais
WHERE ativo = true;

-- Migration completed successfully
SELECT 'Migration completed: requer_imagem column added to trabalhos and rituais tables' as status;

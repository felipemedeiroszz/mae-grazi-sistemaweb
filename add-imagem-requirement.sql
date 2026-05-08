-- Adicionar campo requer_imagem nas tabelas trabalhos e rituais
-- Execute este script no SQL Editor do Supabase

-- Adicionar campo na tabela trabalhos
ALTER TABLE trabalhos ADD COLUMN IF NOT EXISTS requer_imagem BOOLEAN DEFAULT FALSE;

-- Adicionar campo na tabela rituais  
ALTER TABLE rituais ADD COLUMN IF NOT EXISTS requer_imagem BOOLEAN DEFAULT FALSE;

-- Atualizar serviços existentes para não requerer imagem por padrão
UPDATE trabalhos SET requer_imagem = FALSE WHERE requer_imagem IS NULL;
UPDATE rituais SET requer_imagem = FALSE WHERE requer_imagem IS NULL;

-- Verificar se os campos foram adicionados
SELECT 
    'trabalhos' as tabela,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trabalhos' 
    AND table_schema = 'public'
    AND column_name = 'requer_imagem'
UNION ALL
SELECT 
    'rituais' as tabela,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rituais' 
    AND table_schema = 'public'
    AND column_name = 'requer_imagem';

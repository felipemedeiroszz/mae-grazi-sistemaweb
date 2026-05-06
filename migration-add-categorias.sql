-- Migration: Add Categorias Table and Category Fields
-- Created: May 4, 2026

-- Create categorias table
CREATE TABLE IF NOT EXISTS categorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo service_type NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#8B0000',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to trabalhos
ALTER TABLE trabalhos 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;

-- Add category_id to rituais
ALTER TABLE rituais 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias(ativo);
CREATE INDEX IF NOT EXISTS idx_trabalhos_categoria_id ON trabalhos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_rituais_categoria_id ON rituais(categoria_id);

-- Create updated_at trigger for categorias (PostgreSQL syntax)
DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;
CREATE TRIGGER update_categorias_updated_at
    BEFORE UPDATE ON categorias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories for trabalhos
INSERT INTO categorias (nome, tipo, descricao, cor, ordem) VALUES
    ('Amor e Relacionamento', 'trabalho', 'Trabalhos para atrair amor, fortalecer relacionamentos e unir casais', '#ff1a1a', 1),
    ('Prosperidade e Dinheiro', 'trabalho', 'Trabalhos para atrair riqueza, prosperidade financeira e oportunidades', '#ffd700', 2),
    ('Proteção e Descarrego', 'trabalho', 'Trabalhos de proteção espiritual, limpeza e remoção de energias negativas', '#4a0080', 3),
    ('Saúde e Bem-estar', 'trabalho', 'Trabalhos para saúde física, mental e equilíbrio energético', '#00ff7f', 4)
ON CONFLICT DO NOTHING;

-- Insert sample categories for rituais
INSERT INTO categorias (nome, tipo, descricao, cor, ordem) VALUES
    ('Rituais de Amor', 'ritual', 'Rituais para conquistar, fortalecer e harmonizar o amor', '#ff1a1a', 1),
    ('Rituais de Prosperidade', 'ritual', 'Rituais para atrair abundância financeira e sucesso', '#ffd700', 2),
    ('Rituais de Proteção', 'ritual', 'Rituais de defesa espiritual e limpeza energética', '#4a0080', 3),
    ('Rituais de Transformação', 'ritual', 'Rituais para mudanças de vida, novos ciclos e autoconhecimento', '#00bfff', 4)
ON CONFLICT DO NOTHING;

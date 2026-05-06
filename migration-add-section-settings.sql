-- Migration: Add Site Settings for Section Visibility
-- Created: May 4, 2026

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings for section visibility
INSERT INTO site_settings (chave, valor, descricao) VALUES
    ('trabalhos_enabled', 'true', 'Mostrar seção de trabalhos no site'),
    ('rituais_enabled', 'true', 'Mostrar seção de rituais no site'),
    ('trabalhos_title', 'TRABALHOS', 'Título da seção de trabalhos'),
    ('rituais_title', 'RITUAIS', 'Título da seção de rituais')
ON CONFLICT (chave) DO NOTHING;

-- Enable RLS on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on site_settings" 
    ON site_settings 
    FOR SELECT 
    USING (true);

-- Allow admin write access (check application layer)
CREATE POLICY "Allow admin write on site_settings" 
    ON site_settings 
    FOR ALL 
    USING (true);

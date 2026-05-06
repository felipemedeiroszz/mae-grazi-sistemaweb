-- Supabase Database Schema for Mae Grazi Project
-- Run this SQL in your Supabase project SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE service_type AS ENUM ('trabalho', 'ritual');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'completed');

-- Trabalhos Table
CREATE TABLE IF NOT EXISTS trabalhos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    icon_url TEXT,
    perguntas JSONB DEFAULT '[]'::jsonb,
    requer_imagem BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rituais Table
CREATE TABLE IF NOT EXISTS rituais (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    icon_url TEXT,
    perguntas JSONB DEFAULT '[]'::jsonb,
    requer_imagem BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clientes Table
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pedidos Table
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    trabalho_id UUID REFERENCES trabalhos(id) ON DELETE SET NULL,
    ritual_id UUID REFERENCES rituais(id) ON DELETE SET NULL,
    valor DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    asaas_payment_id VARCHAR(255),
    asaas_payment_url TEXT,
    form_data JSONB,
    form_submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_service_type CHECK (
        (trabalho_id IS NOT NULL AND ritual_id IS NULL) OR 
        (trabalho_id IS NULL AND ritual_id IS NOT NULL)
    )
);

-- Pedido Files Table
CREATE TABLE IF NOT EXISTS pedido_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trabalhos_ativo ON trabalhos(ativo);
CREATE INDEX IF NOT EXISTS idx_rituais_ativo ON rituais(ativo);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedido_files_pedido_id ON pedido_files(pedido_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_trabalhos_updated_at BEFORE UPDATE ON trabalhos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rituais_updated_at BEFORE UPDATE ON rituais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabalhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rituais ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_files ENABLE ROW LEVEL SECURITY;

-- Trabalhos policies
CREATE POLICY "Anyone can view active trabalhos" ON trabalhos
    FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage trabalhos" ON trabalhos
    FOR ALL USING (true); -- Will be checked in application layer

-- Rituais policies
CREATE POLICY "Anyone can view active rituais" ON rituais
    FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage rituais" ON rituais
    FOR ALL USING (true); -- Will be checked in application layer

-- Clientes policies
CREATE POLICY "Users can view their own profile" ON clientes
    FOR SELECT USING (true); -- Will be checked in application layer

CREATE POLICY "Users can update their own profile" ON clientes
    FOR UPDATE USING (true); -- Will be checked in application layer

CREATE POLICY "Users can insert their own profile" ON clientes
    FOR INSERT WITH CHECK (true); -- Will be checked in application layer

-- Pedidos policies
CREATE POLICY "Users can view their own orders" ON pedidos
    FOR SELECT USING (true); -- Will be checked in application layer

CREATE POLICY "Admins can view all orders" ON pedidos
    FOR SELECT USING (true); -- Will be checked in application layer

CREATE POLICY "Users can create orders" ON pedidos
    FOR INSERT WITH CHECK (true); -- Will be checked in application layer

CREATE POLICY "Admins can update orders" ON pedidos
    FOR UPDATE USING (true); -- Will be checked in application layer

-- Pedido Files policies
CREATE POLICY "Users can view their own order files" ON pedido_files
    FOR SELECT USING (true); -- Will be checked in application layer

CREATE POLICY "Users can upload their own order files" ON pedido_files
    FOR INSERT WITH CHECK (true); -- Will be checked in application layer

CREATE POLICY "Admins can view all order files" ON pedido_files
    FOR SELECT USING (true); -- Will be checked in application layer

-- Admin Users policies
CREATE POLICY "Admins can manage admin users" ON admin_users
    FOR ALL USING (
        -- Allow access if user is authenticated (we'll check this in application layer)
        true
    );

-- Create Storage Buckets

-- Icons bucket for service icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('icons', 'icons', true)
ON CONFLICT (id) DO NOTHING;

-- Order files bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('order_files', 'order_files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies

-- Icons bucket policies
CREATE POLICY "Anyone can view icons" ON storage.objects
    FOR SELECT USING (bucket_id = 'icons');

CREATE POLICY "Admins can upload icons" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'icons'); -- Will be checked in application layer

CREATE POLICY "Admins can update icons" ON storage.objects
    FOR UPDATE USING (bucket_id = 'icons'); -- Will be checked in application layer

CREATE POLICY "Admins can delete icons" ON storage.objects
    FOR DELETE USING (bucket_id = 'icons'); -- Will be checked in application layer

-- Order files bucket policies
CREATE POLICY "Users can view their own order files" ON storage.objects
    FOR SELECT USING (bucket_id = 'order_files'); -- Will be checked in application layer

CREATE POLICY "Users can upload their own order files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'order_files'); -- Will be checked in application layer

CREATE POLICY "Admins can view all order files" ON storage.objects
    FOR SELECT USING (bucket_id = 'order_files'); -- Will be checked in application layer

-- Create Functions

-- Function to hash password (using pgcrypto)
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use crypt() with a random salt
    RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify password
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (hash = crypt(password, hash));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Sample Data (optional - remove in production)

-- Insert sample admin user with hashed password
INSERT INTO admin_users (email, password_hash, nome) VALUES 
('admin@maegrazi.com', '$2a$10$example_hash', 'Administrador Mae Grazi');

-- Insert sample cliente with hashed password
INSERT INTO clientes (nome, email, password_hash, telefone) VALUES 
('Cliente Teste', 'cliente@exemplo.com', '$2a$10$example_hash', '(11) 99999-9999');

-- Insert sample trabalhos
INSERT INTO trabalhos (nome, descricao, valor, perguntas) VALUES
('Amor e Paixão', 'Trabalho poderoso para atrair amor e paixão para sua vida. Resultados rápidos e duradouros.', 299.90, '["Qual é o seu signo?", "Descreva a pessoa que deseja atrair", "Há algum ritual específico que prefere?"]'::jsonb),
('Prosperidade Financeira', 'Trabalho para abrir caminhos financeiros e atrair abundância para sua vida.', 399.90, '["Qual sua área profissional?", "Qual valor mensal deseja alcançar?", "Há algum bloqueio financeiro específico?"]'::jsonb),
('Proteção Espiritual', 'Trabalho de limpeza e proteção energética para afastar negatividade.', 199.90, '["Sente-se sobrecarregado energeticamente?", "Já fez algum trabalho antes?", "Qual seu maior medo atual?"]'::jsonb);

-- Insert sample rituais
INSERT INTO rituais (nome, descricao, valor, perguntas) VALUES
('Ritual dos 7 Dias', 'Ritual intensivo de 7 dias para transformação completa da sua vida.', 599.90, '["Qual área da vida precisa de transformação?", "Está preparado para mudanças?", "Pode dedicar tempo diário por 7 dias?"]'::jsonb),
('Ritual de Lua Cheia', 'Ritual poderoso realizado na lua cheia para amplificar energias.', 499.90, '["Qual seu objetivo principal?", "Já participou de rituais antes?", "Pode comparecer no dia da lua cheia?"]'::jsonb),
('Ritual de Ano Novo', 'Ritual especial para receber o ano novo com energias positivas.', 799.90, '["Como foi seu ano atual?", "Quais metas para o próximo ano?", "Há algum padrão que deseja quebrar?"]'::jsonb);

-- Create Views for easier queries

-- View for all services (trabalhos + rituais)
CREATE OR REPLACE VIEW all_services AS
SELECT 
    id,
    nome,
    descricao,
    valor,
    icon_url,
    perguntas,
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
    'ritual' as type,
    ativo,
    created_at,
    updated_at
FROM rituais
WHERE ativo = true;

-- View for orders with service details
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
    p.id,
    p.cliente_id,
    p.valor,
    p.status,
    p.asaas_payment_id,
    p.asaas_payment_url,
    p.form_data,
    p.form_submitted_at,
    p.created_at,
    p.updated_at,
    t.nome as trabalho_nome,
    t.descricao as trabalho_descricao,
    t.perguntas as trabalho_perguntas,
    r.nome as ritual_nome,
    r.descricao as ritual_descricao,
    r.perguntas as ritual_perguntas,
    CASE 
        WHEN t.id IS NOT NULL THEN 'trabalho'
        WHEN r.id IS NOT NULL THEN 'ritual'
    END as service_type
FROM pedidos p
LEFT JOIN trabalhos t ON p.trabalho_id = t.id
LEFT JOIN rituais r ON p.ritual_id = r.id;

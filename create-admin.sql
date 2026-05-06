-- Criar usuário admin para testes
-- Execute este SQL no Supabase SQL Editor

-- Inserir usuário admin com senha hasheada
-- Senha: admin123
INSERT INTO admin_users (email, password_hash, nome, role) VALUES 
('admin@maegrazi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9S', 'Administrador Mae Grazi', 'admin');

-- Verificar usuário criado
SELECT * FROM admin_users WHERE email = 'admin@maegrazi.com';

-- Nota: A senha "admin123" foi hasheada com bcrypt
-- Você pode usar estas credenciais para login:
-- Email: admin@maegrazi.com
-- Senha: admin123

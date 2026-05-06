-- Verificar e atualizar usuário admin existente
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar se usuário admin existe
SELECT * FROM admin_users WHERE email = 'admin@maegrazi.com';

-- 2. Se existir, atualizar a senha para "admin123"
UPDATE admin_users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9S'
WHERE email = 'admin@maegrazi.com';

-- 3. Verificar atualização
SELECT email, nome, role FROM admin_users WHERE email = 'admin@maegrazi.com';

-- 4. Testar credenciais:
-- Email: admin@maegrazi.com
-- Senha: admin123

-- NOTA: Se a linha 2 (UPDATE) der erro de "duplicate key", 
-- significa que o usuário já existe com a senha correta.
-- Tente fazer login diretamente no painel admin.

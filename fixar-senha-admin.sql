-- Corrigir senha do usuário admin usando hash do banco
-- Execute este SQL no Supabase SQL Editor

-- 1. Primeiro, verificar se a função hash_password existe
SELECT proname FROM pg_proc WHERE proname = 'hash_password';

-- 2. Se não existir, criar a função (já deve existir no schema)
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Gerar hash para a senha "admin123"
SELECT hash_password('admin123') as new_hash;

-- 4. Atualizar a senha do usuário admin com o hash gerado
UPDATE admin_users 
SET password_hash = hash_password('admin123')
WHERE email = 'admin@maegrazi.com';

-- 5. Verificar a atualização
SELECT email, nome, role, 
       CASE 
           WHEN password_hash IS NOT NULL THEN 'Senha atualizada'
           ELSE 'Senha nula'
       END as status
FROM admin_users 
WHERE email = 'admin@maegrazi.com';

-- 6. Testar verificação
SELECT verify_password('admin123', password_hash) as senha_valida
FROM admin_users 
WHERE email = 'admin@maegrazi.com';

-- Credenciais para teste:
-- Email: admin@maegrazi.com
-- Senha: admin123

-- NOTA: Se a linha 4 (UPDATE) não funcionar, 
-- use o hash gerado na linha 3 manualmente

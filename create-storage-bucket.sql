-- Criar bucket 'form-images' no Supabase Storage
-- Execute este script no SQL Editor do Supabase para permitir uploads de imagens

-- NOTA: Este script precisa ser executado no Supabase Storage, não no SQL Editor
-- As instruções abaixo são para referência

-- Instruções para criar o bucket via painel do Supabase:
-- 1. Vá para: https://supabase.com/dashboard/project/neemeubleifwmryowqzh
-- 2. Clique em "Storage" no menu lateral
-- 3. Clique em "New bucket"
-- 4. Nome do bucket: form-images
-- 5. Deixe as configurações padrão (público)
-- 6. Clique em "Create bucket"

-- Política de acesso (RLS) para o bucket (necessário para uploads)
-- NOTA: Em algumas versões do Supabase, use storage.policies
-- Em outras versões, a configuração é feita via painel do Supabase Storage

-- Abordagem 1: Criar políticas via SQL (se storage.policies existir)
-- Abordagem 2: Configurar via painel do Supabase Storage (recomendado)

-- 1. Política para uploads (usuários autenticados)
INSERT INTO storage.policies (
    name, 
    definition, 
    roles
) VALUES (
    'form-images-upload',
    'INSERT INTO storage.objects (bucket_id, name, owner) VALUES (auth.uid(), ''form-images'', storage.filename(name), auth.uid())',
    '{"authenticated"}'
);

-- 2. Política para leitura pública
INSERT INTO storage.policies (
    name, 
    definition, 
    roles
) VALUES (
    'form-images-images-public-read',
    'SELECT * FROM storage.objects WHERE bucket_id = ''form-images''',
    '{"authenticated", "anon"}'
);

-- 3. Política para leitura (apenas usuários autenticados)
INSERT INTO storage.policies (
    name, 
    definition, 
    roles
) VALUES (
    'form-images-images-auth-read',
    'SELECT * FROM storage.objects WHERE bucket_id = ''form-images'' AND auth.role() = ''authenticated''',
    '{"authenticated"}'
);

-- Verificar se as políticas foram criadas
SELECT 
    policy_name,
    definition,
    roles
FROM storage.policies 
WHERE policy_name LIKE 'form-images%';

-- Verificar se o bucket existe (referência)
-- NOTA: A tabela storage.buckets pode não existir em algumas versões do Supabase
-- Use a consulta abaixo ou verifique diretamente no painel do Supabase Storage

-- Opção 1: Verificar buckets disponíveis
SELECT * FROM storage.buckets;

-- Opção 2: Verificar bucket específico (se a tabela existir)
SELECT 
    name, 
    created_at
FROM storage.buckets 
WHERE name = 'form-images';

-- Script alternativo para criar bucket e políticas RLS
-- Execute este script no SQL Editor do Supabase

-- NOTA: Em algumas versões do Supabase, storage.policies não existe
-- Este script usa uma abordagem alternativa que funciona na maioria das versões

-- 1. Criar bucket (se não existir)
-- NOTA: Esta parte pode precisar ser feita manualmente no painel do Supabase Storage
-- Execute as consultas abaixo para verificar

-- Verificar se bucket já existe
SELECT 'Bucket form-images já existe' as resultado 
FROM storage.buckets 
WHERE name = 'form-images'
HAVING COUNT(*) > 0;

-- Se não existir, crie manualmente:
-- 1. Vá para: https://supabase.com/dashboard/project/neemeubleifwmryowqzh
-- 2. Clique em "Storage" no menu lateral
-- 3. Clique em "New bucket"
-- 4. Nome: form-images
-- 5. Deixe público (sem autenticação)
-- 6. Clique em "Create bucket"

-- 2. Criar políticas RLS (se não existirem)
-- NOTA: As políticas também podem precisar ser criadas manualmente no painel

-- Verificar se políticas já existem
SELECT 'Políticas já existem' as resultado
FROM storage.policies 
WHERE policy_name LIKE 'form-images%'
HAVING COUNT(*) > 0;

-- Se não existirem, crie manualmente:
-- 1. Vá para Storage no painel do Supabase
-- 2. Clique na aba "Policies"
-- 3. Clique em "New Policy"
-- 4. Policy name: form-images-upload
-- 5. Definition: INSERT INTO storage.objects (bucket_id, name, owner) VALUES (auth.uid(), 'form-images', storage.filename(name), auth.uid())
-- 6. Roles: {"authenticated"}
-- 7. Clique em "Save"

-- 3. Policy name: form-images-images-public-read
-- 5. Definition: SELECT * FROM storage.objects WHERE bucket_id = 'form-images'
-- 6. Roles: {"authenticated", "anon"}
-- 7. Clique em "Save"

-- 4. Policy name: form-images-images-auth-read
-- 5. Definition: SELECT * FROM storage.objects WHERE bucket_id = 'form-images' AND auth.role() = 'authenticated'
-- 6. Roles: {"authenticated"}
-- 7. Clique em "Save"

-- Exemplo de política de upload correta:
-- INSERT INTO storage.policies (
--   name, 
--   definition, 
--   roles
-- ) VALUES (
--   'form-images-upload',
--   'INSERT INTO storage.objects (bucket_id, name, owner) VALUES (auth.uid(), ''form-images'', storage.filename(name), auth.uid())',
--   '{"authenticated"}'
-- );

-- Script final funcional para configurar Storage do Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas existentes que possam causar conflito
DROP POLICY IF EXISTS "form-images-upload" ON storage.objects;
DROP POLICY IF EXISTS "form-images-read" ON storage.objects;

-- 2. Criar bucket público (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    gen_random_uuid(), 
    'form-images', 
    true, 
    52428800, -- 50MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (name) DO NOTHING;

-- 3. Criar política para uploads (usuários autenticados)
CREATE POLICY "form-images-upload" ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'form-images' 
    AND auth.role() = 'authenticated'
);

-- 4. Criar política para leitura pública
CREATE POLICY "form-images-read" ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'form-images'
);

-- 5. Verificar se tudo foi criado com sucesso
SELECT 
    'Bucket form-images criado com sucesso!' as bucket_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets WHERE name = 'form-images'
        ) THEN 'OK'
        ELSE 'ERRO'
    END as bucket_result,

    'Políticas RLS criadas com sucesso!' as policies_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname LIKE 'form-images%'
        ) THEN 'OK'
        ELSE 'ERRO'
    END as policies_result

FROM (SELECT 1) as dummy;

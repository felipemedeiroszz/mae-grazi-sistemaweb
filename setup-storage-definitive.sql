-- Script definitivo para configurar Storage do Supabase
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Criar bucket público (sem RLS)
-- Esta abordagem cria um bucket público que permite uploads

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    gen_random_uuid(), 
    'form-images', 
    true, 
    52428800, -- 50MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (name) DO NOTHING;

-- PASSO 2: Criar política simples para uploads
CREATE POLICY "form-images-upload" ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'form-images' 
    AND auth.role() = 'authenticated'
);

-- PASSO 3: Criar política para leitura pública
CREATE POLICY "form-images-read" ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'form-images'
);

-- PASSO 4: Verificar se tudo foi criado
SELECT 
    'Bucket form-images criado com sucesso!' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets WHERE name = 'form-images'
        ) THEN 'OK'
        ELSE 'ERRO'
    END as bucket_status,

    'Políticas RLS criadas com sucesso!' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname LIKE 'form-images%'
        ) THEN 'OK'
        ELSE 'ERRO'
    END as policies_status

FROM (SELECT 1) as dummy;

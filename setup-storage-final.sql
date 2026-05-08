-- Script final e simplificado para configurar Storage do Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar bucket (se não existir)
-- NOTA: Se der erro, crie o bucket manualmente no painel do Supabase Storage

INSERT INTO storage.buckets (id, name, public) 
SELECT 
    nextval('storage.bucket_id_seq'::regclass), 
    'form-images', 
    true
ON CONFLICT (id) DO NOTHING;

-- 2. Criar políticas RLS básicas
-- NOTA: Supabase pode criar automaticamente as políticas baseadas nas definições abaixo

-- Política para uploads
CREATE POLICY "form-images-upload" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'form-images',
    auth.role() = 'authenticated'
);

-- Política para leitura pública
CREATE POLICY "form-images-read" ON storage.objects
FOR SELECT
USING (
    bucket_id = 'form-images'
);

-- 3. Verificar se tudo foi criado
SELECT 
    'Bucket criado' as bucket_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'form-images') THEN 'OK'
        ELSE 'ERRO'
    END as status,

    'Políticas criadas' as policies_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE policyname LIKE 'form-images%') THEN 'OK'
        ELSE 'ERRO'
    END as status

FROM (SELECT 1 FROM storage.buckets WHERE name = 'form-images') as bucket_check,
     (SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE 'form-images%') as policy_check;

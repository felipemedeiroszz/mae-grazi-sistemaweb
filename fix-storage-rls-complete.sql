-- Script completo para corrigir RLS do Storage
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "form-images-upload";
DROP POLICY IF EXISTS "form-images-images-public-read";
DROP POLICY IF EXISTS "form-images-images-auth-read";

-- 2. Criar bucket (se não existir)
-- NOTA: Esta parte pode precisar ser feita manualmente no painel do Supabase Storage
-- Execute as consultas abaixo primeiro para verificar

-- Verificar se bucket existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'form-images') THEN
        EXECUTE 'INSERT INTO storage.buckets (name, public) VALUES (''form-images'', true)';
    END IF;
END $$;

-- 3. Criar políticas RLS
-- Usando a sintaxe correta para todas as versões do Supabase

-- Política para uploads (usuários autenticados)
CREATE POLICY "form-images-upload" ON storage.objects
USING (
    bucket_id = 'form-images',
    auth.role() = 'authenticated'
)
WITH CHECK (
    auth.uid() = owner()
)
FOR INSERT
WITH GRANT (
    authenticated
);

-- Política para leitura pública
CREATE POLICY "form-images-images-public-read" ON storage.objects
USING (
    bucket_id = 'form-images'
)
FOR SELECT
USING (
    (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Política para leitura autenticada
CREATE POLICY "form-images-images-auth-read" ON storage.objects
USING (
    bucket_id = 'form-images',
    auth.role() = 'authenticated'
)
FOR SELECT
USING (
    authenticated
);

-- 4. Verificar se tudo foi criado
SELECT 
    'Bucket criado' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'form-images') THEN 'OK'
        ELSE 'ERRO'
    END as bucket_status,

    'Políticas criadas' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE policyname LIKE 'form-images%'
        ) THEN 'OK'
        ELSE 'ERRO'
    END as policies_status

FROM (SELECT 1 FROM storage.buckets WHERE name = 'form-images') as bucket_check,
     (SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE 'form-images%') as policy_check;

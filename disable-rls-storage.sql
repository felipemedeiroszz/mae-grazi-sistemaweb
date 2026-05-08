-- Script para desabilitar RLS no Storage e permitir uploads
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS na tabela storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

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

-- 3. Verificar se tudo foi criado
SELECT 
    'Bucket form-images criado e RLS desabilitado!' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets WHERE name = 'form-images'
        ) THEN 'OK'
        ELSE 'ERRO'
    END as result

FROM (SELECT 1) as dummy;

-- NOTA: RLS foi desabilitado para permitir uploads
-- Para reabilitar RLS depois, execute:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

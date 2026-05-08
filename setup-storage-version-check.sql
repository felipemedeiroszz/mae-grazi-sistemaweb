-- Script para verificar versão do Supabase e configurar storage
-- Execute este script primeiro para identificar a versão

-- Verificar versão do Supabase
SELECT 
    'Versão Supabase' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'pg_catalog' 
            AND table_name = 'pg_available_extensions'
            AND EXISTS (
                SELECT 1 FROM pg_available_extensions 
                WHERE name = 'pg_storage_ajv'
            )
        ) THEN 'Usa storage.policies (antigo)'
        ELSE 'Usa storage.policies (novo)'
    END as versao_storage;

-- Verificar se bucket existe
SELECT 'Bucket form-images existe' as resultado 
FROM storage.buckets 
WHERE name = 'form-images'
HAVING COUNT(*) > 0;

-- Para versão antiga (usa storage.policies)
-- Execute os comandos do create-storage-bucket.sql

-- Para versão nova (não usa storage.policies)  
-- Execute os comandos do create-storage-bucket-alternative.sql

-- Script simples para criar bucket e políticas RLS
-- Execute este script no SQL Editor do Supabase

-- 1. Criar bucket (se não existir)
INSERT INTO storage.buckets (id, name, public) 
SELECT nextval('storage.bucket_id_seq'), 'form-images', true
ON CONFLICT (id) DO NOTHING;

-- 2. Criar política para uploads
CREATE POLICY "form-images-upload" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'form-images' AND auth.role() = 'authenticated');

-- 3. Criar política para leitura
CREATE POLICY "form-images-read" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'form-images');

-- 4. Verificar se foi criado
SELECT 'Bucket e políticas criados com sucesso!' as resultado
WHERE EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'form-images')
  AND EXISTS (SELECT 1 FROM pg_policies WHERE policyname LIKE 'form-images%');

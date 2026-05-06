-- Fix para permissões da tabela categorias no Supabase
-- Execute este SQL no Supabase SQL Editor

-- Habilitar RLS na tabela categorias
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow admin full access on categorias" ON categorias;
DROP POLICY IF EXISTS "Allow read categorias for all" ON categorias;
DROP POLICY IF EXISTS "Allow insert categorias for admin" ON categorias;
DROP POLICY IF EXISTS "Allow update categorias for admin" ON categorias;
DROP POLICY IF EXISTS "Allow delete categorias for admin" ON categorias;

-- Política: Permitir SELECT para todos (usuários autenticados e anônimos)
CREATE POLICY "Allow read categorias for all" ON categorias
    FOR SELECT TO authenticated, anon USING (true);

-- Política: Permitir INSERT para usuários autenticados
CREATE POLICY "Allow insert categorias for authenticated" ON categorias
    FOR INSERT TO authenticated WITH CHECK (true);

-- Política: Permitir UPDATE para usuários autenticados
CREATE POLICY "Allow update categorias for authenticated" ON categorias
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Política: Permitir DELETE para usuários autenticados
CREATE POLICY "Allow delete categorias for authenticated" ON categorias
    FOR DELETE TO authenticated USING (true);

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'categorias';

-- Desativar RLS na tabela orders para permitir atualizações
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desativado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';

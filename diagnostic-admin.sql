-- Script de diagnóstico para o painel admin
-- Execute este script para verificar o estado atual do banco de dados

-- 1. Verificar se existem pedidos na tabela
SELECT 'pedidos_count' as check_type, COUNT(*) as value FROM pedidos;

-- 2. Verificar se existem clientes
SELECT 'clientes_count' as check_type, COUNT(*) as value FROM clientes;

-- 3. Verificar estrutura da tabela pedidos
SELECT 'pedidos_structure' as check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se a view order_with_details foi criada e retorna dados
SELECT 'order_with_details_count' as check_type, COUNT(*) as value FROM order_with_details;

-- 5. Verificar se as funções foram criadas
SELECT 'functions_created' as check_type, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_dashboard_stats', 'get_monthly_revenue', 'get_popular_services');

-- 6. Testar a função get_dashboard_stats diretamente
SELECT * FROM get_dashboard_stats() LIMIT 1;

-- 7. Mostrar alguns pedidos (se existirem) para debug
SELECT 'sample_pedidos' as check_type, id, cliente_id, trabalho_id, ritual_id, valor, status, created_at 
FROM pedidos 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Verificar se há permissões nas tabelas
SELECT 'table_permissions' as check_type, table_name, privilege_type, grantee 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('pedidos', 'clientes', 'trabalhos', 'rituais')
AND grantee IN ('anon', 'authenticated');

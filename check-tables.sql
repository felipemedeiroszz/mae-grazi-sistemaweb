-- Verificar todas as tabelas que podem conter pedidos
SELECT 'tables_with_pedido' as check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%pedido%' OR table_name LIKE '%order%')
ORDER BY table_name;

-- Verificar se existe tabela 'orders'
SELECT 'orders_table_count' as check_type, COUNT(*) as value FROM orders;

-- Verificar se existe tabela 'pedidos'  
SELECT 'pedidos_table_count' as check_type, COUNT(*) as value FROM pedidos;

-- Mostrar estrutura das tabelas
SELECT 'orders_structure' as check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar estrutura da tabela pedidos
SELECT 'pedidos_structure' as check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados na tabela orders (se existir) - sem especificar colunas
SELECT 'orders_sample' as check_type, * 
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar dados na tabela pedidos (se existir) - sem especificar colunas  
SELECT 'pedidos_sample' as check_type, * 
FROM pedidos 
ORDER BY created_at DESC 
LIMIT 1;

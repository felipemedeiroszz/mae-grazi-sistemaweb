-- Verificar se existe tabela de itens do pedido
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (table_name LIKE '%order_item%' OR table_name LIKE '%pedido_item%' OR table_name LIKE '%item%')
ORDER BY table_name, ordinal_position;

-- Verificar todas as tabelas que podem conter relação com serviços
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_name;

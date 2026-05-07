-- Verificar estrutura completa da tabela orders
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados de exemplo para ver os campos reais
SELECT * FROM orders LIMIT 1;

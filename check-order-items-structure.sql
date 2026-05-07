-- Verificar estrutura da tabela order_items
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados de exemplo da tabela order_items
SELECT * FROM order_items LIMIT 3;

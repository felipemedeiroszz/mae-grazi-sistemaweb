-- SQL para verificar se existem usuários na tabela clientes
-- e verificar o estado da autenticação

SELECT 
    'clientes' as tabela,
    COUNT(*) as total_registros
FROM clientes
UNION ALL
SELECT 
    'cart_items' as tabela,
    COUNT(*) as total_registros
FROM cart_items
UNION ALL
SELECT 
    'orders' as tabela,
    COUNT(*) as total_registros
FROM orders;

-- Verificar estrutura da tabela clientes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

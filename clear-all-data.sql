-- Script para excluir todas compras e formulários
-- ATENÇÃO: Este script irá APAGAR TODOS os dados permanentemente!
-- Execute apenas se tiver certeza absoluta!

-- Excluir todos os dados das tabelas (em ordem de dependência)

-- 1. Excluir todos os itens de pedidos (order_items)
DELETE FROM order_items;

-- 2. Excluir todos os pedidos (orders)
DELETE FROM orders;

-- 3. Excluir todos os clientes (clientes)
DELETE FROM clientes;

-- 4. Resetar sequências de IDs (opcional, para começar do 1 novamente)
ALTER SEQUENCE IF EXISTS clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;

-- 5. Verificar se tudo foi excluído
SELECT 
    'clientes' as tabela,
    COUNT(*) as registros_restantes
FROM clientes
UNION ALL
SELECT 
    'orders' as tabela,
    COUNT(*) as registros_restantes
FROM orders
UNION ALL
SELECT 
    'order_items' as tabela,
    COUNT(*) as registros_restantes
FROM order_items;

-- Mensagem de confirmação
SELECT 'Todos os dados foram excluídos com sucesso!' as resultado;

-- Criar view para orders com detalhes dos itens
CREATE OR REPLACE VIEW orders_with_items AS
SELECT 
    o.id,
    o.cliente_id,
    o.valor_total,
    o.status,
    o.metodo_pagamento,
    o.asaas_payment_id,
    o.asaas_payment_url,
    o.paid_at,
    o.created_at,
    o.updated_at,
    
    -- Dados do cliente
    c.nome as cliente_nome,
    c.email as cliente_email,
    c.telefone as cliente_telefone
    
FROM orders o
LEFT JOIN clientes c ON o.cliente_id = c.id;

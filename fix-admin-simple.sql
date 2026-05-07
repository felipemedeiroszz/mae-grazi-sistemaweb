-- Script simplificado para corrigir o painel admin
-- Execute este script no SQL Editor do Supabase

-- Remover view existente para evitar conflitos
DROP VIEW IF EXISTS order_with_details;

-- Criar view simplificada para pedidos com detalhes
CREATE VIEW order_with_details AS
SELECT 
    p.id,
    p.cliente_id,
    p.valor_total,
    p.status,
    p.metodo_pagamento,
    p.asaas_payment_id,
    p.asaas_payment_url,
    p.asaas_pix_qr_code,
    p.asaas_pix_payload,
    p.paid_at,
    p.created_at,
    p.updated_at,
    
    -- Dados do cliente
    c.nome as cliente_nome,
    c.email as cliente_email,
    c.telefone as cliente_telefone,
    
    -- Dados do serviço (da tabela order_items) - pegar apenas o primeiro item
    oi.nome as service_nome,
    oi.tipo as tipo_servico,
    oi.servico_id as service_id,
    oi.form_data as form_data,
    oi.valor_unitario as valor_unitario,
    oi.quantidade as quantidade
    
FROM orders p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN LATERAL (
    SELECT * FROM order_items 
    WHERE order_id = p.id 
    LIMIT 1
) oi ON true;

-- Função simplificada para estatísticas
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_trabalhos BIGINT,
    total_rituais BIGINT,
    total_clientes BIGINT,
    total_pedidos BIGINT,
    pedidos_pendentes BIGINT,
    pedidos_pagos BIGINT,
    pedidos_concluidos BIGINT,
    pedidos_cancelados BIGINT,
    receita_total NUMERIC,
    ticket_medio NUMERIC,
    clientes_mes_atual BIGINT,
    pedidos_mes_atual BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::BIGINT FROM trabalhos WHERE ativo = true) as total_trabalhos,
        (SELECT COUNT(*)::BIGINT FROM rituais WHERE ativo = true) as total_rituais,
        (SELECT COUNT(*)::BIGINT FROM clientes) as total_clientes,
        (SELECT COUNT(*)::BIGINT FROM orders) as total_pedidos,
        (SELECT COUNT(*)::BIGINT FROM orders WHERE status = 'pending') as pedidos_pendentes,
        (SELECT COUNT(*)::BIGINT FROM orders WHERE status = 'paid') as pedidos_pagos,
        (SELECT COUNT(*)::BIGINT FROM orders WHERE status = 'completed') as pedidos_concluidos,
        (SELECT COUNT(*)::BIGINT FROM orders WHERE status = 'cancelled') as pedidos_cancelados,
        (SELECT COALESCE(SUM(valor_total), 0)::NUMERIC FROM orders WHERE status = 'paid') as receita_total,
        (SELECT COALESCE(AVG(valor_total), 0)::NUMERIC FROM orders WHERE status = 'paid') as ticket_medio,
        (SELECT COUNT(*)::BIGINT FROM clientes WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as clientes_mes_atual,
        (SELECT COUNT(*)::BIGINT FROM orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as pedidos_mes_atual;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- Verificar se tudo foi criado
SELECT 
    'View' as type,
    'order_with_details' as name,
    'OK' as status
UNION ALL
SELECT 
    'Function' as type,
    routine_name as name,
    'OK' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_dashboard_stats';

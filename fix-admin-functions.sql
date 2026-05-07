-- Fix para o painel admin - Criar funções RPC necessárias
-- Execute este script no SQL Editor do Supabase

-- Remover funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS get_dashboard_stats();
DROP FUNCTION IF EXISTS get_monthly_revenue();
DROP FUNCTION IF EXISTS get_popular_services();

-- Função para estatísticas do dashboard
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

-- Função para receita mensal
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE (
    mes TIMESTAMP WITH TIME ZONE,
    total_pedidos BIGINT,
    pedidos_pagos BIGINT,
    receita NUMERIC,
    receita_confirmada NUMERIC,
    ticket_medio NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', p.created_at) as mes,
        COUNT(*)::BIGINT as total_pedidos,
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END)::BIGINT as pedidos_pagos,
        COALESCE(SUM(p.valor_total), 0)::NUMERIC as receita,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.valor_total END), 0)::NUMERIC as receita_confirmada,
        COALESCE(AVG(p.valor_total), 0)::NUMERIC as ticket_medio
    FROM orders p
    WHERE p.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', p.created_at)
    ORDER BY mes DESC;
END;
$$;

-- Função para serviços populares
CREATE OR REPLACE FUNCTION get_popular_services()
RETURNS TABLE (
    service_nome TEXT,
    tipo_servico TEXT,
    total_pedidos BIGINT,
    pedidos_pagos BIGINT,
    receita_total NUMERIC,
    valor_medio NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(t.nome, r.nome)::TEXT as service_nome,
        CASE 
            WHEN t.id IS NOT NULL THEN 'trabalho'
            WHEN r.id IS NOT NULL THEN 'ritual'
        END::TEXT as tipo_servico,
        COUNT(p.id)::BIGINT as total_pedidos,
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END)::BIGINT as pedidos_pagos,
        COALESCE(SUM(p.valor_total), 0)::NUMERIC as receita_total,
        COALESCE(AVG(p.valor_total), 0)::NUMERIC as valor_medio
    FROM orders p
    LEFT JOIN trabalhos t ON p.trabalho_id = t.id
    LEFT JOIN rituais r ON p.ritual_id = r.id
    WHERE p.created_at >= NOW() - INTERVAL '6 months'
    GROUP BY COALESCE(t.nome, r.nome), 
             CASE 
                 WHEN t.id IS NOT NULL THEN 'trabalho'
                 WHEN r.id IS NOT NULL THEN 'ritual'
             END
    ORDER BY total_pedidos DESC;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_revenue() TO anon;
GRANT EXECUTE ON FUNCTION get_monthly_revenue() TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_services() TO anon;
GRANT EXECUTE ON FUNCTION get_popular_services() TO authenticated;

-- View para pedidos com detalhes (se ainda não existir)
CREATE OR REPLACE VIEW order_with_details AS
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
    
    -- Como não temos trabalho_id/ritual_id, vamos usar valores padrão
    'Serviço' as service_nome,
    'desconhecido' as tipo_servico,
    null as service_descricao
    
FROM orders p
LEFT JOIN clientes c ON p.cliente_id = c.id;

-- Verificar se tudo foi criado corretamente
SELECT 
    'Functions' as type,
    routine_name as name,
    'OK' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_dashboard_stats', 'get_monthly_revenue', 'get_popular_services')

UNION ALL

SELECT 
    'Views' as type,
    table_name as name,
    'OK' as status
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'order_with_details';

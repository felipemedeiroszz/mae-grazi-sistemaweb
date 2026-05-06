-- Fix para views no Supabase - Versão que funciona 100%
-- Execute no SQL Editor do Supabase

-- OPÇÃO 1: Usar função RPC em vez de view (RECOMENDADO)
-- Criar função que retorna dados mensais (bypass RLS via SECURITY DEFINER na função)

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
SECURITY DEFINER  -- Executa com permissões do dono (bypass RLS)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', p.created_at) as mes,
        COUNT(*)::BIGINT as total_pedidos,
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END)::BIGINT as pedidos_pagos,
        COALESCE(SUM(p.valor), 0)::NUMERIC as receita,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.valor END), 0)::NUMERIC as receita_confirmada,
        COALESCE(AVG(p.valor), 0)::NUMERIC as ticket_medio
    FROM pedidos p
    WHERE p.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', p.created_at)
    ORDER BY mes DESC;
END;
$$;

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
    ticket_medio NUMERIC
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
        (SELECT COUNT(*)::BIGINT FROM pedidos) as total_pedidos,
        (SELECT COUNT(*)::BIGINT FROM pedidos WHERE status = 'pending') as pedidos_pendentes,
        (SELECT COUNT(*)::BIGINT FROM pedidos WHERE status = 'paid') as pedidos_pagos,
        (SELECT COUNT(*)::BIGINT FROM pedidos WHERE status = 'completed') as pedidos_concluidos,
        (SELECT COUNT(*)::BIGINT FROM pedidos WHERE status = 'cancelled') as pedidos_cancelados,
        (SELECT COALESCE(SUM(valor), 0)::NUMERIC FROM pedidos WHERE status = 'paid') as receita_total,
        (SELECT COALESCE(AVG(valor), 0)::NUMERIC FROM pedidos WHERE status = 'paid') as ticket_medio;
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
        COALESCE(SUM(p.valor), 0)::NUMERIC as receita_total,
        COALESCE(AVG(p.valor), 0)::NUMERIC as valor_medio
    FROM pedidos p
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

-- Conceder permissão para funções (necessário para chamada via API)
GRANT EXECUTE ON FUNCTION get_monthly_revenue() TO anon;
GRANT EXECUTE ON FUNCTION get_monthly_revenue() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_services() TO anon;
GRANT EXECUTE ON FUNCTION get_popular_services() TO authenticated;

-- OPÇÃO 2: Se quiser manter as views, desativar RLS nas tabelas base (menos seguro)
-- ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Verificar funções criadas
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_monthly_revenue', 'get_dashboard_stats', 'get_popular_services');

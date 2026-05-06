-- Views completas para o painel admin
-- Execute este SQL no Supabase SQL Editor

-- View para todos os serviços (trabalhos + rituais)
CREATE OR REPLACE VIEW all_services AS
SELECT 
    id,
    nome,
    descricao,
    valor,
    icon_url,
    perguntas,
    ativo,
    created_at,
    updated_at,
    'trabalho' as tipo_servico
FROM trabalhos

UNION ALL

SELECT 
    id,
    nome,
    descricao,
    valor,
    icon_url,
    perguntas,
    ativo,
    created_at,
    updated_at,
    'ritual' as tipo_servico
FROM rituais;

-- View para pedidos com detalhes completos
CREATE OR REPLACE VIEW order_with_details AS
SELECT 
    p.id,
    p.cliente_id,
    p.trabalho_id,
    p.ritual_id,
    p.valor,
    p.status,
    p.asaas_payment_id,
    p.asaas_payment_url,
    p.form_data,
    p.form_submitted_at,
    p.created_at,
    p.updated_at,
    
    -- Dados do cliente
    c.nome as cliente_nome,
    c.email as cliente_email,
    c.telefone as cliente_telefone,
    
    -- Dados do trabalho (se existir)
    t.nome as trabalho_nome,
    t.descricao as trabalho_descricao,
    t.perguntas as trabalho_perguntas,
    
    -- Dados do ritual (se existir)
    r.nome as ritual_nome,
    r.descricao as ritual_descricao,
    r.perguntas as ritual_perguntas,
    
    -- Tipo de serviço
    CASE 
        WHEN t.id IS NOT NULL THEN 'trabalho'
        WHEN r.id IS NOT NULL THEN 'ritual'
        ELSE 'desconhecido'
    END as tipo_servico,
    
    -- Nome do serviço
    COALESCE(t.nome, r.nome) as service_nome,
    
    -- Descrição do serviço
    COALESCE(t.descricao, r.descricao) as service_descricao
    
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN trabalhos t ON p.trabalho_id = t.id
LEFT JOIN rituais r ON p.ritual_id = r.id;

-- View para estatísticas do dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    -- Total de trabalhos ativos
    (SELECT COUNT(*) FROM trabalhos WHERE ativo = true) as total_trabalhos,
    
    -- Total de rituais ativos
    (SELECT COUNT(*) FROM rituais WHERE ativo = true) as total_rituais,
    
    -- Total de clientes
    (SELECT COUNT(*) FROM clientes) as total_clientes,
    
    -- Total de pedidos
    (SELECT COUNT(*) FROM pedidos) as total_pedidos,
    
    -- Pedidos por status
    (SELECT COUNT(*) FROM pedidos WHERE status = 'pending') as pedidos_pendentes,
    (SELECT COUNT(*) FROM pedidos WHERE status = 'paid') as pedidos_pagos,
    (SELECT COUNT(*) FROM pedidos WHERE status = 'completed') as pedidos_concluidos,
    (SELECT COUNT(*) FROM pedidos WHERE status = 'cancelled') as pedidos_cancelados,
    
    -- Receita total
    (SELECT COALESCE(SUM(valor), 0) FROM pedidos WHERE status = 'paid') as receita_total,
    
    -- Ticket médio
    (SELECT COALESCE(AVG(valor), 0) FROM pedidos WHERE status = 'paid') as ticket_medio;

-- View para relatório financeiro mensal
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as total_pedidos,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as pedidos_pagos,
    COALESCE(SUM(valor), 0) as receita,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN valor END), 0) as receita_confirmada,
    COALESCE(AVG(valor), 0) as ticket_medio
FROM pedidos
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- View para serviços mais populares
CREATE OR REPLACE VIEW popular_services AS
SELECT 
    COALESCE(t.nome, r.nome) as service_nome,
    CASE 
        WHEN t.id IS NOT NULL THEN 'trabalho'
        WHEN r.id IS NOT NULL THEN 'ritual'
    END as tipo_servico,
    COUNT(p.id) as total_pedidos,
    COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as pedidos_pagos,
    COALESCE(SUM(p.valor), 0) as receita_total,
    COALESCE(AVG(p.valor), 0) as valor_medio
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

-- Verificar se as views foram criadas corretamente
SELECT 
    table_name,
    table_type
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('all_services', 'order_with_details', 'dashboard_stats', 'monthly_revenue', 'popular_services');

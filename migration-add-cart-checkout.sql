-- Migration: Add Cart and Checkout System
-- Created: May 4, 2026

-- Create cart_items table for temporary cart storage
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    tipo service_type NOT NULL,
    servico_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    quantidade INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cliente_id, tipo, servico_id)
);

-- Create orders table for completed orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    metodo_pagamento VARCHAR(50), -- 'pix', 'credit_card', 'debit_card'
    asaas_payment_id VARCHAR(255),
    asaas_pix_qr_code TEXT,
    asaas_pix_payload TEXT,
    asaas_payment_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table for order details
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    tipo service_type NOT NULL,
    servico_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    quantidade INTEGER DEFAULT 1,
    valor_total DECIMAL(10,2) NOT NULL,
    form_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_cliente ON cart_items(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orders_cliente ON orders(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Enable RLS on new tables
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cart_items
CREATE POLICY "Users can manage own cart items" ON cart_items
    FOR ALL USING (cliente_id = current_setting('app.current_user_id')::UUID);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (cliente_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (cliente_id = current_setting('app.current_user_id')::UUID);

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM orders WHERE cliente_id = current_setting('app.current_user_id')::UUID)
    );

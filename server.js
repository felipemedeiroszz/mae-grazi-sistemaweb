require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// ASAAS API configuration
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY
  }
});

// Create PIX Payment
app.post('/api/payments/pix', async (req, res) => {
  try {
    const { customerId, value, description, externalReference, customerData } = req.body;

    // Create or get customer
    let customer = customerId;
    if (!customer && customerData) {
      const customerResponse = await asaasClient.post('/customers', {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        cpfCnpj: customerData.cpfCnpj
      });
      customer = customerResponse.data.id;
    }

    // Create PIX payment
    const paymentResponse = await asaasClient.post('/payments', {
      customer,
      billingType: 'PIX',
      value,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description,
      externalReference
    });

    // Get PIX QR Code
    const pixResponse = await asaasClient.get(`/payments/${paymentResponse.data.id}/pixQrCode`);

    res.json({
      success: true,
      payment: paymentResponse.data,
      pix: pixResponse.data
    });
  } catch (error) {
    console.error('PIX Payment Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.description || 'Erro ao gerar PIX'
    });
  }
});

// Create Card Payment
app.post('/api/payments/card', async (req, res) => {
  try {
    const { 
      customerId, 
      value, 
      description, 
      externalReference, 
      customerData,
      creditCard,
      creditCardHolderInfo,
      installmentCount = 1
    } = req.body;

    // Create or get customer
    let customer = customerId;
    if (!customer && customerData) {
      const customerResponse = await asaasClient.post('/customers', {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        cpfCnpj: customerData.cpfCnpj
      });
      customer = customerResponse.data.id;
    }

    // Create card payment
    const paymentData = {
      customer,
      billingType: 'CREDIT_CARD',
      value,
      dueDate: new Date().toISOString().split('T')[0],
      description,
      externalReference,
      installmentCount: installmentCount > 1 ? installmentCount : undefined
    };

    // Add card data
    if (creditCard && creditCardHolderInfo) {
      paymentData.creditCard = creditCard;
      paymentData.creditCardHolderInfo = creditCardHolderInfo;
    }

    console.log('Enviando pagamento para Asaas:', JSON.stringify(paymentData, null, 2));
    const paymentResponse = await asaasClient.post('/payments', paymentData);
    console.log('Resposta do Asaas:', JSON.stringify(paymentResponse.data, null, 2));

    res.json({
      success: true,
      payment: paymentResponse.data
    });
  } catch (error) {
    console.error('Card Payment Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.description || 'Erro ao processar cartão'
    });
  }
});

// Check Payment Status
app.get('/api/payments/:paymentId/status', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const response = await asaasClient.get(`/payments/${paymentId}`);
    
    res.json({
      success: true,
      status: response.data.status,
      payment: response.data
    });
  } catch (error) {
    console.error('Status Check Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status'
    });
  }
});

// ASAAS Webhook Handler
app.post('/api/webhooks/asaas', async (req, res) => {
  try {
    const { event, payment } = req.body;
    
    // Verify webhook secret (optional security)
    const webhookSecret = req.headers['asaas-webhook-secret'];
    if (webhookSecret !== process.env.ASAAS_WEBHOOK_SECRET) {
      console.warn('Invalid webhook secret');
    }

    console.log('Webhook received:', event, payment);

    // Handle different payment events
    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        // Update order status in database
        const { data, error } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            asaas_payment_status: payment.status
          })
          .eq('asaas_payment_id', payment.id);
        
        if (error) {
          console.error('Database update error:', error);
        }
        break;

      case 'PAYMENT_OVERDUE':
        await supabase
          .from('orders')
          .update({ 
            status: 'overdue',
            asaas_payment_status: payment.status
          })
          .eq('asaas_payment_id', payment.id);
        break;

      case 'PAYMENT_DELETED':
        await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            asaas_payment_status: payment.status
          })
          .eq('asaas_payment_id', payment.id);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get Payment QR Code (for polling)
app.get('/api/payments/:paymentId/qrcode', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const response = await asaasClient.get(`/payments/${paymentId}/pixQrCode`);
    
    res.json({
      success: true,
      qrCode: response.data
    });
  } catch (error) {
    console.error('QR Code Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter QR Code'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Mae Grazi Backend running on port ${PORT}`);
    console.log(`ASAAS API URL: ${ASAAS_API_URL}`);
  });
}

# Configuração de Webhooks - Asaas Mae Grazi

## URLs de Webhook

### 1. URL de Webhook no Backend

```
POST /api/webhooks/asaas
```

**URL completa:**
- Produção: `https://seudominio.com/api/webhooks/asaas`
- Desenvolvimento: `http://localhost:3000/api/webhooks/asaas`

---

## URLs de Callback (Redirecionamento Após Pagamento)

### Para Trabalhos/Rituais Individuais (`cliente.js`)

```javascript
successUrl: https://seudominio.com/cliente-dashboard.html?payment=success&order=ID
autoUrl: https://seudominio.com/cliente-dashboard.html?payment=auto&order=ID
```

### Para Pagamentos do Carrinho (`services.js`)

```javascript
callbackUrl: https://seudominio.com/payment-callback
successUrl: https://seudominio.com/payment-success
pendingPaymentUrl: https://seudominio.com/payment-pending
```

---

## Webhooks para Ativar no Painel Asaas

Acesse: [https://sandbox.asaas.com](https://sandbox.asaas.com) → **Configurações → Webhooks**

### Eventos Obrigatórios (✅)

| Evento | Descrição | Ação no Sistema |
|--------|-----------|-----------------|
| ✅ **PAYMENT_CONFIRMED** | Pagamento confirmado | Atualiza pedido para "paid", redireciona cliente para formulários |
| ✅ **PAYMENT_RECEIVED** | Pagamento recebido | Mesma ação acima (backup) |
| ✅ **PAYMENT_OVERDUE** | Pagamento vencido | Atualiza pedido para "overdue" |
| ✅ **PAYMENT_CANCELLED** | Pagamento cancelado | Atualiza pedido para "cancelled" |

### Eventos Opcionais (⬜)

| Evento | Descrição | Uso |
|--------|-----------|-----|
| ⬜ **PAYMENT_CREATED** | Pagamento criado | Apenas para logs/debug |
| ⬜ **PAYMENT_UPDATED** | Pagamento atualizado | Apenas para logs/debug |
| ⬜ **PAYMENT_DELETED** | Pagamento removido | Raramente usado |

---

## Configuração no Painel Asaas

### Passo a Passo:

1. Acesse o painel: https://sandbox.asaas.com (ou produção)
2. Clique em **Configurações** no menu lateral
3. Selecione **Webhooks**
4. Clique em **Novo Webhook**
5. Preencha os campos:

```
Nome: Mae Grazi - Pagamentos
URL: https://seudominio.com/api/webhooks/asaas
Método HTTP: POST
Formato: JSON
```

6. Em **Eventos**, selecione:
   - ☑️ PAYMENT_CONFIRMED
   - ☑️ PAYMENT_RECEIVED
   - ☑️ PAYMENT_OVERDUE
   - ☑️ PAYMENT_CANCELLED

7. (Opcional) Configure **Webhook Secret** para segurança adicional
8. Clique em **Salvar**

---

## Variáveis de Ambiente (.env)

```env
# ============================================
# ASAAS CONFIGURATION
# ============================================

# Chave de API do Asaas (obrigatória)
# Sandbox: começa com '$aact_'
# Produção: começa com '$aact_' também, mas de conta diferente
ASAAS_API_KEY=$aact_YTU5YTE0M2N2NjIwNDMxYjAwNTU3NjU3ZDk1MzQ0MmQ0

# URL da API (sandbox ou produção)
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
# ASAAS_API_URL=https://api.asaas.com/v3  # Produção

# Webhook Secret (opcional, para validar requests)
ASAAS_WEBHOOK_SECRET=seu_webhook_secret_aqui

# ============================================
# SUPABASE CONFIGURATION
# ============================================

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_aqui

# ============================================
# APPLICATION CONFIGURATION
# ============================================

PORT=3000
NODE_ENV=production
APP_URL=https://seudominio.com
```

---

## Fluxo Completo de Pagamento

```
┌─────────────────┐
│  1. Cliente     │
│  clica pagar    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 2. Sistema      │
│ cria cobrança   │
│ no Asaas        │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 3. Cliente      │
│ realiza pagamento│
│ (PIX/Cartão/    │
│  Boleto)        │
└────────┬────────┘
         ↓
┌─────────────────────────────────┐
│ 4. Asaas dispara webhook        │
│    PAYMENT_CONFIRMED            │
│    para /api/webhooks/asaas     │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 5. Backend atualiza             │
│    status no Supabase           │
│    (orders → status: 'paid')    │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 6. Cliente é redirecionado      │
│    para cliente-dashboard.html  │
│    ?payment=success&order=ID    │
└────────┬────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 7. Sistema detecta callback     │
│    e redireciona para:          │
│    "Responder Formulários"       │
└─────────────────────────────────┘
```

---

## Estrutura do Webhook

### Payload Recebido (Exemplo PAYMENT_CONFIRMED)

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_123456789",
    "customer": "cus_123456789",
    "subscription": null,
    "installment": null,
    "externalReference": "uuid-do-pedido-aqui",
    "status": "CONFIRMED",
    "value": 150.00,
    "netValue": 145.50,
    "description": "Trabalho: Amarração Amorosa",
    "billingType": "PIX",
    "confirmedDate": "2024-01-15",
    "paymentDate": "2024-01-15",
    "invoiceUrl": "https://sandbox.asaas.com/i/123456789",
    "bankSlipUrl": null,
    "transactionReceiptUrl": "https://sandbox.asaas.com/comprovante/..."
  }
}
```

### Processamento no Backend (`server.js`)

```javascript
app.post('/api/webhooks/asaas', async (req, res) => {
  const { event, payment } = req.body;
  
  // Opcional: Validar webhook secret
  const webhookSecret = req.headers['asaas-webhook-secret'];
  
  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      // Atualiza pedido para pago
      await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          asaas_payment_status: payment.status
        })
        .eq('asaas_payment_id', payment.id);
      break;
      
    case 'PAYMENT_OVERDUE':
      // Pedido vencido
      await supabase
        .from('orders')
        .update({ status: 'overdue' })
        .eq('asaas_payment_id', payment.id);
      break;
      
    case 'PAYMENT_CANCELLED':
      // Pedido cancelado
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('asaas_payment_id', payment.id);
      break;
  }
  
  res.status(200).json({ received: true });
});
```

---

## Testando Webhooks em Desenvolvimento

### Opção 1: Usar ngrok (Recomendado)

```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar tunnel
ngrok http 3000

# URL gerada (exemplo):
# https://abc123.ngrok.io/api/webhooks/asaas
```

Configure essa URL temporária no painel Asaas.

### Opção 2: Usar LocalTunnel

```bash
npx localtunnel --port 3000
```

### Opção 3: Testar via Postman/curl

```bash
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_test_123",
      "status": "CONFIRMED",
      "externalReference": "seu-uuid-de-teste",
      "value": 150.00
    }
  }'
```

---

## Troubleshooting

### Problema: Webhook não está chegando

**Verificações:**
1. URL está acessível publicamente? (não pode ser localhost)
2. Verifique logs do servidor: `console.log('Webhook received:', req.body)`
3. Confira se o evento está ativado no painel Asaas
4. Verifique se o firewall está bloqueando requests

### Problema: Pedido não atualiza no banco

**Verificações:**
1. `asaas_payment_id` está sendo salvo ao criar o pedido?
2. Query do Supabase está correta? `.eq('asaas_payment_id', payment.id)`
3. Verifique permissões RLS no Supabase

### Problema: Cliente não é redirecionado

**Verificações:**
1. `successUrl` está configurada corretamente?
2. Verifique se `checkPaymentCallback()` está sendo chamado no cliente-dashboard.js
3. URL tem os parâmetros corretos: `?payment=success&order=ID`

---

## Links Úteis

- [Documentação Oficial Asaas](https://docs.asaas.com/)
- [Webhook Events Asaas](https://docs.asaas.com/docs/webhook-para-status-de-pagamentos)
- [Painel Sandbox](https://sandbox.asaas.com/)
- [Painel Produção](https://app.asaas.com/)

---

## Resumo para Copiar

```bash
# URL do Webhook:
https://seudominio.com/api/webhooks/asaas

# Eventos a ativar:
☑️ PAYMENT_CONFIRMED
☑️ PAYMENT_RECEIVED
☑️ PAYMENT_OVERDUE
☑️ PAYMENT_CANCELLED
```

---

**Data de criação:** 04/05/2026  
**Última atualização:** 04/05/2026

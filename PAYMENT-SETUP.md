# Configuração de Pagamentos - Mae Grazi

## Visão Geral

Sistema de pagamentos integrado com ASAAS API, suportando:
- Pagamento via PIX (QR Code)
- Pagamento via Cartão de Crédito/Débito
- Webhook para atualização automática de status

## Estrutura

```
maegrazi/
├── .env                          # Variáveis de ambiente
├── package.json                  # Dependências do backend
├── server.js                     # Backend API (Node.js/Express)
├── services.js                   # Frontend (integração API)
└── index.html                    # Página principal
```

## Instalação

### 1. Instalar dependências do backend

```bash
npm install
```

### 2. Configurar variáveis de ambiente (.env)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://neemeubleifwmryowqzh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7

# ASAAS API (Sandbox para testes)
ASAAS_API_KEY=$aact_YTU5YTE0M2N2NjIwNDMxYjAwNTU3NjU3ZDk1MzQ0MmQ0
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_SECRET=webhook_secret_mae_grazi_2024

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar Webhook no ASAAS

1. Acesse o painel do ASAAS (sandbox.asaas.com)
2. Vá em Configurações → Webhooks
3. Adicione a URL: `http://localhost:3001/api/webhooks/asaas`
4. Selecione eventos:
   - `PAYMENT_RECEIVED`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_DELETED`
5. Configure o header `asaas-webhook-secret` com o valor de `ASAAS_WEBHOOK_SECRET`

## Executar

### Iniciar Backend

```bash
npm start
# ou
npm run dev  # com nodemon (auto-reload)
```

Backend rodará em `http://localhost:3001`

### Iniciar Frontend

Abra o `index.html` em um servidor web (Live Server, XAMPP, etc.)

```bash
# Exemplo com Live Server (VS Code)
# Clique com botão direito em index.html → "Open with Live Server"
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/payments/pix` | Criar pagamento PIX |
| POST | `/api/payments/card` | Criar pagamento com cartão |
| GET | `/api/payments/:id/status` | Verificar status |
| GET | `/api/payments/:id/qrcode` | Obter QR Code |
| POST | `/api/webhooks/asaas` | Webhook ASAAS |
| GET | `/api/health` | Health check |

### Exemplo: Criar PIX

```bash
curl -X POST http://localhost:3001/api/payments/pix \
  -H "Content-Type: application/json" \
  -d '{
    "customerData": {
      "name": "João Silva",
      "email": "joao@email.com",
      "cpfCnpj": "12345678900",
      "phone": "11999999999"
    },
    "value": 150.00,
    "description": "Pedido #123 - Mae Grazi",
    "externalReference": "order-uuid-here"
  }'
```

### Exemplo: Criar pagamento com Cartão

```bash
curl -X POST http://localhost:3001/api/payments/card \
  -H "Content-Type: application/json" \
  -d '{
    "customerData": { ... },
    "value": 150.00,
    "description": "Pedido #123",
    "externalReference": "order-uuid",
    "installmentCount": 3,
    "creditCard": {
      "holderName": "JOAO SILVA",
      "number": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "ccv": "123"
    },
    "creditCardHolderInfo": {
      "name": "JOAO SILVA",
      "email": "joao@email.com",
      "cpfCnpj": "12345678900",
      "mobilePhone": "11999999999"
    }
  }'
```

## Fluxo de Pagamento

### PIX

1. Usuário adiciona itens ao carrinho
2. Clica em "Finalizar Compra"
3. Seleciona "Pagar com PIX"
4. Backend cria pagamento no ASAAS
5. Frontend exibe QR Code para scan ou cópia
6. Usuário paga via app bancário
7. ASAAS envia webhook confirmando pagamento
8. Backend atualiza status no Supabase
9. Frontend redireciona para formulário

### Cartão

1. Usuário adiciona itens ao carrinho
2. Clica em "Finalizar Compra"
3. Seleciona "Pagar com Cartão"
4. Preenche dados (visualização 3D do cartão)
5. Backend processa pagamento no ASAAS
6. Se aprovado: redireciona para formulário
7. Se pendente: aguarda webhook

## Banco de Dados (Supabase)

Tabelas necessárias:
- `orders` - Pedidos
- `order_items` - Itens do pedido
- `cart_items` - Carrinho temporário

### Migration (já criada)

`migration-add-cart-checkout.sql`

## Testes

Para testar sem processar pagamentos reais:

1. Use o ambiente **Sandbox** do ASAAS
2. Cartões de teste:
   - Visa: `4111111111111111`
   - Mastercard: `5555666677778884`
3. PIX: O QR Code gerado não processa valor real

## Produção

Para colocar em produção:

1. Crie conta no ASAAS (ambiente de produção)
2. Gere nova API Key de produção
3. Atualize `ASAAS_API_URL` para `https://api.asaas.com/v3`
4. Configure webhook com URL pública (ex: ngrok ou domínio)
5. Habilite HTTPS no backend

## Suporte

- ASAAS Docs: https://asaas.com.br/documentacao
- Sandbox: https://sandbox.asaas.com

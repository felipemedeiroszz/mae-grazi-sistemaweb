# Deploy no Vercel - Guia Completo

## 📋 Pré-requisitos

- Conta no Vercel (https://vercel.com)
- Repositório Git configurado
- Variáveis de ambiente do ASAAS e Supabase

## 🚀 Passo a Passo para Deploy

### 1. Preparar o Repositório

```bash
# Adicionar arquivos ao Git
git add .
git commit -m "Configuração para deploy no Vercel"
git push origin main
```

### 2. Configurar Variáveis de Ambiente no Vercel

Acesse o dashboard do Vercel → Project Settings → Environment Variables e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://neemeubleifwmryowqzh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7
ASAAS_API_KEY=$aact_YTU5YTE0M2N2NjIwNDMxYjAwNTU3NjU3ZDk1MzQ0MmQ0
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_SECRET=webhook_secret_mae_grazi_2024
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

### 3. Conectar o Repositório ao Vercel

1. Faça login no Vercel
2. Clique em "Add New Project"
3. Importe o repositório do seu projeto
4. O Vercel detectará automaticamente a configuração

### 4. Configurar Domínio (Opcional)

1. Vá para Project Settings → Domains
2. Adicione seu domínio personalizado
3. Configure o DNS conforme instruções do Vercel

## 🔧 Arquivos de Configuração Criados

### `vercel.json`
- Configura rotas para API e arquivos estáticos
- Define builds para Node.js e arquivos estáticos
- Configura timeout de 30s para funções

### `.vercelignore`
- Exclui arquivos desnecessários do deploy
- Mantém o build limpo e otimizado

### `.env.example`
- Template para variáveis de ambiente
- Facilita configuração em diferentes ambientes

## 🌐 Estrutura do Deploy

```
├── server.js              → API Backend (Vercel Functions)
├── *.html                 → Páginas estáticas
├── *.css                  → Estilos
├── *.js                   → Scripts frontend
├── *.png, *.jpg, *.jpeg   → Imagens
└── assets/                → Outros recursos estáticos
```

## 📡 Endpoints da API

Após o deploy, os endpoints ficarão disponíveis em:

```
https://seu-dominio.vercel.app/api/payments/pix
https://seu-dominio.vercel.app/api/payments/card
https://seu-dominio.vercel.app/api/payments/:id/status
https://seu-dominio.vercel.app/api/webhooks/asaas
https://seu-dominio.vercel.app/api/health
```

## 🔍 Testes Pós-Deploy

### 1. Testar API
```bash
curl https://seu-dominio.vercel.app/api/health
```

### 2. Testar Webhook
Configure o webhook no ASAAS apontando para:
```
https://seu-dominio.vercel.app/api/webhooks/asaas
```

### 3. Testar Frontend
Acesse a URL principal e verifique:
- Carregamento das páginas
- Funcionalidade do carrinho
- Processo de pagamento

## 🚨 Importante

- **ASAAS Webhook**: Configure o webhook no painel ASAAS após o deploy
- **HTTPS**: O Vercel fornece HTTPS automaticamente
- **Build Time**: O primeiro deploy pode demorar mais
- **Logs**: Monitore os logs no dashboard do Vercel

## 🛠️ Comandos Úteis

```bash
# Ver logs de deploy
vercel logs

# Deploy manual
vercel --prod

# Testar localmente
npm run dev
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs no dashboard Vercel
2. Confirme as variáveis de ambiente
3. Teste a API localmente
4. Verifique a configuração do webhook ASAAS

---

**Status**: ✅ Configuração concluída para deploy no Vercel

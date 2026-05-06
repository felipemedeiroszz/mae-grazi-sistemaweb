# Mae Grazi - Sistema Completo de Administração

## 📋 Visão Geral

Sistema completo para gerenciamento de serviços espirituais com:
- Painel administrativo
- Área do cliente
- Integração com Supabase
- Pagamentos via Asaas
- Upload de arquivos
- Formulários dinâmicos

## 🚀 Configuração Rápida

### 1. Supabase Setup

1. Crie um novo projeto em [Supabase](https://supabase.com)
2. Execute o SQL do arquivo `database-schema.sql` no editor SQL do seu projeto
3. Configure o Storage:
   - Crie os buckets: `icons` (público) e `order_files` (privado)
   - Configure as políticas de acesso conforme o schema

### 2. Configurar Credenciais

Nos arquivos `admin.js` e `cliente.js`, atualize as credenciais:

```javascript
// Supabase Configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Asaas Configuration
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3'; // Sandbox para testes
const ASAAS_API_KEY = 'your-asaas-api-key';
```

### 3. Asaas Setup

1. Crie uma conta em [Asaas](https://asaas.com.br)
2. Obtenha sua API Key
3. Configure webhooks para notificações de pagamento

## 📁 Estrutura de Arquivos

```
maegrazi/
├── index.html              # Site principal
├── admin.html              # Painel administrativo
├── cliente.html            # Área do cliente
├── styles.css              # Estilos do site
├── admin.js                # Funcionalidades admin
├── cliente.js              # Funcionalidades cliente
├── database-schema.sql     # Schema do banco
└── README-SETUP.md         # Este arquivo
```

## 🔧 Funcionalidades

### Painel Administrativo (`admin.html`)

- **Autenticação**: Login seguro para administradores
- **Gerenciamento de Trabalhos**:
  - Cadastrar/editar/excluir trabalhos
  - Upload de ícones
  - Configurar perguntas do formulário
  - Definir valores
- **Gerenciamento de Rituais**:
  - Cadastrar/editar/excluir rituais
  - Upload de ícones
  - Configurar perguntas do formulário
  - Definir valores
- **Visualização de Pedidos**:
  - Status dos pagamentos
  - Informações dos clientes
  - Histórico de pedidos
- **Gerenciamento de Clientes**:
  - Lista de clientes cadastrados
  - Histórico de pedidos por cliente

### Área do Cliente (`cliente.html`)

- **Catálogo de Serviços**:
  - Visualização de trabalhos e rituais
  - Detalhes completos de cada serviço
  - Valores e descrições
- **Sistema de Pedidos**:
  - Solicitação de serviços
  - Integração com Asaas para pagamento
  - Status em tempo real
- **Formulários Dinâmicos**:
  - Preenchimento após pagamento confirmado
  - Perguntas personalizadas por serviço
  - Salvamento automático
- **Upload de Arquivos**:
  - Anexar imagens relacionadas ao pedido
  - Visualização dos arquivos enviados
  - Gerenciamento completo

### Integrações

#### Supabase
- **Banco de dados**: PostgreSQL com Row Level Security
- **Storage**: Upload de ícones e arquivos de pedidos
- **Autenticação**: Login seguro para admin e clientes
- **Realtime**: Atualizações em tempo real (opcional)

#### Asaas
- **Pagamentos**: Processamento seguro de pagamentos
- **Múltiplos métodos**: Boleto, PIX, Cartão de crédito
- **Webhooks**: Notificações automáticas de status
- **Sandbox**: Ambiente de testes integrado

## 🛠️ Configuração Detalhada

### 1. Supabase

#### Tabelas Criadas:
- `trabalhos`: Serviços de trabalhos espirituais
- `rituais`: Serviços de rituais
- `clientes`: Informações dos clientes
- `pedidos`: Pedidos realizados
- `pedido_files`: Arquivos anexados aos pedidos
- `admin_users`: Usuários administrativos

#### Storage Buckets:
- `icons`: Ícones dos serviços (público)
- `order_files`: Arquivos dos clientes (privado)

#### Segurança:
- Row Level Security (RLS) em todas as tabelas
- Políticas de acesso granulares
- Autenticação via Supabase Auth

### 2. Asaas

#### Configuração de Pagamento:
```javascript
const paymentData = {
    customer: customerData.id,
    billingType: 'UNDEFINED', // BOLETO, CREDIT_CARD, PIX
    value: service.valor,
    dueDate: '2024-01-01',
    description: 'Descrição do serviço',
    externalReference: orderId,
    callback: {
        successUrl: 'https://seusite.com/sucesso',
        autoUrl: 'https://seusite.com/pagamento'
    }
};
```

#### Webhooks:
- Configure URLs para receber notificações
- Processar confirmações de pagamento
- Atualizar status dos pedidos

## 🎨 Personalização

### Estilos
- Tema escuro com detalhes dourados
- Efeitos elétricos nas bordas
- Design responsivo
- Animações suaves

### Cores
- Amarelo/Dourado: `#d4af37`
- Laranja: `#ff6b35`
- Fundo escuro: `#0a0a0a`
- Vidro fosco: `rgba(255, 255, 255, 0.1)`

## 📱 Responsividade

O sistema é totalmente responsivo:
- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Interface adaptada para touch
- **Mobile**: Navegação otimizada para telas pequenas

## 🔐 Segurança

### Autenticação
- Login via Supabase Auth
- Tokens JWT seguros
- Sessões gerenciadas

### Permissões
- Admin: Acesso total ao painel
- Cliente: Acesso apenas aos próprios pedidos
- RLSE: Políticas de acesso no banco

### Dados Sensíveis
- API keys em variáveis de ambiente
- Criptografia de senhas
- HTTPS obrigatório

## 🚀 Deploy

### Produção
1. Configure ambiente de produção
2. Troque URLs do Asaas para produção
3. Configure domínios personalizados
4. Ative HTTPS
5. Configure webhooks de produção

### Variáveis de Ambiente
```bash
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-key
VITE_ASAAS_API_URL=https://www.asaas.com/api/v3
VITE_ASAAS_API_KEY=your-production-api-key
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Login não funciona**
   - Verifique credenciais Supabase
   - Confirme usuário criado em admin_users

2. **Upload de arquivos falha**
   - Verifique permissões do Storage
   - Confirme tamanho máximo do arquivo

3. **Pagamento não processa**
   - Verifique API Key do Asaas
   - Confirme dados do cliente

4. **Formulário não aparece**
   - Verifique status do pedido (deve ser "paid")
   - Confirme perguntas configuradas

### Logs e Debug
- Console do navegador para erros JavaScript
- Logs do Supabase para problemas de banco
- Logs do Asaas para problemas de pagamento

## 📈 Monetização

### Receitas
- Venda de serviços espirituais
- Diferentes faixas de preço
- Upsells de serviços premium

### Custos
- Supabase: Plano gratuito até certo limite
- Asaas: Taxa por transação
- Hosting: Variável conforme provedor

## 🔄 Manutenção

### Tarefas Semanais
- Verificar status dos pedidos
- Backup do banco de dados
- Monitorar performance

### Tarefas Mensais
- Atualizar conteúdo dos serviços
- Revisar relatórios de vendas
- Otimizar performance

## 📞 Suporte

### Para Admins
- Manual completo de uso
- Vídeos tutoriais
- Suporte via email/WhatsApp

### Para Clientes
- FAQ integrado ao site
- Chat de suporte
- Canal de WhatsApp

## 🚀 Próximos Passos

1. **Setup Inicial**: Configure Supabase e Asaas
2. **Testes**: Teste todas as funcionalidades
3. **Conteúdo**: Cadastre seus serviços
4. **Launch**: Coloque no ar
5. **Marketing**: Divulgue seus serviços

---

## 📞 Contato

Para suporte técnico ou dúvidas:
- Email: suporte@maegrazi.com
- WhatsApp: (XX) XXXXX-XXXX

---

**Desenvolvido com ❤️ para Mae Grazi**

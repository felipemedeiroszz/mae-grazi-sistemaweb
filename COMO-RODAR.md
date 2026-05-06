# Como Rodar Frontend + Backend para Testes

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 16+)
2. **Navegador** moderno
3. **Conta Supabase** com projeto criado
4. **Editor de código** (VS Code recomendado)

## 🚀 Passo a Passo

### 1. Configurar Supabase

#### 1.1 Executar Schema SQL
```sql
-- Abra o Supabase Dashboard → SQL Editor
-- Copie e cole todo o conteúdo de database-schema.sql
-- Execute o script
```

#### 1.2 Verificar Configuração
- ✅ Tabelas criadas: `admin_users`, `clientes`, `trabalhos`, `rituais`, `pedidos`
- ✅ Storage buckets: `icons`, `order_files`
- ✅ RLS policies ativas
- ✅ Funções de hash criadas

### 2. Configurar Frontend

#### 2.1 Variáveis de Ambiente
Verifique se `.env` está correto:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://neemeubleifwmryowqzh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7
```

#### 2.2 Atualizar services.js
Verifique se as credenciais estão corretas:
```javascript
// services.js - linha 1-3
const SUPABASE_URL = 'https://neemeubleifwmryowqzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 3. Rodar Servidor Local

#### 3.1 Usando Live Server (Recomendado)
```bash
# Instale Live Server globalmente
npm install -g live-server

# Navegue até a pasta do projeto
cd "c:\Users\felip\OneDrive\Área de Trabalho\maegrazi"

# Inicie o servidor
live-server --port=3000
```

#### 3.2 Usando Python (Alternativa)
```bash
# Python 3
cd "c:\Users\felip\OneDrive\Área de Trabalho\maegrazi"
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

#### 3.3 Usando VS Code
1. Abra a pasta `maegrazi` no VS Code
2. Instale a extensão "Live Server"
3. Clique com botão direito em `index.html`
4. Selecione "Open with Live Server"

### 4. Acessar Aplicação

#### 4.1 URLs de Acesso
- **Site Principal**: http://localhost:3000
- **Painel Admin**: http://localhost:3000/admin.html
- **Área Cliente**: http://localhost:3000/cliente.html
- **Cadastro**: http://localhost:3000/cadastro.html

#### 4.2 Credenciais de Teste
**Admin:**
- Email: `admin@maegrazi.com`
- Senha: `admin123` (será criada no primeiro login)

**Cliente:**
- Email: `cliente@exemplo.com`
- Senha: `cliente123` (será criada no primeiro login)

## 🔧 Testes de Integração

### 1. Testar Conexão com Supabase
```javascript
// Abra o console do navegador (F12)
// Navegue até o site
// Verifique se não há erros de conexão
```

### 2. Testar Cadastro de Serviços
1. Acesse: http://localhost:3000/admin.html
2. Faça login como admin
3. Clique em "Adicionar Trabalho"
4. Preencha os campos e salve
5. Verifique se aparece no site principal

### 3. Testar Cadastro de Cliente
1. Acesse: http://localhost:3000/cadastro.html
2. Preencha o formulário
3. Verifique se o cliente é criado no Supabase

### 4. Testar Realtime
1. Admin: Cadastre um novo trabalho
2. Site: Verifique se aparece automaticamente
3. Console: Deve mostrar "Trabalho changed"

## 🐛 Solução de Problemas

### Erro Comum 1: "CORS policy blocking"
**Solução:**
```bash
# Verifique se o URL no .env está correto
# Reinicie o servidor após mudar o .env
```

### Erro Comum 2: "RLS policy violation"
**Solução:**
```sql
-- Execute no Supabase SQL Editor
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
-- Depois reative com políticas corretas
```

### Erro Comum 3: "Storage bucket not found"
**Solução:**
```sql
-- Execute no Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('icons', 'icons', true)
ON CONFLICT (id) DO NOTHING;
```

### Erro Comum 4: "Function not found"
**Solução:**
```sql
-- Execute no Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Execute novamente o database-schema.sql
```

## 📱 Testes Mobile

### 1. Modo Responsivo
- Abra o site no celular
- Teste todos os botões e navegação
- Verifique o layout em diferentes telas

### 2. Debug Mobile
```bash
# Chrome DevTools → Toggle device toolbar
# Selecione dispositivos móveis
# Teste touch events
```

## 🔄 Fluxo Completo de Testes

### 1. Setup Inicial
```bash
✅ Supabase configurado
✅ Schema SQL executado
✅ .env atualizado
✅ Servidor local rodando
```

### 2. Teste Admin
```bash
✅ Login admin funciona
✅ Cadastro de trabalhos funciona
✅ Cadastro de rituais funciona
✅ Upload de ícones funciona
```

### 3. Teste Cliente
```bash
✅ Cadastro de cliente funciona
✅ Login de cliente funciona
✅ Visualização de serviços funciona
✅ Pedido de serviço funciona
```

### 4. Teste Integração
```bash
✅ Realtime updates funcionam
✅ Storage funciona
✅ RLS policies funcionam
✅ Autenticação própria funciona
```

## 🎯 Próximos Passos

### 1. Produção
- Configurar domínio personalizado
- Otimizar performance
- Configurar HTTPS

### 2. Monitoramento
- Adicionar analytics
- Configurar error tracking
- Monitorar performance

### 3. Segurança
- Implementar rate limiting
- Adicionar validação adicional
- Configurar backup automático

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador
2. Confirme as credenciais do Supabase
3. Execute o schema SQL novamente
4. Reinicie o servidor local

**Boa sorte com seus testes!** 🚀

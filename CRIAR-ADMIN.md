# Como Criar Usuário Admin

## 🚨 **Problema: Login não funciona**

O erro "Invalid login credentials" acontece porque não há usuário admin cadastrado no Supabase.

## ✅ **Solução: Criar Usuário Admin**

### **Passo 1: Acessar Supabase Dashboard**
1. Abra: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `neemeubleifwmryowqzh`

### **Passo 2: Abrir SQL Editor**
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query** (+)

### **Passo 3: Executar Script SQL**
Copie e cole este código no SQL Editor:

```sql
-- Criar usuário admin para testes
INSERT INTO admin_users (email, password_hash, nome, role) VALUES 
('admin@maegrazi.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9S', 'Administrador Mae Grazi', 'admin');
```

4. Clique em **Run** para executar

### **Passo 4: Verificar Usuário Criado**
Execute este SQL para confirmar:

```sql
SELECT * FROM admin_users WHERE email = 'admin@maegrazi.com';
```

### **Passo 5: Fazer Login**
Agora use estas credenciais no painel admin:

**📧 Email:** `admin@maegrazi.com`  
**🔑 Senha:** `admin123`

## 🔧 **Se Ainda Não Funcionar**

### **Opção A: Usar Auth do Supabase**
Se preferir usar o Auth nativo do Supabase:

1. Vá em **Authentication** → **Users**
2. Clique em **Add user**
3. Email: `admin@maegrazi.com`
4. Senha: `admin123`
5. Marque **Confirm email**
6. Clique em **Save**

### **Opção B: Verificar Schema**
Se o SQL der erro, execute primeiro:

```sql
-- Verificar se tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'admin_users';
```

## 🎯 **Teste Final**

1. **Acesse**: http://localhost:3000/admin.html
2. **Login**: `admin@maegrazi.com` / `admin123`
3. **Resultado**: Dashboard deve carregar

## 📞 **Suporte**

Se ainda tiver problemas:
1. Verifique o console do navegador (F12)
2. Confirme que o SQL foi executado sem erros
3. Reinicie o servidor local

**Boa sorte!** 🚀

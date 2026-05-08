# Guia de Configuração Manual do Supabase Storage

Devido a limitações de permissões no SQL Editor, configure o bucket manualmente no painel do Supabase.

## Passo 1: Acessar o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard/project/neemeubleifwmryowqzh
2. Faça login se necessário

## Passo 2: Criar o Bucket
1. No menu lateral, clique em **Storage**
2. Clique no botão **New bucket**
3. Configure:
   - **Nome:** `form-images`
   - **Public:** Marque como público (enable public bucket)
   - **File size limit:** 50MB (ou deixe padrão)
   - **Allowed MIME types:** `image/png`, `image/jpeg`, `image/jpg`
4. Clique em **Create bucket**

## Passo 3: Configurar Políticas RLS (Policies)
1. No bucket `form-images`, clique na aba **Policies**
2. Clique em **New Policy**

### Política de Upload
1. Policy name: `form-images-upload`
2. Definition: 
   ```
   INSERT INTO storage.objects (bucket_id, name, owner) 
   VALUES (auth.uid(), 'form-images', storage.filename(name), auth.uid())
   ```
3. Roles: Selecione `authenticated`
4. Clique em **Save**

### Política de Leitura Pública
1. Policy name: `form-images-read`
2. Definition:
   ```
   SELECT * FROM storage.objects WHERE bucket_id = 'form-images'
   ```
3. Roles: Selecione `authenticated` e `anon`
4. Clique em **Save**

## Passo 4: Verificar Configuração
1. No painel Storage, você deve ver o bucket `form-images`
2. Clique no bucket e verifique se está marcado como público
3. Na aba Policies, você deve ver as políticas criadas

## Passo 5: Testar Upload
1. No sistema cliente-dashboard, tente fazer upload de uma imagem
2. Se funcionar, a configuração está correta

## Solução Alternativa: Desabilitar RLS
Se as políticas não funcionarem, você pode desabilitar RLS temporariamente:
1. No painel Storage, clique em **Settings**
2. Desmarque **Enable Row Level Security**
3. Salve as alterações

⚠️ **Aviso:** Desabilitar RLS torna o bucket completamente público sem restrições.

## Resumo
- **Bucket:** `form-images` (público)
- **Permissões:** Upload para autenticados, leitura para todos
- **Formatos:** PNG, JPG (máx. 50MB)
- **Status:** Configuração manual recomendada

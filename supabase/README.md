# IRIS Platform - Supabase Edge Functions

## Estrutura

```
supabase/
  config.toml              # Configuracao do Supabase
  functions/
    import_map.json        # Mapa de imports para Deno
    process-meeting-pdf/   # Edge Function para processar PDFs
      index.ts
  migrations/
    20250208_create_deliberacoes_tables.sql  # Schema do banco
```

## Edge Function: process-meeting-pdf

Processa PDFs de deliberacoes da ARTESP usando Gemini AI.

### Entrada (POST)

```json
{
  "reuniao_id": "uuid-opcional",
  "pdf_base64": "base64-do-pdf",
  "link_pdf": "url-opcional-do-pdf"
}
```

### Saida (Sucesso)

```json
{
  "success": true,
  "duplicado": false,
  "deliberacao": {
    "processo": "DER-2024/12345",
    "interessado": "Ecovias",
    "microtema": "Revisao Tarifaria",
    "decisao": "Deferido",
    "tipo": "Pleito Externo"
  }
}
```

### Saida (Duplicado)

```json
{
  "success": true,
  "duplicado": true,
  "message": "Deliberacao ja existe no banco"
}
```

### Saida (Erro)

```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

## Variaveis de Ambiente Necessarias

Configure no Supabase Dashboard > Edge Functions > Secrets:

- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de servico
- `GEMINI_API_KEY` - Chave da API Gemini

## Deploy

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login

```bash
supabase login
```

### 3. Linkar projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

### 4. Executar migrations

```bash
supabase db push
```

### 5. Deploy da funcao

```bash
supabase functions deploy process-meeting-pdf
```

## Teste Local

```bash
# Iniciar Supabase local
supabase start

# Servir funcoes localmente
supabase functions serve process-meeting-pdf --env-file .env.local
```

## Chamando a Funcao

```javascript
const { data, error } = await supabase.functions.invoke('process-meeting-pdf', {
  body: {
    reuniao_id: 'uuid-da-reuniao',
    pdf_base64: base64String,
    link_pdf: 'https://url-do-pdf.com/arquivo.pdf'
  }
});
```

## Regras de Classificacao

### Resultado (Decisao)

| Expressao no PDF | Classificacao |
|------------------|---------------|
| NAO CONHECE, NEGA PROVIMENTO, INDEFERE | Indeferido |
| ACOLHE, DEFERE, APROVA, DA PROVIMENTO | Deferido |
| PARCIALMENTE | Parcialmente Deferido |
| Nao identificado | A classificar |

### Tipo de Deliberacao

| Condicao | Tipo |
|----------|------|
| Interessado = ARTESP ou assunto interno | Ato Administrativo Interno |
| Outros casos | Pleito Externo |

### Microtemas Comuns

- Multa
- Revisao Tarifaria
- Reequilibrio Economico
- Aditivo Contratual
- Recurso Administrativo
- Autorizacao
- Fiscalizacao
- Penalidade
- Prorrogacao

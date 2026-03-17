# IRIS - Guia Completo de Operacoes, Infraestrutura e Estrategia

> Documento consolidado cobrindo: Backup Multi-Tenant, Rotina Operacional Diaria,
> Analise sobre Lovable, Sugestoes de Renomeacao e Infraestrutura para Producao.

---

## Indice

1. [Backup Multi-Tenant - Como Funciona e Como Configurar](#1-backup-multi-tenant)
2. [Rotina Operacional Diaria](#2-rotina-operacional-diaria)
3. [Lovable - Vale a Pena?](#3-lovable-vale-a-pena)
4. [Sugestoes de Nomes para a Plataforma](#4-sugestoes-de-nomes)
5. [Infraestrutura da IRIS - O que E e O que Melhorar](#5-infraestrutura-da-iris)
6. [Recomendacoes para Producao](#6-recomendacoes-para-producao)

---

## 1. Backup Multi-Tenant

### O que e Multi-Tenant?

Multi-tenant significa que **varios clientes (escritorios, empresas)** usam a mesma
plataforma IRIS, mas cada um ve apenas seus proprios dados. Pense em um predio
comercial: a estrutura e uma so, mas cada sala e independente e trancada.

### Arquitetura de Backup para Varios Clientes

```
IRIS Platform (Supabase)
|
|-- Banco de Dados PostgreSQL
|   |-- Schema: public (compartilhado)
|   |-- Row Level Security (RLS) por tenant_id
|   |
|   |-- Cliente A (tenant_id = "escritorio-alpha")
|   |   |-- deliberacoes_extraidas (filtradas por tenant_id)
|   |   |-- directors (filtrados por tenant_id)
|   |   |-- reunioes_monitoradas (filtradas por tenant_id)
|   |
|   |-- Cliente B (tenant_id = "escritorio-beta")
|   |   |-- deliberacoes_extraidas (filtradas por tenant_id)
|   |   |-- directors (filtrados por tenant_id)
|   |   |-- reunioes_monitoradas (filtradas por tenant_id)
|   |
|   |-- Cliente C (tenant_id = "empresa-gamma")
|       |-- ...
```

### Como Configurar o Backup

#### Passo 1 - Criar tabela de tenants e adicionar coluna nas tabelas

```sql
-- Criar tabela de tenants (clientes)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,              -- "Escritorio Silva & Associados"
    slug TEXT UNIQUE NOT NULL,       -- "silva-associados"
    plano TEXT DEFAULT 'basico',     -- basico, profissional, enterprise
    ativo BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',       -- configuracoes especificas do cliente
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar tenant_id em todas as tabelas principais
ALTER TABLE deliberacoes_extraidas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE reunioes_monitoradas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE directors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
```

#### Passo 2 - Politica RLS (cada cliente ve so seus dados)

```sql
-- Habilitar RLS
ALTER TABLE deliberacoes_extraidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes_monitoradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE directors ENABLE ROW LEVEL SECURITY;

-- Politica: usuario so ve dados do seu tenant
CREATE POLICY tenant_isolation ON deliberacoes_extraidas
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation ON reunioes_monitoradas
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID);

CREATE POLICY tenant_isolation ON directors
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID);
```

#### Passo 3 - Estrategia de Backup em 3 Camadas

```
CAMADA 1 - Backup Automatico do Supabase (incluso no plano Pro)
|-- Backup diario automatico
|-- Retencao de 7 dias
|-- Point-in-Time Recovery (PITR) ate 7 dias atras
|-- Voce NAO precisa fazer nada, ja vem pronto

CAMADA 2 - Backup Programado por Tenant (voce configura)
|-- Script roda 1x por dia (cron job as 3h da manha)
|-- Exporta dados de CADA cliente separadamente
|-- Salva em JSON no Supabase Storage
|-- Estrutura: /backups/{tenant_slug}/{data}/backup-completo.json
|-- Retencao: 30 dias

CAMADA 3 - Backup Externo (seguranca maxima)
|-- Copia semanal para storage externo (AWS S3 ou Google Cloud Storage)
|-- Criptografado com AES-256
|-- Retencao de 90 dias
|-- Protege contra desastre total no Supabase
```

#### Passo 4 - Script de Backup por Tenant

```javascript
// backup-tenant.js - Roda via cron diariamente
const { createClient } = require('@supabase/supabase-js');

async function backupTenant(tenantId, tenantSlug) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const dataHoje = new Date().toISOString().split('T')[0];

    // 1. Exportar deliberacoes do tenant
    const { data: deliberacoes } = await supabase
        .from('deliberacoes_extraidas')
        .select('*')
        .eq('tenant_id', tenantId);

    // 2. Exportar directors do tenant
    const { data: directors } = await supabase
        .from('directors')
        .select('*')
        .eq('tenant_id', tenantId);

    // 3. Exportar reunioes do tenant
    const { data: reunioes } = await supabase
        .from('reunioes_monitoradas')
        .select('*')
        .eq('tenant_id', tenantId);

    // 4. Montar pacote de backup
    const backupPackage = {
        tenant: tenantSlug,
        data_backup: dataHoje,
        total_deliberacoes: deliberacoes.length,
        total_directors: directors.length,
        total_reunioes: reunioes.length,
        deliberacoes,
        directors,
        reunioes
    };

    // 5. Salvar no Supabase Storage
    const filePath = `backups/${tenantSlug}/${dataHoje}/backup-completo.json`;
    await supabase.storage
        .from('backups')
        .upload(filePath, JSON.stringify(backupPackage, null, 2), {
            contentType: 'application/json',
            upsert: true
        });

    console.log(`[OK] Backup ${tenantSlug}: ${deliberacoes.length} deliberacoes, ${directors.length} diretores`);
}

// Executar para todos os tenants ativos
async function backupAll() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: tenants } = await supabase
        .from('tenants')
        .select('id, slug, nome')
        .eq('ativo', true);

    console.log(`Iniciando backup para ${tenants.length} clientes...`);

    for (const tenant of tenants) {
        try {
            await backupTenant(tenant.id, tenant.slug);
        } catch (err) {
            console.error(`[ERRO] Backup falhou para ${tenant.slug}: ${err.message}`);
        }
    }

    console.log(`Backup concluido para ${tenants.length} clientes`);
}

backupAll();
```

#### Passo 5 - Agendar com Cron

```bash
# Executar backup todo dia as 3h da manha
0 3 * * * cd /app && node backup-tenant.js >> /var/log/backup-iris.log 2>&1
```

#### Passo 6 - Restauracao de Backup (por cliente)

```javascript
// restore-tenant.js - Restaurar dados de um cliente especifico
async function restoreTenant(tenantSlug, dataBackup) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // 1. Baixar backup
    const { data: file } = await supabase.storage
        .from('backups')
        .download(`backups/${tenantSlug}/${dataBackup}/backup-completo.json`);

    const backup = JSON.parse(await file.text());

    // 2. Restaurar deliberacoes (upsert para nao duplicar)
    for (const delib of backup.deliberacoes) {
        await supabase.from('deliberacoes_extraidas').upsert(delib, { onConflict: 'id' });
    }

    // 3. Restaurar directors
    for (const dir of backup.directors) {
        await supabase.from('directors').upsert(dir, { onConflict: 'id' });
    }

    // 4. Restaurar reunioes
    for (const reuniao of backup.reunioes) {
        await supabase.from('reunioes_monitoradas').upsert(reuniao, { onConflict: 'id' });
    }

    console.log(`Restauracao ${tenantSlug} concluida: ${backup.total_deliberacoes} deliberacoes`);
}

// Uso: node restore-tenant.js silva-associados 2026-02-25
restoreTenant(process.argv[2], process.argv[3]);
```

---

## 2. Rotina Operacional Diaria

### O que fazer TODOS OS DIAS para a IRIS funcionar bem

Se a IRIS estivesse em producao com clientes reais, esta seria a rotina:

### Checklist Diario (15-30 minutos)

```
MANHA (08:00 - 08:30)
======================

[ ] 1. VERIFICAR COLETA DE DADOS
    - Acessar o painel admin da IRIS
    - Confirmar que o coletor ARTESP rodou durante a noite
    - Verificar se novas deliberacoes foram capturadas
    - Checar se houve erros de parsing nos PDFs
    Comando: npm run cli:status (no artesp-collector)

[ ] 2. VERIFICAR SAUDE DO SISTEMA
    - Supabase Dashboard: verificar uso de banco, storage, auth
    - Verificar se a API esta respondendo (health check)
    - Checar logs de erro do servidor
    Endpoint: GET /api/health

[ ] 3. VERIFICAR BACKUPS
    - Confirmar que o backup noturno rodou com sucesso
    - Verificar tamanho dos backups (crescimento anormal = problema)
    - Abrir 1 backup aleatorio e validar conteudo

[ ] 4. MONITORAR USUARIOS
    - Quantos usuarios logaram ontem?
    - Algum usuario reportou problema?
    - Checar metricas de uso (quais telas mais acessadas)
```

### Checklist Semanal (1 hora, toda segunda-feira)

```
SEGUNDA-FEIRA
==============

[ ] 1. QUALIDADE DOS DADOS
    - Revisar 5-10 deliberacoes aleatorias extraidas na semana
    - Validar se a classificacao (microtema, decisao) esta correta
    - Verificar se votos dos diretores estao sendo capturados

[ ] 2. PERFORMANCE
    - Tempo medio de resposta das queries principais
    - Verificar se indices do banco estao sendo usados
    - Supabase: checar se esta perto dos limites do plano

[ ] 3. SEGURANCA
    - Revisar logs de autenticacao (tentativas falhas)
    - Verificar se tokens JWT estao expirando corretamente
    - Checar se RLS policies estao funcionando

[ ] 4. ATUALIZACOES
    - Verificar se ha novas versoes das dependencias (npm audit)
    - Checar se o site da ARTESP mudou o layout (quebra o scraper)
    - Testar o fluxo completo: coleta -> extracao -> dashboard
```

### Checklist Mensal (2-3 horas, primeiro dia util)

```
PRIMEIRO DIA UTIL DO MES
=========================

[ ] 1. RELATORIO DE SAUDE
    - Total de deliberacoes processadas no mes
    - Taxa de erro de extracao (meta: < 5%)
    - Uptime do sistema (meta: > 99.5%)
    - Crescimento do banco de dados

[ ] 2. TESTE DE RESTAURACAO
    - Escolher 1 tenant aleatorio
    - Restaurar backup em ambiente de teste
    - Validar integridade dos dados restaurados

[ ] 3. REVISAO DE CUSTOS
    - Supabase: uso vs plano contratado
    - Hosting: custos de servidor
    - APIs externas: consumo de IA (se usar para classificacao)

[ ] 4. PLANEJAMENTO
    - Novas agencias para adicionar? (ANEEL, ANP, ANM)
    - Feedbacks de clientes para implementar
    - Melhorias de performance necessarias
```

### Alertas Automaticos (configurar uma vez, funciona pra sempre)

```
ALERTA                     CONDICAO                           PRIORIDADE
------------------------   --------------------------------   ----------
Coleta falhou              Nenhuma deliberacao nova em 48h     ALTA
Banco quase cheio          Uso > 80% do plano Supabase        MEDIA
Erro no frontend           Erro 500 detectado                 ALTA
Backup falhou              Backup noturno nao completou       CRITICA
API lenta                  Resposta > 5 segundos              MEDIA
Login suspeito             +10 tentativas falhas mesmo IP     ALTA
```

---

## 3. Lovable - Vale a Pena?

### O que e a Lovable?

Lovable e uma plataforma que gera aplicacoes React a partir de prompts em linguagem
natural. Voce descreve o que quer e ela gera o codigo frontend.

### Analise Honesta

```
PONTOS A FAVOR
===============
+ Velocidade: frontend bonito em horas, nao semanas
+ Bom para MVPs e provas de conceito
+ Gera codigo React real (exportavel, nao fica preso na plataforma)
+ Integracao nativa com Supabase (que a IRIS ja usa)
+ Bom para quem nao e desenvolvedor frontend
+ Voce ja tem o prompt pronto (LOVABLE_PROMPT_DELIBERACOES.md)

PONTOS CONTRA
==============
- Codigo gerado e verboso e nem sempre segue boas praticas
- Dificil manter consistencia quando o projeto cresce
- Cada novo prompt pode quebrar algo que ja funcionava
- Nao tem controle fino sobre arquitetura
- Debugging e mais dificil (voce nao escreveu o codigo)
- Custo mensal da Lovable se soma aos outros custos ($20/mes+)
- Logica complexa (parsing de PDFs, cron jobs) NAO funciona na Lovable
```

### Quando Usar e Quando NAO Usar

```
USE A LOVABLE PARA:                    NAO USE A LOVABLE PARA:
============================           ============================
Dashboard de visualizacao              Backend / API do coletor
Telas de login e cadastro              Logica de parsing de PDFs
Paginas de relatorios                  Processamento de dados
Landing page do produto                Jobs agendados (cron)
Painel administrativo simples          Integracao com IA/LLM
Graficos e tabelas                     Logica multi-tenant complexa
```

### Recomendacao Final

**Usar a Lovable APENAS como frontend. Manter o backend 100% separado.**

```
Lovable (Frontend)              Servidor Node.js (Backend)
|-- Dashboard                   |-- artesp-collector
|-- Graficos                    |-- Parsing de PDFs
|-- Telas de usuario            |-- API REST
|-- Relatorios                  |-- Cron Jobs / Backup
|                               |-- Logica de negocios
|                               |
+---------- Supabase -----------+
            |-- PostgreSQL
            |-- Auth
            |-- Storage (PDFs)
            |-- Edge Functions
```

---

## 4. Sugestoes de Nomes para a Plataforma

Se quiser trocar o nome IRIS por algo mais ligado a "inteligencia":

### Tier 1 - Altamente Recomendados

| Nome | Significado | Por que e bom |
|------|-------------|---------------|
| **NEXUS** | Ponto de conexao, centro de inteligencia | Hub de informacao regulatoria. Curto, forte, facil de lembrar. |
| **VIGIL** | Vigilancia, monitoramento atento | Perfeito para monitoramento regulatorio. Profissional e serio. |
| **SENTIO** | Do latim "perceber, sentir, entender" | Sofisticado, unico, transmite inteligencia sensorial. |
| **CORA** | Central de Observatorio Regulatorio Avancado | Soa humano, acessivel. Funciona bem como marca. |

### Tier 2 - Muito Bons

| Nome | Significado | Por que e bom |
|------|-------------|---------------|
| **PRAXIS** | Do grego "acao informada por conhecimento" | Inteligencia aplicada. Forte para consultoria juridica. |
| **LUMEN** | Luz, clareza, iluminacao | Traz clareza para o mundo regulatorio. Elegante. |
| **ARGUS** | Gigante mitologico com 100 olhos | Monitoramento total. Poderoso para SaaS de vigilancia. |
| **ORACULO** | Fonte de sabedoria e previsao | Inteligencia preditiva. Muito brasileiro, facil de entender. |

### Tier 3 - Opcoes Solidas

| Nome | Significado | Por que e bom |
|------|-------------|---------------|
| **MIRA** | Observar com atencao | Curto, feminino, facil de pronunciar. "Mira Regulatoria". |
| **PULSO** | Batimento, ritmo vital | "O pulso do setor regulatorio". Marketing natural. |
| **RADAR** | Deteccao e monitoramento | Obvio e direto. "Radar Regulatorio". Facil de vender. |
| **ATHENA** | Deusa grega da sabedoria | Inteligencia + estrategia. Forte e memoravel. |

### Comparativo Rapido

```
Nome        Unico?    Facil?    Forte?    Dominio provavel?   Nota
----------- --------- --------- --------- ------------------- -----
IRIS        Medio     Sim       Medio     Dificil             7/10
NEXUS       Alto      Sim       Alto      Medio               9/10
VIGIL       Alto      Sim       Alto      Provavel            9/10
SENTIO      Alto      Sim       Alto      Provavel            8/10
CORA        Medio     Sim       Medio     Dificil             8/10
PRAXIS      Alto      Medio     Alto      Provavel            8/10
ARGUS       Alto      Sim       Alto      Provavel            8/10
LUMEN       Medio     Sim       Medio     Dificil             7/10
ATHENA      Medio     Sim       Alto      Medio               8/10
```

### Minha Recomendacao

**NEXUS** ou **VIGIL** sao os mais fortes. Curtos, unicos, e comunicam
exatamente o que a plataforma faz.

Se quiser manter a identidade atual, **IRIS** ainda funciona bem. O acronimo
pode ser: **I**nteligencia **R**egulatoria **I**ntegrada e **S**istematizada.

---

## 5. Infraestrutura da IRIS

### O que a IRIS tem HOJE

```
COMPONENTE          TECNOLOGIA              STATUS
-----------------   ---------------------   --------
Frontend            HTML unico (354KB)      Funcional, mas nao escala
Backend             Node.js + Express       Funcional
Banco de Dados      Supabase (PostgreSQL)   Configurado
Autenticacao        JWT + bcryptjs          Basico
Coletor             Scraper ARTESP          Funcional
Parser de PDFs      pdf-parse               Funcional
Hospedagem          Local (npm start)       Nao tem producao
Docker              Nao tem                 Precisa criar
CI/CD               Nao tem                 Precisa criar
Monitoramento       Nao tem                 Precisa criar
Testes              Basico (1 arquivo)      Precisa expandir
Multi-tenant        Nao tem                 Precisa criar
```

### Diagrama da Infraestrutura Atual

```
Usuario (Navegador)
       |
       v
[HTML Estatico 354KB]  <---->  [Express API :3000]
                                    |
                                    v
                          [Supabase Cloud]
                          |-- PostgreSQL
                          |-- Auth
                          |-- Storage (PDFs)
                                    |
                                    v
                          [Site da ARTESP]
                          (scraping de PDFs)
```

### O que FALTA para Producao

```
1. Docker              --> Empacotar tudo em container
2. CI/CD               --> Deploy automatico via GitHub Actions
3. Monitoramento       --> Saber quando algo quebra
4. Frontend separado   --> React app independente do backend
5. Multi-tenancy       --> Suportar varios clientes
6. Rate limiting       --> Protecao contra abuso
7. Cache               --> Performance
8. Testes              --> Cobertura minima de 60%
9. Logs centralizados  --> Saber o que aconteceu
10. Backup automatico  --> Proteger dados dos clientes
```

---

## 6. Recomendacoes para Producao

### PRIORIDADE CRITICA (Mes 1)

#### 6.1 Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "artesp-collector/server-unified.js"]
```

#### 6.2 Variaveis de Ambiente Seguras

```bash
# .env.production (NUNCA commitar no git)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=chave-forte-com-pelo-menos-256-bits
NODE_ENV=production
CORS_ORIGIN=https://seudominio.com.br
```

#### 6.3 CI/CD com GitHub Actions

```yaml
name: Deploy IRIS
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: echo "Deploy automatico apos testes passarem"
```

### PRIORIDADE ALTA (Mes 2)

#### 6.4 Monitoramento

```
Ferramenta           Funcao                  Custo
-------------------  ----------------------  -----------
Sentry               Captura erros           Gratis (5K/mes)
UptimeRobot          Uptime monitoring       Gratis (50 monitores)
Logflare             Logs centralizados      Gratis com Supabase
Supabase Dashboard   Metricas do banco       Incluso
```

#### 6.5 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 100,                   // 100 requests por IP
    message: 'Muitas requisicoes. Tente novamente em 15 minutos.'
});
app.use('/api/', limiter);
```

#### 6.6 Testes Automatizados

```
Componente             Cobertura Meta
---------------------  ---------------
Parser de PDFs         90% (core do produto)
API endpoints          80%
Autenticacao           90% (seguranca)
Logica de negocios     70%
Frontend               50% (e2e com Playwright)
```

### PRIORIDADE MEDIA (Mes 3-4)

- Frontend React separado (ou gerado via Lovable)
- Multi-tenancy completo com billing (Stripe)
- Cache com Redis
- CDN para assets estaticos
- Documentacao da API com Swagger
- Novas agencias (ANEEL, ANP, ANM)

### Custos Estimados para Producao

```
Servico                  Plano           Custo/mes (USD)
------------------------ --------------- ----------------
Supabase                 Pro             $25
Railway ou Render        Starter         $5-7
Vercel (frontend)        Hobby           $0 (gratis)
Sentry (erros)           Developer       $0 (gratis)
UptimeRobot              Free            $0 (gratis)
Dominio .com.br          Anual           ~$3/mes
Lovable (se usar)        Starter         $20/mes
                                         ----------------
TOTAL SEM LOVABLE                        ~$33-35/mes
TOTAL COM LOVABLE                        ~$53-55/mes
```

Para ate **10 clientes** simultaneos, esta infra suporta tranquilamente.
Acima de **50 clientes**, considerar upgrade para Supabase Team ($599/mes).

---

## Resumo Executivo

| Topico | Recomendacao |
|--------|-------------|
| **Backup** | 3 camadas: Supabase automatico + script por tenant + copia externa semanal |
| **Rotina Diaria** | 15-30 min/dia: checar coleta, saude, backups, usuarios |
| **Lovable** | Sim, mas APENAS para frontend. Backend sempre separado |
| **Nome** | Manter IRIS ou migrar para NEXUS / VIGIL |
| **Infraestrutura** | Faltam Docker, CI/CD e Monitoramento (os 3 pilares) |
| **Producao** | ~$35/mes suporta ate 10 clientes |

---

*Documento gerado em 2026-02-25 para o projeto IRIS Platform.*
*Repositorio: mvp-iris-regula-o---monitor*

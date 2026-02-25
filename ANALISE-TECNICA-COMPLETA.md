# IRIS - Analise Tecnica Completa

> Documento cobrindo: Diretores Reais, Limite de PDFs, Duplicatas, Dashboard Supabase,
> Hub de Noticias com Inteligencia, e Recomendacoes de Melhoria.

---

## Indice

1. [Dados Reais dos Diretores](#1-dados-reais-dos-diretores)
2. [Upload de PDFs - Limites e Problema com 816 Arquivos](#2-upload-de-pdfs)
3. [Deteccao de Duplicatas](#3-deteccao-de-duplicatas)
4. [Fluxo Completo: Baixar PDFs e Gerar Metricas](#4-fluxo-completo)
5. [Qualidade do Prompt de Leitura de PDF](#5-qualidade-do-prompt-de-leitura)
6. [Dashboard - Erro "Supabase indisponivel"](#6-dashboard-supabase)
7. [Hub de Noticias com Inteligencia Regulatoria](#7-hub-de-noticias)

---

## 1. Dados Reais dos Diretores

### O que a IRIS tem HOJE

Os diretores estao **hardcoded** no arquivo `iris-core/services/extrator-deliberacoes.js`.
Nao ha consulta automatica a fontes externas. Os dados atuais sao:

### Diretoria Atual da ARTESP (2024-2029)

| Diretor | Cargo | Inicio Mandato | Termino Mandato |
|---------|-------|----------------|-----------------|
| Andre Isper Rodrigues Barnabe | Diretor-Presidente | 10/09/2024 | 09/09/2029 |
| Diego Albert Zanatto | Diretor | 14/08/2024 | 13/08/2029 |
| Fernanda Esbizaro Rodrigues Rudnik | Diretora | 28/08/2025 | 27/08/2030 |
| Raquel Franca Carneiro | Diretora | 14/05/2025 | 13/05/2030 |

**Fonte:** Diarios Oficiais do Estado de Sao Paulo e atas de posse da ARTESP.

### Diretoria Anterior (para PDFs historicos)

| Diretor | Aliases no sistema |
|---------|--------------------|
| Milton Persoli | Persoli |
| Sergio Massaru Harada | Sergio Harada, Harada, Massaru |
| Carlos Eduardo Simoes | Carlos Simoes, Simoes |
| Antonio Carlos de Almeida | Antonio Almeida, Almeida |
| Flavio Augusto Trevisan Saes | Flavio Saes, Trevisan, Saes |

### Posso trazer dados reais automaticamente?

**Sim, mas com restricoes importantes:**

```
O QUE E POSSIVEL                          O QUE NAO E POSSIVEL
========================================  ========================================
Nomes dos diretores atuais (publico)      Garantir 100% de acuracia automatica
Cargos oficiais (publico)                 CPF, dados pessoais (LGPD)
Datas de nomeacao (Diario Oficial)        Salario, patrimonio
Historico de mandatos (publico)           Informacoes de contato pessoal
Votos em deliberacoes (publico)           Dados nao publicados
```

### Fontes Confiaveis para Cada Agencia

```
AGENCIA     FONTE DE DADOS DE DIRETORES                          CONFIAVEL?
----------  -----------------------------------------------------  ----------
ARTESP      artesp.sp.gov.br/quem-somos/diretoria                Sim
ANEEL       gov.br/aneel/pt-br/acesso-a-informacao/institucional  Sim
ANATEL      gov.br/anatel/pt-br/acesso-a-informacao               Sim
ANP         gov.br/anp/pt-br/acesso-a-informacao                  Sim
ANTT        gov.br/antt/pt-br/acesso-a-informacao                 Sim
ANS         gov.br/ans/pt-br/acesso-a-informacao                  Sim
ANVISA      gov.br/anvisa/pt-br/acesso-a-informacao               Sim
ANA         gov.br/ana/pt-br/acesso-a-informacao                  Sim
ANM         gov.br/anm/pt-br/acesso-a-informacao                  Sim
```

### Recomendacao: Abordagem Semi-Automatica

NAO recomendo automacao total para dados de diretores. O risco de erro e alto
e impacta diretamente a credibilidade do produto. Recomendo:

```
ABORDAGEM RECOMENDADA
======================

1. COLETA MANUAL INICIAL (1x por agencia)
   - Acessar o site oficial de cada agencia
   - Copiar nomes, cargos, datas de nomeacao
   - Salvar na tabela 'directors' do Supabase

2. ALERTA AUTOMATICO DE MUDANCA
   - Scraper verifica a pagina de diretoria de cada agencia 1x por semana
   - Se detectar mudanca no HTML, envia alerta para admin
   - Admin valida manualmente e atualiza no sistema
   - Isso garante 100% de acuracia sem erro automatico

3. VALIDACAO CRUZADA COM PDFs
   - Quando um PDF menciona um diretor que NAO esta no sistema
   - O sistema gera alerta: "Novo diretor detectado: [nome]"
   - Admin valida e cadastra

4. HISTORICO VERSIONADO
   - Toda mudanca de diretoria gera versao historica
   - PDFs antigos continuam linkados a diretoria da epoca
   - Nenhum dado e perdido, apenas marcado como "mandato encerrado"
```

### SQL para Tabela de Diretores Melhorada

```sql
-- Tabela melhorada de diretores com historico
CREATE TABLE IF NOT EXISTS directors_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    cargo TEXT NOT NULL,                      -- Diretor-Presidente, Diretor(a), Conselheiro(a)
    agencia TEXT NOT NULL,                    -- ARTESP, ANEEL, etc
    mandato_inicio DATE,
    mandato_fim DATE,
    nomeado_por TEXT,                         -- Decreto/Ato de nomeacao
    fonte_oficial TEXT,                       -- URL da fonte publica
    aliases TEXT[] DEFAULT '{}',              -- ['Andre Isper', 'Isper', 'Barnabe']
    ativo BOOLEAN DEFAULT true,
    verificado_em TIMESTAMPTZ,               -- Ultima verificacao manual
    verificado_por TEXT,                      -- Quem verificou
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT directors_unique_v2 UNIQUE (nome_completo, agencia, mandato_inicio)
);

-- Indice para busca rapida por agencia e status
CREATE INDEX IF NOT EXISTS idx_directors_v2_agency_active
    ON directors_v2(agencia, ativo);
```

---

## 2. Upload de PDFs - Limites e Problema com 816 Arquivos

### Configuracao Atual do Sistema

```
PARAMETRO                   VALOR ATUAL        ARQUIVO
--------------------------  -----------------  ----------------------------------
Tamanho maximo por PDF      50 MB              artesp-collector/src/services/downloader.js
Batch size (lote)           10 PDFs por vez    downloader.js (linha 27)
Delay entre downloads       1-3 segundos       downloader.js (linha 25-26)
Pausa entre batches         10 segundos        downloader.js (linha 28)
Timeout por download        60 segundos        downloader.js (linha 16)
Chunk maximo em memoria     2 MB               downloader.js (linha ~260)
```

### Por que 816 PDFs deu problema?

Fazendo as contas:

```
816 PDFs com a configuracao atual:
- 816 / 10 = 82 batches
- Cada batch: ~30 segundos (10 PDFs x 2s media + 10s pausa)
- Tempo total MINIMO: 82 x 30s = 2.460 segundos = ~41 minutos

PROBLEMAS PROVAVEIS:
1. MEMORIA: 816 PDFs carregados em memoria ao mesmo tempo = CRASH
   - Se cada PDF tem ~2 MB em media: 816 x 2 MB = 1.6 GB de RAM
   - Node.js por padrao tem limite de ~1.5 GB de heap
   - RESULTADO: JavaScript heap out of memory

2. TIMEOUT: Requests HTTP com timeout de 60s podem acumular
   - 816 conexoes tentando ao mesmo tempo = socket exhaustion

3. BLOQUEIO: O site da ARTESP pode ter bloqueado apos muitas requisicoes
   - 816 requests do mesmo IP = parece ataque DDoS

4. SUPABASE: Insercao de 816 registros pode exceder rate limit
   - Plano Free: 500 requests/segundo
   - Se inserir com upsert individual: 816 requests quase simultaneos
```

### Recomendacao: Limite Seguro por Vez

```
CENARIO                LIMITE RECOMENDADO     TEMPO ESTIMADO
---------------------  --------------------   ---------------
Upload via interface   50 PDFs por vez        ~3 minutos
Upload via CLI         100 PDFs por vez       ~6 minutos
Upload em batch job    200 PDFs por vez       ~12 minutos
Upload massivo         816 PDFs em 5 lotes    ~45 minutos (seguro)
                       de ~163 cada
```

### Solucao: Processamento em Fila (Queue)

```javascript
// Recomendacao: processar PDFs em fila, nao tudo de uma vez

class FilaPDFs {
    constructor(opcoes = {}) {
        this.tamanhoBatch = opcoes.tamanhoBatch || 50;      // 50 de cada vez
        this.pausaEntreBatches = opcoes.pausa || 15000;      // 15s entre lotes
        this.maxConcorrente = opcoes.concorrencia || 5;      // 5 simultanios max
        this.fila = [];
        this.processados = 0;
        this.erros = [];
    }

    async adicionarPDFs(listaPDFs) {
        this.fila = [...listaPDFs];
        this.totalPDFs = this.fila.length;
        console.log(`Fila criada: ${this.totalPDFs} PDFs para processar`);
        return this.processar();
    }

    async processar() {
        while (this.fila.length > 0) {
            // Pegar proximo batch
            const batch = this.fila.splice(0, this.tamanhoBatch);
            console.log(`Processando batch: ${batch.length} PDFs (restam ${this.fila.length})`);

            // Processar com concorrencia limitada
            const resultados = [];
            for (let i = 0; i < batch.length; i += this.maxConcorrente) {
                const chunk = batch.slice(i, i + this.maxConcorrente);
                const promises = chunk.map(pdf => this.processarUmPDF(pdf));
                const res = await Promise.allSettled(promises);
                resultados.push(...res);
            }

            // Contabilizar
            const sucessos = resultados.filter(r => r.status === 'fulfilled').length;
            const falhas = resultados.filter(r => r.status === 'rejected');
            this.processados += sucessos;
            this.erros.push(...falhas);

            const progresso = Math.round((this.processados / this.totalPDFs) * 100);
            console.log(`Progresso: ${progresso}% (${this.processados}/${this.totalPDFs})`);

            // Pausa entre batches (para nao sobrecarregar)
            if (this.fila.length > 0) {
                console.log(`Pausando ${this.pausaEntreBatches / 1000}s antes do proximo batch...`);
                await new Promise(r => setTimeout(r, this.pausaEntreBatches));
            }
        }

        return {
            total: this.totalPDFs,
            processados: this.processados,
            erros: this.erros.length,
            detalhesErros: this.erros.map(e => e.reason?.message || 'Erro desconhecido')
        };
    }

    async processarUmPDF(pdf) {
        // Aqui entra a logica de parse + save + verificacao de duplicata
        // ...
    }
}

// Uso para 816 PDFs:
const fila = new FilaPDFs({ tamanhoBatch: 50, concorrencia: 5, pausa: 15000 });
const resultado = await fila.adicionarPDFs(lista816PDFs);
// Vai processar em 17 batches de ~50, com 15s entre cada
// Tempo total estimado: ~20-25 minutos (seguro e estavel)
```

### Configuracao de Memoria para Uploads Grandes

```bash
# Para processar muitos PDFs, aumentar limite de memoria do Node.js
# Default: ~1.5 GB, Recomendado para 816+ PDFs: 4 GB
node --max-old-space-size=4096 server-unified.js

# OU via variavel de ambiente
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

## 3. Deteccao de Duplicatas

### O que JA existe no sistema

O arquivo `iris-core/services/detector-duplicidade.js` ja implementa deteccao
em 4 niveis:

```
NIVEL   METODO                    CONFIANCA   COMO FUNCIONA
------  ------------------------  ----------  -----------------------------------------
1       Numero do Processo        95%         Compara ARTESP-PRC-2025/12345, SEI, etc
2       Numero da Deliberacao     90%         Compara DEL-123/2025
3       Hash MD5 do Texto         99%         Hash do texto normalizado (match exato)
4       Similaridade Jaccard      85%+        Tokeniza e compara palavras (fuzzy match)
```

### Mas ainda tem PROBLEMAS

```
PROBLEMA                              IMPACTO                    STATUS
-------------------------------------  -------------------------  --------
1. Mesmo PDF enviado 2x = duplicata    ALTO (dados dobrados)      Parcial
2. PDFs diferentes, mesma deliberacao  ALTO (dados inconsistentes) Parcial
3. PDF atualizado (errata/correcao)    MEDIO (versao errada)      NAO tratado
4. Mesmo conteudo, formatacao diferent BAIXO (raro)               Tratado (hash)
5. Sem feedback visual pro usuario     ALTO (usuario nao sabe)    NAO tratado
```

### Recomendacao de Melhorias

```
MELHORIA                                        PRIORIDADE   ESFORCO
----------------------------------------------  -----------  --------
Feedback visual: "3 duplicatas ignoradas"        CRITICA      Baixo
Tela de revisao de duplicatas pendentes          ALTA         Medio
Versionamento: PDF v1 vs v2 (errata)             MEDIA        Alto
Log de duplicatas rejeitadas com motivo           ALTA         Baixo
Relatorio: "dos 816, 47 eram duplicatas"          ALTA         Baixo
Opcao de "forcar reprocessamento" de duplicata    MEDIA        Medio
```

### Fluxo Ideal de Duplicatas com Feedback

```
USUARIO FAZ UPLOAD DE 816 PDFs
              |
              v
[1. Validacao inicial]
    - Formato valido? (.pdf, %PDF magic number)
    - Tamanho ok? (< 50MB)
    - Resultado: "816 validos, 0 invalidos"
              |
              v
[2. Verificacao de duplicatas PRE-PROCESSAMENTO]
    - Hash rapido do arquivo (SHA-256 do binario)
    - Compara com hashes ja existentes no banco
    - Resultado: "47 duplicatas detectadas, 769 novos"
              |
              v
[3. Tela de decisao para o usuario]
    - "Encontramos 47 PDFs que ja existem no sistema:"
    - [x] Ignorar duplicatas (recomendado)
    - [ ] Reprocessar tudo (substituir dados anteriores)
    - [ ] Revisar manualmente (ver lista de duplicatas)
              |
              v
[4. Processamento dos 769 novos]
    - Batches de 50
    - Barra de progresso: "Processando 124/769 (16%)..."
    - Verificacao de duplicata por CONTEUDO (nivel 2)
    - Mais 12 duplicatas por conteudo detectadas
              |
              v
[5. Relatorio final]
    - "816 PDFs recebidos"
    - "757 processados com sucesso"
    - "47 duplicatas por arquivo (ignorados)"
    - "12 duplicatas por conteudo (ignorados)"
    - "0 erros de processamento"
    - [Baixar relatorio completo]
```

---

## 4. Fluxo Completo: Baixar PDFs e Gerar Metricas

### Situacao Atual

Hoje o fluxo e:
1. Voce baixa os PDFs manualmente do site da ARTESP
2. Faz upload na plataforma IRIS
3. O sistema processa e extrai dados

### Fluxo IDEAL (automatizado)

```
ETAPA 1: COLETA AUTOMATICA
============================
[Cron Job - Todo dia as 6h da manha]
        |
        v
[Scraper acessa artesp.sp.gov.br]
        |
        v
[Lista novas reunioes publicadas]
        |
        v
[Compara com reunioes ja processadas]
        |
        v
[Baixa apenas PDFs NOVOS] ----> [Salva no Supabase Storage]
        |
        v
"3 novos PDFs encontrados e baixados"


ETAPA 2: PROCESSAMENTO
============================
[Para cada PDF novo]
        |
        v
[pdf-parse extrai texto]
        |
        v
[extrator-deliberacoes.js analisa o texto]
        |-- Identifica: interessado, processo, microtema
        |-- Classifica: deferido/indeferido
        |-- Extrai: votos dos diretores
        |-- Detecta: valores monetarios, prazos, rodovias
        |
        v
[detector-duplicidade.js verifica]
        |-- E duplicata? -> Ignora
        |-- E novo? -> Salva no banco
        |
        v
[Salva em deliberacoes_extraidas]


ETAPA 3: METRICAS AUTOMATICAS
============================
[Views SQL calculam em tempo real]
        |
        v
[Dashboard atualiza automaticamente]
        |-- Total de deliberacoes
        |-- Taxa deferido vs indeferido
        |-- Ranking de microtemas
        |-- Votos por diretor
        |-- Tendencias temporais
        |-- Valores monetarios envolvidos
```

### Para seus 816 PDFs AGORA (passo a passo)

```bash
# PASSO 1: Organizar os PDFs
# Coloque todos os 816 PDFs em uma pasta local
mkdir ~/iris-pdfs
# Copie todos os PDFs para essa pasta

# PASSO 2: Usar o CLI do artesp-collector
cd artesp-collector

# Verificar status atual
npm run cli:status

# Processar com modo seguro (batches menores)
# Recomendacao: dividir em 5 rodadas de ~163 PDFs
NODE_OPTIONS="--max-old-space-size=4096" npm run cli

# OU usar modo Supabase direto
NODE_OPTIONS="--max-old-space-size=4096" npm run supabase

# PASSO 3: Acompanhar progresso
# O terminal vai mostrar:
# "Processando batch 1/17... (50/816)"
# "Processando batch 2/17... (100/816)"
# ...

# PASSO 4: Verificar resultado
npm run cli:status
```

---

## 5. Qualidade do Prompt de Leitura de PDF

### Como o sistema le PDFs HOJE

O sistema **NAO usa IA/LLM** para ler PDFs. Usa **pattern matching com regex**.

Arquivo: `iris-core/services/extrator-deliberacoes.js` (1.568 linhas)

```
METODO ATUAL: Regex Pattern Matching
=====================================
- 30+ padroes regex para extrair dados
- Funciona para PDFs com estrutura previsivel (ARTESP)
- NAO funciona bem para PDFs com layout diferente
- NAO entende contexto (se a regex nao bate, perde o dado)
```

### Avaliacao Honesta

```
ASPECTO                         NOTA    COMENTARIO
------------------------------  ------  -----------------------------------------
Extracao de numero de reuniao   9/10    Regex muito bem feito, cobre variantes
Extracao de data                8/10    Cobre formato numerico e extenso
Extracao de interessado         7/10    Funciona na maioria, falha em nomes complexos
Classificacao deferido/indeferi 8/10    Cobre muitas variantes (homologado, etc)
Extracao de votos               7/10    Funciona com aliases, mas depende de formato
Extracao de microtema           6/10    Baseado em keywords, pode errar categoria
Extracao de valores monetarios  7/10    Funciona para R$ padrao, falha em extenso
Extracao de processo            8/10    Muitos padroes cobertos (SEI, PRC, etc)
Suporte multi-agencia           5/10    ARTESP otimo, outras agencias basico
------------------------------  ------  -----------------------------------------
MEDIA GERAL                     7.2/10
```

### Recomendacao: Hibrido Regex + IA

```
ABORDAGEM RECOMENDADA: PIPELINE EM 2 FASES
=============================================

FASE 1 - Regex (rapido, barato, 80% dos casos)
    |-- pdf-parse extrai texto bruto
    |-- Regex tenta extrair todos os campos
    |-- Se extraiu tudo com confianca > 85% -> PRONTO
    |-- Se faltou algo ou confianca baixa -> vai pra Fase 2
    |
    v

FASE 2 - IA (preciso, mais caro, 20% dos casos)
    |-- Envia texto para LLM (Claude ou GPT)
    |-- Prompt estruturado pede extracao completa
    |-- Retorna JSON com todos os campos
    |-- Valida contra Schema esperado
    |-- Custo: ~$0.01-0.03 por PDF com Claude Haiku

RESULTADO:
- 80% dos PDFs: so regex (rapido e gratis)
- 20% dos PDFs: regex + IA (preciso e barato)
- Custo para 816 PDFs: ~$3-5 (so para os 20% que precisaram de IA)
```

### Prompt Ideal para LLM (quando regex falha)

```
Voce e um especialista em analise de documentos regulatorios brasileiros.
Analise o texto abaixo de uma deliberacao de agencia reguladora e extraia
os dados em formato JSON.

TEXTO DO PDF:
{texto_extraido}

EXTRAIA em JSON:
{
  "numero_reuniao": "numero da reuniao ordinaria",
  "data_reuniao": "YYYY-MM-DD",
  "agencia": "nome da agencia reguladora",
  "interessado": "empresa ou pessoa que fez o pedido",
  "processo": "numero do processo administrativo",
  "classificacao": "Pleito Externo ou Pauta Interna",
  "microtema": "categoria (tarifa, multa, contrato, etc)",
  "decisao": "Deferido, Indeferido, ou Parcialmente Deferido",
  "votos_favor": ["lista de diretores que votaram a favor"],
  "votos_contra": ["lista de diretores que votaram contra"],
  "unanime": true/false,
  "resumo": "resumo em 1-2 frases do que foi decidido",
  "valores_monetarios": ["R$ X.XXX,XX se mencionado"],
  "prazos": ["prazo mencionado, se houver"]
}

REGRAS:
- Se nao encontrar um campo, use null
- Datas sempre em formato YYYY-MM-DD
- Valores monetarios sempre com R$
- Para votos, use o nome COMPLETO do diretor
```

---

## 6. Dashboard - Erro "Supabase indisponivel"

### Onde esta o problema

Arquivo: `artesp-collector/public/js/app.js` (linha 2938-2953)

```javascript
// O codigo faz um fetch para /api/supabase/status
// Se falha ou retorna disconnected, mostra a mensagem
try {
    const resp = await fetch('/api/supabase/status');
    const data = await resp.json();
    if (data.connected) {
        text.textContent = 'Supabase conectado';     // SUCESSO
    } else {
        text.textContent = 'Supabase nao configurado'; // SEM CONFIG
    }
} catch (e) {
    text.textContent = 'Usando dados locais (Supabase indisponivel)'; // ERRO
}
```

### Causas Provaveis

```
CAUSA                                        COMO VERIFICAR                  SOLUCAO
-------------------------------------------  ----------------------------    -------------------------
1. Variaveis de ambiente nao configuradas    Checar .env                     Configurar SUPABASE_URL e keys
2. SUPABASE_URL incorreta                    Abrir a URL no navegador        Copiar do Supabase Dashboard
3. SUPABASE_ANON_KEY expirada/errada         Testar no Postman               Gerar nova key no Dashboard
4. Supabase em manutencao                    Checar status.supabase.com      Aguardar
5. CORS bloqueando                           Checar console do navegador     Adicionar dominio nas configs
6. Endpoint /api/supabase/status nao existe  Acessar direto no navegador     Verificar rotas do Express
7. Servidor nao esta rodando                 npm start deu erro?             Verificar logs
```

### Como resolver AGORA

```bash
# 1. Verificar se .env existe e tem as variaveis
cat .env
# Deve conter:
# SUPABASE_URL=https://seu-projeto.supabase.co
# SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 2. Testar conexao manualmente
curl https://seu-projeto.supabase.co/rest/v1/ \
  -H "apikey: sua-anon-key" \
  -H "Authorization: Bearer sua-anon-key"

# Se retornar JSON = Supabase esta OK, problema e na config local
# Se retornar erro = Supabase esta fora ou chave errada

# 3. Verificar se o servidor esta respondendo
curl http://localhost:3000/api/supabase/status
# Deve retornar: {"connected": true} ou {"connected": false, "message": "..."}

# 4. Se nada funcionar, verificar logs
npm start 2>&1 | head -50
# Procurar por linhas com "Supabase" ou "error"
```

### Checklist Rapido

```
[ ] 1. Arquivo .env existe na raiz do artesp-collector?
[ ] 2. SUPABASE_URL esta correto? (comeca com https://)
[ ] 3. SUPABASE_ANON_KEY esta correto? (comeca com eyJ)
[ ] 4. O servidor foi reiniciado apos mudar o .env?
[ ] 5. Console do navegador mostra algum erro de CORS?
[ ] 6. O endpoint /api/supabase/status retorna JSON?
```

---

## 7. Hub de Noticias com Inteligencia Regulatoria

### O que JA existe

O arquivo `iris-core/services/news-fetcher.js` (634 linhas) ja tem:

```
FUNCIONALIDADE                          STATUS
--------------------------------------  ---------
RSS de 17+ agencias federais            PRONTO
RSS de agencias estaduais (SP)          PRONTO
Fontes legislativas (Senado, Camara)    PRONTO
Cache com stale-while-revalidate        PRONTO
Fetching paralelo (Promise.allSettled)  PRONTO
Classificacao por tipo de noticia       PRONTO
Filtro por setor e esfera               PRONTO
Timeout inteligente (8s)                PRONTO
Background pre-fetch automatico         PRONTO
```

### O que voce sugeriu: CONCORDO 100%

As tres melhorias que voce descreveu sao exatamente o que transforma um portal
de noticias generico em uma plataforma de INTELIGENCIA. Vamos a analise detalhada:

---

### 7.1 Cruzamento Automatico com Base de Deliberacoes

> "Quando uma noticia menciona a AutoBAn, o hub mostra ao lado o historico
> de deliberacoes daquela empresa, os votos dos diretores e se ha anomalias."

**CONCORDO. Este e o diferencial matador.**

Nenhum portal de noticias faz isso porque nenhum tem a base de deliberacoes
estruturada. A IRIS tem. Isso e uma vantagem competitiva absurda.

**Como implementar:**

```
NOTICIA CHEGA VIA RSS:
"ANEEL aprova reajuste de 12% para Light S.A."
        |
        v
[1. Extrai entidades da noticia]
    - Empresa: "Light S.A."
    - Agencia: "ANEEL"
    - Tema: "reajuste"
    - Data: 2026-02-25
        |
        v
[2. Busca no banco de deliberacoes]
    SELECT * FROM deliberacoes_extraidas
    WHERE interessado ILIKE '%Light%'
    ORDER BY data_reuniao DESC LIMIT 10;
        |
        v
[3. Monta painel contextual]
    +--------------------------------------------------+
    | NOTICIA: ANEEL aprova reajuste de 12% para Light |
    +--------------------------------------------------+
    | HISTORICO IRIS:                                   |
    | - Light S.A. teve 23 deliberacoes nos ultimos 2a  |
    | - 19 deferidas (82%), 4 indeferidas (18%)         |
    | - Temas: reajuste (12), multa (6), contrato (5)  |
    | - Diretor X votou contra em 3 das 4 indeferidas   |
    | ⚠ ANOMALIA: Taxa de indeferimento subiu 200% no   |
    |   ultimo trimestre                                |
    +--------------------------------------------------+
```

**Complexidade: MEDIA** (2-3 semanas de desenvolvimento)
**Impacto no produto: ENORME**

---

### 7.2 Radar Regulatorio (Heatmap de Temas Quentes)

> "Um heatmap visual de quais temas estao 'quentes' esta semana"

**CONCORDO. Insight que leva horas para montar manualmente, a IRIS faz em tempo real.**

**Como implementar:**

```
DADOS DE ENTRADA:
- Noticias da semana (RSS)
- Deliberacoes da semana (base IRIS)
- Consultas publicas abertas

PROCESSAMENTO:
[Para cada tema (tarifa, multa, contrato, etc)]
    |
    |-- Contar mencoes em noticias esta semana
    |-- Contar deliberacoes esta semana
    |-- Comparar com media das 4 semanas anteriores
    |-- Calcular "temperatura" do tema
    |
    v

VISUALIZACAO:
+================================================================+
|  RADAR REGULATORIO - Semana 25/02 a 03/03/2026                 |
+================================================================+
|                                                                 |
|  🔴 TARIFA          ████████████████████  (28 mencoes, +180%)  |
|  🔴 REEQUILIBRIO    ███████████████████   (24 mencoes, +150%)  |
|  🟡 MULTA           ████████████          (15 mencoes, +30%)   |
|  🟢 CONTRATO        █████████             (12 mencoes, -5%)    |
|  🟢 FISCALIZACAO    ██████                (8 mencoes, +10%)    |
|  ⚪ AMBIENTAL       ████                  (5 mencoes, -20%)    |
|                                                                 |
|  ⚠ TENDENCIA EMERGENTE: "reequilibrio" saiu de 3 mencoes/sem  |
|    para 24 mencoes/sem nas ultimas 2 semanas                   |
+================================================================+
```

**Deteccao de Tendencias Emergentes:**

```javascript
function detectarTendenciaEmergente(tema) {
    const mencoesUltimas4Semanas = getMencoesPorSemana(tema, 4);
    // Exemplo: [3, 4, 8, 24]

    const mediaAnterior = (mencoesUltimas4Semanas[0] + mencoesUltimas4Semanas[1]) / 2;
    // Media: 3.5

    const atual = mencoesUltimas4Semanas[3];
    // Atual: 24

    const crescimento = ((atual - mediaAnterior) / mediaAnterior) * 100;
    // Crescimento: 585%

    if (crescimento > 200 && atual > 10) {
        return {
            tema,
            alerta: 'TENDENCIA EMERGENTE',
            crescimento: `${crescimento.toFixed(0)}%`,
            descricao: `"${tema}" saiu de ${mediaAnterior} para ${atual} mencoes/semana`
        };
    }

    return null;
}
```

**Complexidade: MEDIA** (2 semanas)
**Impacto: ALTO** (visual poderoso, facil de entender)

---

### 7.3 Alertas por Empresa e por Tema

> "Um diretor de compliance que configura 'me avise quando a ANEEL publicar
> qualquer coisa sobre reequilibrio' nunca mais larga a plataforma."

**CONCORDO 1000%. Isso e o que gera retencao diaria e justifica assinatura.**

**Como implementar:**

```
CONFIGURACAO DO ALERTA (pelo usuario):
+--------------------------------------------------+
| NOVO ALERTA                                       |
+--------------------------------------------------+
| Tipo:     [x] Noticia  [ ] Deliberacao  [x] Ambos |
| Agencia:  [x] ANEEL    [ ] ARTESP  [ ] Todas      |
| Empresa:  [ AutoBAn___________________ ]           |
| Tema:     [x] Reequilibrio  [x] Tarifa            |
| Canal:    [x] Email   [x] Plataforma  [ ] SMS     |
| Freq.:    [x] Imediato  [ ] Diario  [ ] Semanal   |
+--------------------------------------------------+
```

**Tabela de Alertas:**

```sql
CREATE TABLE IF NOT EXISTS alertas_configurados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),

    -- Filtros do alerta
    tipo TEXT[] DEFAULT '{"noticia","deliberacao"}',
    agencias TEXT[] DEFAULT '{}',        -- ['ANEEL', 'ARTESP'] ou vazio = todas
    empresas TEXT[] DEFAULT '{}',        -- ['AutoBAn', 'Light'] ou vazio = todas
    temas TEXT[] DEFAULT '{}',           -- ['reequilibrio', 'tarifa'] ou vazio = todos
    palavras_chave TEXT[] DEFAULT '{}',  -- keywords adicionais

    -- Configuracao de entrega
    canal TEXT[] DEFAULT '{"plataforma"}', -- email, plataforma, webhook
    frequencia TEXT DEFAULT 'imediato',     -- imediato, diario, semanal
    email_destino TEXT,
    webhook_url TEXT,

    -- Status
    ativo BOOLEAN DEFAULT true,
    ultimo_disparo TIMESTAMPTZ,
    total_disparos INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Motor de Alertas:**

```
A CADA NOTICIA/DELIBERACAO NOVA:
        |
        v
[1. Buscar todos os alertas ativos]
    SELECT * FROM alertas_configurados WHERE ativo = true;
        |
        v
[2. Para cada alerta, verificar match]
    - Agencia bate?
    - Empresa mencionada no texto?
    - Tema classificado bate?
    - Palavra-chave encontrada?
        |
        v
[3. Se match, verificar frequencia]
    - Imediato: disparar agora
    - Diario: adicionar a fila (envia as 8h)
    - Semanal: adicionar a fila (envia segunda 8h)
        |
        v
[4. Disparar alerta]
    - Plataforma: notificacao in-app + badge
    - Email: template HTML com contexto
    - Webhook: POST JSON para URL configurada
```

**Complexidade: ALTA** (3-4 semanas)
**Impacto: MAXIMO** (retencao diaria, justifica assinatura)

---

### Roadmap Completo do Hub de Noticias

```
FASE 1 (Semanas 1-2): CRUZAMENTO COM DELIBERACOES
- Extrair entidades (empresa, agencia) das noticias
- Query automatica na base de deliberacoes
- Painel contextual ao lado da noticia
- MVP: funciona para ARTESP (depois expande)

FASE 2 (Semanas 3-4): RADAR REGULATORIO
- Contagem de mencoes por tema por semana
- Heatmap visual
- Deteccao de tendencia emergente
- Widget no dashboard principal

FASE 3 (Semanas 5-8): ALERTAS INTELIGENTES
- Tabela de alertas no Supabase
- Tela de configuracao de alertas (frontend)
- Motor de matching
- Notificacoes in-app
- Envio de email (Supabase Edge Functions ou Resend)

RESULTADO FINAL:
O hub deixa de ser "lista de noticias" e vira "central de inteligencia regulatoria"
que NENHUM concorrente tem, porque nenhum outro tem a base estruturada de deliberacoes.
```

---

## Resumo Executivo

| Topico | Situacao Atual | Recomendacao |
|--------|---------------|-------------|
| **Diretores** | Hardcoded, so ARTESP | Semi-automatico: coleta manual + alerta de mudanca |
| **816 PDFs** | Sistema crashou (memoria) | Fila com batches de 50, memoria 4GB, barra de progresso |
| **Duplicatas** | 4 niveis implementados | Adicionar feedback visual e relatorio de rejeicao |
| **Leitura de PDF** | Regex only (7.2/10) | Hibrido: regex (80%) + LLM (20% que falham) |
| **Dashboard** | "Supabase indisponivel" | Verificar .env, SUPABASE_URL, keys, reiniciar servidor |
| **Hub Noticias** | RSS pronto (17 fontes) | 3 fases: cruzamento + radar + alertas = inteligencia |

---

*Documento gerado em 2026-02-25 para o projeto IRIS Platform.*
*Repositorio: mvp-iris-regula-o---monitor*

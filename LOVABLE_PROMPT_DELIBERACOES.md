# PROMPT COMPLETO PARA LOVABLE - SISTEMA DE DELIBERAÇÕES REGULATÓRIAS

## CONTEXTO DO PROJETO

Estou construindo uma plataforma de **Inteligência Regulatória** chamada **IRIS** que processa PDFs de **deliberações de agências reguladoras brasileiras** (como ARTESP, ANM, ANEEL, ANP, etc.) e extrai métricas estratégicas para análise jurídica e de compliance.

---

## O QUE É UMA DELIBERAÇÃO?

Uma **Deliberação** é um documento oficial produzido por uma agência reguladora durante suas **reuniões ordinárias** (colegiadas). Cada deliberação contém:

### ESTRUTURA DE UMA DELIBERAÇÃO:

```json
{
  "numero_deliberacao": "1176",        // Número sequencial da reunião
  "reuniao_ordinaria": "1176",         // Número da reunião onde foi decidido
  "data_reuniao": "2025-12-18",        // Data da reunião
  "agencia": "ARTESP",                 // Agência reguladora

  "interessado": "Viação Cometa S/A",  // Quem fez o pedido (empresa, pessoa, ou a própria agência)
  "processo": "SEI! n° 134.00037303/2024-01", // Número do processo administrativo

  "classificacao": "Pleito Externo",   // Tipo: "Pleito Externo" ou "Pauta Interna da Agência"
  "microtema": "Tarifa",               // Categoria do assunto

  "resultado": "Deferido",             // Decisão: "Deferido" ou "Indeferido"

  "votos_a_favor": [                   // Lista de diretores que votaram A FAVOR
    "André Isper Rodrigues Barnabé",
    "Diego Albert Zanatto",
    "Fernanda Esbízaro Rodrigues Rudnik",
    "Raquel França Carneiro"
  ],
  "votos_contra": [],                  // Lista de diretores que votaram CONTRA (divergentes)

  "resumo_pleito": "A empresa solicitou ressarcimento...", // Resumo do que foi pedido
  "fundamento_decisao": "RECOMENDA O DEFERIMENTO..."       // Justificativa da decisão
}
```

---

## TIPOS DE DELIBERAÇÃO

### 1. PLEITO EXTERNO (Pauta Externa)
- Solicitação feita por **empresa ou cidadão** à agência
- Exemplos:
  - Pedido de reequilíbrio econômico-financeiro
  - Solicitação de reajuste tarifário
  - Recurso contra multa
  - Pedido de prorrogação de contrato

### 2. PAUTA INTERNA (Ato Administrativo Interno)
- Decisão **interna da própria agência**
- Exemplos:
  - Aprovação de norma regulatória
  - Nomeação de fiscais
  - Alteração de procedimentos internos
  - Delegação de competências

---

## MICROTEMAS (CATEGORIAS)

As deliberações são classificadas por **microtema** (assunto principal):

| Microtema | Descrição |
|-----------|-----------|
| **Reequilíbrio** | Pedidos de reequilíbrio econômico-financeiro de contratos |
| **Tarifa** | Reajustes e revisões tarifárias |
| **Obras** | Aprovação de obras e investimentos |
| **Contrato** | Alterações contratuais, aditivos, prorrogações |
| **Multa** | Aplicação, recurso ou cancelamento de multas |
| **Fiscalização** | Ações de fiscalização e auditoria |
| **Segurança** | Normas e procedimentos de segurança |
| **Ambiental** | Licenciamento e questões ambientais |
| **Desapropriação** | Processos de desapropriação |
| **Usuário** | Reclamações e direitos de usuários |
| **Concessão** | Licitações e contratos de concessão |
| **Permissão** | Autorizações e permissões |
| **Regulação** | Normas regulatórias gerais |
| **Institucional** | Atos administrativos internos |
| **Recursos Humanos** | Questões de pessoal |
| **Outros** | Demais assuntos |

---

## ESTRUTURA DO CONSELHO DIRETOR

Cada agência reguladora possui um **Conselho Diretor** (ou Diretoria Colegiada) composto por **4-5 diretores** que votam nas deliberações.

### EXEMPLO - ARTESP (2024-2025):

| Diretor | Cargo | Início Mandato | Término Mandato |
|---------|-------|----------------|-----------------|
| André Isper Rodrigues Barnabé | Diretor-Presidente | 10/09/2024 | 09/09/2029 |
| Diego Albert Zanatto | Diretor | 14/08/2024 | 13/08/2029 |
| Fernanda Esbízaro Rodrigues Rudnik | Diretora | 28/08/2025 | 27/08/2030 |
| Raquel França Carneiro | Diretora | 14/05/2025 | 13/05/2030 |

### TIPOS DE VOTAÇÃO:

1. **Unanimidade**: Todos os diretores votaram igual (todos a favor ou todos contra)
2. **Maioria**: Decisão por maioria dos votos
3. **Voto Divergente**: Quando um diretor vota CONTRA a maioria
4. **Voto Vista**: Quando um diretor pede mais tempo para analisar
5. **Ausente/Impedido**: Diretor não participou da votação

---

## MÉTRICAS QUE PRECISO GERAR

### GRUPO 1: MÉTRICAS DE VALOR REGULATÓRIO

```javascript
{
  // Quantidade total de deliberações processadas
  totalDeliberacoes: 156,

  // Percentual que foi classificado automaticamente pelo sistema
  percentualClassificado: 94.5,

  // Tempo médio para processar cada PDF (em segundos)
  tempoMedioProcessamento: 12.3,

  // Quantidade de microtemas diferentes identificados
  totalMicrotemas: 14,

  // Distribuição por tipo
  pleitosExternos: 89,      // Pedidos de empresas/cidadãos
  pautasInternas: 67,       // Atos internos da agência

  // Total de votos mapeados por diretor
  votosPorDiretor: {
    "André Isper": 142,
    "Diego Zanatto": 138,
    // ...
  },

  // Total de decisões por agência (se múltiplas agências)
  decisoesPorAgencia: {
    "ARTESP": 156,
    "ANM": 89
  }
}
```

### GRUPO 2: MÉTRICAS POR DIRETOR

```javascript
{
  nome: "André Isper Rodrigues Barnabé",
  cargo: "Diretor-Presidente",
  mandato: {
    inicio: "2024-09-10",
    termino: "2029-09-09"
  },

  // Distribuição de votos
  totalVotos: 142,
  votosPleitoExterno: 85,           // Quantos votos em pleitos externos
  percentualPleitoExterno: 59.8,     // % dos votos em pleitos externos
  votosPautaInterna: 57,             // Quantos votos em pautas internas
  percentualPautaInterna: 40.2,      // % dos votos em pautas internas

  // Temas mais votados por este diretor
  temasQueMaisVota: [
    { tema: "Tarifa", quantidade: 34 },
    { tema: "Reequilíbrio", quantidade: 28 },
    { tema: "Contrato", quantidade: 21 }
  ],

  // Taxa de deferimento vs indeferimento
  votosDeferido: 128,                // Votos em decisões deferidas
  votosIndeferido: 14,               // Votos em decisões indeferidas
  taxaDeferimento: 90.1,             // % de deferimento
  taxaIndeferimento: 9.9,            // % de indeferimento

  // ⭐ TENDÊNCIA DECISÓRIA (evolução ao longo do tempo)
  tendenciaDecisoria: {
    geral: "estável",  // "crescente", "decrescente" ou "estável"
    porTrimestre: [
      { periodo: "2024-T3", taxaDeferimento: 88.5 },
      { periodo: "2024-T4", taxaDeferimento: 91.2 },
      { periodo: "2025-T1", taxaDeferimento: 90.0 }
    ],
    evolucaoMensal: [
      { mes: "2024-09", deferidos: 12, indeferidos: 2, taxa: 85.7 },
      { mes: "2024-10", deferidos: 15, indeferidos: 1, taxa: 93.7 }
    ]
  },

  // ⭐ VOTOS DIVERGENTES (quando votou contra a maioria)
  votosDivergentes: 3,
  percentualDivergencia: 2.1,
  detalheDivergencias: [
    {
      deliberacao: "1156",
      data: "2025-06-15",
      tema: "Multa",
      votoMaioria: "Deferido",
      seuVoto: "Contra"
    }
  ],

  // ⭐ DECISÕES DURANTE O MANDATO
  decisoesDuranteMandato: 142,       // Total de votos durante o mandato
  decisoesForaMandato: 0,            // Votos antes de assumir (se houver)

  // ⭐ TENDÊNCIA NO MANDATO (como evoluiu desde que assumiu)
  tendenciaNoMandato: {
    primeiros6Meses: { taxa: 87.5, votos: 45 },
    ultimos6Meses: { taxa: 92.3, votos: 52 },
    variacao: "+4.8%"  // Está deferindo mais ou menos?
  }
}
```

### GRUPO 3: MÉTRICAS POR TEMA

```javascript
{
  tema: "Tarifa",

  // Recorrência
  totalDeliberacoes: 34,
  posicaoRanking: 1,  // É o tema mais recorrente

  // Taxa de decisão
  deferidos: 28,
  indeferidos: 6,
  taxaDeferimento: 82.3,
  taxaIndeferimento: 17.7,

  // Evolução temporal
  evolucaoAnual: [
    { ano: 2024, quantidade: 12, taxaDeferimento: 75.0 },
    { ano: 2025, quantidade: 22, taxaDeferimento: 86.4 }
  ],
  evolucaoMensal: [
    { mes: "2025-01", quantidade: 4, taxaDeferimento: 100 },
    { mes: "2025-02", quantidade: 3, taxaDeferimento: 66.7 }
  ],

  // Quais diretores mais votam neste tema
  diretoresQueMaisVotam: [
    { nome: "André Isper", votos: 34 },
    { nome: "Diego Zanatto", votos: 32 }
  ]
}
```

### GRUPO 4: MÉTRICAS INSTITUCIONAIS DA AGÊNCIA

```javascript
{
  agencia: "ARTESP",

  // Reuniões
  reunioesNoAno: {
    2024: 48,
    2025: 52
  },
  totalReunioes: 100,
  tempoMedioEntreReunioes: 7.2,  // Em dias

  // Distribuição de pauta
  totalDeliberacoes: 456,
  pautaInterna: 187,
  pautaExterna: 269,
  percentualPautaInterna: 41.0,
  percentualPautaExterna: 59.0,

  // Atos normativos (regulações aprovadas)
  atosNormativosAprovados: 23,
  tiposAtosNormativos: [
    { tipo: "Resolução", quantidade: 12 },
    { tipo: "Portaria", quantidade: 8 },
    { tipo: "Deliberação Normativa", quantidade: 3 }
  ]
}
```

### GRUPO 5: MÉTRICAS DIFERENCIAIS (COMPETITIVAS)

```javascript
{
  // Comparação entre diretores
  comparacaoDiretores: [
    {
      nome: "André Isper",
      taxaDeferimento: 90.1,
      divergencias: 3,
      tendencia: "estável"
    },
    {
      nome: "Diego Zanatto",
      taxaDeferimento: 88.5,
      divergencias: 5,
      tendencia: "crescente"
    }
  ],

  // Matriz TEMA x DIRETOR x DECISÃO
  matrizTemaDiretorDecisao: {
    "Tarifa": {
      "André Isper": { deferidos: 30, indeferidos: 4 },
      "Diego Zanatto": { deferidos: 28, indeferidos: 4 }
    },
    "Multa": {
      "André Isper": { deferidos: 8, indeferidos: 12 },
      "Diego Zanatto": { deferidos: 6, indeferidos: 14 }
    }
  },

  // Análise de padrões
  padroes: {
    temasMaisDeferidos: ["Tarifa", "Reequilíbrio", "Obras"],
    temasMaisIndeferidos: ["Multa", "Fiscalização"],
    diretorMaisRigoroso: "Diego Zanatto",
    diretorMaisFlexivel: "Fernanda Rudnik"
  }
}
```

---

## MODELO DE DADOS PARA O BANCO

### Tabela: `deliberacoes`

```sql
CREATE TABLE deliberacoes (
  id UUID PRIMARY KEY,

  -- Identificação
  numero_deliberacao VARCHAR(20),
  reuniao_ordinaria VARCHAR(20),
  data_reuniao DATE,
  agencia VARCHAR(50),

  -- Partes
  interessado TEXT,
  processo VARCHAR(100),

  -- Classificação
  tipo_pauta VARCHAR(50),  -- 'Pleito Externo' ou 'Pauta Interna'
  microtema VARCHAR(100),

  -- Decisão
  resultado VARCHAR(50),   -- 'Deferido' ou 'Indeferido'

  -- Resumo
  resumo_pleito TEXT,
  fundamento_decisao TEXT,

  -- Metadados
  arquivo_origem VARCHAR(255),
  processado_em TIMESTAMP,
  tempo_processamento_ms INTEGER
);
```

### Tabela: `votos`

```sql
CREATE TABLE votos (
  id UUID PRIMARY KEY,
  deliberacao_id UUID REFERENCES deliberacoes(id),

  diretor_nome VARCHAR(200),
  tipo_voto VARCHAR(50),  -- 'favor', 'contra', 'vista', 'ausente'

  created_at TIMESTAMP
);
```

### Tabela: `diretores`

```sql
CREATE TABLE diretores (
  id UUID PRIMARY KEY,
  nome VARCHAR(200),
  cargo VARCHAR(100),
  agencia VARCHAR(50),

  inicio_mandato DATE,
  termino_mandato DATE,
  ativo BOOLEAN,

  -- Variantes do nome (para matching)
  variantes_nome TEXT[]  -- ['André Isper', 'Barnabé', 'A. Barnabé']
);
```

---

## FLUXO DE PROCESSAMENTO

```
1. UPLOAD DO PDF
   └── Usuário faz upload do PDF da ata de reunião

2. EXTRAÇÃO DE TEXTO
   └── Sistema extrai texto do PDF (OCR se necessário)

3. IDENTIFICAÇÃO DE DELIBERAÇÕES
   └── Sistema identifica cada deliberação no documento
   └── Separa por número de deliberação

4. EXTRAÇÃO DE DADOS
   └── Para cada deliberação:
       ├── Extrai número do processo
       ├── Identifica interessado
       ├── Classifica tipo (externa/interna)
       ├── Identifica microtema
       ├── Extrai resultado (deferido/indeferido)
       ├── Mapeia votos de cada diretor
       └── Extrai resumo e fundamento

5. CÁLCULO DE MÉTRICAS
   └── Sistema calcula todas as métricas em tempo real

6. VISUALIZAÇÃO
   └── Dashboard apresenta gráficos e tabelas
```

---

## PROCESSAMENTO DE PDFs - DETALHADO

### Estrutura do PDF de Deliberações

Um PDF típico de ata de reunião da ARTESP contém:

```
ATA DA 1176ª REUNIÃO ORDINÁRIA DO CONSELHO DIRETOR
Data: 18 de dezembro de 2025

PRESENTES:
- André Isper Rodrigues Barnabé (Diretor-Presidente)
- Diego Albert Zanatto (Diretor)
- Fernanda Esbízaro Rodrigues Rudnik (Diretora)
- Raquel França Carneiro (Diretora)

PAUTA:

1. DELIBERAÇÃO Nº 1
   Interessado: Viação Cometa S/A
   Processo: SEI! n° 134.00037303/2024-01
   Assunto: Pedido de ressarcimento...
   [texto do pleito]
   DECISÃO: DEFERIDO por unanimidade

2. DELIBERAÇÃO Nº 2
   [próxima deliberação]
   ...
```

### Extração de Dados do PDF

O sistema deve extrair os seguintes dados de cada PDF:

```javascript
// Dados extraídos de cada PDF
{
  "arquivo": {
    "nome": "ata_1176.pdf",
    "tamanho": 2457600,
    "data_upload": "2025-12-20T10:30:00Z",
    "hash_md5": "a1b2c3d4..."  // Para evitar duplicatas
  },

  "reuniao": {
    "numero": 1176,
    "data": "2025-12-18",
    "tipo": "Ordinária",
    "presentes": ["André Isper...", "Diego Albert..."]
  },

  "deliberacoes": [
    {
      "numero_item": 1,
      "interessado": "Viação Cometa S/A",
      "processo": "SEI! n° 134.00037303/2024-01",
      "microtema": "Tarifa",
      "classificacao": "Pleito Externo",
      "resumo_pleito": "A empresa solicitou...",
      "fundamento_decisao": "RECOMENDA O DEFERIMENTO...",
      "resultado": "Deferido",
      "tipo_votacao": "Unanimidade",
      "votos_favor": ["André Isper...", "Diego Albert...", "Fernanda...", "Raquel..."],
      "votos_contra": []
    }
    // ... mais deliberações
  ]
}
```

---

## ANÁLISE EM LOTE (BATCH PROCESSING)

### O que é Análise em Lote?

A análise em lote permite processar **múltiplos PDFs simultaneamente**, otimizando o tempo de extração quando há muitos documentos para analisar.

### Interface de Análise em Lote

```html
<!-- Seção de Análise em Lote -->
<div class="batch-analysis-section">
    <!-- Seleção de Arquivos -->
    <div class="batch-selection">
        <label>
            <input type="checkbox" id="select-all-pending">
            Selecionar todos os pendentes
        </label>
        <span class="selected-count">0 arquivos selecionados</span>
    </div>

    <!-- Opções de Processamento -->
    <div class="batch-options">
        <select id="parallel-count">
            <option value="1">1 arquivo por vez</option>
            <option value="2">2 arquivos simultâneos</option>
            <option value="3" selected>3 arquivos simultâneos</option>
            <option value="5">5 arquivos simultâneos</option>
        </select>

        <button id="start-batch" disabled>
            Iniciar Análise em Lote
        </button>
    </div>

    <!-- Progresso do Lote -->
    <div class="batch-progress" style="display: none;">
        <div class="progress-stats">
            <span class="completed">0 Concluídos</span>
            <span class="processing">0 Processando</span>
            <span class="remaining">0 Restantes</span>
            <span class="errors">0 Erros</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
        <button class="cancel-batch">Cancelar</button>
    </div>
</div>
```

### Lógica de Processamento Paralelo

```javascript
// Exemplo de implementação de análise em lote
async function startBatchAnalysis(selectedFiles, parallelCount = 3) {
    const queue = [...selectedFiles];
    const activePromises = new Map();
    let completed = 0;
    let errors = 0;

    // Função para processar um arquivo
    const processFile = async (fileIndex) => {
        try {
            const response = await fetch(`/api/analisar-pdf/${fileIndex}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (result.sucesso) {
                completed++;
                updateProgress(completed, errors, queue.length);
            } else {
                throw new Error(result.erro);
            }
        } catch (error) {
            errors++;
            console.error(`Erro no arquivo ${fileIndex}:`, error);
        }
    };

    // Processa em paralelo respeitando o limite
    while (queue.length > 0 || activePromises.size > 0) {
        // Inicia novos processos até o limite
        while (queue.length > 0 && activePromises.size < parallelCount) {
            const fileIndex = queue.shift();
            const promise = processFile(fileIndex);
            activePromises.set(fileIndex, promise);
            promise.finally(() => activePromises.delete(fileIndex));
        }

        // Aguarda pelo menos um completar
        if (activePromises.size > 0) {
            await Promise.race(activePromises.values());
        }
    }

    return { completed, errors };
}
```

### API para Análise em Lote

```javascript
// Endpoints necessários

// 1. Analisar um único PDF
POST /api/analisar-pdf/:index
Response: {
    "sucesso": true,
    "deliberacoes_extraidas": 15,
    "tempo_processamento_ms": 3500
}

// 2. Analisar múltiplos PDFs (alternativa ao paralelo no frontend)
POST /api/analisar-lote
Body: {
    "indices": [0, 1, 2, 3, 4],
    "paralelo": 3
}
Response: {
    "sucesso": true,
    "resultados": [
        { "index": 0, "sucesso": true, "deliberacoes": 12 },
        { "index": 1, "sucesso": true, "deliberacoes": 8 },
        { "index": 2, "sucesso": false, "erro": "PDF corrompido" }
    ],
    "total_deliberacoes": 20,
    "tempo_total_ms": 15000
}

// 3. Status do processamento em lote
GET /api/lote/status/:batchId
Response: {
    "status": "processando",
    "total": 10,
    "concluidos": 6,
    "erros": 1,
    "em_andamento": 3
}
```

### Tabela de PDFs com Seleção para Lote

```html
<table class="pdfs-table">
    <thead>
        <tr>
            <th><input type="checkbox" id="select-all"></th>
            <th>#</th>
            <th>Arquivo</th>
            <th>Tamanho</th>
            <th>Status</th>
            <th>Deliberações</th>
            <th>Ações</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><input type="checkbox" class="pdf-checkbox" data-index="0"></td>
            <td>1</td>
            <td>ata_1176.pdf</td>
            <td>2.4 MB</td>
            <td><span class="badge pending">Pendente</span></td>
            <td>-</td>
            <td>
                <button class="btn-analyze">Analisar</button>
                <button class="btn-delete">Excluir</button>
            </td>
        </tr>
        <!-- Mais linhas... -->
    </tbody>
</table>
```

### Estados do PDF

```javascript
const PDF_STATUS = {
    PENDENTE: 'pendente',      // Aguardando análise
    ANALISANDO: 'analisando',  // Em processamento
    ANALISADO: 'analisado',    // Análise concluída com sucesso
    ERRO: 'erro'               // Falha na análise
};
```

### Fluxo Completo de Upload + Análise em Lote

```
1. UPLOAD
   └── Usuário seleciona múltiplos PDFs (drag & drop ou botão)
   └── Sistema faz upload de cada arquivo
   └── PDFs ficam com status "pendente"

2. SELEÇÃO PARA LOTE
   └── Usuário marca checkbox nos PDFs pendentes
   └── Ou clica em "Selecionar todos pendentes"
   └── Sistema mostra contagem de selecionados

3. CONFIGURAÇÃO
   └── Usuário escolhe quantidade de processos paralelos
   └── Opções: 1, 2, 3 ou 5 simultâneos
   └── Mais paralelos = mais rápido, mas mais uso de recursos

4. EXECUÇÃO
   └── Usuário clica "Iniciar Análise em Lote"
   └── Sistema processa PDFs respeitando limite paralelo
   └── Interface mostra progresso em tempo real:
       - Quantos concluídos
       - Quantos em processamento
       - Quantos restantes
       - Quantos com erro

5. CANCELAMENTO (opcional)
   └── Usuário pode cancelar a qualquer momento
   └── PDFs já iniciados terminam
   └── Fila restante é descartada

6. CONCLUSÃO
   └── Sistema mostra resumo final
   └── Lista de PDFs é atualizada com novos status
   └── Métricas são recalculadas automaticamente
```

---

## COMPONENTES UI NECESSÁRIOS

### 1. Dashboard Principal
- Cards com métricas resumidas
- Gráfico de pizza: Deferido vs Indeferido
- Gráfico de barras: Deliberações por tema
- Timeline de reuniões

### 2. Página de Diretores
- Cards de cada diretor com foto/avatar
- Barra de progresso do mandato
- Gráfico de tendência decisória
- Lista de votos divergentes

### 3. Página de Temas
- Ranking de temas mais recorrentes
- Heatmap: Tema x Taxa de Deferimento
- Gráfico de evolução mensal

### 4. Página de Deliberações
- Lista com filtros (data, tema, decisão, diretor)
- Modal com detalhes completos
- Visualização do JSON extraído

### 5. Análise Comparativa
- Matriz de votação por diretor
- Comparação entre mandatos
- Tendências ao longo do tempo

---

## EXEMPLO DE JSON COMPLETO DE UMA DELIBERAÇÃO

```json
{
  "id": "uuid-aqui",
  "numero_deliberacao": "1176",
  "reuniao_ordinaria": "1176",
  "data_reuniao": "2025-12-18",
  "agencia": "ARTESP",

  "interessado": "Viação Cometa S/A",
  "processo": "SEI! n° 134.00037303/2024-01",

  "tipo_pauta": "Pleito Externo",
  "microtema": "Tarifa",

  "resultado": "Deferido",

  "votos": [
    {
      "diretor": "André Isper Rodrigues Barnabé",
      "tipo": "favor"
    },
    {
      "diretor": "Diego Albert Zanatto",
      "tipo": "favor"
    },
    {
      "diretor": "Fernanda Esbízaro Rodrigues Rudnik",
      "tipo": "favor"
    },
    {
      "diretor": "Raquel França Carneiro",
      "tipo": "favor"
    }
  ],

  "tipo_votacao": "Unanimidade",

  "resumo_pleito": "A Viação Cometa S/A solicitou o ressarcimento referente à utilização do serviço de transporte intermunicipal com benefício tarifário de gratuidade, conforme previsto no Decreto nº 68.937, de 3 de outubro de 2024, que estabelece a gratuidade nos dias 6 e 27 de outubro de 2024.",

  "fundamento_decisao": "RECOMENDA O DEFERIMENTO do pedido da operadora Viação Cometa S/A, para conceder o ressarcimento no Serviço Regular Rodoviário de 18.366 (dezoito mil, trezentos e sessenta e seis) gratuidades, no montante de R$ 1.029.792,49 (um milhão, vinte e nove mil, setecentos e noventa e dois reais e quarenta e nove centavos), decorrente dos impactos do Decreto nº 68.937, de 03 de outubro de 2024, que estabelece a gratuidade dos serviços de transporte público coletivo de passageiros do Estado de São Paulo, nos dias 6 e 27 de outubro de 2024.",

  "metadados": {
    "arquivo_origem": "ata-reuniao-1176.pdf",
    "pagina": 12,
    "processado_em": "2025-12-19T10:30:00Z",
    "tempo_processamento_ms": 1245,
    "confianca_extracao": 0.95
  }
}
```

---

## INSTRUÇÕES FINAIS PARA LOVABLE

1. **Crie um banco de dados** com as tabelas descritas acima
2. **Implemente APIs REST** para:
   - `GET /api/deliberacoes` - Listar todas
   - `GET /api/deliberacoes/:id` - Detalhes de uma
   - `GET /api/metricas/resumo` - Métricas gerais
   - `GET /api/metricas/por-diretor` - Métricas por diretor
   - `GET /api/metricas/por-tema` - Métricas por tema
   - `GET /api/metricas/diretor-avancado` - Tendências e divergências

3. **Crie dashboards** com:
   - Gráficos de evolução temporal (linhas)
   - Gráficos de distribuição (pizza/donut)
   - Tabelas com ranking
   - Cards com KPIs principais

4. **Implemente filtros** por:
   - Período (data início/fim)
   - Agência
   - Diretor
   - Tema/Microtema
   - Tipo de decisão

5. **Use cores consistentes**:
   - Deferido: Verde (#4ade80)
   - Indeferido: Vermelho (#f87171)
   - Primária: Amarelo (#FFEF4D)
   - Background: Azul escuro (#2A428C)

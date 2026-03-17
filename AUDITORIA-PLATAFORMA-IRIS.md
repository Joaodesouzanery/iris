# AUDITORIA COMPLETA — Plataforma IRIS
## Instituto de Regulacao, Inovacao e Sustentabilidade

**Data:** Fevereiro 2026
**Versao:** 1.0.0
**Status:** Producao

---

## 1. VISAO GERAL

A Plataforma IRIS e um sistema de **Inteligencia Regulatoria** que monitora, coleta, analisa e cruza dados de **25+ agencias reguladoras brasileiras** em tempo real. Combina coleta automatizada de deliberacoes, noticias regulatorias, analise de PDFs com IA, e geracao de insights para tomada de decisao.

### Stack Tecnologico
- **Backend:** Node.js + Express.js (50+ endpoints REST API)
- **Frontend:** SPA responsivo (HTML5 + CSS3 + JavaScript vanilla)
- **Banco de Dados:** Supabase (PostgreSQL) + cache em memoria
- **IA/NLP:** Google Gemini para extracao de dados de PDFs
- **Seguranca:** JWT + bcrypt + CSRF + rate limiting + CSP headers

---

## 2. MODULOS DA PLATAFORMA (15 paginas)

### 2.1 — Dashboard de Inteligencia (Analytics Avancado)
- Metricas consolidadas em cards: deliberacoes totais, taxa de deferimento, diretores ativos, temas mapeados
- Graficos interativos: distribuicao por microtema, votacao por diretor, tendencias temporais
- Comparativo: pauta interna vs pleitos externos
- Fonte de dados: `/api/metricas/resumo`, `/api/metricas/por-diretor`, `/api/metricas/por-tema`

### 2.2 — Deliberacoes ARTESP
- Tabela completa de deliberacoes extraidas de PDFs oficiais
- Campos: numero_deliberacao, reuniao_ordinaria, classificacao, microtema, resultado, votacao (favor/contra), resumo_pleito, fundamento_decisao
- 6 filtros combinaveis: microtema, resultado, reuniao, diretor, interessado, busca livre
- Detalhe expandivel com votos individuais de cada diretor
- Fonte: `/api/deliberacoes`

### 2.3 — Diretores e Composicao
- Perfil completo dos diretores da ARTESP: Andre Isper, Diego Zanatto, Fernanda Rudnik, Raquel Carneiro
- Historico de votos, taxa de concordancia, padroes de votacao
- Analise de correlacao entre pares de diretores
- Fonte: `/api/metricas/por-diretor`, `/api/metricas/diretor-avancado`

### 2.4 — Jurimetria Regulatoria
- Analise probabilistica de resultados com base em dados historicos
- Previsao de deferimento por tipo de pedido, microtema e composicao da reuniao
- Benchmark setorial

### 2.5 — Governanca Regulatoria
- Indicadores de qualidade regulatoria
- Transparencia e accountability das agencias
- Metricas de eficiencia processual

### 2.6 — Hub de Noticias Regulatorias
- Feed em tempo real de 25+ fontes oficiais (RSS + scraping)
- Fontes: DOU, ANEEL, ANATEL, ANP, ANVISA, ANS, ANTT, ANTAQ, ANAC, ANA, ANM, CVM, TCU, CGU, CADE, ARTESP, ARSESP, Senado, Camara, entre outras
- Filtros por esfera (federal/estadual) e setor (transporte, energia, telecom, saude, etc.)
- Indicador de status online/offline para cada fonte
- Fonte: `/api/noticias`, `/api/noticias/status`

### 2.7 — Cruzamento de Dados + Radar Regulatorio
- Radar de riscos regulatorios com alertas configurados
- Correlacao automatica entre noticias e deliberacoes
- Alertas por palavras-chave, empresa, tema ou concessionaria
- Fonte: `/api/inteligencia/radar`, `/api/noticias/inteligencia`, `/api/inteligencia/alertas`

### 2.8 — Dossies Automaticos
- Geracao automatica de dossies por entidade (empresa, diretor ou agencia)
- Perfil completo: historico de deliberacoes, taxa de deferimento, microtemas envolvidos
- Exportacao em PDF para impressao
- Busca por CNPJ com integracao ReceitaWS e Portal da Transparencia
- Fonte: `/api/dossie/:entidade`, `/api/dossie-pdf/:entidade`, `/api/cnpj/:cnpj`

### 2.9 — Boletim Mensal
- Geracao automatica de relatorio mensal com destaques
- Metricas do mes, temas frequentes, decisoes relevantes
- Formato pronto para compartilhamento

### 2.10 — Auditoria Forense
- Deteccao de padroes anomalos em votacoes
- Concentracao de relatorias por diretor
- Correlacoes estatisticas entre pares de votacao
- Fonte: `/api/analytics/correlacoes`, `/api/metricas/por-diretor`

### 2.11 — Monitoramento 24/7
- Monitoramento automatico e continuo do site da ARTESP
- Deteccao de novas reunioes ordinarias publicadas
- Processamento automatico de PDFs de atas
- Notificacoes de novidades
- Fonte: `/api/monitoramento/status`, `/api/reunioes-monitoradas`

### 2.12 — Upload e Gestao de PDFs
- Upload individual ou em lote de PDFs de deliberacoes
- Upload via URL direta
- Analise automatizada com IA (Google Gemini)
- Extracao estruturada: deliberacoes, votos, interessados, resultados
- Fonte: `/api/upload-pdf`, `/api/upload-multiplo`, `/api/analisar-todos`

### 2.13 — Agencias Reguladoras
- Visao geral de todas as agencias reguladoras do Brasil
- Informacoes: lei de criacao, mandato, diretores atuais, competencias
- Dados federais e estaduais
- Fonte: `/api/agencias-reguladoras`

### 2.14 — Mapa do Brasil
- Visualizacao geografica da presenca regulatoria por estado
- Dados de agencias estaduais (ARTESP, ARSESP, etc.)

### 2.15 — Analise de Vinculos (Grafo de Conexoes)
- Grafo interativo de relacoes entre entidades: diretores, empresas, microtemas
- Visualizacao force-directed com Canvas
- Legendas e filtros por tipo de no
- Busca por entidade
- Fonte: `/api/grafo-data-completo`

---

## 3. METRICAS GERADAS

### 3.1 — Metricas de Deliberacoes
| Metrica | Descricao |
|---------|-----------|
| Total de deliberacoes | Quantidade total de deliberacoes extraidas |
| Taxa de deferimento | % deliberacoes deferidas vs total |
| Distribuicao por microtema | Quantidade por tema (reajuste, penalidade, investimento, etc.) |
| Distribuicao por resultado | Deferido, Indeferido, Parcialmente Deferido, etc. |
| Pleitos externos vs pauta interna | Classificacao de origem |
| Deliberacoes por reuniao | Agrupamento por reuniao ordinaria |

### 3.2 — Metricas de Diretores
| Metrica | Descricao |
|---------|-----------|
| Votos por diretor | Total de votos registrados |
| Taxa de concordancia | % de vezes que votou com a maioria |
| Relatorias por diretor | Concentracao de relatorias |
| Correlacao entre diretores | Frequencia de votos alinhados entre pares |

### 3.3 — Metricas de Noticias
| Metrica | Descricao |
|---------|-----------|
| Noticias por fonte | Total por agencia reguladora |
| Fontes ativas/offline | Status de disponibilidade |
| Correlacao noticias x deliberacoes | Eventos relacionados detectados |

### 3.4 — Metricas de Empresas
| Metrica | Descricao |
|---------|-----------|
| Deliberacoes por empresa | Historico regulatorio completo |
| Taxa de deferimento por empresa | Sucesso nos pedidos |
| Presenca em temas | Quais microtemas a empresa participa |

### 3.5 — Metricas de Risco
| Metrica | Descricao |
|---------|-----------|
| Alertas disparados | Eventos detectados por palavras-chave |
| Radar regulatorio | Nivel de risco por tema/setor |
| Tendencias | Evolucao temporal de indicadores |

---

## 4. INFRAESTRUTURA TECNICA

### 4.1 — API Backend (68 endpoints)
- **Noticias e Inteligencia:** 6 endpoints
- **Monitoramento:** 7 endpoints
- **Metricas e Analytics:** 10 endpoints
- **PDFs e Analise:** 10 endpoints
- **Deliberacoes e Reunioes:** 5 endpoints
- **Dossies e Entidades:** 5 endpoints
- **Integracoes (Supabase, CNPJ, Transparencia):** 12 endpoints
- **Seguranca e Auth:** 8 endpoints
- **Health/Status:** 5 endpoints

### 4.2 — Fontes de Dados Monitoradas
| Agencia | Tipo | Esfera |
|---------|------|--------|
| DOU (Imprensa Nacional) | RSS | Federal |
| ANEEL | RSS | Federal |
| ANATEL | RSS | Federal |
| ANP | RSS | Federal |
| ANVISA | RSS | Federal |
| ANS | RSS | Federal |
| ANTT | RSS | Federal |
| ANTAQ | RSS | Federal |
| ANAC | RSS | Federal |
| ANA | RSS | Federal |
| ANM | RSS | Federal |
| CVM | RSS | Federal |
| CADE | RSS | Federal |
| TCU | Scraping | Federal |
| CGU | RSS | Federal |
| Senado Federal | RSS | Federal |
| Camara dos Deputados | RSS | Federal |
| ARTESP | Scraping | Estadual (SP) |
| ARSESP | Scraping | Estadual (SP) |

### 4.3 — Seguranca Implementada
| Camada | Implementacao |
|--------|---------------|
| Autenticacao | JWT com access (1h) + refresh (7d) tokens |
| Senhas | bcrypt com cost factor 12 |
| CSRF | Double-submit cookie pattern |
| Brute Force | 5 tentativas → bloqueio 15 min |
| Rate Limiting | 120 req/min geral, 20 req/min endpoints criticos |
| Headers | CSP, X-Frame-Options, X-Content-Type-Options, HSTS |
| Input | Sanitizacao de strings, validacao de CNPJ, URLs |
| CORS | Whitelist de origens, credentials controladas |
| Cookies | HttpOnly, Secure, SameSite=Strict |
| SSRF | Bloqueio de redirects para redes privadas |

---

## 5. FLUXO DE DADOS

```
Fontes Oficiais (25+ agencias)
        |
        v
  [News Fetcher] ← RSS + Scraping + Cache (10min)
        |
        v
  [Backend Express] ← 68 endpoints API
        |
   +----+----+
   |         |
   v         v
[Supabase]  [Memoria]  ← Persistencia dual
   |
   v
[Frontend SPA] ← 15 paginas interativas
        |
        v
  [Associados IRIS] ← Login obrigatorio
```

---

## 6. DIFERENCIAIS COMPETITIVOS

1. **Monitoramento em tempo real** de 25+ fontes regulatorias simultaneas
2. **Extracao automatizada com IA** de dados estruturados a partir de PDFs oficiais
3. **Cruzamento inteligente** entre noticias e deliberacoes
4. **Dossies automaticos** com exportacao PDF profissional
5. **Jurimetria regulatoria** com analise probabilistica baseada em dados historicos
6. **Grafo de vinculos** mostrando relacoes entre diretores, empresas e temas
7. **Auditoria forense** detectando padroes anomalos em votacoes
8. **Radar regulatorio** com alertas configurveis por palavras-chave
9. **Dashboard unificado** com metricas consolidadas
10. **Seguranca robusta** com autenticacao JWT, CSRF, rate limiting

---

## 7. ESTATISTICAS DO PROJETO

| Item | Valor |
|------|-------|
| Endpoints API | 68 |
| Paginas da plataforma | 15 |
| Fontes monitoradas | 25+ |
| Camadas de seguranca | 10 |
| Linhas de codigo (frontend) | ~9.800 |
| Linhas de codigo (backend) | ~4.200 |
| Modulos auxiliares | 8 |

---

## 8. ROADMAP / PROXIMOS PASSOS

- [ ] Migrar armazenamento de usuarios para Supabase (persistencia)
- [ ] Dashboard de administracao de usuarios
- [ ] Notificacoes por email/WhatsApp para alertas regulatorios
- [ ] Integracao com mais agencias estaduais (AGERGS, AGERBA, etc.)
- [ ] App mobile (PWA)
- [ ] Exportacao de relatorios em Excel/CSV
- [ ] Analise preditiva com Machine Learning sobre resultados de deliberacoes

---

*Documento gerado como parte da auditoria completa da Plataforma IRIS.*
*Para uso em comunicacao institucional e geracao de conteudo para LinkedIn.*

import {
  LayoutDashboard,
  FileText,
  MonitorDot,
  Users,
  Scale,
  Building2,
  Newspaper,
  Upload,
  FileSearch,
  ShieldAlert,
  Landmark,
  Map,
  Network,
  Rss,
} from "lucide-react";

export const MODULES = [
  {
    id: "dashboard",
    title: "Dashboard Geral",
    description: "KPIs consolidados, taxa de deferimento, tendências temporais e visão 360° da atividade regulatória.",
    category: "Análise",
    icon: LayoutDashboard,
    metrics: ["Taxa de Deferimento", "Volume Mensal", "Tendências"],
  },
  {
    id: "deliberacoes",
    title: "Deliberações",
    description: "Lista pesquisável com filtros por tipo, decisão, tema, empresa e diretor. Exportação em múltiplos formatos.",
    category: "Coleta",
    icon: FileText,
    metrics: ["Busca Full-Text", "Filtros Avançados", "Exportação"],
  },
  {
    id: "monitor",
    title: "Monitor de Reuniões",
    description: "Processamento de PDFs em tempo real com extração automática de deliberações, votos e decisões.",
    category: "Coleta",
    icon: MonitorDot,
    metrics: ["Tempo Real", "Auto-Extração", "Notificações"],
  },
  {
    id: "diretores",
    title: "Diretores e Mandatos",
    description: "Composição da diretoria, timeline de mandatos, expiração e histórico de participação em reuniões.",
    category: "Análise",
    icon: Users,
    metrics: ["Mandatos Ativos", "Timeline", "Participação"],
  },
  {
    id: "jurimetria",
    title: "Jurimetria",
    description: "Padrões de votação, divergências entre diretores, análise comparativa e previsibilidade de decisões.",
    category: "Análise",
    icon: Scale,
    metrics: ["Padrões de Voto", "Divergências", "Previsibilidade"],
  },
  {
    id: "governanca",
    title: "Governança Regulatória",
    description: "Conformidade, transparência, aderência normativa e indicadores de qualidade regulatória.",
    category: "Auditoria",
    icon: Building2,
    metrics: ["Conformidade", "Transparência", "Qualidade"],
  },
  {
    id: "boletim",
    title: "Boletim Mensal",
    description: "Resumo executivo automático com principais decisões, tendências e alertas do período.",
    category: "Análise",
    icon: Newspaper,
    metrics: ["Auto-Gerado", "Executivo", "Alertas"],
  },
  {
    id: "upload",
    title: "Upload de PDFs",
    description: "Drag-and-drop para análise manual de documentos regulatórios com processamento inteligente.",
    category: "Coleta",
    icon: Upload,
    metrics: ["Drag & Drop", "Batch Upload", "Validação"],
  },
  {
    id: "analise",
    title: "Análise de PDFs",
    description: "Extração e estruturação de dados de documentos regulatórios com classificação automática por IA.",
    category: "Coleta",
    icon: FileSearch,
    metrics: ["IA de Extração", "Classificação", "Estruturação"],
  },
  {
    id: "auditoria",
    title: "Auditoria Forense",
    description: "Detecção de anomalias, padrões suspeitos e desvios estatísticos em decisões regulatórias.",
    category: "Auditoria",
    icon: ShieldAlert,
    metrics: ["Anomalias", "Padrões", "Alertas"],
  },
  {
    id: "agencias",
    title: "Agências Reguladoras",
    description: "Visão comparativa multi-agência com métricas de desempenho e análise cruzada.",
    category: "Visualização",
    icon: Landmark,
    metrics: ["Multi-Agência", "Comparativo", "Benchmarks"],
  },
  {
    id: "mapa",
    title: "Mapa do Brasil",
    description: "Distribuição geográfica de deliberações, concessões e atividade regulatória por região.",
    category: "Visualização",
    icon: Map,
    metrics: ["Geolocalização", "Regiões", "Distribuição"],
  },
  {
    id: "grafo",
    title: "Rede de Conexões",
    description: "Grafo de relações entre diretores, empresas e temas regulatórios. Inteligência de rede.",
    category: "Visualização",
    icon: Network,
    metrics: ["Knowledge Graph", "Conexões", "Influência"],
  },
  {
    id: "noticias",
    title: "Feed de Notícias",
    description: "RSS regulatório em tempo real com 34+ fontes oficiais, filtros por agência e setor.",
    category: "Coleta",
    icon: Rss,
    metrics: ["34+ Fontes", "Tempo Real", "Filtros"],
  },
];

export const MODULE_CATEGORIES = ["Todos", "Coleta", "Análise", "Visualização", "Auditoria"] as const;

export const HERO_STATS = [
  { value: 14, label: "Módulos Analíticos", suffix: "" },
  { value: 40, label: "Empresas Monitoradas", suffix: "+" },
  { value: 24, label: "Monitoramento Contínuo", suffix: "/7" },
] as const;

export const AGENCIES = [
  "ARTESP", "ANEEL", "ANP", "ANATEL", "ANVISA", "ANTT", "ANTAQ", "ANS", "ANA",
] as const;

export const PIPELINE_STEPS = [
  {
    step: 1,
    title: "Coleta Automática",
    description: "Captura contínua de documentos regulatórios, atas de reunião e deliberações direto das fontes oficiais.",
    icon: "download",
  },
  {
    step: 2,
    title: "Extração e Estruturação",
    description: "IA que transforma PDFs não-estruturados em dados classificados: tipo, decisão, votos, empresas, microtemas.",
    icon: "cpu",
  },
  {
    step: 3,
    title: "Análise Inteligente",
    description: "Jurimetria, detecção de anomalias, grafos de conexão e análise preditiva de tendências regulatórias.",
    icon: "brain",
  },
  {
    step: 4,
    title: "Inteligência Acionável",
    description: "Dashboards em tempo real, alertas, boletins mensais e relatórios prontos para decisão.",
    icon: "zap",
  },
] as const;

export const USE_CASES = [
  {
    title: "Compliance & Auditoria",
    description: "Monitore decisões que afetam sua concessão. Receba alertas. Tenha dados para defender posições em processos regulatórios.",
    persona: "Diretor de Compliance",
    icon: "shield",
  },
  {
    title: "Análise Regulatória",
    description: "Jurimetria de votos, tendências de deferimento, padrões de decisão. Dados que antes exigiam meses de pesquisa manual.",
    persona: "Analista Regulatório",
    icon: "bar-chart",
  },
  {
    title: "Advocacia Regulatória",
    description: "Grafo de conexões, histórico de decisões por tema, análise comparativa entre agências. Argumentos baseados em evidência.",
    persona: "Advogado Regulatório",
    icon: "scale",
  },
  {
    title: "Inteligência Competitiva",
    description: "Saiba o que está acontecendo com concorrentes, setores adjacentes e tendências regulatórias antes dos outros.",
    persona: "Gestor de Concessão",
    icon: "eye",
  },
] as const;

export const FAQ_DATA = [
  {
    question: "O que a IRIS faz que eu não consigo com uma planilha?",
    answer: "Planilhas armazenam dados. A IRIS gera inteligência: classifica automaticamente, detecta padrões, mapeia conexões e identifica anomalias que análise manual jamais encontraria.",
  },
  {
    question: "Quais agências reguladoras são cobertas?",
    answer: "Atualmente a IRIS processa dados da ARTESP com arquitetura pronta para expandir para ANEEL, ANP, ANATEL, ANVISA, ANTT e outras agências federais e estaduais.",
  },
  {
    question: "Os dados são atualizados em tempo real?",
    answer: "A IRIS faz varredura automática a cada 30 minutos e processa novos documentos assim que publicados.",
  },
  {
    question: "Preciso instalar algum software?",
    answer: "Não. A IRIS é 100% web, acessível por qualquer navegador moderno.",
  },
  {
    question: "Como funciona a detecção de anomalias?",
    answer: "Algoritmos analisam padrões históricos de votação, tempo de tramitação e consistência de decisões para identificar desvios estatisticamente significativos.",
  },
  {
    question: "Posso fazer upload dos meus próprios documentos?",
    answer: "Sim. O módulo de Upload aceita PDFs via drag-and-drop e os processa com a mesma inteligência da coleta automática.",
  },
  {
    question: "Quem pode se beneficiar da IRIS?",
    answer: "Empresas reguladas, escritórios de advocacia, consultorias, áreas de compliance, pesquisadores e qualquer profissional que precise entender decisões regulatórias.",
  },
  {
    question: "Como solicito uma demonstração?",
    answer: "Preencha o formulário nesta página ou entre em contato diretamente. Fazemos uma demo personalizada para seu caso de uso.",
  },
] as const;

export const NAV_LINKS = [
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#modulos", label: "Módulos" },
  { href: "#casos-de-uso", label: "Casos de Uso" },
  { href: "#faq", label: "FAQ" },
] as const;

export const FOOTER_LINKS = {
  produto: [
    { label: "Módulos", href: "#modulos" },
    { label: "Casos de Uso", href: "#casos-de-uso" },
    { label: "FAQ", href: "#faq" },
    { label: "Demonstração", href: "#demo" },
  ],
  empresa: [
    { label: "Sobre", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contato", href: "mailto:contato@iris.reg.br" },
  ],
  legal: [
    { label: "Política de Privacidade", href: "#" },
    { label: "Termos de Uso", href: "#" },
  ],
} as const;

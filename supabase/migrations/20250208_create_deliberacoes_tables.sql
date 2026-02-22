-- =============================================================================
-- IRIS Platform - Complete Migration
-- Version: 2.0.0
-- Description: Creates all tables, indexes, views, RPC functions, RLS policies,
--              and triggers for the IRIS regulatory intelligence platform.
--
-- This migration matches the authoritative schema in:
--   iris-core/database-schema.sql
--
-- To apply manually:
--   1. Open the SQL Editor in the Supabase Dashboard
--   2. Paste and run this script
--   3. RLS (Row Level Security) will be enabled automatically
-- =============================================================================


-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Tipo de voto dos diretores
DO $$ BEGIN
    CREATE TYPE vote_type_enum AS ENUM ('FAVORABLE', 'AGAINST', 'ABSTENTION', 'ABSENT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- TABELAS
-- =============================================================================

-- ── Tabela: reunioes_monitoradas ──
-- Controla o status de processamento de reunioes coletadas
CREATE TABLE IF NOT EXISTS reunioes_monitoradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_reuniao VARCHAR(50),
    data_reuniao DATE,
    link_pdf TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    progresso INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE reunioes_monitoradas IS 'Controla o status de processamento de reunioes coletadas dos portais das agencias';
COMMENT ON COLUMN reunioes_monitoradas.status IS 'pendente, processando, processado, erro';
COMMENT ON COLUMN reunioes_monitoradas.progresso IS 'Percentual de progresso do processamento (0-100)';

-- ── Tabela: directors (Diretores das agencias) ──
-- Armazena informacoes sobre diretores das agencias reguladoras
CREATE TABLE IF NOT EXISTS directors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Diretor(a)',
    agency TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    mandate_start DATE,
    mandate_end DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT directors_unique_name_agency UNIQUE (name, agency)
);

COMMENT ON TABLE directors IS 'Diretores das agencias reguladoras com dados de mandato';
COMMENT ON COLUMN directors.role IS 'Cargo do diretor (ex: Diretor(a), Presidente, Conselheiro(a))';
COMMENT ON COLUMN directors.is_active IS 'Se o diretor esta em exercicio ativo';

CREATE INDEX IF NOT EXISTS idx_directors_agency ON directors(agency);
CREATE INDEX IF NOT EXISTS idx_directors_name ON directors(name);
CREATE INDEX IF NOT EXISTS idx_directors_active ON directors(is_active) WHERE is_active = true;

-- ── Tabela: deliberacoes_extraidas (Deliberacoes extraidas de PDFs) ──
-- Tabela principal do sistema - armazena todas as deliberacoes processadas
CREATE TABLE IF NOT EXISTS deliberacoes_extraidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencia a reuniao monitorada (quando disponivel)
    reuniao_id UUID REFERENCES reunioes_monitoradas(id),

    -- Identificacao
    agencia TEXT NOT NULL DEFAULT 'ARTESP',
    processo VARCHAR(100),
    numero_reuniao VARCHAR(50),
    data_reuniao DATE,

    -- Partes
    interessado TEXT,

    -- Classificacao
    tipo_deliberacao VARCHAR(100),       -- 'Pleito Externo' ou 'Ato Administrativo Interno'
    pauta_interna BOOLEAN DEFAULT false,
    microtema VARCHAR(200),

    -- Decisao
    decisao VARCHAR(100),                -- 'Deferido', 'Indeferido', 'Parcialmente Deferido', 'A classificar'
    resumo_pleito TEXT,
    fundamento_decisao TEXT,

    -- Votos (texto livre para registro rapido)
    votos_favor TEXT,
    votos_contra TEXT,

    -- Metadados
    link_pdf TEXT,
    raw_data JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE deliberacoes_extraidas IS 'Deliberacoes extraidas de PDFs das agencias reguladoras';
COMMENT ON COLUMN deliberacoes_extraidas.reuniao_id IS 'Referencia a reuniao monitorada de origem';
COMMENT ON COLUMN deliberacoes_extraidas.tipo_deliberacao IS 'Pleito Externo ou Ato Administrativo Interno';
COMMENT ON COLUMN deliberacoes_extraidas.pauta_interna IS 'True se for assunto interno da agencia';
COMMENT ON COLUMN deliberacoes_extraidas.decisao IS 'Deferido, Indeferido, Parcialmente Deferido ou A classificar';
COMMENT ON COLUMN deliberacoes_extraidas.fundamento_decisao IS 'Fundamentacao juridica ou tecnica da decisao';
COMMENT ON COLUMN deliberacoes_extraidas.votos_favor IS 'Nomes dos diretores que votaram a favor (texto livre)';
COMMENT ON COLUMN deliberacoes_extraidas.votos_contra IS 'Nomes dos diretores que votaram contra (texto livre)';
COMMENT ON COLUMN deliberacoes_extraidas.raw_data IS 'Dados brutos do processamento incluindo confianca e metadados';

CREATE INDEX IF NOT EXISTS idx_delib_agencia ON deliberacoes_extraidas(agencia);
CREATE INDEX IF NOT EXISTS idx_delib_reuniao ON deliberacoes_extraidas(numero_reuniao);
CREATE INDEX IF NOT EXISTS idx_delib_data ON deliberacoes_extraidas(data_reuniao);
CREATE INDEX IF NOT EXISTS idx_delib_processo ON deliberacoes_extraidas(processo);
CREATE INDEX IF NOT EXISTS idx_delib_interessado ON deliberacoes_extraidas(interessado);
CREATE INDEX IF NOT EXISTS idx_delib_microtema ON deliberacoes_extraidas(microtema);
CREATE INDEX IF NOT EXISTS idx_delib_decisao ON deliberacoes_extraidas(decisao);
CREATE INDEX IF NOT EXISTS idx_delib_created ON deliberacoes_extraidas(created_at);

-- Indice unico para evitar duplicatas (processo + reuniao)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deliberacoes_unique
ON deliberacoes_extraidas(processo, numero_reuniao)
WHERE processo IS NOT NULL AND numero_reuniao IS NOT NULL;

-- ── Tabela: votes (Votos individuais dos diretores) ──
-- Registro detalhado de votos com confianca de classificacao
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deliberacao_id UUID NOT NULL REFERENCES deliberacoes_extraidas(id) ON DELETE CASCADE,
    director_id UUID NOT NULL REFERENCES directors(id) ON DELETE SET NULL,
    vote_type vote_type_enum NOT NULL DEFAULT 'FAVORABLE',
    confidence_score NUMERIC(3,2) DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE votes IS 'Votos individuais dos diretores em deliberacoes';
COMMENT ON COLUMN votes.vote_type IS 'FAVORABLE, AGAINST, ABSTENTION ou ABSENT';
COMMENT ON COLUMN votes.confidence_score IS 'Score de confianca da classificacao (0.0 a 1.0)';

CREATE INDEX IF NOT EXISTS idx_votes_delib ON votes(deliberacao_id);
CREATE INDEX IF NOT EXISTS idx_votes_director ON votes(director_id);
CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(vote_type);

-- ── Tabela: processing_logs (Logs de processamento) ──
-- Registra eventos de processamento para auditoria e debugging
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL DEFAULT 'PROCESSAMENTO',
    nivel TEXT NOT NULL DEFAULT 'INFO',
    mensagem TEXT NOT NULL,
    detalhes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE processing_logs IS 'Logs de processamento para auditoria e debugging';
COMMENT ON COLUMN processing_logs.tipo IS 'Tipo do evento (PROCESSAMENTO, COLETA, CLASSIFICACAO, etc)';
COMMENT ON COLUMN processing_logs.nivel IS 'Nivel do log (DEBUG, INFO, WARN, ERROR)';

CREATE INDEX IF NOT EXISTS idx_logs_tipo ON processing_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_created ON processing_logs(created_at);

-- ── Tabela: meetings (Reunioes colegiadas - formato multi-agencia) ──
-- Formato normalizado para reunioes de qualquer agencia
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency TEXT NOT NULL,
    meeting_number TEXT,
    meeting_date DATE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR')),
    pdf_url TEXT,
    total_deliberations INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE meetings IS 'Reunioes colegiadas em formato normalizado multi-agencia';
COMMENT ON COLUMN meetings.status IS 'PENDING, PROCESSING, COMPLETED ou ERROR';

CREATE INDEX IF NOT EXISTS idx_meetings_agency ON meetings(agency);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- ── Tabela: news_cache (Cache de noticias - opcional) ──
-- Cache local de noticias coletadas para o dashboard
CREATE TABLE IF NOT EXISTS news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agencia TEXT NOT NULL,
    titulo TEXT NOT NULL,
    resumo TEXT,
    link TEXT,
    data_publicacao DATE,
    tipo TEXT DEFAULT 'noticia',
    esfera TEXT DEFAULT 'federal',
    fonte TEXT,
    cor TEXT,
    fetched_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE news_cache IS 'Cache de noticias regulatorias coletadas para o dashboard';

CREATE INDEX IF NOT EXISTS idx_news_agencia ON news_cache(agencia);
CREATE INDEX IF NOT EXISTS idx_news_data ON news_cache(data_publicacao);
CREATE INDEX IF NOT EXISTS idx_news_fetched ON news_cache(fetched_at);


-- =============================================================================
-- VIEWS PARA DASHBOARD
-- =============================================================================

-- View: Estatisticas por decisao
-- Mostra contagem e percentual de cada tipo de decisao
CREATE OR REPLACE VIEW vw_estatisticas_decisao AS
SELECT
    decisao,
    COUNT(*) AS total,
    ROUND(
        COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM deliberacoes_extraidas), 0),
        2
    ) AS percentual
FROM deliberacoes_extraidas
GROUP BY decisao
ORDER BY total DESC;

COMMENT ON VIEW vw_estatisticas_decisao IS 'Estatisticas agregadas por tipo de decisao';

-- View: Estatisticas por microtema
-- Mostra contagem total e breakdown deferido/indeferido por microtema
CREATE OR REPLACE VIEW vw_estatisticas_microtema AS
SELECT
    microtema,
    COUNT(*) AS total,
    SUM(CASE WHEN decisao = 'Deferido' THEN 1 ELSE 0 END) AS deferidos,
    SUM(CASE WHEN decisao = 'Indeferido' THEN 1 ELSE 0 END) AS indeferidos
FROM deliberacoes_extraidas
GROUP BY microtema
ORDER BY total DESC;

COMMENT ON VIEW vw_estatisticas_microtema IS 'Estatisticas agregadas por microtema com breakdown de decisoes';

-- View: Deliberacoes recentes
-- Ultimas 100 deliberacoes para exibicao rapida no dashboard
CREATE OR REPLACE VIEW vw_deliberacoes_recentes AS
SELECT
    id,
    processo,
    interessado,
    microtema,
    decisao,
    data_reuniao,
    created_at
FROM deliberacoes_extraidas
ORDER BY created_at DESC
LIMIT 100;

COMMENT ON VIEW vw_deliberacoes_recentes IS 'Ultimas 100 deliberacoes para exibicao rapida no dashboard';


-- =============================================================================
-- FUNCOES RPC PARA ANALYTICS
-- =============================================================================

-- Contagem de deliberacoes por agencia
CREATE OR REPLACE FUNCTION get_deliberacoes_por_agencia()
RETURNS TABLE(agencia TEXT, total BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT d.agencia, COUNT(*) AS total
    FROM deliberacoes_extraidas d
    GROUP BY d.agencia
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_deliberacoes_por_agencia IS 'Retorna contagem de deliberacoes agrupadas por agencia';

-- Contagem de votos por diretor (filtro opcional por agencia)
CREATE OR REPLACE FUNCTION get_votos_por_diretor(p_agency TEXT DEFAULT NULL)
RETURNS TABLE(
    director_name TEXT,
    director_role TEXT,
    favorable BIGINT,
    against BIGINT,
    abstention BIGINT,
    total BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dir.name AS director_name,
        dir.role AS director_role,
        COUNT(*) FILTER (WHERE v.vote_type = 'FAVORABLE') AS favorable,
        COUNT(*) FILTER (WHERE v.vote_type = 'AGAINST') AS against,
        COUNT(*) FILTER (WHERE v.vote_type = 'ABSTENTION') AS abstention,
        COUNT(*) AS total
    FROM votes v
    JOIN directors dir ON v.director_id = dir.id
    WHERE (p_agency IS NULL OR dir.agency = p_agency)
    GROUP BY dir.name, dir.role
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_votos_por_diretor IS 'Retorna contagem de votos por diretor, com filtro opcional por agencia';

-- Resumo geral de metricas da plataforma
CREATE OR REPLACE FUNCTION get_metricas_resumo()
RETURNS TABLE(
    total_deliberacoes BIGINT,
    total_diretores BIGINT,
    total_votos BIGINT,
    total_agencias BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM deliberacoes_extraidas),
        (SELECT COUNT(*) FROM directors WHERE is_active = true),
        (SELECT COUNT(*) FROM votes),
        (SELECT COUNT(DISTINCT agencia) FROM deliberacoes_extraidas);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_metricas_resumo IS 'Retorna metricas resumidas da plataforma (totais de deliberacoes, diretores, votos e agencias)';


-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Funcao generica para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at para cada tabela com essa coluna
CREATE OR REPLACE TRIGGER trigger_reunioes_updated
    BEFORE UPDATE ON reunioes_monitoradas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_deliberacoes_updated
    BEFORE UPDATE ON deliberacoes_extraidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_directors_updated
    BEFORE UPDATE ON directors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_meetings_updated
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Supabase requer RLS habilitado para acesso via API.
-- Policies abaixo permitem leitura publica e escrita via service_role key.

-- Habilitar RLS em todas as tabelas
ALTER TABLE reunioes_monitoradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliberacoes_extraidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;

-- Reunioes monitoradas: leitura publica, escrita via service_role
CREATE POLICY "Leitura publica de reunioes" ON reunioes_monitoradas
    FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de reunioes" ON reunioes_monitoradas
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizacao via service_role de reunioes" ON reunioes_monitoradas
    FOR UPDATE USING (true);

-- Deliberacoes: leitura publica, escrita via service_role
CREATE POLICY "Leitura publica de deliberacoes" ON deliberacoes_extraidas
    FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de deliberacoes" ON deliberacoes_extraidas
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizacao via service_role de deliberacoes" ON deliberacoes_extraidas
    FOR UPDATE USING (true);

-- Directors: leitura publica, escrita via service_role
CREATE POLICY "Leitura publica de diretores" ON directors
    FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de diretores" ON directors
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizacao via service_role de diretores" ON directors
    FOR UPDATE USING (true);

-- Votes: leitura publica, escrita via service_role
CREATE POLICY "Leitura publica de votos" ON votes
    FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de votos" ON votes
    FOR INSERT WITH CHECK (true);

-- Processing logs: leitura publica, escrita via service_role
CREATE POLICY "Leitura publica de logs" ON processing_logs
    FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de logs" ON processing_logs
    FOR INSERT WITH CHECK (true);

-- Meetings: leitura publica, escrita via service_role
CREATE POLICY "Leitura publica de meetings" ON meetings
    FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de meetings" ON meetings
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizacao via service_role de meetings" ON meetings
    FOR UPDATE USING (true);

-- News cache: leitura publica, escrita via service_role
CREATE POLICY "Leitura publica de noticias" ON news_cache
    FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de noticias" ON news_cache
    FOR INSERT WITH CHECK (true);


-- =============================================================================
-- FIM DO SCHEMA
-- =============================================================================

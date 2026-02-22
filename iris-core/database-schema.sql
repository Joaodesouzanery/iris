-- =============================================================================
-- IRIS Platform - Database Schema (Supabase/PostgreSQL)
-- Version: 1.1.0
-- Description: Schema for regulatory intelligence platform
--
-- Para aplicar no Supabase:
--   1. Acesse o SQL Editor no Dashboard do Supabase
--   2. Cole e execute este script
--   3. Verifique que RLS (Row Level Security) esta habilitado
-- =============================================================================

-- ── Tabela: directors (Diretores das agências) ──
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

    -- Índices de busca
    CONSTRAINT directors_unique_name_agency UNIQUE (name, agency)
);

CREATE INDEX IF NOT EXISTS idx_directors_agency ON directors(agency);
CREATE INDEX IF NOT EXISTS idx_directors_name ON directors(name);
CREATE INDEX IF NOT EXISTS idx_directors_active ON directors(is_active) WHERE is_active = true;

-- ── Tabela: deliberacoes_extraidas (Deliberações extraídas de PDFs) ──
CREATE TABLE IF NOT EXISTS deliberacoes_extraidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agencia TEXT NOT NULL DEFAULT 'ARTESP',
    numero_reuniao TEXT,
    data_reuniao DATE,
    processo TEXT,
    interessado TEXT,
    pauta_interna BOOLEAN DEFAULT false,
    microtema TEXT,
    resumo_pleito TEXT,
    decisao TEXT,
    link_pdf TEXT,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delib_agencia ON deliberacoes_extraidas(agencia);
CREATE INDEX IF NOT EXISTS idx_delib_reuniao ON deliberacoes_extraidas(numero_reuniao);
CREATE INDEX IF NOT EXISTS idx_delib_data ON deliberacoes_extraidas(data_reuniao);
CREATE INDEX IF NOT EXISTS idx_delib_processo ON deliberacoes_extraidas(processo);
CREATE INDEX IF NOT EXISTS idx_delib_interessado ON deliberacoes_extraidas(interessado);
CREATE INDEX IF NOT EXISTS idx_delib_microtema ON deliberacoes_extraidas(microtema);
CREATE INDEX IF NOT EXISTS idx_delib_created ON deliberacoes_extraidas(created_at);

-- ── Tabela: votes (Votos dos diretores) ──
CREATE TYPE vote_type_enum AS ENUM ('FAVORABLE', 'AGAINST', 'ABSTENTION', 'ABSENT');

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deliberacao_id UUID NOT NULL REFERENCES deliberacoes_extraidas(id) ON DELETE CASCADE,
    director_id UUID NOT NULL REFERENCES directors(id) ON DELETE SET NULL,
    vote_type vote_type_enum NOT NULL DEFAULT 'FAVORABLE',
    confidence_score NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_votes_delib ON votes(deliberacao_id);
CREATE INDEX IF NOT EXISTS idx_votes_director ON votes(director_id);
CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(vote_type);

-- ── Tabela: processing_logs (Logs de processamento) ──
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL DEFAULT 'PROCESSAMENTO',
    nivel TEXT NOT NULL DEFAULT 'INFO',
    mensagem TEXT NOT NULL,
    detalhes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_tipo ON processing_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_created ON processing_logs(created_at);

-- ── Tabela: meetings (Reuniões colegiadas) ──
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

CREATE INDEX IF NOT EXISTS idx_meetings_agency ON meetings(agency);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- ── Tabela: news_cache (Cache de notícias - opcional) ──
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

CREATE INDEX IF NOT EXISTS idx_news_agencia ON news_cache(agencia);
CREATE INDEX IF NOT EXISTS idx_news_data ON news_cache(data_publicacao);
CREATE INDEX IF NOT EXISTS idx_news_fetched ON news_cache(fetched_at);

-- ── Funções RPC para analytics ──

-- Contagem de deliberações por agência
CREATE OR REPLACE FUNCTION get_deliberacoes_por_agencia()
RETURNS TABLE(agencia TEXT, total BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT d.agencia, COUNT(*) as total
    FROM deliberacoes_extraidas d
    GROUP BY d.agencia
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- Contagem de votos por diretor
CREATE OR REPLACE FUNCTION get_votos_por_diretor(p_agency TEXT DEFAULT NULL)
RETURNS TABLE(director_name TEXT, director_role TEXT, favorable BIGINT, against BIGINT, abstention BIGINT, total BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dir.name as director_name,
        dir.role as director_role,
        COUNT(*) FILTER (WHERE v.vote_type = 'FAVORABLE') as favorable,
        COUNT(*) FILTER (WHERE v.vote_type = 'AGAINST') as against,
        COUNT(*) FILTER (WHERE v.vote_type = 'ABSTENTION') as abstention,
        COUNT(*) as total
    FROM votes v
    JOIN directors dir ON v.director_id = dir.id
    WHERE (p_agency IS NULL OR dir.agency = p_agency)
    GROUP BY dir.name, dir.role
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- Resumo geral de métricas
CREATE OR REPLACE FUNCTION get_metricas_resumo()
RETURNS TABLE(total_deliberacoes BIGINT, total_diretores BIGINT, total_votos BIGINT, total_agencias BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM deliberacoes_extraidas),
        (SELECT COUNT(*) FROM directors WHERE is_active = true),
        (SELECT COUNT(*) FROM votes),
        (SELECT COUNT(DISTINCT agencia) FROM deliberacoes_extraidas);
END;
$$ LANGUAGE plpgsql;

-- ── Row Level Security (RLS) ──
-- Nota: Para Supabase, habilitar RLS nas tabelas
-- e criar policies conforme necessidade.
-- Exemplo para leitura pública e escrita autenticada:

-- ALTER TABLE deliberacoes_extraidas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE directors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Leitura pública de deliberações" ON deliberacoes_extraidas
--     FOR SELECT USING (true);
-- CREATE POLICY "Inserção com service_key" ON deliberacoes_extraidas
--     FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Atualização com service_key" ON deliberacoes_extraidas
--     FOR UPDATE USING (true);

-- ── Trigger para atualizar updated_at ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_deliberacoes_updated
    BEFORE UPDATE ON deliberacoes_extraidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_directors_updated
    BEFORE UPDATE ON directors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_meetings_updated
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

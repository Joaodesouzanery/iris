-- =============================================================================
-- IRIS Platform - Setup Completo para Supabase SQL Editor
-- =============================================================================
-- INSTRUÇÕES:
--   1. Abra o Supabase Dashboard -> SQL Editor
--   2. Cole TODO este script
--   3. Clique em "Run" (ou Ctrl+Enter)
--   4. Pronto! Todas as tabelas, views, funções e policies serão criadas.
--
-- Este script é IDEMPOTENTE - pode ser executado múltiplas vezes sem erro.
-- =============================================================================


-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE vote_type_enum AS ENUM ('FAVORABLE', 'AGAINST', 'ABSTENTION', 'ABSENT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- 2. TABELAS
-- =============================================================================

-- Reuniões monitoradas (status de processamento)
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

-- Diretores das agências reguladoras
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

-- Deliberações extraídas de PDFs (tabela principal)
CREATE TABLE IF NOT EXISTS deliberacoes_extraidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reuniao_id UUID REFERENCES reunioes_monitoradas(id),
    agencia TEXT NOT NULL DEFAULT 'ARTESP',
    processo VARCHAR(100),
    numero_reuniao VARCHAR(50),
    data_reuniao DATE,
    interessado TEXT,
    tipo_deliberacao VARCHAR(100),
    pauta_interna BOOLEAN DEFAULT false,
    microtema VARCHAR(200),
    decisao VARCHAR(100),
    resumo_pleito TEXT,
    fundamento_decisao TEXT,
    votos_favor TEXT,
    votos_contra TEXT,
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

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_deliberacoes_unique
ON deliberacoes_extraidas(processo, numero_reuniao)
WHERE processo IS NOT NULL AND numero_reuniao IS NOT NULL;

-- Votos individuais dos diretores
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

-- Logs de processamento
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


-- =============================================================================
-- 3. VIEWS PARA DASHBOARD
-- =============================================================================

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

CREATE OR REPLACE VIEW vw_deliberacoes_recentes AS
SELECT
    id,
    processo,
    interessado,
    microtema,
    decisao,
    data_reuniao,
    numero_reuniao,
    agencia,
    votos_favor,
    votos_contra,
    created_at
FROM deliberacoes_extraidas
ORDER BY created_at DESC
LIMIT 100;

COMMENT ON VIEW vw_deliberacoes_recentes IS 'Ultimas 100 deliberacoes para exibicao rapida no dashboard';

-- View: Deliberações com votos detalhados
CREATE OR REPLACE VIEW vw_deliberacoes_com_votos AS
SELECT
    d.id,
    d.processo,
    d.interessado,
    d.microtema,
    d.decisao,
    d.numero_reuniao,
    d.data_reuniao,
    d.agencia,
    d.tipo_deliberacao,
    d.votos_favor,
    d.votos_contra,
    d.resumo_pleito,
    COUNT(v.id) AS total_votos_registrados,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'FAVORABLE') AS votos_favoraveis,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'AGAINST') AS votos_contrarios,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'ABSTENTION') AS abstencoes,
    d.created_at
FROM deliberacoes_extraidas d
LEFT JOIN votes v ON v.deliberacao_id = d.id
GROUP BY d.id
ORDER BY d.created_at DESC;

COMMENT ON VIEW vw_deliberacoes_com_votos IS 'Deliberacoes com contagem detalhada de votos por tipo';

-- View: Resumo por diretor
CREATE OR REPLACE VIEW vw_resumo_diretores AS
SELECT
    dir.id,
    dir.name,
    dir.role,
    dir.agency,
    dir.is_active,
    dir.mandate_start,
    dir.mandate_end,
    COUNT(v.id) AS total_votos,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'FAVORABLE') AS votos_favoraveis,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'AGAINST') AS votos_contrarios,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'ABSTENTION') AS abstencoes,
    ROUND(AVG(v.confidence_score)::numeric, 2) AS confianca_media
FROM directors dir
LEFT JOIN votes v ON v.director_id = dir.id
GROUP BY dir.id
ORDER BY total_votos DESC;

COMMENT ON VIEW vw_resumo_diretores IS 'Resumo por diretor com contagem de votos e confianca media';


-- =============================================================================
-- 4. FUNÇÕES RPC PARA ANALYTICS
-- =============================================================================

-- Contagem de deliberações por agência
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

-- Contagem de votos por diretor
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

-- Resumo geral de métricas
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

-- Busca de deliberações com filtros (para o endpoint REST)
CREATE OR REPLACE FUNCTION buscar_deliberacoes(
    p_agencia TEXT DEFAULT NULL,
    p_decisao TEXT DEFAULT NULL,
    p_microtema TEXT DEFAULT NULL,
    p_interessado TEXT DEFAULT NULL,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_limite INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    processo VARCHAR,
    numero_reuniao VARCHAR,
    data_reuniao DATE,
    interessado TEXT,
    tipo_deliberacao VARCHAR,
    microtema VARCHAR,
    decisao VARCHAR,
    resumo_pleito TEXT,
    votos_favor TEXT,
    votos_contra TEXT,
    agencia TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id, d.processo, d.numero_reuniao, d.data_reuniao,
        d.interessado, d.tipo_deliberacao, d.microtema, d.decisao,
        d.resumo_pleito, d.votos_favor, d.votos_contra, d.agencia,
        d.created_at
    FROM deliberacoes_extraidas d
    WHERE
        (p_agencia IS NULL OR d.agencia = p_agencia)
        AND (p_decisao IS NULL OR d.decisao = p_decisao)
        AND (p_microtema IS NULL OR d.microtema ILIKE '%' || p_microtema || '%')
        AND (p_interessado IS NULL OR d.interessado ILIKE '%' || p_interessado || '%')
        AND (p_data_inicio IS NULL OR d.data_reuniao >= p_data_inicio)
        AND (p_data_fim IS NULL OR d.data_reuniao <= p_data_fim)
    ORDER BY d.created_at DESC
    LIMIT p_limite
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_deliberacoes IS 'Busca deliberacoes com filtros combinaveis (agencia, decisao, microtema, interessado, periodo)';

-- Estatísticas avançadas por diretor
CREATE OR REPLACE FUNCTION get_estatisticas_diretor(p_director_name TEXT DEFAULT NULL)
RETURNS TABLE(
    director_name TEXT,
    director_role TEXT,
    agency TEXT,
    total_votos BIGINT,
    favoraveis BIGINT,
    contrarios BIGINT,
    abstencoes BIGINT,
    taxa_favoravel NUMERIC,
    temas_mais_votados JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dir.name,
        dir.role,
        dir.agency,
        COUNT(v.id) AS total_votos,
        COUNT(v.id) FILTER (WHERE v.vote_type = 'FAVORABLE') AS favoraveis,
        COUNT(v.id) FILTER (WHERE v.vote_type = 'AGAINST') AS contrarios,
        COUNT(v.id) FILTER (WHERE v.vote_type = 'ABSTENTION') AS abstencoes,
        CASE WHEN COUNT(v.id) > 0
            THEN ROUND(COUNT(v.id) FILTER (WHERE v.vote_type = 'FAVORABLE') * 100.0 / COUNT(v.id), 1)
            ELSE 0
        END AS taxa_favoravel,
        COALESCE(
            jsonb_agg(DISTINCT jsonb_build_object('tema', de.microtema, 'count', 1))
            FILTER (WHERE de.microtema IS NOT NULL),
            '[]'::jsonb
        ) AS temas_mais_votados
    FROM directors dir
    LEFT JOIN votes v ON v.director_id = dir.id
    LEFT JOIN deliberacoes_extraidas de ON de.id = v.deliberacao_id
    WHERE (p_director_name IS NULL OR dir.name ILIKE '%' || p_director_name || '%')
    GROUP BY dir.id, dir.name, dir.role, dir.agency
    HAVING COUNT(v.id) > 0
    ORDER BY total_votos DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_estatisticas_diretor IS 'Estatisticas avancadas por diretor com taxa de aprovacao e temas mais votados';


-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers primeiro para evitar erro de duplicata
DROP TRIGGER IF EXISTS trigger_reunioes_updated ON reunioes_monitoradas;
DROP TRIGGER IF EXISTS trigger_deliberacoes_updated ON deliberacoes_extraidas;
DROP TRIGGER IF EXISTS trigger_directors_updated ON directors;

CREATE TRIGGER trigger_reunioes_updated
    BEFORE UPDATE ON reunioes_monitoradas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_deliberacoes_updated
    BEFORE UPDATE ON deliberacoes_extraidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_directors_updated
    BEFORE UPDATE ON directors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE reunioes_monitoradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliberacoes_extraidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes para permitir re-execução
DO $$ BEGIN
    -- reunioes_monitoradas
    DROP POLICY IF EXISTS "Leitura publica de reunioes" ON reunioes_monitoradas;
    DROP POLICY IF EXISTS "Insercao via service_role de reunioes" ON reunioes_monitoradas;
    DROP POLICY IF EXISTS "Atualizacao via service_role de reunioes" ON reunioes_monitoradas;
    -- deliberacoes_extraidas
    DROP POLICY IF EXISTS "Leitura publica de deliberacoes" ON deliberacoes_extraidas;
    DROP POLICY IF EXISTS "Insercao via service_role de deliberacoes" ON deliberacoes_extraidas;
    DROP POLICY IF EXISTS "Atualizacao via service_role de deliberacoes" ON deliberacoes_extraidas;
    -- directors
    DROP POLICY IF EXISTS "Leitura publica de diretores" ON directors;
    DROP POLICY IF EXISTS "Insercao via service_role de diretores" ON directors;
    DROP POLICY IF EXISTS "Atualizacao via service_role de diretores" ON directors;
    -- votes
    DROP POLICY IF EXISTS "Leitura publica de votos" ON votes;
    DROP POLICY IF EXISTS "Insercao via service_role de votos" ON votes;
    -- processing_logs
    DROP POLICY IF EXISTS "Leitura publica de logs" ON processing_logs;
    DROP POLICY IF EXISTS "Insercao via service_role de logs" ON processing_logs;
END $$;

-- Policies: Leitura pública + escrita via service_role
CREATE POLICY "Leitura publica de reunioes" ON reunioes_monitoradas FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de reunioes" ON reunioes_monitoradas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizacao via service_role de reunioes" ON reunioes_monitoradas FOR UPDATE USING (true);

CREATE POLICY "Leitura publica de deliberacoes" ON deliberacoes_extraidas FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de deliberacoes" ON deliberacoes_extraidas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizacao via service_role de deliberacoes" ON deliberacoes_extraidas FOR UPDATE USING (true);

CREATE POLICY "Leitura publica de diretores" ON directors FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de diretores" ON directors FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizacao via service_role de diretores" ON directors FOR UPDATE USING (true);

CREATE POLICY "Leitura publica de votos" ON votes FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de votos" ON votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Leitura publica de logs" ON processing_logs FOR SELECT USING (true);
CREATE POLICY "Insercao via service_role de logs" ON processing_logs FOR INSERT WITH CHECK (true);


-- =============================================================================
-- 7. DADOS INICIAIS - Diretores ARTESP atuais
-- =============================================================================

INSERT INTO directors (name, role, agency, is_active, mandate_start, mandate_end)
VALUES
    ('André Isper Rodrigues Barnabé', 'Diretor-Presidente', 'ARTESP', true, '2024-09-10', '2029-09-09'),
    ('Diego Albert Zanatto', 'Diretor', 'ARTESP', true, '2024-08-14', '2029-08-13'),
    ('Fernanda Esbízaro Rodrigues Rudnik', 'Diretora', 'ARTESP', true, '2025-08-28', '2030-08-27'),
    ('Raquel França Carneiro', 'Diretora', 'ARTESP', true, '2025-05-14', '2030-05-13')
ON CONFLICT (name, agency) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    mandate_start = EXCLUDED.mandate_start,
    mandate_end = EXCLUDED.mandate_end;


-- =============================================================================
-- SETUP COMPLETO!
-- =============================================================================
-- Tabelas criadas: 5
-- Views criadas: 5
-- Funções RPC: 5 (+1 trigger helper)
-- Policies RLS: 13
-- Diretores inseridos: 4
-- =============================================================================

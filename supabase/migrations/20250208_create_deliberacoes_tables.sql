-- ============================================================================
-- IRIS Platform - Database Schema
-- Tabelas para armazenamento de deliberacoes da ARTESP
-- ============================================================================

-- Tabela: reunioes_monitoradas
-- Armazena informacoes sobre reunioes e status de processamento
CREATE TABLE IF NOT EXISTS reunioes_monitoradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_reuniao VARCHAR(50),
    data_reuniao DATE,
    link_pdf TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    progresso INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: deliberacoes_extraidas
-- Armazena as deliberacoes extraidas dos PDFs
CREATE TABLE IF NOT EXISTS deliberacoes_extraidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reuniao_id UUID REFERENCES reunioes_monitoradas(id),
    agencia VARCHAR(50) DEFAULT 'ARTESP',

    -- Identificacao
    processo VARCHAR(100),
    numero_reuniao VARCHAR(50),
    data_reuniao DATE,

    -- Partes
    interessado TEXT,

    -- Classificacao
    tipo_deliberacao VARCHAR(100), -- 'Pleito Externo' ou 'Ato Administrativo Interno'
    pauta_interna BOOLEAN DEFAULT FALSE,
    microtema VARCHAR(200),

    -- Decisao
    decisao VARCHAR(100), -- 'Deferido', 'Indeferido', 'Parcialmente Deferido', 'A classificar'
    resumo_pleito TEXT,
    fundamento_decisao TEXT,

    -- Votos
    votos_favor TEXT,
    votos_contra TEXT,

    -- Metadados
    link_pdf TEXT,
    raw_data JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_deliberacoes_processo ON deliberacoes_extraidas(processo);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_reuniao ON deliberacoes_extraidas(numero_reuniao);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_interessado ON deliberacoes_extraidas(interessado);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_decisao ON deliberacoes_extraidas(decisao);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_microtema ON deliberacoes_extraidas(microtema);
CREATE INDEX IF NOT EXISTS idx_deliberacoes_data ON deliberacoes_extraidas(data_reuniao);

-- Indice unico para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_deliberacoes_unique
ON deliberacoes_extraidas(processo, numero_reuniao)
WHERE processo IS NOT NULL AND numero_reuniao IS NOT NULL;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_deliberacoes_updated_at ON deliberacoes_extraidas;
CREATE TRIGGER update_deliberacoes_updated_at
    BEFORE UPDATE ON deliberacoes_extraidas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reunioes_updated_at ON reunioes_monitoradas;
CREATE TRIGGER update_reunioes_updated_at
    BEFORE UPDATE ON reunioes_monitoradas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views para Dashboard
-- ============================================================================

-- View: Estatisticas por decisao
CREATE OR REPLACE VIEW vw_estatisticas_decisao AS
SELECT
    decisao,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM deliberacoes_extraidas), 0), 2) as percentual
FROM deliberacoes_extraidas
GROUP BY decisao
ORDER BY total DESC;

-- View: Estatisticas por microtema
CREATE OR REPLACE VIEW vw_estatisticas_microtema AS
SELECT
    microtema,
    COUNT(*) as total,
    SUM(CASE WHEN decisao = 'Deferido' THEN 1 ELSE 0 END) as deferidos,
    SUM(CASE WHEN decisao = 'Indeferido' THEN 1 ELSE 0 END) as indeferidos
FROM deliberacoes_extraidas
GROUP BY microtema
ORDER BY total DESC;

-- View: Deliberacoes recentes
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

-- ============================================================================
-- RLS (Row Level Security) - Opcional
-- ============================================================================

-- Habilitar RLS nas tabelas (descomente se necessario)
-- ALTER TABLE deliberacoes_extraidas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reunioes_monitoradas ENABLE ROW LEVEL SECURITY;

-- Politica para leitura publica (descomente se necessario)
-- CREATE POLICY "Deliberacoes sao publicas" ON deliberacoes_extraidas FOR SELECT USING (true);
-- CREATE POLICY "Reunioes sao publicas" ON reunioes_monitoradas FOR SELECT USING (true);

-- ============================================================================
-- Comentarios nas tabelas
-- ============================================================================

COMMENT ON TABLE deliberacoes_extraidas IS 'Armazena deliberacoes extraidas de PDFs da ARTESP';
COMMENT ON TABLE reunioes_monitoradas IS 'Controla o status de processamento de reunioes';

COMMENT ON COLUMN deliberacoes_extraidas.tipo_deliberacao IS 'Pleito Externo ou Ato Administrativo Interno';
COMMENT ON COLUMN deliberacoes_extraidas.pauta_interna IS 'True se for assunto interno da ARTESP';
COMMENT ON COLUMN deliberacoes_extraidas.decisao IS 'Deferido, Indeferido, Parcialmente Deferido ou A classificar';

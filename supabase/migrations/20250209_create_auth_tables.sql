-- =============================================================================
-- IRIS Platform - Auth Tables Migration
-- Version: 3.1.0
-- Description: Creates tables for user authentication and password reset,
--              replacing the in-memory auth store with Supabase persistence.
--
-- To apply manually:
--   1. Open the SQL Editor in the Supabase Dashboard
--   2. Paste and run this script
-- =============================================================================


-- ── Tabela: iris_users ──
-- Armazena usuarios da plataforma com hash de senha bcrypt
CREATE TABLE IF NOT EXISTS iris_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'associado',
    must_change_password BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT iris_users_username_check CHECK (
        length(username) >= 3 AND username ~ '^[a-zA-Z0-9._-]+$'
    ),
    CONSTRAINT iris_users_role_check CHECK (
        role IN ('admin', 'associado')
    )
);

COMMENT ON TABLE iris_users IS 'Usuarios da plataforma IRIS com autenticacao propria';
COMMENT ON COLUMN iris_users.password_hash IS 'Hash bcrypt da senha do usuario';
COMMENT ON COLUMN iris_users.role IS 'admin ou associado';
COMMENT ON COLUMN iris_users.must_change_password IS 'True se o usuario deve trocar a senha no proximo login';

CREATE INDEX IF NOT EXISTS idx_iris_users_username ON iris_users(username);
CREATE INDEX IF NOT EXISTS idx_iris_users_active ON iris_users(is_active) WHERE is_active = true;


-- ── Tabela: iris_password_resets ──
-- Tokens de recuperacao de senha com expiracao
CREATE TABLE IF NOT EXISTS iris_password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) NOT NULL REFERENCES iris_users(username) ON DELETE CASCADE,
    reset_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE iris_password_resets IS 'Tokens de recuperacao de senha com expiracao de 15 minutos';
COMMENT ON COLUMN iris_password_resets.reset_code IS 'Codigo numerico de 6 digitos para reset de senha';

CREATE INDEX IF NOT EXISTS idx_iris_resets_code ON iris_password_resets(reset_code) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_iris_resets_username ON iris_password_resets(username);
CREATE INDEX IF NOT EXISTS idx_iris_resets_expires ON iris_password_resets(expires_at);


-- ── Tabela: iris_refresh_tokens ──
-- Tokens de refresh para sessoes JWT
CREATE TABLE IF NOT EXISTS iris_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) NOT NULL REFERENCES iris_users(username) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE iris_refresh_tokens IS 'Refresh tokens para manter sessoes de usuario';

CREATE INDEX IF NOT EXISTS idx_iris_refresh_hash ON iris_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_iris_refresh_expires ON iris_refresh_tokens(expires_at);


-- ── Trigger: updated_at para iris_users ──
CREATE OR REPLACE TRIGGER trigger_iris_users_updated
    BEFORE UPDATE ON iris_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── RLS Policies ──
ALTER TABLE iris_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE iris_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE iris_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- iris_users: leitura e escrita via service_role/anon (server-side only)
CREATE POLICY "Server read iris_users" ON iris_users FOR SELECT USING (true);
CREATE POLICY "Server insert iris_users" ON iris_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Server update iris_users" ON iris_users FOR UPDATE USING (true);
CREATE POLICY "Server delete iris_users" ON iris_users FOR DELETE USING (true);

-- iris_password_resets: escrita e leitura via server
CREATE POLICY "Server read iris_password_resets" ON iris_password_resets FOR SELECT USING (true);
CREATE POLICY "Server insert iris_password_resets" ON iris_password_resets FOR INSERT WITH CHECK (true);
CREATE POLICY "Server update iris_password_resets" ON iris_password_resets FOR UPDATE USING (true);
CREATE POLICY "Server delete iris_password_resets" ON iris_password_resets FOR DELETE USING (true);

-- iris_refresh_tokens: escrita e leitura via server
CREATE POLICY "Server read iris_refresh_tokens" ON iris_refresh_tokens FOR SELECT USING (true);
CREATE POLICY "Server insert iris_refresh_tokens" ON iris_refresh_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Server delete iris_refresh_tokens" ON iris_refresh_tokens FOR DELETE USING (true);


-- ── Funcao: Limpar tokens expirados ──
CREATE OR REPLACE FUNCTION cleanup_expired_auth_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM iris_password_resets WHERE expires_at < now() OR used = true;
    DELETE FROM iris_refresh_tokens WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_auth_tokens IS 'Remove tokens de reset e refresh expirados';


-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================

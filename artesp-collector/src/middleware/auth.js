/**
 * IRIS Platform - Authentication Middleware
 * JWT-based authentication with bcrypt password hashing
 *
 * Security features:
 * - JWT tokens with short expiry (1h access, 7d refresh)
 * - Bcrypt password hashing (cost factor 12)
 * - HTTP-only secure cookies for token storage
 * - CSRF protection via double-submit cookie pattern
 * - Brute-force protection with account lockout
 * - Session invalidation support
 * - Supabase persistence with in-memory fallback
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ── Configuration ──
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const PASSWORD_RESET_EXPIRY = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

// ── Supabase REST API Configuration ──
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

function isSupabaseAvailable() {
    return !!(SUPABASE_URL &&
              !SUPABASE_URL.includes('SEU_PROJECT_ID') &&
              SUPABASE_KEY &&
              !SUPABASE_KEY.includes('COLE_SUA'));
}

async function supabaseRequest(method, table, data = null, query = '') {
    const axios = require('axios');
    const url = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}${query}`;

    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : (method === 'DELETE' ? '' : 'return=minimal')
    };

    if (method === 'GET' || method === 'DELETE') {
        headers['Prefer'] = '';
    }
    if (method === 'PATCH') {
        headers['Prefer'] = 'return=representation';
    }

    const config = { method, url, timeout: 10000, headers };
    if (data) config.data = data;

    const response = await axios(config);
    return response.data;
}

// ── In-memory fallback stores ──
const memoryUsers = new Map();
const memoryRefreshTokens = new Set();
const loginAttempts = new Map(); // always in-memory (ephemeral)
const invalidatedTokens = new Set(); // always in-memory (ephemeral)
const passwordResetAttempts = new Map(); // rate limit per IP (ephemeral)

// ── User Operations (Supabase or Memory) ──
async function findUser(username) {
    if (isSupabaseAvailable()) {
        try {
            const result = await supabaseRequest('GET', 'iris_users', null,
                `?username=eq.${encodeURIComponent(username)}&is_active=eq.true&limit=1`);
            if (result && result.length > 0) {
                const u = result[0];
                return {
                    id: u.id,
                    username: u.username,
                    passwordHash: u.password_hash,
                    role: u.role,
                    mustChangePassword: u.must_change_password,
                    createdAt: u.created_at,
                    lastLogin: u.last_login
                };
            }
            return null;
        } catch (err) {
            console.warn('[Auth] Supabase findUser error, falling back to memory:', err.message);
        }
    }
    return memoryUsers.get(username) || null;
}

async function createUser(username, passwordHash, role, mustChangePassword = true) {
    if (isSupabaseAvailable()) {
        try {
            const result = await supabaseRequest('POST', 'iris_users', {
                username,
                password_hash: passwordHash,
                role,
                must_change_password: mustChangePassword
            });
            if (result && result.length > 0) {
                const u = result[0];
                return { id: u.id, username: u.username, role: u.role, mustChangePassword: u.must_change_password };
            }
        } catch (err) {
            console.warn('[Auth] Supabase createUser error, falling back to memory:', err.message);
        }
    }

    const user = {
        id: 'usr_' + crypto.randomBytes(8).toString('hex'),
        username,
        passwordHash,
        role,
        mustChangePassword,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    memoryUsers.set(username, user);
    return user;
}

async function updateUserPassword(username, newPasswordHash) {
    if (isSupabaseAvailable()) {
        try {
            await supabaseRequest('PATCH', 'iris_users', {
                password_hash: newPasswordHash,
                must_change_password: false
            }, `?username=eq.${encodeURIComponent(username)}`);
            return true;
        } catch (err) {
            console.warn('[Auth] Supabase updateUserPassword error:', err.message);
        }
    }

    const user = memoryUsers.get(username);
    if (user) {
        user.passwordHash = newPasswordHash;
        user.mustChangePassword = false;
    }
    return true;
}

async function updateUserLastLogin(username) {
    if (isSupabaseAvailable()) {
        try {
            await supabaseRequest('PATCH', 'iris_users', {
                last_login: new Date().toISOString()
            }, `?username=eq.${encodeURIComponent(username)}`);
        } catch (err) {
            // Non-critical, ignore
        }
    }

    const user = memoryUsers.get(username);
    if (user) user.lastLogin = new Date().toISOString();
}

async function listUsers() {
    if (isSupabaseAvailable()) {
        try {
            const result = await supabaseRequest('GET', 'iris_users', null,
                '?select=id,username,role,created_at,last_login,is_active&order=created_at.desc');
            return (result || []).map(u => ({
                id: u.id,
                username: u.username,
                role: u.role,
                createdAt: u.created_at,
                lastLogin: u.last_login
            }));
        } catch (err) {
            console.warn('[Auth] Supabase listUsers error:', err.message);
        }
    }

    return Array.from(memoryUsers.values()).map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
    }));
}

async function deleteUser(username) {
    if (isSupabaseAvailable()) {
        try {
            await supabaseRequest('DELETE', 'iris_users', null,
                `?username=eq.${encodeURIComponent(username)}`);
            return true;
        } catch (err) {
            console.warn('[Auth] Supabase deleteUser error:', err.message);
        }
    }
    return memoryUsers.delete(username);
}

async function userExists(username) {
    const user = await findUser(username);
    return !!user;
}

// ── Password Reset Token Operations (Supabase or Memory) ──
const memoryResetTokens = new Map();

async function saveResetCode(username, resetCode, expiresAt) {
    if (isSupabaseAvailable()) {
        try {
            await supabaseRequest('POST', 'iris_password_resets', {
                username,
                reset_code: resetCode,
                expires_at: new Date(expiresAt).toISOString()
            });
            return true;
        } catch (err) {
            console.warn('[Auth] Supabase saveResetCode error:', err.message);
        }
    }

    memoryResetTokens.set(resetCode, {
        username,
        expiresAt,
        used: false
    });
    return true;
}

async function findResetCode(code) {
    if (isSupabaseAvailable()) {
        try {
            const result = await supabaseRequest('GET', 'iris_password_resets', null,
                `?reset_code=eq.${encodeURIComponent(code)}&used=eq.false&limit=1`);
            if (result && result.length > 0) {
                const r = result[0];
                return {
                    id: r.id,
                    username: r.username,
                    expiresAt: new Date(r.expires_at).getTime(),
                    used: r.used
                };
            }
            return null;
        } catch (err) {
            console.warn('[Auth] Supabase findResetCode error:', err.message);
        }
    }

    return memoryResetTokens.get(code) || null;
}

async function markResetCodeUsed(code) {
    if (isSupabaseAvailable()) {
        try {
            await supabaseRequest('PATCH', 'iris_password_resets',
                { used: true },
                `?reset_code=eq.${encodeURIComponent(code)}`);
            return true;
        } catch (err) {
            console.warn('[Auth] Supabase markResetCodeUsed error:', err.message);
        }
    }

    const token = memoryResetTokens.get(code);
    if (token) {
        token.used = true;
        memoryResetTokens.delete(code);
    }
    return true;
}

// ── Initialize default admin user ──
async function initDefaultAdmin() {
    const existing = await findUser('admin');
    if (!existing) {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'iris-admin-2026';
        const hash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);
        await createUser('admin', hash, 'admin', !process.env.ADMIN_PASSWORD);

        const storage = isSupabaseAvailable() ? 'Supabase' : 'memoria';
        console.log(`[Auth] Default admin user initialized (${storage})`);
        if (!process.env.ADMIN_PASSWORD) {
            console.warn('[Auth] WARNING: Using default password. Set ADMIN_PASSWORD in .env');
        }
    } else {
        const storage = isSupabaseAvailable() ? 'Supabase' : 'memoria';
        console.log(`[Auth] Admin user found (${storage})`);
    }
}

// ── Brute Force Protection (always in-memory, ephemeral) ──
function checkLoginAttempts(username) {
    const attempts = loginAttempts.get(username);
    if (!attempts) return { allowed: true };

    const now = Date.now();
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const remainingMs = attempts.lockedUntil - now;
        return {
            allowed: false,
            retryAfter: Math.ceil(remainingMs / 1000),
            message: `Conta bloqueada. Tente novamente em ${Math.ceil(remainingMs / 60000)} minutos.`
        };
    }

    if (attempts.lockedUntil && now >= attempts.lockedUntil) {
        loginAttempts.delete(username);
        return { allowed: true };
    }

    return { allowed: true };
}

function recordFailedLogin(username) {
    const attempts = loginAttempts.get(username) || { count: 0, firstAttempt: Date.now() };
    attempts.count++;

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
        console.warn(`[Auth] Account '${username}' locked after ${attempts.count} failed attempts`);
    }

    loginAttempts.set(username, attempts);
}

function clearLoginAttempts(username) {
    loginAttempts.delete(username);
}

// ── Token Generation ──
function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role,
            type: 'access'
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY, issuer: 'iris-platform' }
    );
}

function generateRefreshToken(user) {
    const token = jwt.sign(
        {
            sub: user.id,
            username: user.username,
            type: 'refresh',
            jti: crypto.randomBytes(16).toString('hex')
        },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY, issuer: 'iris-platform' }
    );
    memoryRefreshTokens.add(token);
    return token;
}

function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ── Cookie Settings ──
function getAccessCookieOptions() {
    return {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/'
    };
}

function getRefreshCookieOptions() {
    return {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/refresh'
    };
}

// ── Middleware: Authenticate Request ──
function authenticate(req, res, next) {
    const token = req.cookies?.iris_access_token ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Autenticacao necessaria',
            code: 'AUTH_REQUIRED'
        });
    }

    if (invalidatedTokens.has(token)) {
        return res.status(401).json({
            success: false,
            error: 'Sessao expirada',
            code: 'TOKEN_INVALIDATED'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'iris-platform' });
        if (decoded.type !== 'access') {
            return res.status(401).json({ success: false, error: 'Token invalido', code: 'INVALID_TOKEN_TYPE' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ success: false, error: 'Token invalido', code: 'INVALID_TOKEN' });
    }
}

// ── Middleware: Require Admin Role ──
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado. Permissao de administrador necessaria.',
            code: 'ADMIN_REQUIRED'
        });
    }
    next();
}

// ── Middleware: Optional Auth ──
function optionalAuth(req, res, next) {
    const token = req.cookies?.iris_access_token ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (token && !invalidatedTokens.has(token)) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'iris-platform' });
            if (decoded.type === 'access') {
                req.user = decoded;
            }
        } catch {
            // Silently ignore invalid tokens in optional auth
        }
    }
    next();
}

// ── Middleware: CSRF Protection ──
function csrfProtection(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
    const csrfCookie = req.cookies?.iris_csrf_token;

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
        return res.status(403).json({
            success: false,
            error: 'CSRF token invalido',
            code: 'CSRF_INVALID'
        });
    }
    next();
}

// ── Auth Route Handlers ──
async function handleLogin(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username e password sao obrigatorios' });
    }

    const attemptCheck = checkLoginAttempts(username);
    if (!attemptCheck.allowed) {
        return res.status(429).json({
            success: false,
            error: attemptCheck.message,
            retryAfter: attemptCheck.retryAfter
        });
    }

    const user = await findUser(username);
    if (!user) {
        recordFailedLogin(username);
        return res.status(401).json({ success: false, error: 'Credenciais invalidas' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
        recordFailedLogin(username);
        return res.status(401).json({ success: false, error: 'Credenciais invalidas' });
    }

    clearLoginAttempts(username);
    await updateUserLastLogin(username);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const csrfToken = generateCSRFToken();

    res.cookie('iris_access_token', accessToken, getAccessCookieOptions());
    res.cookie('iris_refresh_token', refreshToken, getRefreshCookieOptions());
    res.cookie('iris_csrf_token', csrfToken, {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000
    });

    console.log(`[Auth] User '${username}' logged in successfully`);

    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            mustChangePassword: user.mustChangePassword
        },
        csrfToken,
        accessToken
    });
}

async function handleRefreshToken(req, res) {
    const refreshToken = req.cookies?.iris_refresh_token;

    if (!refreshToken || !memoryRefreshTokens.has(refreshToken)) {
        return res.status(401).json({ success: false, error: 'Refresh token invalido', code: 'REFRESH_INVALID' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, { issuer: 'iris-platform' });
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ success: false, error: 'Token invalido' });
        }

        const user = await findUser(decoded.username);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Usuario nao encontrado' });
        }

        memoryRefreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        const csrfToken = generateCSRFToken();

        res.cookie('iris_access_token', newAccessToken, getAccessCookieOptions());
        res.cookie('iris_refresh_token', newRefreshToken, getRefreshCookieOptions());
        res.cookie('iris_csrf_token', csrfToken, {
            httpOnly: false,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        res.json({ success: true, csrfToken, accessToken: newAccessToken });
    } catch {
        memoryRefreshTokens.delete(refreshToken);
        return res.status(401).json({ success: false, error: 'Refresh token expirado' });
    }
}

function handleLogout(req, res) {
    const accessToken = req.cookies?.iris_access_token;
    const refreshToken = req.cookies?.iris_refresh_token;

    if (accessToken) invalidatedTokens.add(accessToken);
    if (refreshToken) memoryRefreshTokens.delete(refreshToken);

    res.clearCookie('iris_access_token', { path: '/' });
    res.clearCookie('iris_refresh_token', { path: '/api/auth/refresh' });
    res.clearCookie('iris_csrf_token');

    console.log(`[Auth] User logged out`);
    res.json({ success: true, message: 'Logout realizado com sucesso' });
}

async function handleChangePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Senha atual e nova senha sao obrigatorias' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Nova senha deve ter no minimo 8 caracteres' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, error: 'Nova senha deve conter maiusculas, minusculas e numeros' });
    }

    const user = await findUser(username);
    if (!user) {
        return res.status(404).json({ success: false, error: 'Usuario nao encontrado' });
    }

    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) {
        return res.status(401).json({ success: false, error: 'Senha atual incorreta' });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await updateUserPassword(username, newHash);

    console.log(`[Auth] Password changed for user '${username}'`);
    res.json({ success: true, message: 'Senha alterada com sucesso' });
}

function handleAuthStatus(req, res) {
    res.json({
        success: true,
        authenticated: true,
        user: {
            id: req.user.sub,
            username: req.user.username,
            role: req.user.role
        }
    });
}

// ── Password Reset ──
function checkResetAttempts(ip) {
    const attempts = passwordResetAttempts.get(ip);
    if (!attempts) return { allowed: true };
    const now = Date.now();
    if (now - attempts.firstAttempt > 60 * 60 * 1000) {
        passwordResetAttempts.delete(ip);
        return { allowed: true };
    }
    if (attempts.count >= PASSWORD_RESET_MAX_ATTEMPTS) {
        return { allowed: false, message: 'Muitas tentativas. Tente novamente em 1 hora.' };
    }
    return { allowed: true };
}

function recordResetAttempt(ip) {
    const attempts = passwordResetAttempts.get(ip) || { count: 0, firstAttempt: Date.now() };
    attempts.count++;
    passwordResetAttempts.set(ip, attempts);
}

async function handlePasswordResetRequest(req, res) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const rateCheck = checkResetAttempts(ip);
    if (!rateCheck.allowed) {
        return res.status(429).json({ success: false, error: rateCheck.message });
    }

    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ success: false, error: 'Nome de usuario e obrigatorio' });
    }

    recordResetAttempt(ip);

    const successResponse = {
        success: true,
        message: 'Se o usuario existir, um codigo de recuperacao foi gerado. Solicite o codigo ao administrador do sistema.'
    };

    const user = await findUser(username);
    if (!user) {
        await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
        return res.json(successResponse);
    }

    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + PASSWORD_RESET_EXPIRY;

    await saveResetCode(username, resetCode, expiresAt);

    console.log(`[Auth] PASSWORD RESET CODE for user '${username}': ${resetCode} (expires in 15 min)`);

    res.json(successResponse);
}

async function handlePasswordReset(req, res) {
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
        return res.status(400).json({ success: false, error: 'Codigo e nova senha sao obrigatorios' });
    }

    const resetData = await findResetCode(code);
    if (!resetData || resetData.used) {
        return res.status(400).json({ success: false, error: 'Codigo de recuperacao invalido ou ja utilizado' });
    }

    if (Date.now() > resetData.expiresAt) {
        await markResetCodeUsed(code);
        return res.status(400).json({ success: false, error: 'Codigo de recuperacao expirado. Solicite um novo.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Nova senha deve ter no minimo 8 caracteres' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, error: 'Nova senha deve conter maiusculas, minusculas e numeros' });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await updateUserPassword(resetData.username, newHash);
    await markResetCodeUsed(code);
    clearLoginAttempts(resetData.username);

    console.log(`[Auth] Password reset completed for user '${resetData.username}'`);
    res.json({ success: true, message: 'Senha redefinida com sucesso. Faca login com a nova senha.' });
}

// ── Admin: Register New User ──
async function handleRegisterUser(req, res) {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username e password sao obrigatorios' });
    }

    if (username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
        return res.status(400).json({ success: false, error: 'Username deve ter 3-30 caracteres alfanumericos' });
    }

    if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'Senha deve ter no minimo 8 caracteres' });
    }

    if (await userExists(username)) {
        return res.status(409).json({ success: false, error: 'Username ja existe' });
    }

    const allowedRoles = ['associado', 'admin'];
    const userRole = allowedRoles.includes(role) ? role : 'associado';

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newUser = await createUser(username, hash, userRole, true);

    console.log(`[Auth] New user '${username}' (${userRole}) created by '${req.user.username}'`);
    res.json({
        success: true,
        user: { id: newUser.id, username: newUser.username || username, role: newUser.role || userRole }
    });
}

// ── Admin: List Users ──
async function handleListUsers(req, res) {
    const userList = await listUsers();
    res.json({ success: true, users: userList });
}

// ── Admin: Delete User ──
async function handleDeleteUser(req, res) {
    const { username } = req.params;
    if (username === req.user.username) {
        return res.status(400).json({ success: false, error: 'Nao pode deletar a propria conta' });
    }
    if (!(await userExists(username))) {
        return res.status(404).json({ success: false, error: 'Usuario nao encontrado' });
    }
    await deleteUser(username);
    console.log(`[Auth] User '${username}' deleted by '${req.user.username}'`);
    res.json({ success: true, message: 'Usuario removido com sucesso' });
}

// ── Register Auth Routes ──
function registerAuthRoutes(app) {
    const cookieParser = require('cookie-parser');
    app.use(cookieParser());

    // Public auth endpoints
    app.post('/api/auth/login', handleLogin);
    app.post('/api/auth/refresh', handleRefreshToken);
    app.post('/api/auth/logout', handleLogout);
    app.post('/api/auth/password-reset-request', handlePasswordResetRequest);
    app.post('/api/auth/password-reset', handlePasswordReset);

    // Protected auth endpoints
    app.get('/api/auth/status', authenticate, handleAuthStatus);
    app.post('/api/auth/change-password', authenticate, handleChangePassword);

    // Admin-only endpoints
    app.post('/api/auth/register', authenticate, requireAdmin, handleRegisterUser);
    app.get('/api/auth/users', authenticate, requireAdmin, handleListUsers);
    app.delete('/api/auth/users/:username', authenticate, requireAdmin, handleDeleteUser);

    // CSRF token endpoint
    app.get('/api/auth/csrf', (req, res) => {
        const csrfToken = generateCSRFToken();
        res.cookie('iris_csrf_token', csrfToken, {
            httpOnly: false,
            secure: COOKIE_SECURE,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });
        res.json({ success: true, csrfToken });
    });

    // Auth storage status endpoint
    app.get('/api/auth/storage', (req, res) => {
        res.json({
            success: true,
            storage: isSupabaseAvailable() ? 'supabase' : 'memory',
            supabaseConfigured: isSupabaseAvailable()
        });
    });

    // Initialize default admin
    initDefaultAdmin();

    const storage = isSupabaseAvailable() ? 'Supabase' : 'memoria local';
    console.log(`[Auth] Storage: ${storage}`);
}

// Cleanup invalidated tokens periodically (every 2 hours)
setInterval(() => {
    invalidatedTokens.clear();
    passwordResetAttempts.clear();
    // Cleanup expired memory reset tokens
    const now = Date.now();
    for (const [code, data] of memoryResetTokens.entries()) {
        if (now > data.expiresAt) memoryResetTokens.delete(code);
    }
    // If Supabase is available, cleanup expired tokens there too
    if (isSupabaseAvailable()) {
        supabaseRequest('DELETE', 'iris_password_resets', null, `?expires_at=lt.${new Date().toISOString()}`).catch(() => {});
    }
    console.log('[Auth] Cleared expired token caches');
}, 2 * 60 * 60 * 1000);

module.exports = {
    authenticate,
    requireAdmin,
    optionalAuth,
    csrfProtection,
    registerAuthRoutes,
    initDefaultAdmin,
    isSupabaseAvailable
};

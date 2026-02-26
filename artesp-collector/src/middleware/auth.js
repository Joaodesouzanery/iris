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

// ── In-memory user store (replace with Supabase in production) ──
// Default admin user - MUST be changed on first login
const users = new Map();
const refreshTokens = new Set();
const loginAttempts = new Map();
const invalidatedTokens = new Set();

// Initialize default admin user
async function initDefaultAdmin() {
    if (users.size === 0) {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'iris-admin-2026';
        const hash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);
        users.set('admin', {
            id: 'usr_' + crypto.randomBytes(8).toString('hex'),
            username: 'admin',
            passwordHash: hash,
            role: 'admin',
            mustChangePassword: !process.env.ADMIN_PASSWORD,
            createdAt: new Date().toISOString(),
            lastLogin: null
        });
        console.log('[Auth] Default admin user initialized');
        if (!process.env.ADMIN_PASSWORD) {
            console.warn('[Auth] WARNING: Using default password. Set ADMIN_PASSWORD in .env');
        }
    }
}

// ── Brute Force Protection ──
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

    // Reset if lockout expired
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
    refreshTokens.add(token);
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
    // Try cookie first, then Authorization header
    const token = req.cookies?.iris_access_token ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Autenticacao necessaria',
            code: 'AUTH_REQUIRED'
        });
    }

    // Check if token was invalidated (logout)
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

// ── Middleware: Optional Auth (enriches req.user if token present) ──
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
    // Only protect state-changing methods
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

    // Check brute force protection
    const attemptCheck = checkLoginAttempts(username);
    if (!attemptCheck.allowed) {
        return res.status(429).json({
            success: false,
            error: attemptCheck.message,
            retryAfter: attemptCheck.retryAfter
        });
    }

    const user = users.get(username);
    if (!user) {
        recordFailedLogin(username);
        // Intentionally vague error message to prevent username enumeration
        return res.status(401).json({ success: false, error: 'Credenciais invalidas' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
        recordFailedLogin(username);
        return res.status(401).json({ success: false, error: 'Credenciais invalidas' });
    }

    // Success - clear login attempts
    clearLoginAttempts(username);

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const csrfToken = generateCSRFToken();

    // Set cookies
    res.cookie('iris_access_token', accessToken, getAccessCookieOptions());
    res.cookie('iris_refresh_token', refreshToken, getRefreshCookieOptions());
    res.cookie('iris_csrf_token', csrfToken, {
        httpOnly: false, // Must be readable by JS for CSRF header
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
        accessToken // Also return in body for SPA usage
    });
}

async function handleRefreshToken(req, res) {
    const refreshToken = req.cookies?.iris_refresh_token;

    if (!refreshToken || !refreshTokens.has(refreshToken)) {
        return res.status(401).json({ success: false, error: 'Refresh token invalido', code: 'REFRESH_INVALID' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, { issuer: 'iris-platform' });
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ success: false, error: 'Token invalido' });
        }

        const user = users.get(decoded.username);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Usuario nao encontrado' });
        }

        // Rotate refresh token (invalidate old, issue new)
        refreshTokens.delete(refreshToken);
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
        refreshTokens.delete(refreshToken);
        return res.status(401).json({ success: false, error: 'Refresh token expirado' });
    }
}

function handleLogout(req, res) {
    const accessToken = req.cookies?.iris_access_token;
    const refreshToken = req.cookies?.iris_refresh_token;

    if (accessToken) invalidatedTokens.add(accessToken);
    if (refreshToken) refreshTokens.delete(refreshToken);

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

    // Password strength validation
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Nova senha deve ter no minimo 8 caracteres' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, error: 'Nova senha deve conter maiusculas, minusculas e numeros' });
    }

    const user = users.get(username);
    if (!user) {
        return res.status(404).json({ success: false, error: 'Usuario nao encontrado' });
    }

    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) {
        return res.status(401).json({ success: false, error: 'Senha atual incorreta' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = false;

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

    if (users.has(username)) {
        return res.status(409).json({ success: false, error: 'Username ja existe' });
    }

    const allowedRoles = ['associado', 'admin'];
    const userRole = allowedRoles.includes(role) ? role : 'associado';

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newUser = {
        id: 'usr_' + crypto.randomBytes(8).toString('hex'),
        username,
        passwordHash: hash,
        role: userRole,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    users.set(username, newUser);

    console.log(`[Auth] New user '${username}' (${userRole}) created by '${req.user.username}'`);
    res.json({
        success: true,
        user: { id: newUser.id, username: newUser.username, role: newUser.role }
    });
}

// ── Admin: List Users ──
function handleListUsers(req, res) {
    const userList = Array.from(users.values()).map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
    }));
    res.json({ success: true, users: userList });
}

// ── Admin: Delete User ──
function handleDeleteUser(req, res) {
    const { username } = req.params;
    if (username === req.user.username) {
        return res.status(400).json({ success: false, error: 'Nao pode deletar a propria conta' });
    }
    if (!users.has(username)) {
        return res.status(404).json({ success: false, error: 'Usuario nao encontrado' });
    }
    users.delete(username);
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

    // Protected auth endpoints
    app.get('/api/auth/status', authenticate, handleAuthStatus);
    app.post('/api/auth/change-password', authenticate, handleChangePassword);

    // Admin-only endpoints
    app.post('/api/auth/register', authenticate, requireAdmin, handleRegisterUser);
    app.get('/api/auth/users', authenticate, requireAdmin, handleListUsers);
    app.delete('/api/auth/users/:username', authenticate, requireAdmin, handleDeleteUser);

    // CSRF token endpoint (for SPA to get initial token)
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

    // Initialize default admin
    initDefaultAdmin();
}

// Cleanup invalidated tokens periodically (every 2 hours)
setInterval(() => {
    invalidatedTokens.clear();
    console.log('[Auth] Cleared invalidated token cache');
}, 2 * 60 * 60 * 1000);

module.exports = {
    authenticate,
    requireAdmin,
    optionalAuth,
    csrfProtection,
    registerAuthRoutes,
    initDefaultAdmin
};

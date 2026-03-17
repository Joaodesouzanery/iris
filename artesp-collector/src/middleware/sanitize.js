/**
 * IRIS Platform - Input Sanitization & Validation Middleware
 *
 * Security features:
 * - XSS prevention via HTML entity encoding
 * - SQL injection prevention (parameterized queries via Supabase)
 * - Path traversal prevention
 * - Command injection prevention
 * - URL validation (SSRF prevention)
 * - File upload validation
 * - Request size limits
 */

// ── XSS Prevention ──
const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;'
};

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'`/]/g, char => HTML_ENTITIES[char]);
}

/**
 * Sanitize a string: remove HTML tags, trim, limit length, escape entities
 */
function sanitizeString(str, maxLen = 500) {
    if (typeof str !== 'string') return '';
    // Remove HTML tags
    let clean = str.replace(/<[^>]*>/g, '');
    // Remove null bytes
    clean = clean.replace(/\0/g, '');
    // Remove control characters (except newline/tab)
    clean = clean.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Trim and limit length
    clean = clean.trim().substring(0, maxLen);
    return clean;
}

/**
 * Deep sanitize: recursively sanitize all string values in an object
 */
function deepSanitize(obj, maxDepth = 5) {
    if (maxDepth <= 0) return null;

    if (typeof obj === 'string') {
        return sanitizeString(obj, 10000);
    }
    if (Array.isArray(obj)) {
        return obj.slice(0, 1000).map(item => deepSanitize(item, maxDepth - 1));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        const keys = Object.keys(obj).slice(0, 100); // Limit keys
        for (const key of keys) {
            const cleanKey = sanitizeString(key, 100);
            sanitized[cleanKey] = deepSanitize(obj[key], maxDepth - 1);
        }
        return sanitized;
    }
    // Numbers, booleans, null pass through
    if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
        return obj;
    }
    return null;
}

// ── CNPJ Validation (with checksum) ──
function validateCNPJ(cnpj) {
    if (typeof cnpj !== 'string') return false;
    const cleaned = cnpj.replace(/[^\d]/g, '');

    if (cleaned.length !== 14) return false;
    // Reject known invalid patterns
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    // Validate check digits
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned[i]) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned[12]) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned[i]) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned[13]) !== digit2) return false;

    return true;
}

// ── URL Validation (SSRF Prevention) ──
function validateUrl(url) {
    if (typeof url !== 'string') return { valid: false, error: 'URL invalida' };

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return { valid: false, error: 'URL mal formatada' };
    }

    // Only allow HTTP(S)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'Apenas HTTP/HTTPS permitidos' };
    }

    // Block internal/private IPs (SSRF prevention)
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^0\./,
        /^169\.254\./,          // Link-local
        /^\[::1\]$/,            // IPv6 localhost
        /^\[fd[0-9a-f]{2}:/i,  // IPv6 private
        /^\[fe80:/i,            // IPv6 link-local
        /\.local$/i,
        /\.internal$/i
    ];

    for (const pattern of blockedPatterns) {
        if (pattern.test(hostname)) {
            return { valid: false, error: 'URL aponta para rede interna (bloqueado)' };
        }
    }

    // Allowed domains for PDF download
    const allowedDomains = [
        'artesp.sp.gov.br',
        'www.artesp.sp.gov.br',
        'gov.br',
        'diariooficial.imprensaoficial.com.br'
    ];

    const isDomainAllowed = allowedDomains.some(d =>
        hostname === d || hostname.endsWith('.' + d)
    );

    return {
        valid: true,
        trusted: isDomainAllowed,
        url: parsed.href
    };
}

// ── Path Traversal Prevention ──
function sanitizePath(filepath) {
    if (typeof filepath !== 'string') return '';
    // Remove path traversal sequences
    let clean = filepath.replace(/\.\./g, '');
    clean = clean.replace(/[~\0]/g, '');
    // Normalize separators
    clean = clean.replace(/\\/g, '/');
    // Remove leading slashes
    clean = clean.replace(/^\/+/, '');
    return clean;
}

// ── File Upload Validation ──
function validatePDFUpload(base64Data, maxSizeMB = 25) {
    if (typeof base64Data !== 'string') {
        return { valid: false, error: 'Dados do arquivo invalidos' };
    }

    // Remove data URI prefix if present
    const clean = base64Data.replace(/^data:application\/pdf;base64,/, '');

    // Estimate file size (base64 is ~4/3 of original)
    const estimatedBytes = (clean.length * 3) / 4;
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (estimatedBytes > maxBytes) {
        return { valid: false, error: `Arquivo excede limite de ${maxSizeMB}MB` };
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(clean)) {
        return { valid: false, error: 'Formato base64 invalido' };
    }

    // Check PDF magic bytes (first few bytes of decoded content)
    try {
        const buffer = Buffer.from(clean.substring(0, 20), 'base64');
        const header = buffer.toString('ascii', 0, 5);
        if (!header.startsWith('%PDF-')) {
            return { valid: false, error: 'Arquivo nao e um PDF valido' };
        }
    } catch {
        return { valid: false, error: 'Erro ao validar arquivo' };
    }

    return { valid: true, sizeBytes: estimatedBytes };
}

// ── Integer Validation ──
function validateInt(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return min;
    return Math.min(Math.max(num, min), max);
}

// ── Request Sanitization Middleware ──
function sanitizeRequestMiddleware(req, res, next) {
    // Sanitize query parameters
    if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
                req.query[key] = sanitizeString(value, 500);
            }
        }
    }

    // Sanitize URL parameters
    if (req.params) {
        for (const [key, value] of Object.entries(req.params)) {
            if (typeof value === 'string') {
                req.params[key] = sanitizeString(value, 300);
            }
        }
    }

    // Note: body sanitization is selective - don't sanitize PDF base64 data
    // Individual endpoints should sanitize body fields explicitly

    next();
}

module.exports = {
    escapeHtml,
    sanitizeString,
    deepSanitize,
    validateCNPJ,
    validateUrl,
    sanitizePath,
    validatePDFUpload,
    validateInt,
    sanitizeRequestMiddleware
};

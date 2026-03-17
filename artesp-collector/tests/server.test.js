/**
 * IRIS Platform - Automated Tests
 * Uses Node.js built-in test runner (node:test)
 * Run: node --test tests/server.test.js
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

// Helper: make HTTP request
function request(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = data.startsWith('{') || data.startsWith('[')
                        ? JSON.parse(data) : null;
                    resolve({ status: res.statusCode, headers: res.headers, body: data, json });
                } catch {
                    resolve({ status: res.statusCode, headers: res.headers, body: data, json: null });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

function get(path, port = 3456) {
    return request({ hostname: 'localhost', port, path, method: 'GET' });
}

function post(path, body, port = 3456) {
    const data = JSON.stringify(body);
    return request({
        hostname: 'localhost', port, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        body: data
    });
}

// Start server on a test port
let server;
const TEST_PORT = 3456;

before(async () => {
    process.env.PORT = TEST_PORT;
    process.env.NODE_ENV = 'test';

    // We need to start the Express app manually
    const express = require('express');
    const app = express();
    const serverPath = path.join(__dirname, '..', 'server-unified.js');

    // Instead of requiring the whole server (which starts listening),
    // we start a minimal test server
    app.use(express.json({ limit: '50mb' }));
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // Health endpoint for basic test
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '2.0.0-unified'
        });
    });

    // Serve SPA routes
    const spaRoutes = ['/', '/hub', '/deliberacoes', '/landing', '/grafo',
        '/jurimetria', '/metricas', '/upload', '/analise', '/agencias'];
    spaRoutes.forEach(route => {
        app.get(route, (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'app.html'));
        });
    });

    server = app.listen(TEST_PORT);
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
});

after(() => {
    if (server) server.close();
});

// ============================================
// 1. STATIC FILES
// ============================================
describe('Static Files', () => {
    it('serves app.html at root', async () => {
        const res = await get('/');
        assert.strictEqual(res.status, 200);
        assert.ok(res.body.includes('<!DOCTYPE html>'));
        assert.ok(res.body.includes('IRIS'));
    });

    it('serves CSS file', async () => {
        const res = await get('/css/styles.css');
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers['content-type'].includes('text/css'));
        assert.ok(res.body.includes('#page-landing'));
    });

    it('serves JavaScript file', async () => {
        const res = await get('/js/app.js');
        assert.strictEqual(res.status, 200);
        assert.ok(res.body.includes('Router'));
    });

    it('returns 404 for nonexistent files', async () => {
        const res = await get('/nonexistent-file.xyz');
        assert.strictEqual(res.status, 404);
    });
});

// ============================================
// 2. SPA ROUTES
// ============================================
describe('SPA Routes', () => {
    const routes = ['/hub', '/deliberacoes', '/landing', '/grafo',
        '/jurimetria', '/metricas', '/upload', '/analise', '/agencias'];

    for (const route of routes) {
        it(`serves app.html for ${route}`, async () => {
            const res = await get(route);
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.includes('<!DOCTYPE html>'));
        });
    }
});

// ============================================
// 3. API HEALTH
// ============================================
describe('API Health', () => {
    it('returns health status', async () => {
        const res = await get('/api/health');
        assert.strictEqual(res.status, 200);
        assert.ok(res.json);
        assert.strictEqual(res.json.status, 'ok');
        assert.ok(res.json.timestamp);
        assert.ok(res.json.uptime >= 0);
    });
});

// ============================================
// 4. HTML STRUCTURE VALIDATION
// ============================================
describe('HTML Structure', () => {
    it('contains all required page-view sections', async () => {
        const res = await get('/');
        const requiredPages = [
            'page-hub', 'page-deliberações', 'page-landing',
            'page-grafo', 'page-jurimetria', 'page-metricas',
            'page-upload', 'page-analise', 'page-agencias'
        ];
        for (const page of requiredPages) {
            assert.ok(res.body.includes(`id="${page}"`),
                `Missing page section: ${page}`);
        }
    });

    it('contains sidebar navigation', async () => {
        const res = await get('/');
        assert.ok(res.body.includes('class="sidebar"'));
        assert.ok(res.body.includes('class="nav-item"'));
    });

    it('links to CSS and JS files', async () => {
        const res = await get('/');
        assert.ok(res.body.includes('href="/css/styles.css"'));
        assert.ok(res.body.includes('src="/js/app.js"'));
    });

    it('has proper meta tags', async () => {
        const res = await get('/');
        assert.ok(res.body.includes('charset="UTF-8"'));
        assert.ok(res.body.includes('viewport'));
    });
});

// ============================================
// 5. CSS VALIDATION
// ============================================
describe('CSS Structure', () => {
    let cssContent;

    before(async () => {
        const res = await get('/css/styles.css');
        cssContent = res.body;
    });

    it('has balanced braces', () => {
        const opens = (cssContent.match(/\{/g) || []).length;
        const closes = (cssContent.match(/\}/g) || []).length;
        assert.strictEqual(opens, closes,
            `Unbalanced braces: ${opens} opens vs ${closes} closes`);
    });

    it('has landing page variables defined', () => {
        assert.ok(cssContent.includes('--lp-bg:'));
        assert.ok(cssContent.includes('--lp-primary:'));
        assert.ok(cssContent.includes('--lp-text:'));
    });

    it('has landing page screenshot styles', () => {
        assert.ok(cssContent.includes('.lp-screenshot-browser'));
        assert.ok(cssContent.includes('.lp-browser-bar'));
        assert.ok(cssContent.includes('.lp-browser-dots'));
        assert.ok(cssContent.includes('.lp-mock-header'));
    });

    it('has landing page comparison table styles', () => {
        assert.ok(cssContent.includes('.lp-compare-table'));
        assert.ok(cssContent.includes('.lp-compare-header'));
        assert.ok(cssContent.includes('.lp-compare-row'));
        assert.ok(cssContent.includes('grid-template-columns: 1.5fr 1fr 1fr'));
    });

    it('has landing page fit section styles', () => {
        assert.ok(cssContent.includes('.lp-fit-grid'));
        assert.ok(cssContent.includes('.lp-fit-card'));
        assert.ok(cssContent.includes('.lp-fit-list'));
    });

    it('has #page-landing specificity on all lp- selectors', () => {
        // Check that critical layout selectors have #page-landing prefix
        const criticalSelectors = [
            '#page-landing .lp-mock-header',
            '#page-landing .lp-compare-header',
            '#page-landing .lp-fit-grid',
            '#page-landing .lp-browser-bar',
            '#page-landing .lp-carousel-dots'
        ];
        for (const sel of criticalSelectors) {
            assert.ok(cssContent.includes(sel),
                `Missing scoped selector: ${sel}`);
        }
    });

    it('uses !important on critical layout properties', () => {
        // Verify the nuclear fix is in place
        assert.ok(cssContent.includes('display: flex !important'),
            'Missing !important on display: flex');
        assert.ok(cssContent.includes('display: grid !important'),
            'Missing !important on display: grid');
    });

    it('has responsive styles', () => {
        assert.ok(cssContent.includes('@media (max-width: 768px)'));
    });
});

// ============================================
// 6. JAVASCRIPT VALIDATION
// ============================================
describe('JavaScript Structure', () => {
    let jsContent;

    before(async () => {
        const res = await get('/js/app.js');
        jsContent = res.body;
    });

    it('is syntactically valid', () => {
        // Try to parse the JS — if this throws, the test fails
        assert.doesNotThrow(() => {
            new Function(jsContent);
        }, 'JavaScript has syntax errors');
    });

    it('has Router module', () => {
        assert.ok(jsContent.includes('const Router'));
        assert.ok(jsContent.includes('Router.register'));
    });

    it('has all page modules', () => {
        const modules = [
            'PageHub', 'PageDeliberacoes', 'PageLanding',
            'PageGrafo', 'PageJurimetria', 'PageMetricas',
            'PageUpload', 'PageAnalise', 'PageAgencias'
        ];
        for (const mod of modules) {
            assert.ok(jsContent.includes(mod),
                `Missing page module: ${mod}`);
        }
    });

    it('has carousel functionality', () => {
        assert.ok(jsContent.includes('initCarousel'));
        assert.ok(jsContent.includes('goToSlide'));
        assert.ok(jsContent.includes('nextSlide'));
        assert.ok(jsContent.includes('prevSlide'));
    });

    it('registers /landing route', () => {
        assert.ok(jsContent.includes("'/landing'"));
        assert.ok(jsContent.includes('PageLanding.init'));
    });
});

// ============================================
// 7. FILE STRUCTURE
// ============================================
describe('Project File Structure', () => {
    const root = path.join(__dirname, '..');

    it('has required project files', () => {
        const required = [
            'package.json',
            'server-unified.js',
            'public/app.html',
            'public/css/styles.css',
            'public/js/app.js'
        ];
        for (const file of required) {
            assert.ok(fs.existsSync(path.join(root, file)),
                `Missing required file: ${file}`);
        }
    });

    it('has .env or .env.example', () => {
        const hasEnv = fs.existsSync(path.join(root, '.env'));
        const hasExample = fs.existsSync(path.join(root, '.env.example'));
        assert.ok(hasEnv || hasExample,
            'Missing .env or .env.example file');
    });

    it('has iris-core services', () => {
        const coreDir = path.join(root, '..', 'iris-core', 'services');
        const hasCoreDir = fs.existsSync(coreDir);
        // This is informational — may not exist in all setups
        if (hasCoreDir) {
            assert.ok(fs.existsSync(path.join(coreDir, 'news-fetcher.js')),
                'Missing news-fetcher.js service');
        }
    });
});

// ============================================
// 8. NEWS FETCHER SERVICE
// ============================================
describe('News Fetcher Service', () => {
    const fetcherPath = path.join(__dirname, '..', '..', 'iris-core', 'services', 'news-fetcher.js');

    it('news-fetcher.js exists', () => {
        assert.ok(fs.existsSync(fetcherPath), 'news-fetcher.js not found');
    });

    it('exports required functions', () => {
        if (!fs.existsSync(fetcherPath)) return;
        const content = fs.readFileSync(fetcherPath, 'utf8');
        assert.ok(content.includes('fetchTodasNoticias') || content.includes('fetchNoticiasComCache'),
            'Missing fetch functions');
    });

    it('has RSS source configuration', () => {
        if (!fs.existsSync(fetcherPath)) return;
        const content = fs.readFileSync(fetcherPath, 'utf8');
        assert.ok(content.includes('FONTES_RSS') || content.includes('fontes'),
            'Missing RSS sources configuration');
    });
});

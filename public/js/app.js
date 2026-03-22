/**
 * IRIS Platform - Single Page Application
 * Instituto de Regulação, Inovação e Sustentabilidade
 *
 * Main application JavaScript file
 * Handles routing, navigation, and page rendering
 */

(function() {
    'use strict';

    // ============================================
    // ROUTER - SPA Navigation
    // ============================================
    const Router = {
        routes: {},
        currentPage: null,

        init() {
            window.addEventListener('popstate', () => this.handleRoute());
            document.addEventListener('click', (e) => {
                const link = e.target.closest('[data-route]');
                if (link) {
                    e.preventDefault();
                    this.navigate(link.dataset.route);
                }
            });
            this.handleRoute();
        },

        register(path, handler) {
            this.routes[path] = handler;
        },

        navigate(path) {
            history.pushState({}, '', path);
            this.handleRoute();
        },

        handleRoute() {
            const path = window.location.pathname || '/hub';
            const handler = this.routes[path] || this.routes['/hub'];

            // Ensure platform is visible when navigating to any non-root route
            if (path !== '/' && path !== '') {
                const landingEl = document.getElementById('landing-page');
                const loginEl = document.getElementById('login-screen');
                const platformEl = document.getElementById('app-platform');
                if (landingEl) landingEl.style.display = 'none';
                if (loginEl) loginEl.style.display = 'none';
                if (platformEl) platformEl.style.display = 'flex';
            }

            // Update active nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.route === path) {
                    item.classList.add('active');
                }
            });

            // Update breadcrumb
            const pageNames = {
                '/hub': 'Hub de Inteligência Regulatória',
                '/metricas': 'Dashboard Geral',
                '/deliberacoes': 'Deliberações',
                '/monitor': 'Monitor de Reuniões',
                '/diretores': 'Diretores e Mandatos',
                '/jurimetria': 'Jurimetria',
                '/governanca': 'Governança Regulatória',
                '/boletim': 'Boletim Mensal',
                '/auditoria': 'Auditoria Forense',
                '/upload': 'Upload e Análise de PDFs',
                '/analise': 'Upload e Análise de PDFs',
                '/agencias': 'Agências Reguladoras',
                '/mapa': 'Mapa do Brasil',
                '/radar': 'Radar Regulatório',
                '/painel-regulatorio': 'Painel Regulatório',
                '/setores': 'Setores Regulados',
                '/microtemas': 'Microtemas',
                '/empresas': 'Empresas',
                '/historico': 'Histórico',
                '/monitoramento': 'Monitoramento 24/7',
                '/dossie': 'Dossiês Automáticos',
                '/cruzamento': 'Cruzamento de Dados',
                '/analytics': 'Analytics Avançado',
                '/landing': 'Conheça a IRIS'
            };
            const breadcrumb = document.getElementById('breadcrumb-page');
            if (breadcrumb) {
                breadcrumb.textContent = pageNames[path] || 'Inteligência Regulatória';
            }

            // Cleanup before navigation
            if (typeof PageGrafo !== 'undefined' && PageGrafo.animFrame) { PageGrafo.destroy(); }

            // Show page
            document.querySelectorAll('.page-view').forEach(page => {
                page.classList.remove('active');
            });

            if (handler) {
                this.currentPage = path;
                handler();
            }
        }
    };

    // ============================================
    // ICONS - SVG Icons Library
    // ============================================
    const Icons = {
        document: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
        eye: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>',
        upload: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>',
        users: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
        chart: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
        building: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
        dashboard: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>',
        newspaper: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>',
        clipboard: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>',
        warning: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
    };

    // ============================================
    // API - Backend Communication
    // ============================================
    const API = {
        async get(endpoint) {
            try {
                const response = await fetch(endpoint);
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                return null;
            }
        },

        async post(endpoint, data) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                return null;
            }
        },

        async delete(endpoint) {
            try {
                const response = await fetch(endpoint, { method: 'DELETE' });
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                return null;
            }
        }
    };

    // ============================================
    // UTILS - Helper Functions
    // ============================================
    const Utils = {
        formatDate(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR');
        },

        formatDateShort(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        },

        showLoading(containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando...</div>';
            }
        },

        showEmpty(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<div class="empty-state">${message}</div>`;
            }
        },

        exportCSV(data, headers, filename) {
            const rows = data.map(row => headers.map(h => `"${row[h.key] || ''}"`).join(','));
            const csv = [headers.map(h => h.label).join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        },

        exportJSON(data, filename) {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // ============================================
    // PAGE: Deliberacoes
    // ============================================
    const PageDeliberacoes = {
        data: [],
        filtered: [],

        // Dados de exemplo para demonstração
        sampleData: [
            {
                id: 1,
                processo: 'SEI! n° 134.00037303/2024-01',
                interessado: 'Viação Cometa S/A',
                microtema: 'Outros',
                decisao: 'Deferido',
                pauta_interna: false,
                numero_reuniao: '1176',
                data_reuniao: '2025-12-18',
                votos_favor: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                votos_contra: null,
                resumo_pleito: 'A Viação Cometa S/A solicitou o ressarcimento referente à utilização do serviço de transporte intermunicipal com benefício tarifário de gratuidade, conforme previsto no Decreto n° 68.937, de 3 de outubro de 2024, que estabelece a gratuidade nos dias 6 e 27 de outubro de 2024.',
                fundamento_decisao: 'RECOMENDA O DEFERIMENTO do pedido da operadora Viação Cometa S/A, para conceder o ressarcimento no Serviço Regular Rodoviário de 18.366 (dezoito mil, trezentos e sessenta e seis) gratuidades, no montante de R$ 1.029.792,49 (um milhão, vinte e nove mil, setecentos e noventa e dois reais e quarenta e nove centavos), decorrente dos impactos do Decreto n° 68.937, de 03 de outubro de 2024.'
            },
            {
                id: 2,
                processo: 'SEI! n° 134.00038201/2024-02',
                interessado: 'Concessionária ViaOeste S/A',
                microtema: 'Rodovias',
                decisao: 'Deferido',
                pauta_interna: false,
                numero_reuniao: '1176',
                data_reuniao: '2025-12-18',
                votos_favor: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                votos_contra: null,
                resumo_pleito: 'A Concessionária ViaOeste S/A solicitou aprovação do projeto de ampliação da faixa de pedágio no km 42 da Rodovia Raposo Tavares.',
                fundamento_decisao: 'RECOMENDA O DEFERIMENTO do pedido de ampliação, considerando os estudos de demanda e segurança viária apresentados.'
            },
            {
                id: 3,
                processo: 'SEI! n° 134.00039102/2024-03',
                interessado: 'EMTU - Empresa Metropolitana de Transportes Urbanos',
                microtema: 'Ônibus',
                decisao: 'Deferido',
                pauta_interna: true,
                numero_reuniao: '1175',
                data_reuniao: '2025-12-11',
                votos_favor: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                votos_contra: null,
                resumo_pleito: 'Solicitação de aprovação de novas linhas metropolitanas para atendimento da região de Guarulhos.',
                fundamento_decisao: 'RECOMENDA O DEFERIMENTO considerando o estudo de demanda e viabilidade operacional.'
            },
            {
                id: 4,
                processo: 'SEI! n° 134.00040003/2024-04',
                interessado: 'AutoBan Concessionária S/A',
                microtema: 'Regulação',
                decisao: 'Indeferido',
                pauta_interna: false,
                numero_reuniao: '1175',
                data_reuniao: '2025-12-11',
                votos_favor: [],
                votos_contra: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                resumo_pleito: 'Pedido de revisão extraordinária de tarifas devido à variação cambial.',
                fundamento_decisao: 'RECOMENDA O INDEFERIMENTO por não atender aos requisitos contratuais estabelecidos.'
            }
        ],

        _page: 1,
        _total: 0,
        _perPage: 50,
        _loading: false,
        _debounceTimer: null,

        async init() {
            const page = document.getElementById('page-deliberacoes');
            if (page) page.classList.add('active');

            this._page = 1;
            await this._loadFromAPI();
        },

        async _loadFromAPI() {
            if (this._loading) return;
            this._loading = true;

            const tbody = document.getElementById('deliberacoes-tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-secondary);"><div class="spinner" style="margin:0 auto 12px;display:block;"></div>Carregando...</td></tr>';

            const params = this._buildParams();
            let usingReal = false;
            try {
                const response = await API.get('/api/deliberacoes?' + params);
                this.data = (response?.deliberacoes || []).map(d => this._normalizeRow(d));
                this._total = response?.total ?? this.data.length;
                if (this.data.length > 0) usingReal = true;
                else this.data = this._page === 1 ? this.sampleData : [];
            } catch (e) {
                this.data = this._page === 1 ? this.sampleData : [];
                this._total = this.sampleData.length;
            }
            this.filtered = this.data;
            setDataMode('page-deliberacoes', usingReal);

            this._populateMicrotemas();
            this.updateStats();
            this.render();
            this._renderPagination();
            this._loading = false;
        },

        _buildParams() {
            const parts = [`page=${this._page}`, `per_page=${this._perPage}`];
            const busca = document.getElementById('filtro-busca')?.value?.trim();
            const agencia = document.getElementById('filtro-agencia')?.value;
            const ano = document.getElementById('filtro-ano')?.value;
            const microtema = document.getElementById('filtro-microtema')?.value;
            const decisao = document.getElementById('filtro-decisao')?.value;
            const dataInicio = document.getElementById('filtro-data-inicio')?.value;
            const dataFim = document.getElementById('filtro-data-fim')?.value;
            const pautaExterna = document.getElementById('filtro-pauta-externa')?.checked;

            if (busca) parts.push('busca=' + encodeURIComponent(busca));
            if (agencia) parts.push('agencia=' + encodeURIComponent(agencia));
            if (ano) parts.push('ano=' + encodeURIComponent(ano));
            if (microtema) parts.push('microtema=' + encodeURIComponent(microtema));
            if (decisao) parts.push('decisao=' + encodeURIComponent(decisao));
            if (dataInicio) parts.push('data_inicio=' + dataInicio);
            if (dataFim) parts.push('data_fim=' + dataFim);
            if (pautaExterna) parts.push('pauta_externa=true');
            return parts.join('&');
        },

        _normalizeRow(d) {
            // Parse votos stored as JSON strings in the DB
            const parseVotos = v => {
                if (!v) return [];
                if (Array.isArray(v)) return v;
                try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
            };
            return {
                ...d,
                votos_favor: parseVotos(d.votos_favor),
                votos_contra: parseVotos(d.votos_contra),
            };
        },

        _populateMicrotemas() {
            const select = document.getElementById('filtro-microtema');
            if (!select || select.options.length > 1) return;
            const microtemas = [...new Set(this.data.map(d => d.microtema).filter(Boolean))];
            if (microtemas.length > 0) {
                select.innerHTML = '<option value="">Todos Microtemas</option>' +
                    microtemas.map(m => `<option value="${m}">${m}</option>`).join('');
            }
        },

        filter() {
            this._page = 1;
            this._loadFromAPI();
        },

        filterDebounced() {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this.filter(), 300);
        },

        clearFilters() {
            ['filtro-busca', 'filtro-agencia', 'filtro-ano', 'filtro-decisao', 'filtro-data-inicio', 'filtro-data-fim'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const cb = document.getElementById('filtro-pauta-externa');
            if (cb) cb.checked = false;
            const microtemaEl = document.getElementById('filtro-microtema');
            if (microtemaEl) microtemaEl.value = '';
            this.filter();
        },

        updateStats() {
            const total = this._total;
            const deferidas = this.data.filter(d => /^deferido$/i.test(d.decisao)).length;
            const indeferidas = this.data.filter(d => /indeferido/i.test(d.decisao)).length;
            const taxa = deferidas + indeferidas > 0 ? ((deferidas / (deferidas + indeferidas)) * 100).toFixed(1) : 0;

            const statEl = id => document.getElementById(id);
            if (statEl('stat-total-delibs')) statEl('stat-total-delibs').textContent = total;
            if (statEl('stat-deferidas')) statEl('stat-deferidas').textContent = deferidas;
            if (statEl('stat-indeferidas')) statEl('stat-indeferidas').textContent = indeferidas;
            if (statEl('stat-taxa')) statEl('stat-taxa').textContent = taxa + '%';
        },

        render() {
            const tbody = document.getElementById('deliberacoes-tbody');
            if (!tbody) return;

            if (this.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-secondary);">Nenhuma deliberação encontrada</td></tr>';
                const label = document.getElementById('delib-count-label');
                if (label) label.textContent = '0 resultados';
                return;
            }

            const label = document.getElementById('delib-count-label');
            if (label) label.textContent = `${this._total} resultado${this._total !== 1 ? 's' : ''} · página ${this._page}`;

            tbody.innerHTML = this.data.map((d, index) => {
                const dec = (d.decisao || '').toLowerCase();
                const decisaoCls = dec.includes('indeferido') ? 'badge-danger' :
                                   dec.includes('deferido') ? 'badge-success' :
                                   dec.includes('arquivado') ? 'badge-warning' : 'badge-info';
                return `<tr style="cursor:pointer;" onclick="App.PageDeliberacoes.openModal(${index})" title="Clique para ver detalhes">
                    <td><strong>${d.reuniao_ordinaria || d.numero_reuniao || '-'}</strong></td>
                    <td style="white-space:nowrap;">${this.formatDate(d.data_reuniao)}</td>
                    <td style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${d.processo || ''}">${d.processo || '-'}</td>
                    <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${d.interessado || ''}">${d.interessado || '-'}</td>
                    <td><span style="font-size:12px;background:rgba(139,92,246,.12);color:#a78bfa;padding:2px 8px;border-radius:4px;">${d.microtema || '-'}</span></td>
                    <td style="max-width:260px;font-size:12px;color:var(--text-secondary);">${this.truncate(d.resumo_pleito || '', 100)}</td>
                    <td><span class="badge ${decisaoCls}" style="font-size:11px;white-space:nowrap;">${d.resultado || d.decisao || '-'}</span></td>
                </tr>`;
            }).join('');
        },

        _renderPagination() {
            const container = document.getElementById('delib-pagination');
            if (!container) return;
            const totalPages = Math.ceil(this._total / this._perPage);
            if (totalPages <= 1) { container.innerHTML = ''; return; }

            const btns = [];
            if (this._page > 1) btns.push(`<button class="btn btn-secondary btn-sm" onclick="App.PageDeliberacoes.goPage(${this._page - 1})">‹ Anterior</button>`);
            const start = Math.max(1, this._page - 2);
            const end = Math.min(totalPages, this._page + 2);
            for (let p = start; p <= end; p++) {
                const active = p === this._page ? 'style="background:var(--primary);color:#fff;"' : '';
                btns.push(`<button class="btn btn-secondary btn-sm" ${active} onclick="App.PageDeliberacoes.goPage(${p})">${p}</button>`);
            }
            if (this._page < totalPages) btns.push(`<button class="btn btn-secondary btn-sm" onclick="App.PageDeliberacoes.goPage(${this._page + 1})">Próxima ›</button>`);
            container.innerHTML = btns.join('');
        },

        goPage(p) {
            this._page = p;
            this._loadFromAPI();
        },

        populateFilters() {
            // Kept for compatibility — filters now populate dynamically
        },

        formatDate(dateStr) {
            if (!dateStr) return 'Data nao informada';
            try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                return dateStr;
            } catch (e) {
                return dateStr;
            }
        },

        truncate(text, maxLength) {
            if (!text) return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        },

        getFirstLastName(fullName) {
            if (!fullName) return '';
            const parts = fullName.split(' ');
            if (parts.length >= 2) {
                return `${parts[0]} ${parts[parts.length - 1]}`;
            }
            return fullName;
        },

        getInitials(fullName) {
            if (!fullName) return '??';
            const parts = fullName.split(' ');
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
            }
            return fullName.substring(0, 2).toUpperCase();
        },

        openModal(index) {
            const d = this.filtered[index];
            if (!d) return;

            const modal = document.getElementById('deliberacao-modal');
            const body = document.getElementById('deliberacao-modal-body');

            const votos = d.votos_favor || [];
            const votosContra = d.votos_contra || [];
            const dataFormatada = this.formatDate(d.data_reuniao);
            const tipoLabel = d.pauta_interna ? 'Pauta Interna' : 'Pauta Externa';

            const jsonData = {
                decisao: d.decisao,
                processo: d.processo,
                microtema: d.microtema,
                interessado: d.interessado,
                votos_favor: d.votos_favor,
                data_reuniao: d.data_reuniao,
                votos_contra: d.votos_contra,
                pauta_interna: d.pauta_interna,
                resumo_pleito: d.resumo_pleito,
                numero_reuniao: d.numero_reuniao,
                fundamento_decisao: d.fundamento_decisao
            };

            body.innerHTML = `
                <div class="modal-header-section">
                    <div class="modal-title-row">
                        <div class="modal-number-badge">
                            <div class="modal-number-label">Deliberacao</div>
                            <div class="modal-number-value">${d.numero_reuniao || '-'}</div>
                        </div>
                        <div class="modal-title-info">
                            <div class="modal-agency-name">${d.agencia || 'ARTESP'}</div>
                            <div class="modal-date">${dataFormatada}</div>
                        </div>
                    </div>
                    <div class="modal-info-grid">
                        <div class="modal-info-item">
                            <div class="modal-info-label">Agência</div>
                            <div class="modal-info-value">${d.agencia || 'ARTESP'}</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-info-label">Numero da Reuniao</div>
                            <div class="modal-info-value">${d.numero_reuniao || '-'}</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-info-label">Data</div>
                            <div class="modal-info-value">${dataFormatada}</div>
                        </div>
                        <div class="modal-info-item">
                            <div class="modal-info-label">Decisao</div>
                            <div class="modal-info-value ${d.decisao === 'Deferido' ? 'success' : ''}">${d.decisao || '-'}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-body-section">
                    <div class="modal-section">
                        <div class="modal-section-title">Votos a Favor</div>
                        <div class="modal-votos-grid">
                            ${votos.map(v => `
                                <div class="modal-voto-item">
                                    <div class="modal-voto-avatar">${this.getInitials(v)}</div>
                                    <div class="modal-voto-name">${v}</div>
                                </div>
                            `).join('')}
                            ${votos.length === 0 ? '<span style="color: var(--text-muted);">Nenhum voto registrado</span>' : ''}
                        </div>
                    </div>

                    <div class="modal-section">
                        <div class="modal-section-title">Detalhes da Deliberacao</div>
                        <div class="modal-info-grid" style="grid-template-columns: repeat(3, 1fr);">
                            <div class="modal-info-item">
                                <div class="modal-info-label">Interessado</div>
                                <div class="modal-info-value">${d.interessado || '-'}</div>
                            </div>
                            <div class="modal-info-item">
                                <div class="modal-info-label">Tipo de Pauta</div>
                                <div class="modal-info-value">${tipoLabel}</div>
                            </div>
                            <div class="modal-info-item">
                                <div class="modal-info-label">Microtema</div>
                                <div class="modal-info-value">${d.microtema || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-section">
                        <div class="modal-section-title">Resumo do Pleito</div>
                        <div class="modal-section-content">${d.resumo_pleito || 'Resumo nao disponivel'}</div>
                    </div>

                    ${d.fundamento_decisao ? `
                    <div class="modal-section">
                        <div class="modal-section-title">Fundamento da Decisao</div>
                        <div class="modal-section-content">${d.fundamento_decisao}</div>
                    </div>
                    ` : ''}

                    <div class="modal-section">
                        <div class="modal-section-title">Dados Extraidos (JSON)</div>
                        <div class="modal-json-section">
                            <pre>${this.formatJSON(jsonData)}</pre>
                        </div>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';

            // Fechar modal ao clicar fora
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            };
        },

        formatJSON(obj) {
            const json = JSON.stringify(obj, null, 2);
            return json
                .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
                .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
                .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
                .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
                .replace(/: null/g, ': <span class="json-null">null</span>');
        },

        closeModal() {
            const modal = document.getElementById('deliberacao-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        },

        exportCSV() {
            if (this.filtered.length === 0) {
                alert('Nenhuma deliberação para exportar');
                return;
            }
            Utils.exportCSV(this.filtered, [
                { key: 'processo', label: 'Processo' },
                { key: 'interessado', label: 'Interessado' },
                { key: 'microtema', label: 'Microtema' },
                { key: 'decisao', label: 'Decisão' },
                { key: 'numero_reuniao', label: 'Reunião' },
                { key: 'data_reuniao', label: 'Data' }
            ], 'deliberacoes_iris.csv');
        }
    };

    // ============================================
    // PAGE: Monitor
    // ============================================
    const PageMonitor = {
        reunioes: [],
        refreshInterval: null,

        async init() {
            const page = document.getElementById('page-monitor');
            page.classList.add('active');

            await this.load();

            // Auto-refresh every 10 seconds
            this.refreshInterval = setInterval(() => this.load(), 10000);
        },

        destroy() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        },

        async load() {
            const response = await API.get('/api/reunioes-monitoradas');
            this.reunioes = response?.reunioes || [];
            this.updateStats();
            this.render();
        },

        updateStats() {
            const total = this.reunioes.length;
            const pendentes = this.reunioes.filter(r => r.status === 'pendente').length;
            const processando = this.reunioes.filter(r => !['pendente', 'processado', 'erro'].includes(r.status)).length;
            const processados = this.reunioes.filter(r => r.status === 'processado').length;
            const erros = this.reunioes.filter(r => r.status === 'erro').length;

            document.getElementById('monitor-total').textContent = total;
            document.getElementById('monitor-pendentes').textContent = pendentes;
            document.getElementById('monitor-processando').textContent = processando;
            document.getElementById('monitor-processados').textContent = processados;
            document.getElementById('monitor-erros').textContent = erros;
        },

        render() {
            const container = document.getElementById('monitor-list');

            if (this.reunioes.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhuma reuniao monitorada. Adicione uma URL acima.</div>';
                return;
            }

            container.innerHTML = this.reunioes.map(r => {
                const statusClass = r.status === 'processado' ? 'processado' :
                                   r.status === 'erro' ? 'erro' :
                                   ['processando', 'baixando', 'extraindo_texto'].includes(r.status) ? 'processando' : '';

                const statusBadgeClass = r.status === 'processado' ? 'status-processado' :
                                         r.status === 'erro' ? 'status-erro' :
                                         r.status === 'pendente' ? 'status-pendente' : 'status-processando';

                const statusLabels = {
                    'pendente': 'Pendente',
                    'iniciando': 'Iniciando...',
                    'baixando': 'Baixando PDF...',
                    'extraindo_texto': 'Extraindo Texto...',
                    'processado': 'Concluído',
                    'erro': 'Erro'
                };

                let html = `<div class="meeting-card ${statusClass}">
                    <div class="meeting-header">
                        <div class="meeting-info">
                            <h3>${r.numero_reuniao || 'Reunião ' + r.id.substring(0, 8)}</h3>
                            <p>${r.data_reuniao || 'Data não identificada'} - ${r.tipo || 'deliberacao'}</p>
                            <a href="${r.url_origem}" target="_blank">${r.url_origem.substring(0, 60)}...</a>
                        </div>
                        <div class="meeting-status">
                            <span class="status-badge ${statusBadgeClass}">${statusLabels[r.status] || r.status}</span>
                        </div>
                    </div>`;

                if (r.status !== 'processado' && r.status !== 'erro' && r.status !== 'pendente') {
                    html += `<div class="meeting-progress">
                        <div class="progress-bar"><div class="progress-fill" style="width: ${r.progresso || 0}%;"></div></div>
                        <div class="progress-text">${r.progresso || 0}% concluido</div>
                    </div>`;
                }

                if (r.status === 'erro' && r.error_message) {
                    html += `<div class="error-msg">${r.error_message}</div>`;
                }

                if (r.deliberacoes_count > 0) {
                    html += `<div class="meeting-delibs"><h4>${r.deliberacoes_count} deliberações extraídas</h4></div>`;
                }

                html += `<div class="meeting-actions">`;
                if (r.status === 'pendente' || r.status === 'erro') {
                    html += `<button class="btn btn-primary btn-sm" onclick="App.PageMonitor.processar('${r.id}')">Processar</button>`;
                }
                html += `<button class="btn btn-danger btn-sm" onclick="App.PageMonitor.excluir('${r.id}')">Excluir</button>`;
                html += `</div></div>`;

                return html;
            }).join('');
        },

        async adicionar() {
            const url = document.getElementById('monitor-url')?.value?.trim();
            const tipo = document.getElementById('monitor-tipo')?.value;

            if (!url) {
                alert('Digite uma URL');
                return;
            }

            const response = await API.post('/api/reunioes-monitoradas', { url, tipo });
            if (response?.sucesso) {
                document.getElementById('monitor-url').value = '';
                await this.load();
            } else {
                alert('Erro: ' + (response?.erro || 'Erro desconhecido'));
            }
        },

        async processar(id) {
            const response = await API.post(`/api/reunioes-monitoradas/${id}/processar`);
            if (response?.sucesso) {
                await this.load();
            } else {
                alert('Erro: ' + (response?.erro || 'Erro desconhecido'));
            }
        },

        async excluir(id) {
            if (!confirm('Excluir esta reunião e todas suas deliberações?')) return;
            await API.delete(`/api/reunioes-monitoradas/${id}`);
            await this.load();
        }
    };

    // ============================================
    // PAGE: Diretores/Mandatos
    // ============================================
    const PageDiretores = {
        selectedAgency: 'artesp',

        agenciasData: {
            artesp: {
                nome: 'ARTESP',
                cor: '#F97316',
                diretores: [
                    {
                        nome: 'Andre Isper Rodrigues Barnabe',
                        cargo: 'Diretor-Presidente',
                        iniciais: 'AI',
                        inicio: '2024-09-10',
                        termino: '2029-09-09',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 0,
                        favoravel: 42,
                        desfavoravel: 0,
                        vista: 0
                    },
                    {
                        nome: 'Fernanda Esbizaro Rodrigues Rudnik',
                        cargo: 'Diretora',
                        iniciais: 'FE',
                        inicio: '2025-08-28',
                        termino: '2030-08-27',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 0,
                        favoravel: 42,
                        desfavoravel: 0,
                        vista: 0
                    },
                    {
                        nome: 'Raquel Franca Carneiro',
                        cargo: 'Diretora',
                        iniciais: 'RF',
                        inicio: '2025-05-14',
                        termino: '2030-05-13',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 0,
                        favoravel: 42,
                        desfavoravel: 0,
                        vista: 0
                    },
                    {
                        nome: 'Diego Albert Zanatto',
                        cargo: 'Diretor',
                        iniciais: 'DA',
                        inicio: '2024-08-14',
                        termino: '2029-08-13',
                        ativo: true,
                        participacoes: 35,
                        relatorias: 0,
                        favoravel: 35,
                        desfavoravel: 0,
                        vista: 0
                    }
                ],
                stats: {
                    diretoresAtivos: 4,
                    participacoesColegiadas: 161,
                    taxaConsenso: 100,
                    deliberacoes: 89
                },
                votos: {
                    favoravel: 161,
                    desfavoravel: 0,
                    vista: 0,
                    relator: 0
                },
                setores: [
                    { nome: 'Rodovias', valor: 48, cor: '#F97316' },
                    { nome: 'Onibus', valor: 21, cor: '#F97316' },
                    { nome: 'Regulacao', valor: 12, cor: '#F97316' },
                    { nome: 'Marcos Legais', valor: 5, cor: '#F97316' },
                    { nome: 'Ferrovias', valor: 1, cor: '#F97316' }
                ]
            },
            anm: {
                nome: 'ANM',
                cor: '#60A5FA',
                diretores: [
                    {
                        nome: 'Mauro Henrique Moreira Sousa',
                        cargo: 'Diretor-Geral',
                        iniciais: 'MM',
                        inicio: '2022-04-15',
                        termino: '2026-12-31',
                        ativo: true,
                        participacoes: 78,
                        relatorias: 12,
                        favoravel: 72,
                        desfavoravel: 4,
                        vista: 2
                    },
                    {
                        nome: 'Jose Fernando de Mendonca Gomes Junior',
                        cargo: 'Diretor',
                        iniciais: 'JG',
                        inicio: '2025-01-01',
                        termino: '2028-12-31',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 3,
                        favoravel: 40,
                        desfavoravel: 0,
                        vista: 2
                    },
                    {
                        nome: 'Luiz Paniago Neves',
                        cargo: 'Diretor Substituto',
                        iniciais: 'LP',
                        inicio: '2025-06-01',
                        termino: '2026-12-31',
                        ativo: true,
                        participacoes: 35,
                        relatorias: 4,
                        favoravel: 33,
                        desfavoravel: 1,
                        vista: 1
                    },
                    {
                        nome: 'Fabio Fernando Borges',
                        cargo: 'Diretor Substituto',
                        iniciais: 'FB',
                        inicio: '2025-06-01',
                        termino: '2026-12-31',
                        ativo: true,
                        participacoes: 35,
                        relatorias: 4,
                        favoravel: 33,
                        desfavoravel: 1,
                        vista: 1
                    }
                ],
                stats: {
                    diretoresAtivos: 4,
                    participacoesColegiadas: 190,
                    taxaConsenso: 94,
                    deliberacoes: 156
                },
                votos: {
                    favoravel: 178,
                    desfavoravel: 6,
                    vista: 6,
                    relator: 0
                },
                setores: [
                    { nome: 'Licenciamento', valor: 67, cor: '#60a5fa' },
                    { nome: 'Fiscalizacao', valor: 45, cor: '#60a5fa' },
                    { nome: 'Outorga', valor: 28, cor: '#60a5fa' },
                    { nome: 'Arrecadacao', valor: 12, cor: '#60a5fa' },
                    { nome: 'Outros', valor: 4, cor: '#60a5fa' }
                ]
            },
            anatel: {
                nome: 'ANATEL',
                cor: '#10B981',
                diretores: [
                    {
                        nome: 'Carlos Manuel Baigorri',
                        cargo: 'Presidente',
                        iniciais: 'CB',
                        inicio: '2022-11-04',
                        termino: '2026-11-03',
                        ativo: true,
                        participacoes: 156,
                        relatorias: 28,
                        favoravel: 148,
                        desfavoravel: 5,
                        vista: 3
                    },
                    {
                        nome: 'Alexandre Reis Siqueira Freire',
                        cargo: 'Conselheiro',
                        iniciais: 'AF',
                        inicio: '2022-06-15',
                        termino: '2027-06-14',
                        ativo: true,
                        participacoes: 98,
                        relatorias: 18,
                        favoravel: 94,
                        desfavoravel: 2,
                        vista: 2
                    },
                    {
                        nome: 'Octávio Penna Pieranti',
                        cargo: 'Conselheiro',
                        iniciais: 'OP',
                        inicio: '2025-08-01',
                        termino: '2028-12-31',
                        ativo: true,
                        participacoes: 32,
                        relatorias: 5,
                        favoravel: 30,
                        desfavoravel: 1,
                        vista: 1
                    },
                    {
                        nome: 'Edson Victor Eugênio de Holanda',
                        cargo: 'Conselheiro',
                        iniciais: 'EV',
                        inicio: '2025-09-01',
                        termino: '2029-12-31',
                        ativo: true,
                        participacoes: 28,
                        relatorias: 4,
                        favoravel: 27,
                        desfavoravel: 0,
                        vista: 1
                    }
                ],
                stats: {
                    diretoresAtivos: 4,
                    participacoesColegiadas: 314,
                    taxaConsenso: 96,
                    deliberacoes: 234
                },
                votos: {
                    favoravel: 299,
                    desfavoravel: 8,
                    vista: 7,
                    relator: 0
                },
                setores: [
                    { nome: 'Telecomunicacoes', valor: 120, cor: '#10b981' },
                    { nome: 'Radiodifusao', valor: 58, cor: '#10b981' },
                    { nome: 'Espectro', valor: 34, cor: '#10b981' },
                    { nome: 'Fiscalizacao', valor: 22, cor: '#10b981' }
                ]
            },
            aneel: {
                nome: 'ANEEL',
                cor: '#F59E0B',
                diretores: [
                    {
                        nome: 'Sandoval de Araújo Feitosa Neto',
                        cargo: 'Diretor-Geral',
                        iniciais: 'SF',
                        inicio: '2022-01-10',
                        termino: '2027-12-31',
                        ativo: true,
                        participacoes: 187,
                        relatorias: 30,
                        favoravel: 180,
                        desfavoravel: 4,
                        vista: 3
                    },
                    {
                        nome: 'Agnes Maria de Aragao da Costa',
                        cargo: 'Diretora',
                        iniciais: 'AC',
                        inicio: '2022-06-20',
                        termino: '2028-12-31',
                        ativo: true,
                        participacoes: 145,
                        relatorias: 25,
                        favoravel: 138,
                        desfavoravel: 4,
                        vista: 3
                    },
                    {
                        nome: 'Fernando Luiz Mosna Ferreira da Silva',
                        cargo: 'Diretor',
                        iniciais: 'FM',
                        inicio: '2022-03-15',
                        termino: '2026-12-31',
                        ativo: true,
                        participacoes: 145,
                        relatorias: 22,
                        favoravel: 140,
                        desfavoravel: 3,
                        vista: 2
                    },
                    {
                        nome: 'Willamy Moreira Frota',
                        cargo: 'Diretor',
                        iniciais: 'WF',
                        inicio: '2025-08-01',
                        termino: '2029-12-31',
                        ativo: true,
                        participacoes: 28,
                        relatorias: 4,
                        favoravel: 27,
                        desfavoravel: 0,
                        vista: 1
                    },
                    {
                        nome: 'Gentil Nogueira de Sa Junior',
                        cargo: 'Diretor',
                        iniciais: 'GN',
                        inicio: '2025-09-01',
                        termino: '2030-12-31',
                        ativo: true,
                        participacoes: 25,
                        relatorias: 3,
                        favoravel: 24,
                        desfavoravel: 0,
                        vista: 1
                    }
                ],
                stats: {
                    diretoresAtivos: 5,
                    participacoesColegiadas: 530,
                    taxaConsenso: 97,
                    deliberacoes: 198
                },
                votos: {
                    favoravel: 509,
                    desfavoravel: 11,
                    vista: 10,
                    relator: 0
                },
                setores: [
                    { nome: 'Tarifas', valor: 85, cor: '#f59e0b' },
                    { nome: 'Regulacao', valor: 62, cor: '#f59e0b' },
                    { nome: 'Fiscalizacao', valor: 31, cor: '#f59e0b' },
                    { nome: 'Outorga', valor: 20, cor: '#f59e0b' }
                ]
            }
        },

        async init() {
            const page = document.getElementById('page-diretores');
            page.classList.add('active');

            // Try loading real director data from API
            await this.loadRealData();

            this.setupAgencyTabs();
            this.renderAll();
        },

        async loadRealData() {
            try {
                const agencia = (this.selectedAgency || 'artesp').toUpperCase();
                const response = await fetch('/api/diretores?agencia=' + agencia);
                const data = await response.json();
                const apiDiretores = data?.diretores || [];

                if (apiDiretores.length > 0) {
                    const bucket = this.agenciasData[this.selectedAgency || 'artesp'];
                    if (bucket) {
                        bucket.diretores = apiDiretores.map(d => ({
                            nome: d.nome,
                            cargo: d.cargo || 'Diretor(a)',
                            iniciais: (d.nome || '').split(' ').filter(w => w.length > 2).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'DR',
                            inicio: d.mandato_inicio || '',
                            termino: d.mandato_fim || '',
                            ativo: d.ativo !== false,
                            participacoes: d.participacoes || 0,
                            relatorias: 0,
                            favoravel: (d.votos || {}).FAVORABLE || 0,
                            desfavoravel: (d.votos || {}).AGAINST || 0,
                            vista: (d.votos || {}).ABSTENTION || 0,
                            colegiado: d.colegiado || 0,
                            divergente: d.divergente || 0,
                            mandato_percent: d.mandato_percent || 0,
                            votos_por_tema: d.votos_por_tema || []
                        }));
                        bucket.stats.diretoresAtivos = bucket.diretores.filter(d => d.ativo).length;
                        bucket.stats.participacoesColegiadas = bucket.diretores.reduce((s, d) => s + d.participacoes, 0);

                        const demoBanner = document.querySelector('#page-diretores .demo-banner');
                        if (demoBanner) demoBanner.style.display = 'none';
                    }

                    // Populate voting matrix with real data
                    this._renderRealVotingMatrix(apiDiretores);
                }
            } catch (error) {
                console.warn('[Diretores] API indisponível, exibindo dados base:', error.message);
            }
        },

        _renderRealVotingMatrix(diretores) {
            const tbody = document.getElementById('diretores-voting-matrix-body');
            if (!tbody || diretores.length === 0) return;
            tbody.innerHTML = diretores.map(d => {
                const v = d.votos || {};
                const total = d.participacoes || 0;
                const cor = this.agenciasData[this.selectedAgency]?.cor || '#8b5cf6';
                return `<tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div class="mandato-avatar small" style="background:${cor};width:32px;height:32px;font-size:11px;">${d.iniciais||'DR'}</div>
                            <div><div style="font-weight:600;">${d.nome}</div><div style="font-size:11px;color:var(--text-muted);">${d.cargo||''}</div></div>
                        </div>
                    </td>
                    <td><span class="vote-badge green">${v.FAVORABLE||0}</span></td>
                    <td><span class="vote-badge red">${v.AGAINST||0}</span></td>
                    <td><span class="vote-badge orange">${v.ABSTENTION||0}</span></td>
                    <td><span class="vote-badge purple">0</span></td>
                    <td><span class="vote-badge blue">${d.colegiado||0}</span></td>
                    <td><span class="vote-badge pink">${d.divergente||0}</span></td>
                    <td><span class="vote-badge">0</span></td>
                    <td><span class="vote-badge">${total}</span></td>
                    <td><strong>${total}</strong></td>
                </tr>`;
            }).join('');
        },

        setupAgencyTabs() {
            const tabs = document.querySelectorAll('#diretores-agency-tabs .agency-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const agency = e.currentTarget.dataset.agency;
                    this.switchAgency(agency);
                });
            });
        },

        switchAgency(agency) {
            this.selectedAgency = agency;

            document.querySelectorAll('#diretores-agency-tabs .agency-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.agency === agency);
            });

            this.renderAll();
        },

        renderAll() {
            this.renderStats();
            this.renderMandatosExpirando();
            this.renderCards();
            this.renderGantt();
            this.renderVotingMatrix();
            this.renderSetoresChart();
            this.renderParticipationList();
        },

        renderMandatosExpirando() {
            const container = document.getElementById('mandatos-expirando-container');
            const countBadge = document.getElementById('mandatos-expirando-count');
            if (!container) return;

            // Collect all directors from all agencies with their mandate end dates
            const hoje = new Date();
            const todosDir = [];

            Object.entries(this.agenciasData).forEach(([key, agencia]) => {
                agencia.diretores.forEach(d => {
                    if (!d.termino) return;
                    const fim = new Date(d.termino + (d.termino.length === 10 ? 'T12:00:00' : ''));
                    const diffMs = fim - hoje;
                    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    todosDir.push({
                        ...d,
                        agenciaNome: agencia.nome,
                        agenciaCor: agencia.cor,
                        fim,
                        diffDias
                    });
                });
            });

            // Sort by expiration date (soonest first)
            todosDir.sort((a, b) => a.diffDias - b.diffDias);

            // Filter: show expired + expiring within 24 months
            const expirando = todosDir.filter(d => d.diffDias <= 730);

            if (countBadge) countBadge.textContent = expirando.length;

            if (expirando.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Nenhum mandato expirando nos proximos 24 meses</div></div>';
                return;
            }

            container.innerHTML = `
                <div class="mandatos-exp-timeline">
                    ${expirando.map(d => {
                        let urgencia = 'far';
                        let urgenciaLabel = '';
                        let urgenciaIcon = '';

                        if (d.diffDias < 0) {
                            urgencia = 'expired';
                            urgenciaLabel = 'Expirado';
                            urgenciaIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
                        } else if (d.diffDias <= 180) {
                            urgencia = 'critical';
                            urgenciaLabel = d.diffDias + ' dias';
                            urgenciaIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
                        } else if (d.diffDias <= 365) {
                            urgencia = 'warning';
                            urgenciaLabel = Math.ceil(d.diffDias / 30) + ' meses';
                            urgenciaIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
                        } else {
                            urgenciaLabel = Math.ceil(d.diffDias / 30) + ' meses';
                            urgenciaIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
                        }

                        const iniciais = d.nome.split(' ').filter((_, i, arr) => i === 0 || i === arr.length - 1).map(p => p[0]).join('');
                        const dataFim = d.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

                        // Progress: how much of mandate has elapsed
                        let progressPct = 100;
                        if (d.inicio) {
                            const inicio = new Date(d.inicio + (d.inicio.length === 10 ? 'T12:00:00' : ''));
                            const total = d.fim - inicio;
                            const elapsed = hoje - inicio;
                            progressPct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                        }

                        return `
                            <div class="mandato-exp-item urgencia-\${urgencia}">
                                <div class="mandato-exp-timeline-dot"></div>
                                <div class="mandato-exp-timeline-line"></div>
                                <div class="mandato-exp-content">
                                    <div class="mandato-exp-header">
                                        <div class="mandato-exp-avatar" style="background: \${d.agenciaCor};">\${iniciais}</div>
                                        <div class="mandato-exp-info">
                                            <div class="mandato-exp-nome">\${d.nome}</div>
                                            <div class="mandato-exp-cargo">\${d.cargo} — <span style="color: \${d.agenciaCor}; font-weight: 600;">\${d.agenciaNome}</span></div>
                                        </div>
                                        <div class="mandato-exp-countdown urgencia-\${urgencia}">
                                            \${urgenciaIcon}
                                            <span>\${urgenciaLabel}</span>
                                        </div>
                                    </div>
                                    <div class="mandato-exp-bar-wrapper">
                                        <div class="mandato-exp-bar">
                                            <div class="mandato-exp-bar-fill urgencia-\${urgencia}" style="width: \${progressPct}%;"></div>
                                        </div>
                                        <div class="mandato-exp-dates">
                                            <span>\${d.inicio ? new Date(d.inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}</span>
                                            <span class="mandato-exp-end-date">\${dataFim}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        renderStats() {
            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            document.getElementById('diretores-total').textContent = data.stats.diretoresAtivos;
            document.getElementById('diretores-participacoes').textContent = data.stats.participacoesColegiadas;
            document.getElementById('diretores-consenso').textContent = data.stats.taxaConsenso + '%';
            document.getElementById('diretores-deliberacoes').textContent = data.stats.deliberacoes;

            document.getElementById('diretores-favoravel').textContent = data.votos.favoravel;
            document.getElementById('diretores-desfavoravel').textContent = data.votos.desfavoravel;
            document.getElementById('diretores-vista').textContent = data.votos.vista;
            document.getElementById('diretores-relator').textContent = data.votos.relator;
            document.getElementById('diretores-votos-total').textContent = data.votos.favoravel;

            document.getElementById('diretores-nominais').textContent = '0 (0%)';
            document.getElementById('diretores-colegiadas').textContent = `${data.stats.participacoesColegiadas} (100%)`;
            document.getElementById('diretores-confianca').textContent = '0';
            document.getElementById('diretores-inferidos').textContent = data.stats.participacoesColegiadas;
        },

        renderCards() {
            const grid = document.getElementById('diretores-grid');
            if (!grid) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            grid.innerHTML = data.diretores.map(d => {
                const inicio = new Date(d.inicio);
                const termino = new Date(d.termino);
                const agora = new Date();

                const mesesDecorridos = Math.floor((agora - inicio) / (1000 * 60 * 60 * 24 * 30));
                const anosDecorridos = Math.floor(mesesDecorridos / 12);
                const mesesRestantes = mesesDecorridos % 12;

                const totalMandato = termino - inicio;
                const decorrido = agora - inicio;
                const percentual = Math.min(100, Math.round((decorrido / totalMandato) * 100));

                let tempoStr = '';
                if (anosDecorridos > 0) {
                    tempoStr = `${anosDecorridos}a ${mesesRestantes}m decorridos`;
                } else {
                    tempoStr = `${mesesDecorridos} meses decorridos`;
                }

                const inicioFormatado = this.formatDateBR(d.inicio);
                const terminoFormatado = this.formatDateBR(d.termino);

                return `
                <div class="mandato-detailed-card">
                    <div class="mandato-card-header">
                        <div class="mandato-avatar" style="background: ${data.cor};">${d.iniciais}</div>
                        <div class="mandato-info">
                            <div class="mandato-name">${d.nome}</div>
                            <div class="mandato-role">${d.cargo}</div>
                        </div>
                        <span class="mandato-status ${d.ativo ? 'ativo' : 'inativo'}">${d.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div class="mandato-card-body">
                        <div class="mandato-dates">
                            <div class="mandato-date-item">
                                <div class="mandato-date-label">Inicio</div>
                                <div class="mandato-date-value">${inicioFormatado}</div>
                            </div>
                            <div class="mandato-date-item">
                                <div class="mandato-date-label">Termino</div>
                                <div class="mandato-date-value">${terminoFormatado}</div>
                            </div>
                        </div>
                        <div class="mandato-progress">
                            <div class="mandato-progress-text">${tempoStr}<span style="float: right; color: var(--primary);">${percentual}% do mandato</span></div>
                            <div class="mandato-progress-bar">
                                <div class="mandato-progress-fill" style="width: ${percentual}%;"></div>
                            </div>
                        </div>
                        <div class="mandato-stats">
                            <div class="mandato-stat">
                                <div class="mandato-stat-value" style="color: ${data.cor};">${d.participacoes}</div>
                                <div class="mandato-stat-label">Participacoes</div>
                            </div>
                            <div class="mandato-stat">
                                <div class="mandato-stat-value">${d.relatorias}</div>
                                <div class="mandato-stat-label">Relatorias</div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        },

        renderGantt() {
            const container = document.getElementById('diretores-gantt-chart');
            if (!container) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            const startYear = 2024;
            const endYear = 2031;
            const totalMonths = (endYear - startYear) * 12;

            container.innerHTML = data.diretores.map(d => {
                const startDate = new Date(d.inicio);
                const endDate = new Date(d.termino);
                const startOffset = Math.max(0, ((startDate.getFullYear() - startYear) * 12 + startDate.getMonth()) / totalMonths * 100);
                const duration = ((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)) / totalMonths * 100;
                const barClass = d.ativo ? '' : 'ended';

                return `<div class="gantt-row">
                    <div class="gantt-label">${d.nome.split(' ')[0]} ${d.nome.split(' ').slice(-1)[0]}</div>
                    <div class="gantt-bars">
                        <div class="gantt-bar ${barClass}" style="left: ${startOffset}%; width: ${Math.min(duration, 100 - startOffset)}%; background: ${data.cor};">
                            ${d.cargo.split(' ')[0]}
                        </div>
                    </div>
                </div>`;
            }).join('');
        },

        renderVotingMatrix() {
            const tbody = document.getElementById('diretores-voting-matrix-body');
            if (!tbody) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            tbody.innerHTML = data.diretores.map(d => {
                const total = d.participacoes;
                return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="mandato-avatar small" style="background: ${data.cor}; width: 32px; height: 32px; font-size: 11px;">${d.iniciais}</div>
                            <div>
                                <div style="font-weight: 600;">${d.nome}</div>
                                <div style="font-size: 11px; color: var(--text-muted);">${d.cargo}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="vote-badge green">${d.favoravel}</span></td>
                    <td><span class="vote-badge red">${d.desfavoravel}</span></td>
                    <td><span class="vote-badge orange">${d.vista}</span></td>
                    <td><span class="vote-badge purple">${d.relatorias}</span></td>
                    <td><span class="vote-badge blue">${d.favoravel}</span></td>
                    <td><span class="vote-badge pink">0</span></td>
                    <td><span class="vote-badge">0</span></td>
                    <td><span class="vote-badge">${total}</span></td>
                    <td><strong>${total}</strong></td>
                </tr>
                `;
            }).join('');
        },

        renderSetoresChart() {
            const container = document.getElementById('diretores-setores-chart');
            if (!container) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            const maxVal = Math.max(...data.setores.map(s => s.valor));

            container.innerHTML = data.setores.map(s => `
                <div class="h-bar-item">
                    <span class="h-bar-label">${s.nome}</span>
                    <div class="h-bar-track">
                        <div class="h-bar-fill" style="width: ${(s.valor / maxVal * 100)}%; background: ${s.cor};"></div>
                    </div>
                    <span style="width: 30px; text-align: right; font-weight: 600;">${s.valor}</span>
                </div>
            `).join('');
        },

        renderParticipationList() {
            const container = document.getElementById('diretores-participation-list');
            if (!container) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            const sortedDiretores = [...data.diretores].sort((a, b) => b.participacoes - a.participacoes);

            container.innerHTML = sortedDiretores.map((d, i) => `
                <div class="participation-item">
                    <div class="participation-rank">${i + 1}</div>
                    <div class="participation-info">
                        <div class="participation-name">${d.nome}</div>
                        <div class="participation-count">${d.participacoes} participações</div>
                    </div>
                    <span class="relatorias-badge">${d.relatorias} relatorias</span>
                </div>
            `).join('');
        },

        formatDateBR(dateStr) {
            const date = new Date(dateStr);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    };

    // ============================================
    // PAGE: Setores
    // ============================================
    const PageSetores = {
        async init() {
            const page = document.getElementById('page-setores');
            page.classList.add('active');
            await this.loadData();
        },

        async loadData() {
            try {
                const data = await API.get('/api/metricas/por-tema');
                if (data && data.temas && data.temas.length > 0) {
                    this.renderStats(data);
                    setDataMode('page-setores', true);
                }
            } catch (err) {
                console.warn('[Setores] API indisponivel:', err.message);
            }
        },

        renderStats(data) {
            const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
            el('setores-total', data.totalTemas || 0);
            const totalDelibs = data.temas.reduce((sum, t) => sum + t.total, 0);
            const setoresDelib = document.getElementById('setores-deliberações');
            if (setoresDelib) setoresDelib.textContent = totalDelibs;
            el('setores-mais-ativo', data.temas[0]?.tema || '-');
        }
    };

    // ============================================
    // PAGE: Painel Regulatorio
    // ============================================
    const PagePainelRegulatorio = {
        currentPage: 1,
        itemsPerPage: 8,
        activeSetor: 'todos',
        activeNatureza: 'todos',
        activeAno: '2026',

        normasData: [
            { titulo: 'Resolução nº 001/2026 - Diretrizes de Fiscalização', data: '04/01/2026', setor: 'Rodovias', tipo: 'Resolução', natureza: 'nova', relevancia: 'alta' },
            { titulo: 'Deliberação nº 15/2026 - Tarifas de Pedágio', data: '03/01/2026', setor: 'Rodovias', tipo: 'Deliberação', natureza: 'alteração', relevancia: 'alta' },
            { titulo: 'Portaria nº 042/2026 - Procedimentos de Vistoria', data: '02/01/2026', setor: 'Ferrovias', tipo: 'Portaria', natureza: 'nova', relevancia: 'média' },
            { titulo: 'Resolução nº 998/2025 - Revogação de Normativo', data: '27/12/2025', setor: 'Rodovias', tipo: 'Resolução', natureza: 'revogação', relevancia: 'baixa' },
            { titulo: 'Deliberação nº 14/2026 - Indicadores de Qualidade', data: '01/01/2026', setor: 'Rodovias', tipo: 'Deliberação', natureza: 'alteração', relevancia: 'média' },
            { titulo: 'Resolução nº 002/2026 - Normas de Segurança Ferroviária', data: '05/01/2026', setor: 'Ferrovias', tipo: 'Resolução', natureza: 'nova', relevancia: 'alta' },
            { titulo: 'Deliberação nº 16/2026 - Reajuste Tarifário Aeroportuário', data: '06/01/2026', setor: 'Aeroportos', tipo: 'Deliberação', natureza: 'alteração', relevancia: 'alta' },
            { titulo: 'Portaria nº 043/2026 - Inspeção de Terminais Portuários', data: '07/01/2026', setor: 'Portos', tipo: 'Portaria', natureza: 'nova', relevancia: 'média' },
            { titulo: 'Resolução nº 003/2026 - Padrão de Sinalização', data: '08/01/2026', setor: 'Rodovias', tipo: 'Resolução', natureza: 'nova', relevancia: 'média' },
            { titulo: 'Deliberação nº 17/2026 - Concessão de Rodovia SP-300', data: '09/01/2026', setor: 'Rodovias', tipo: 'Deliberação', natureza: 'nova', relevancia: 'alta' },
            { titulo: 'Resolução nº 997/2025 - Revogação de Taxas Aeroportuárias', data: '26/12/2025', setor: 'Aeroportos', tipo: 'Resolução', natureza: 'revogação', relevancia: 'média' },
            { titulo: 'Portaria nº 044/2026 - Manutenção de Vias Férreas', data: '10/01/2026', setor: 'Ferrovias', tipo: 'Portaria', natureza: 'alteração', relevancia: 'baixa' },
            { titulo: 'Deliberação nº 18/2026 - Seguro de Cargas Portuárias', data: '11/01/2026', setor: 'Portos', tipo: 'Deliberação', natureza: 'nova', relevancia: 'média' },
            { titulo: 'Resolução nº 004/2026 - Limite de Velocidade em Túneis', data: '12/01/2026', setor: 'Rodovias', tipo: 'Resolução', natureza: 'alteração', relevancia: 'alta' }
        ],

        chartData: {
            meses: ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            novas:      [12, 8, 14, 10, 18, 11],
            alteracoes: [14, 12, 16, 22, 14, 15],
            revogacoes: [3, 2, 4, 3, 5, 2]
        },

        init() {
            const page = document.getElementById('page-painel-regulatorio');
            page.classList.add('active');
            this.renderChart();
            this.renderNormas();
            this.bindEvents();
        },

        bindEvents() {
            // Chip filters - Setor
            document.querySelectorAll('#painel-setor-chips .painel-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    document.querySelectorAll('#painel-setor-chips .painel-chip').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    this.activeSetor = e.target.dataset.setor;
                    this.currentPage = 1;
                    this.renderNormas();
                    this.updateKPIs();
                });
            });

            // Chip filters - Natureza
            document.querySelectorAll('#painel-natureza-chips .painel-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    document.querySelectorAll('#painel-natureza-chips .painel-chip').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    this.activeNatureza = e.target.dataset.natureza;
                    this.currentPage = 1;
                    this.renderNormas();
                    this.updateKPIs();
                });
            });

            // Ano filter
            const anoFilter = document.getElementById('painel-ano-filter');
            if (anoFilter) {
                anoFilter.addEventListener('change', (e) => {
                    this.activeAno = e.target.value;
                    this.currentPage = 1;
                    this.renderNormas();
                    this.updateKPIs();
                });
            }

            // Pagination
            const prevBtn = document.getElementById('painel-prev-btn');
            const nextBtn = document.getElementById('painel-next-btn');
            if (prevBtn) prevBtn.addEventListener('click', () => { this.currentPage--; this.renderNormas(); });
            if (nextBtn) nextBtn.addEventListener('click', () => { this.currentPage++; this.renderNormas(); });

            // Agencia filter
            const agenciaFilter = document.getElementById('painel-agencia-filter');
            if (agenciaFilter) {
                agenciaFilter.addEventListener('change', () => {
                    this.renderChart();
                    this.renderNormas();
                    this.updateKPIs();
                });
            }

            // Export
            const exportBtn = document.getElementById('painel-exportar-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    alert('Exportação em desenvolvimento. Os dados serão exportados em formato CSV/PDF.');
                });
            }
        },

        getFilteredNormas() {
            return this.normasData.filter(n => {
                if (this.activeSetor !== 'todos' && n.setor.toLowerCase() !== this.activeSetor) return false;
                if (this.activeNatureza !== 'todos' && n.natureza !== this.activeNatureza) return false;
                return true;
            });
        },

        updateKPIs() {
            const filtered = this.getFilteredNormas();
            const total = filtered.length;
            const novas = filtered.filter(n => n.natureza === 'nova').length;
            const alteracoes = filtered.filter(n => n.natureza === 'alteracao').length;
            const revogacoes = filtered.filter(n => n.natureza === 'revogacao').length;

            const elTotal = document.getElementById('painel-total-normas');
            const elNovas = document.getElementById('painel-novas');
            const elAlteracoes = document.getElementById('painel-alteracoes');
            const elRevogacoes = document.getElementById('painel-revogacoes');

            if (elTotal) elTotal.textContent = total;
            if (elNovas) elNovas.textContent = novas;
            if (elAlteracoes) elAlteracoes.textContent = alteracoes;
            if (elRevogacoes) elRevogacoes.textContent = revogacoes;
        },

        renderNormas() {
            const tbody = document.getElementById('painel-normas-tbody');
            if (!tbody) return;

            const filtered = this.getFilteredNormas();
            const totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
            if (this.currentPage > totalPages) this.currentPage = totalPages;

            const start = (this.currentPage - 1) * this.itemsPerPage;
            const pageItems = filtered.slice(start, start + this.itemsPerPage);

            tbody.innerHTML = pageItems.map(n => `
                <tr>
                    <td style="max-width: 320px; font-weight: 500;">${n.titulo}</td>
                    <td>${n.data}</td>
                    <td><span class="painel-badge-setor">${n.setor}</span></td>
                    <td>${n.tipo}</td>
                    <td><span class="painel-badge-natureza ${n.natureza}">${n.natureza.charAt(0).toUpperCase() + n.natureza.slice(1)}</span></td>
                    <td><span class="painel-badge-relevancia ${n.relevancia}">${n.relevancia.charAt(0).toUpperCase() + n.relevancia.slice(1)}</span></td>
                    <td>
                        <button class="painel-link-btn" title="Ver detalhes">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Pagination
            const pageInfo = document.getElementById('painel-page-info');
            const prevBtn = document.getElementById('painel-prev-btn');
            const nextBtn = document.getElementById('painel-next-btn');
            if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
            if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
            if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        },

        renderChart() {
            const canvas = document.getElementById('painel-evolucao-canvas');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.parentElement.getBoundingClientRect();
            const w = rect.width || 700;
            const h = 320;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.scale(dpr, dpr);

            ctx.clearRect(0, 0, w, h);

            const data = this.chartData;
            const padding = { top: 20, right: 30, bottom: 40, left: 40 };
            const chartW = w - padding.left - padding.right;
            const chartH = h - padding.top - padding.bottom;
            const maxVal = Math.max(...data.novas, ...data.alteracoes, ...data.revogacoes) + 5;
            const stepX = chartW / (data.meses.length - 1);

            // Grid lines
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartH / 4) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(w - padding.right, y);
                ctx.stroke();

                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '11px Inter';
                ctx.textAlign = 'right';
                ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padding.left - 8, y + 4);
            }

            // X labels
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            data.meses.forEach((m, i) => {
                const x = padding.left + stepX * i;
                ctx.fillText(m, x, h - 10);
            });

            // Draw lines with area fill
            const drawLine = (values, color, fillColor) => {
                const points = values.map((v, i) => ({
                    x: padding.left + stepX * i,
                    y: padding.top + chartH - (v / maxVal) * chartH
                }));

                // Area fill
                ctx.beginPath();
                ctx.moveTo(points[0].x, padding.top + chartH);
                points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
                ctx.closePath();
                ctx.fillStyle = fillColor;
                ctx.fill();

                // Line
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.lineJoin = 'round';
                points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();

                // Dots
                points.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                });
            };

            drawLine(data.novas, '#fbbf24', 'rgba(251, 191, 36, 0.08)');
            drawLine(data.alteracoes, '#4ade80', 'rgba(74, 222, 128, 0.12)');
            drawLine(data.revogacoes, '#f87171', 'rgba(248, 113, 113, 0.06)');
        }
    };

    // ============================================
    // UTIL: DEMO/REAL indicator
    // ============================================
    function setDataMode(pageId, isReal) {
        const page = document.getElementById(pageId);
        if (!page) return;
        const badge = page.querySelector('.demo-badge');
        if (badge) {
            badge.style.display = isReal ? 'none' : '';
            badge.textContent = isReal ? '' : 'Demo';
        }
        // Add a subtle "REAL" badge when showing real data
        let realBadge = page.querySelector('.real-badge');
        if (isReal && !realBadge) {
            const actions = page.querySelector('.page-actions');
            if (actions) {
                realBadge = document.createElement('span');
                realBadge.className = 'real-badge';
                realBadge.textContent = 'Dados Reais';
                realBadge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.35);color:#4ade80;font-size:10px;font-weight:700;letter-spacing:1.5px;border-radius:4px;font-family:Courier New,monospace;text-transform:uppercase;';
                actions.prepend(realBadge);
            }
        } else if (!isReal && realBadge) {
            realBadge.remove();
        }
    }

    // ============================================
    // PAGE: Microtemas
    // ============================================
    const PageMicrotemas = {
        async init() {
            const page = document.getElementById('page-microtemas');
            page.classList.add('active');
            await this.loadData();
        },

        async loadData() {
            try {
                const data = await API.get('/api/metricas/por-tema');
                if (data && data.temas && data.temas.length > 0) {
                    this.renderStats(data);
                    this.renderMicrotemas(data.temas);
                    setDataMode('page-microtemas', true);
                } else {
                    setDataMode('page-microtemas', false);
                }
            } catch (err) {
                console.warn('[Microtemas] API indisponivel:', err.message);
                setDataMode('page-microtemas', false);
            }
        },

        renderStats(data) {
            const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
            el('microtemas-total', data.totalTemas || 0);
            el('microtemas-frequente', data.temas[0]?.tema || '-');
            // Count new microtemas (approximation: themes with only 1 occurrence)
            const novos = data.temas.filter(t => t.total <= 2).length;
            el('microtemas-novos', novos);
            el('microtemas-monitoramento', data.temas.length);
        },

        renderMicrotemas(temas) {
            const grid = document.getElementById('setores-microtemas-grid');
            if (!grid) return;

            // Group microtemas by sector keywords
            const setores = {
                'Rodovias': { icon: 'road', color: 'cyan', temas: [] },
                'Ferrovias': { icon: 'rail', color: 'green', temas: [] },
                'Aeroportos': { icon: 'air', color: 'orange', temas: [] },
                'Portos': { icon: 'port', color: 'red', temas: [] },
                'Outros': { icon: 'other', color: 'purple', temas: [] }
            };

            temas.forEach(t => {
                const tema = (t.tema || '').toLowerCase();
                if (tema.includes('rodov') || tema.includes('pedagio') || tema.includes('pedágio') || tema.includes('duplica') || tema.includes('sinalizac')) {
                    setores['Rodovias'].temas.push(t);
                } else if (tema.includes('ferrov') || tema.includes('trem') || tema.includes('metro')) {
                    setores['Ferrovias'].temas.push(t);
                } else if (tema.includes('aero') || tema.includes('aviac') || tema.includes('voo')) {
                    setores['Aeroportos'].temas.push(t);
                } else if (tema.includes('porto') || tema.includes('naveg') || tema.includes('maritim')) {
                    setores['Portos'].temas.push(t);
                } else {
                    setores['Outros'].temas.push(t);
                }
            });

            grid.innerHTML = Object.entries(setores)
                .filter(([, v]) => v.temas.length > 0)
                .map(([setor, v]) => `
                    <div class="setor-microtemas-card setor-${v.color}">
                        <div class="setor-header">
                            <h4 class="setor-title">${setor}</h4>
                            <span class="setor-count">${v.temas.length} microtemas</span>
                        </div>
                        <div class="microtema-tags">
                            ${v.temas.slice(0, 6).map((t, i) => `<span class="microtema-tag${i === 0 ? ' primary' : ''}">${t.tema} <span class="count">${t.total}</span></span>`).join('')}
                        </div>
                    </div>
                `).join('');
        }
    };

    // ============================================
    // PAGE: Empresas
    // ============================================
    const PageEmpresas = {
        empresasDetectadas: [],

        async init() {
            const page = document.getElementById('page-empresas');
            page.classList.add('active');

            // Carrega empresas detectadas nos PDFs
            await this.loadEmpresasDetectadas();
        },

        async loadEmpresasDetectadas() {
            try {
                const response = await API.get('/api/empresas/detectadas');
                if (response?.sucesso && response.empresas) {
                    this.empresasDetectadas = response.empresas;
                    this.renderEmpresasDetectadas();
                }
            } catch (error) {
                console.error('Erro ao carregar empresas detectadas:', error);
            }
        },

        renderEmpresasDetectadas() {
            const container = document.getElementById('empresas-detectadas-list');
            if (!container) return;

            if (this.empresasDetectadas.length === 0) {
                container.innerHTML = '<span class="empresas-none">Nenhuma empresa detectada ainda. Faça upload e análise de PDFs para detectar empresas automaticamente.</span>';
                return;
            }

            container.innerHTML = this.empresasDetectadas.map(emp => `
                <span class="empresa-detectada-tag" onclick="App.PageEmpresas.adicionarEmpresa('${emp.nome}', '${emp.setor}', '${emp.tipo}')" title="Clique para adicionar ao sistema">
                    <svg class="add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    ${emp.nome}
                    <span style="opacity: 0.7; font-size: 11px;">(${emp.setor} - ${emp.mencoes} mencoes em ${emp.documentos} docs)</span>
                </span>
            `).join('');
        },

        async adicionarEmpresa(nome, setor, tipo) {
            if (!confirm(`Adicionar "${nome}" a lista de empresas do sistema?`)) return;

            try {
                const response = await API.post('/api/empresas/adicionar', { nome, setor, tipo });
                if (response?.sucesso) {
                    alert(`Empresa "${nome}" adicionada com sucesso!`);
                    await this.loadEmpresasDetectadas();
                } else {
                    alert('Erro: ' + (response?.erro || 'Erro desconhecido'));
                }
            } catch (error) {
                alert('Erro ao adicionar empresa: ' + error.message);
            }
        }
    };

    // ============================================
    // PAGE: Historico
    // ============================================
    const PageHistorico = {
        async init() {
            const page = document.getElementById('page-historico');
            page.classList.add('active');
            await this.loadData();
        },

        async loadData() {
            try {
                const data = await API.get('/api/deliberacoes');
                if (data && data.deliberacoes && data.deliberacoes.length > 0) {
                    this.renderStats(data.deliberacoes);
                    this.renderTimeline(data.deliberacoes);
                    setDataMode('page-historico', true);
                } else {
                    setDataMode('page-historico', false);
                }
            } catch (err) {
                console.warn('[Historico] API indisponivel:', err.message);
                setDataMode('page-historico', false);
            }
        },

        renderStats(deliberacoes) {
            const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
            el('historico-eventos', deliberacoes.length);
            // Count unique reunioes as "marcos"
            const reunioes = [...new Set(deliberacoes.map(d => d.reuniao_ordinaria).filter(Boolean))];
            el('historico-marcos', reunioes.length);
            // Count deliberacoes with empresa/interessado as "contratos"
            const contratos = deliberacoes.filter(d => d.interessado && d.interessado !== 'ARTESP').length;
            el('historico-contratos', contratos);
            // Last event date
            const datas = deliberacoes.map(d => d.dataArquivo || d.data_reuniao).filter(Boolean).sort();
            el('historico-ultimo', datas.length > 0 ? datas[datas.length - 1] : '-');
        },

        renderTimeline(deliberacoes) {
            const timeline = document.getElementById('historico-timeline');
            if (!timeline) return;

            // Group by date/reuniao
            const grouped = {};
            deliberacoes.forEach(d => {
                const key = d.reuniao_ordinaria || d.dataArquivo || 'Sem data';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(d);
            });

            const markers = ['success', 'primary', 'warning', 'info', 'danger'];
            let idx = 0;

            timeline.innerHTML = Object.entries(grouped).slice(0, 10).map(([key, delibs]) => {
                const marker = markers[idx++ % markers.length];
                const deferidos = delibs.filter(d => d.resultado === 'Deferido').length;
                const indeferidos = delibs.filter(d => d.resultado === 'Indeferido').length;
                const temas = [...new Set(delibs.map(d => d.microtema).filter(Boolean))].slice(0, 3);

                return `<div class="timeline-item">
                    <div class="timeline-marker ${marker}"></div>
                    <div class="timeline-content">
                        <div class="timeline-date">Reuniao ${key}</div>
                        <div class="timeline-title">${delibs.length} Deliberacoes Processadas</div>
                        <div class="timeline-description">${deferidos} deferidas, ${indeferidos} indeferidas</div>
                        <div class="timeline-tags">
                            ${temas.map(t => `<span class="timeline-tag">${t}</span>`).join('')}
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    };

    // ============================================
    // PAGE: Jurimetria
    // ============================================
    const PageJurimetria = {
        // Dados por agencia
        agenciasData: {
            artesp: {
                nome: 'ARTESP',
                cor: '#FFEF4D',
                diretores: [
                    {
                        nome: 'Fernanda Esbizaro Rodrigues Rudnik',
                        cargo: 'Diretora',
                        iniciais: 'FE',
                        inicio: '2025-08-28',
                        termino: '2030-08-27',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 0
                    },
                    {
                        nome: 'Raquel Franca Carneiro',
                        cargo: 'Diretora',
                        iniciais: 'RF',
                        inicio: '2025-05-14',
                        termino: '2030-05-13',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 0
                    },
                    {
                        nome: 'Andre Isper Rodrigues Barnabe',
                        cargo: 'Diretor-Presidente',
                        iniciais: 'AI',
                        inicio: '2024-09-10',
                        termino: '2029-09-09',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 0
                    },
                    {
                        nome: 'Diego Albert Zanatto',
                        cargo: 'Diretor',
                        iniciais: 'DA',
                        inicio: '2024-08-14',
                        termino: '2029-08-13',
                        ativo: true,
                        participacoes: 35,
                        relatorias: 0
                    }
                ],
                stats: {
                    diretoresAtivos: 4,
                    participacoesColegiadas: 161,
                    taxaConsenso: 100,
                    deliberacoes: 89
                },
                votos: {
                    favoravel: 161,
                    desfavoravel: 0,
                    vista: 0,
                    relator: 0
                },
                setores: [
                    { nome: 'Rodovias', valor: 48, cor: '#f472b6' },
                    { nome: 'Onibus', valor: 21, cor: '#4ade80' },
                    { nome: 'Regulacao', valor: 12, cor: '#fbbf24' },
                    { nome: 'Marcos Legais', valor: 5, cor: '#a855f7' },
                    { nome: 'Ferrovias', valor: 1, cor: '#60a5fa' }
                ]
            },
            anm: {
                nome: 'ANM',
                cor: '#60A5FA',
                diretores: [
                    {
                        nome: 'Mauro Henrique Moreira Sousa',
                        cargo: 'Diretor-Geral',
                        iniciais: 'MM',
                        inicio: '2022-04-15',
                        termino: '2026-12-31',
                        ativo: true,
                        participacoes: 78,
                        relatorias: 12
                    },
                    {
                        nome: 'Jose Fernando de Mendonca Gomes Junior',
                        cargo: 'Diretor',
                        iniciais: 'JG',
                        inicio: '2025-01-01',
                        termino: '2028-12-31',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 3
                    },
                    {
                        nome: 'Luiz Paniago Neves',
                        cargo: 'Diretor Substituto',
                        iniciais: 'LP',
                        inicio: '2025-06-01',
                        termino: '2026-12-31',
                        ativo: true,
                        participacoes: 35,
                        relatorias: 4
                    },
                    {
                        nome: 'Fabio Fernando Borges',
                        cargo: 'Diretor Substituto',
                        iniciais: 'FB',
                        inicio: '2025-06-01',
                        termino: '2026-12-31',
                        ativo: true,
                        participacoes: 35,
                        relatorias: 4
                    }
                ],
                stats: {
                    diretoresAtivos: 4,
                    participacoesColegiadas: 190,
                    taxaConsenso: 94,
                    deliberacoes: 156
                },
                votos: {
                    favoravel: 178,
                    desfavoravel: 6,
                    vista: 6,
                    relator: 0
                },
                setores: [
                    { nome: 'Licenciamento', valor: 67, cor: '#f472b6' },
                    { nome: 'Fiscalizacao', valor: 45, cor: '#4ade80' },
                    { nome: 'Outorga', valor: 28, cor: '#fbbf24' },
                    { nome: 'Arrecadacao', valor: 12, cor: '#a855f7' },
                    { nome: 'Outros', valor: 4, cor: '#60a5fa' }
                ]
            }
        },
        selectedAgency: 'artesp',
        diretores: [],
        metricasAPI: null,
        selectedDirector: 0,
        currentTab: 'mandatos',

        async init() {
            const page = document.getElementById('page-jurimetria');
            page.classList.add('active');

            // Carrega metricas da API
            await this.carregarMetricas();

            this.setupTabs();
            this.setupAgencyTabs();
            this.renderMandatosDetailed();
            this.renderMandatosStats();
            this.renderMandatosVotingMatrix();
            this.renderGantt();
            this.renderVotingMatrix();
            this.renderParticipationList();
            this.renderDirectorSelector();
            this.renderDirectorProfile();
        },

        setupAgencyTabs() {
            const tabs = document.querySelectorAll('#mandatos-agency-tabs .agency-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const agency = e.currentTarget.dataset.agency;
                    this.switchAgency(agency);
                });
            });
        },

        switchAgency(agency) {
            this.selectedAgency = agency;

            // Update tabs
            document.querySelectorAll('#mandatos-agency-tabs .agency-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.agency === agency);
            });

            // Re-render everything
            this.renderMandatosDetailed();
            this.renderMandatosStats();
            this.renderMandatosVotingMatrix();
            this.renderGantt();
        },

        renderMandatosStats() {
            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            const stats = data.stats;
            document.getElementById('mandatos-diretores').textContent = stats.diretoresAtivos;
            document.getElementById('mandatos-participacoes').textContent = stats.participacoesColegiadas;
            document.getElementById('mandatos-consenso').textContent = stats.taxaConsenso + '%';
            document.getElementById('mandatos-deliberacoes').textContent = stats.deliberacoes;

            // Atualiza votos
            document.getElementById('mandatos-favoravel').textContent = data.votos.favoravel;
            document.getElementById('mandatos-desfavoravel').textContent = data.votos.desfavoravel;
            document.getElementById('mandatos-vista').textContent = data.votos.vista;
            document.getElementById('mandatos-relator').textContent = data.votos.relator;
            document.getElementById('mandatos-votos-total').textContent = data.votos.favoravel;

            // Atualiza setores
            const setoresContainer = document.getElementById('mandatos-setores-chart');
            if (setoresContainer) {
                const maxVal = Math.max(...data.setores.map(s => s.valor));
                setoresContainer.innerHTML = data.setores.map(s => `
                    <div class="h-bar-item">
                        <span class="h-bar-label">${s.nome}</span>
                        <div class="h-bar-track">
                            <div class="h-bar-fill" style="width: ${(s.valor / maxVal * 100)}%; background: ${s.cor};"></div>
                        </div>
                        <span style="width: 30px; text-align: right; font-weight: 600;">${s.valor}</span>
                    </div>
                `).join('');
            }

            // Atualiza matriz stats
            const totalVotos = data.votos.favoravel + data.votos.desfavoravel;
            document.getElementById('matrix-nominais').textContent = `0 (0%)`;
            document.getElementById('matrix-colegiadas').textContent = `${stats.participacoesColegiadas} (100%)`;
            document.getElementById('matrix-confianca').textContent = '0';
            document.getElementById('matrix-inferidos').textContent = stats.participacoesColegiadas;
        },

        renderMandatosDetailed() {
            const grid = document.getElementById('mandatos-grid');
            if (!grid) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            grid.innerHTML = data.diretores.map(d => {
                const inicio = new Date(d.inicio);
                const termino = new Date(d.termino);
                const agora = new Date();

                // Calcula tempo decorrido
                const mesesDecorridos = Math.floor((agora - inicio) / (1000 * 60 * 60 * 24 * 30));
                const anosDecorridos = Math.floor(mesesDecorridos / 12);
                const mesesRestantes = mesesDecorridos % 12;

                // Calcula porcentagem do mandato
                const totalMandato = termino - inicio;
                const decorrido = agora - inicio;
                const percentual = Math.min(100, Math.round((decorrido / totalMandato) * 100));

                // Formata tempo decorrido
                let tempoStr = '';
                if (anosDecorridos > 0) {
                    tempoStr = `${anosDecorridos}a ${mesesRestantes}m decorridos`;
                } else {
                    tempoStr = `${mesesDecorridos} meses decorridos`;
                }

                const inicioFormatado = this.formatDateBR(d.inicio);
                const terminoFormatado = this.formatDateBR(d.termino);

                return `
                <div class="mandato-detailed-card">
                    <div class="mandato-card-header">
                        <div class="mandato-avatar" style="background: ${data.cor};">${d.iniciais}</div>
                        <div class="mandato-info">
                            <div class="mandato-name">${d.nome}</div>
                            <div class="mandato-role">${d.cargo}</div>
                        </div>
                        <span class="mandato-status ${d.ativo ? 'ativo' : 'inativo'}">${d.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div class="mandato-card-body">
                        <div class="mandato-dates">
                            <div class="mandato-date-item">
                                <div class="mandato-date-label">Inicio</div>
                                <div class="mandato-date-value">${inicioFormatado}</div>
                            </div>
                            <div class="mandato-date-item">
                                <div class="mandato-date-label">Termino</div>
                                <div class="mandato-date-value">${terminoFormatado}</div>
                            </div>
                        </div>
                        <div class="mandato-progress">
                            <div class="mandato-progress-text">${tempoStr}<span style="float: right; color: var(--primary);">${percentual}% do mandato</span></div>
                            <div class="mandato-progress-bar">
                                <div class="mandato-progress-fill" style="width: ${percentual}%;"></div>
                            </div>
                        </div>
                        <div class="mandato-stats">
                            <div class="mandato-stat">
                                <div class="mandato-stat-value" style="color: ${data.cor};">${d.participacoes}</div>
                                <div class="mandato-stat-label">Participacoes</div>
                            </div>
                            <div class="mandato-stat">
                                <div class="mandato-stat-value">${d.relatorias}</div>
                                <div class="mandato-stat-label">Relatorias</div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        },

        renderMandatosVotingMatrix() {
            const tbody = document.getElementById('mandatos-voting-matrix-body');
            if (!tbody) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            tbody.innerHTML = data.diretores.map(d => {
                const total = d.participacoes;
                const favoravel = total;
                const desfavoravel = 0;
                const vista = 0;
                const relator = 0;
                const acompanhou = total;
                const divergente = 0;
                const nominal = 0;
                const colegiado = total;

                return `
                <tr>
                    <td>${d.nome}</td>
                    <td><span class="vote-badge favorable">${favoravel}</span></td>
                    <td>${desfavoravel}</td>
                    <td>${vista}</td>
                    <td>${relator}</td>
                    <td><span class="vote-badge acompanhou">${acompanhou}</span></td>
                    <td>${divergente}</td>
                    <td>${nominal}</td>
                    <td><span class="vote-badge colegiado">${colegiado}</span></td>
                    <td><strong>${total}</strong></td>
                </tr>
                `;
            }).join('');
        },

        formatDateBR(dateStr) {
            if (!dateStr) return '-';
            try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                return dateStr;
            } catch (e) {
                return dateStr;
            }
        },

        async carregarMetricas() {
            try {
                // Busca metricas por diretor da API
                const response = await API.get('/api/metricas/por-diretor');
                this.metricasAPI = response?.diretores || [];

                // Mescla dados estaticos com dados da API
                this.diretores = this.diretoresBase.map(base => {
                    // Procura correspondencia na API (considerando variantes)
                    let apiData = this.metricasAPI.find(d =>
                        d.nome === base.nome ||
                        base.variantes.some(v => d.nome.includes(v) || v.includes(d.nome))
                    );

                    // Calcula tempo de mandato
                    const inicio = new Date(base.inicio);
                    const agora = new Date();
                    const meses = Math.floor((agora - inicio) / (1000 * 60 * 60 * 24 * 30));
                    const anos = Math.floor(meses / 12);
                    const mesesRestantes = meses % 12;
                    const tempoMandato = `${anos} anos e ${mesesRestantes} meses`;

                    // Dados da API ou valores padrao
                    const participacoes = apiData?.totalVotos || 0;
                    const votosFavor = apiData?.votosFavor || 0;
                    const votosContra = apiData?.votosContra || 0;
                    const taxaDeferimento = apiData?.taxaDeferimento || 0;
                    const temasOrdenados = apiData?.temasOrdenados || [];

                    return {
                        ...base,
                        tempoMandato,
                        participacoes,
                        relatorias: 0, // Nao disponivel na API ainda
                        favoravel: votosFavor,
                        desfavoravel: votosContra,
                        vista: 0,
                        relator: 0,
                        acompanhou: votosFavor,
                        divergente: votosContra,
                        nominal: 0,
                        colegiado: participacoes,
                        taxaDeferimento,
                        temasOrdenados,
                        votosPleitoExterno: apiData?.votosPleitoExterno || 0,
                        votosPautaInterna: apiData?.votosPautaInterna || 0,
                        percentualPleitoExterno: apiData?.percentualPleitoExterno || 0,
                        votosDeferido: apiData?.votosDeferido || 0,
                        votosIndeferido: apiData?.votosIndeferido || 0
                    };
                });

                // Adiciona diretores encontrados na API que nao estao na lista base
                this.metricasAPI.forEach(apiDir => {
                    const jaExiste = this.diretores.some(d =>
                        d.nome === apiDir.nome ||
                        d.variantes?.some(v => apiDir.nome.includes(v))
                    );
                    if (!jaExiste && apiDir.totalVotos > 0) {
                        // Gera iniciais automaticamente
                        const partes = apiDir.nome.split(' ');
                        const iniciais = partes.length >= 2
                            ? partes[0][0] + partes[partes.length - 1][0]
                            : partes[0].substring(0, 2);

                        this.diretores.push({
                            nome: apiDir.nome,
                            variantes: [],
                            cargo: 'Diretor(a)',
                            iniciais: iniciais.toUpperCase(),
                            inicio: '2020-01-01',
                            ativo: true,
                            tempoMandato: '-',
                            participacoes: apiDir.totalVotos || 0,
                            relatorias: 0,
                            favoravel: apiDir.votosFavor || 0,
                            desfavoravel: apiDir.votosContra || 0,
                            vista: 0,
                            relator: 0,
                            acompanhou: apiDir.votosFavor || 0,
                            divergente: apiDir.votosContra || 0,
                            nominal: 0,
                            colegiado: apiDir.totalVotos || 0,
                            taxaDeferimento: apiDir.taxaDeferimento || 0,
                            temasOrdenados: apiDir.temasOrdenados || [],
                            votosPleitoExterno: apiDir.votosPleitoExterno || 0,
                            votosPautaInterna: apiDir.votosPautaInterna || 0,
                            percentualPleitoExterno: apiDir.percentualPleitoExterno || 0,
                            votosDeferido: apiDir.votosDeferido || 0,
                            votosIndeferido: apiDir.votosIndeferido || 0
                        });
                    }
                });

                console.log('[Jurimetria] Diretores carregados:', this.diretores.length);
                console.log('[Jurimetria] Metricas API:', this.metricasAPI);
            } catch (error) {
                console.error('[Jurimetria] Erro ao carregar metricas:', error);
                // Fallback para dados estaticos zerados
                this.diretores = this.diretoresBase.map(base => ({
                    ...base,
                    tempoMandato: '0 anos e 0 meses',
                    participacoes: 0,
                    relatorias: 0,
                    favoravel: 0,
                    desfavoravel: 0,
                    vista: 0,
                    relator: 0,
                    acompanhou: 0,
                    divergente: 0,
                    nominal: 0,
                    colegiado: 0,
                    taxaDeferimento: 0,
                    temasOrdenados: []
                }));
            }
        },

        setupTabs() {
            const tabBtns = document.querySelectorAll('#page-jurimetria .tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabId = e.target.dataset.tab;
                    this.switchTab(tabId);
                });
            });
        },

        switchTab(tabId) {
            // Update buttons
            document.querySelectorAll('#page-jurimetria .tab-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tab === tabId) {
                    btn.classList.add('active');
                }
            });

            // Update content
            document.querySelectorAll('#page-jurimetria .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const tabContent = document.getElementById('tab-' + tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }

            this.currentTab = tabId;
        },

        renderMandatos() {
            const grid = document.getElementById('mandatos-grid');
            if (!grid) return;

            grid.innerHTML = this.diretores.map(d => {
                const topTemas = (d.temasOrdenados || []).slice(0, 2).map(t => t.tema).join(', ') || 'N/A';

                return `
                <div class="mandato-card">
                    <div class="mandato-header">
                        <div class="mandato-avatar">${d.iniciais}</div>
                        <div class="mandato-info">
                            <div class="mandato-name">${d.nome}</div>
                            <div class="mandato-role">${d.cargo}</div>
                            <span class="mandato-status ${d.ativo ? 'active' : 'inactive'}">${d.ativo ? 'Em Exercício' : 'Encerrado'}</span>
                        </div>
                    </div>
                    <div class="mandato-body">
                        <div class="mandato-stat">
                            <div class="mandato-stat-value">${d.participacoes}</div>
                            <div class="mandato-stat-label">Participacoes</div>
                        </div>
                        <div class="mandato-stat">
                            <div class="mandato-stat-value">${d.taxaDeferimento || 0}%</div>
                            <div class="mandato-stat-label">Taxa Deferimento</div>
                        </div>
                        <div class="mandato-progress">
                            <div class="mandato-progress-label">
                                <span>Votos a Favor</span>
                                <span>${d.favoravel} de ${d.participacoes}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill success" style="width: ${d.participacoes > 0 ? (d.favoravel / d.participacoes * 100) : 0}%;"></div>
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary);">
                            Temas: ${topTemas}
                        </div>
                    </div>
                </div>
            `}).join('');
        },

        renderGantt() {
            const container = document.getElementById('gantt-chart');
            if (!container) return;

            const data = this.agenciasData[this.selectedAgency];
            if (!data) return;

            const startYear = 2019;
            const endYear = 2031;
            const totalMonths = (endYear - startYear) * 12;

            container.innerHTML = data.diretores.map(d => {
                const startDate = new Date(d.inicio);
                const endDate = new Date(d.termino);
                const startOffset = ((startDate.getFullYear() - startYear) * 12 + startDate.getMonth()) / totalMonths * 100;
                const durationMonths = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);
                const duration = durationMonths / totalMonths * 100;
                const barClass = d.ativo ? '' : 'ended';

                return `<div class="gantt-row">
                    <div class="gantt-label">${d.nome.split(' ').slice(0, 2).join(' ')}</div>
                    <div class="gantt-bars">
                        <div class="gantt-bar ${barClass}" style="left: ${Math.max(0, startOffset)}%; width: ${Math.min(duration, 100 - startOffset)}%; background: ${data.cor};">
                            ${d.cargo.split(' ')[0]}
                        </div>
                    </div>
                </div>`;
            }).join('');
        },

        renderVotingMatrix() {
            const tbody = document.getElementById('voting-matrix-body');
            if (!tbody) return;

            tbody.innerHTML = this.diretores.map(d => `
                <tr>
                    <td>${d.nome}</td>
                    <td><span class="vote-badge favorable">${d.favoravel}</span></td>
                    <td>${d.desfavoravel}</td>
                    <td>${d.vista}</td>
                    <td>${d.relator}</td>
                    <td><span class="vote-badge acompanhou">${d.votosDeferido || 0}</span></td>
                    <td>${d.votosIndeferido || 0}</td>
                    <td>${d.votosPleitoExterno || 0}</td>
                    <td><span class="vote-badge colegiado">${d.colegiado}</span></td>
                    <td><strong>${d.participacoes}</strong></td>
                </tr>
            `).join('');
        },

        renderParticipationList() {
            const list = document.getElementById('participation-list');
            if (!list) return;

            const sortedDiretores = [...this.diretores].sort((a, b) => b.participacoes - a.participacoes);

            list.innerHTML = sortedDiretores.map((d, i) => `
                <div class="participation-item">
                    <div style="display: flex; align-items: center;">
                        <div class="participation-rank">${i + 1}</div>
                        <div class="participation-info">
                            <div class="participation-name">${d.nome}</div>
                            <div class="participation-count">${d.participacoes} participações</div>
                        </div>
                    </div>
                    <span class="participation-badge">${d.relatorias} relatorias</span>
                </div>
            `).join('');
        },

        renderDirectorSelector() {
            const list = document.getElementById('director-selector-list');
            if (!list) return;

            list.innerHTML = this.diretores.map((d, i) => `
                <div class="director-option ${i === this.selectedDirector ? 'active' : ''}" data-index="${i}" onclick="App.PageJurimetria.selectDirector(${i})">
                    <div class="director-option-info">
                        <div class="director-option-name">${d.nome}</div>
                        <div class="director-option-stats">${d.participacoes} participações colegiadas</div>
                    </div>
                    <span class="director-option-badge">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Colegiado
                    </span>
                </div>
            `).join('');
        },

        selectDirector(index) {
            this.selectedDirector = index;

            // Update selector UI
            document.querySelectorAll('.director-option').forEach((el, i) => {
                el.classList.toggle('active', i === index);
            });

            this.renderDirectorProfile();
        },

        renderDirectorProfile() {
            const container = document.getElementById('director-profile');
            if (!container) return;

            const d = this.diretores[this.selectedDirector];
            if (!d) return;

            const inicioDate = new Date(d.inicio);
            const inicioFormatted = inicioDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const topTemas = (d.temasOrdenados || []).slice(0, 3).map(t => `<span class="badge badge-tema">${t.tema} (${t.count})</span>`).join(' ') || '<span style="color: var(--text-secondary);">Nenhum tema identificado</span>';

            container.innerHTML = `
                <div class="profile-header">
                    <div class="profile-avatar">${d.iniciais}</div>
                    <div class="profile-info">
                        <div class="profile-name">${d.nome}</div>
                        <div class="profile-role">${d.cargo}</div>
                        <span class="profile-status">${d.ativo ? 'Em Exercício' : 'Encerrado'}</span>
                    </div>
                </div>

                <div class="profile-metrics">
                    <div class="profile-metric">
                        <div class="profile-metric-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div class="profile-metric-label">Inicio</div>
                        <div class="profile-metric-value">${inicioFormatted}</div>
                    </div>
                    <div class="profile-metric">
                        <div class="profile-metric-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div class="profile-metric-label">Taxa Deferimento</div>
                        <div class="profile-metric-value" style="color: var(--success);">${d.taxaDeferimento || 0}%</div>
                    </div>
                    <div class="profile-metric">
                        <div class="profile-metric-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                        <div class="profile-metric-label">Participacoes</div>
                        <div class="profile-metric-value">${d.participacoes}</div>
                    </div>
                    <div class="profile-metric">
                        <div class="profile-metric-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                        <div class="profile-metric-label">% Pleito Externo</div>
                        <div class="profile-metric-value">${d.percentualPleitoExterno || 0}%</div>
                    </div>
                </div>

                <div class="profile-alert" style="background: rgba(249, 115, 22, 0.1); border-left: 3px solid var(--accent);">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p>Dados extraídos automaticamente dos PDFs processados. Os valores refletem a <strong>participação institucional</strong> identificada nas deliberações analisadas.</p>
                </div>

                <div class="profile-tabs">
                    <button class="profile-tab active" onclick="App.PageJurimetria.switchProfileTab(this, 'juridico')">Métricas</button>
                    <button class="profile-tab" onclick="App.PageJurimetria.switchProfileTab(this, 'historico')">Temas</button>
                    <button class="profile-tab" onclick="App.PageJurimetria.switchProfileTab(this, 'tendencias')">Decisões</button>
                </div>

                <div class="profile-content" id="profile-tab-content">
                    <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Metricas de Participacao
                    </h4>

                    <div class="participation-stats">
                        <div class="participation-stat-card">
                            <div class="participation-stat-value" style="color: var(--success);">${d.votosDeferido || 0}</div>
                            <div class="participation-stat-label">Deferidos</div>
                        </div>
                        <div class="participation-stat-card">
                            <div class="participation-stat-value" style="color: var(--danger);">${d.votosIndeferido || 0}</div>
                            <div class="participation-stat-label">Indeferidos</div>
                        </div>
                        <div class="participation-stat-card">
                            <div class="participation-stat-value">${d.votosPleitoExterno || 0}</div>
                            <div class="participation-stat-label">Pleitos Externos</div>
                        </div>
                        <div class="participation-stat-card">
                            <div class="participation-stat-value">${d.votosPautaInterna || 0}</div>
                            <div class="participation-stat-label">Pauta Interna</div>
                        </div>
                    </div>

                    <div style="margin-top: 20px;">
                        <h5 style="margin-bottom: 12px; color: var(--text-secondary);">Distribuicao de Votos</h5>
                        <div class="progress-bar" style="height: 24px; margin-bottom: 8px;">
                            <div class="progress-fill success" style="width: ${d.participacoes > 0 ? (d.favoravel / d.participacoes * 100) : 0}%;">
                                A Favor: ${d.favoravel}
                            </div>
                        </div>
                        <div class="progress-bar" style="height: 24px;">
                            <div class="progress-fill" style="width: ${d.participacoes > 0 ? (d.desfavoravel / d.participacoes * 100) : 0}%; background: var(--danger);">
                                Contra: ${d.desfavoravel}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        switchProfileTab(btn, tab) {
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');

            const d = this.diretores[this.selectedDirector];
            if (!d) return;

            const content = document.getElementById('profile-tab-content');

            if (tab === 'juridico') {
                content.innerHTML = `
                    <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Metricas de Participacao
                    </h4>

                    <div class="participation-stats">
                        <div class="participation-stat-card">
                            <div class="participation-stat-value" style="color: var(--success);">${d.votosDeferido || 0}</div>
                            <div class="participation-stat-label">Deferidos</div>
                        </div>
                        <div class="participation-stat-card">
                            <div class="participation-stat-value" style="color: var(--danger);">${d.votosIndeferido || 0}</div>
                            <div class="participation-stat-label">Indeferidos</div>
                        </div>
                        <div class="participation-stat-card">
                            <div class="participation-stat-value">${d.votosPleitoExterno || 0}</div>
                            <div class="participation-stat-label">Pleitos Externos</div>
                        </div>
                        <div class="participation-stat-card">
                            <div class="participation-stat-value">${d.votosPautaInterna || 0}</div>
                            <div class="participation-stat-label">Pauta Interna</div>
                        </div>
                    </div>

                    <div style="margin-top: 20px;">
                        <h5 style="margin-bottom: 12px; color: var(--text-secondary);">Distribuicao de Votos</h5>
                        <div class="progress-bar" style="height: 24px; margin-bottom: 8px;">
                            <div class="progress-fill success" style="width: ${d.participacoes > 0 ? (d.favoravel / d.participacoes * 100) : 0}%;">
                                A Favor: ${d.favoravel}
                            </div>
                        </div>
                        <div class="progress-bar" style="height: 24px;">
                            <div class="progress-fill" style="width: ${d.participacoes > 0 ? (d.desfavoravel / d.participacoes * 100) : 0}%; background: var(--danger);">
                                Contra: ${d.desfavoravel}
                            </div>
                        </div>
                    </div>
                `;
            } else if (tab === 'historico') {
                const temasHtml = (d.temasOrdenados || []).length > 0
                    ? (d.temasOrdenados || []).map(t => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-card); border-radius: 8px; margin-bottom: 8px;">
                            <span style="font-weight: 500;">${t.tema}</span>
                            <span class="badge badge-externo">${t.count} deliberações</span>
                        </div>
                    `).join('')
                    : '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum tema identificado nas deliberações deste diretor.</div>';

                content.innerHTML = `
                    <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        Temas das Deliberações
                    </h4>

                    ${temasHtml}
                `;
            } else if (tab === 'tendencias') {
                const totalDecisoes = (d.votosDeferido || 0) + (d.votosIndeferido || 0);
                const taxaDef = totalDecisoes > 0 ? Math.round((d.votosDeferido / totalDecisoes) * 100) : 0;
                const taxaInd = totalDecisoes > 0 ? Math.round((d.votosIndeferido / totalDecisoes) * 100) : 0;

                content.innerHTML = `
                    <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Decisoes
                    </h4>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div style="background: rgba(74, 222, 128, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--success);">${taxaDef}%</div>
                            <div style="color: var(--text-secondary); margin-top: 4px;">Taxa de Deferimento</div>
                            <div style="font-size: 0.9rem; margin-top: 8px;">${d.votosDeferido || 0} decisões deferidas</div>
                        </div>
                        <div style="background: rgba(248, 113, 113, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--danger);">${taxaInd}%</div>
                            <div style="color: var(--text-secondary); margin-top: 4px;">Taxa de Indeferimento</div>
                            <div style="font-size: 0.9rem; margin-top: 8px;">${d.votosIndeferido || 0} decisões indeferidas</div>
                        </div>
                    </div>

                    <div style="background: var(--bg-card); border-radius: 12px; padding: 16px;">
                        <h5 style="margin-bottom: 12px;">Resumo</h5>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                            <div>
                                <span style="color: var(--text-secondary);">Total Participacoes:</span>
                                <strong style="float: right;">${d.participacoes}</strong>
                            </div>
                            <div>
                                <span style="color: var(--text-secondary);">Votos a Favor:</span>
                                <strong style="float: right; color: var(--success);">${d.favoravel}</strong>
                            </div>
                            <div>
                                <span style="color: var(--text-secondary);">Votos Contra:</span>
                                <strong style="float: right; color: var(--danger);">${d.desfavoravel}</strong>
                            </div>
                            <div>
                                <span style="color: var(--text-secondary);">Temas Atuados:</span>
                                <strong style="float: right;">${(d.temasOrdenados || []).length}</strong>
                            </div>
                        </div>
                    </div>
                    </div>
                `;
            }
        }
    };

    // ============================================
    // PAGE: Governanca
    // ============================================
    const PageGovernanca = {
        async init() {
            const page = document.getElementById('page-governanca');
            page.classList.add('active');
            await this.loadData();
        },

        async loadData() {
            try {
                const data = await API.get('/api/metricas/resumo');
                if (data && data.totalDeliberacoes > 0) {
                    this.renderFromAPI(data);
                    setDataMode('page-governanca', true);
                }
            } catch (err) {
                console.warn('[Governanca] API indisponivel:', err.message);
            }
        },

        renderFromAPI(data) {
            // Update governance stats cards with real computed data
            const page = document.getElementById('page-governanca');
            if (!page) return;

            const cards = page.querySelectorAll('.stat-card-value');
            // Indice de Governanca: based on taxaDeferimento as a proxy
            if (cards[0]) cards[0].textContent = data.taxaDeferimento || 0;
            // Transparencia: % of PDFs analyzed
            if (cards[1]) cards[1].textContent = (data.percentualClassificado || 0) + '%';
            // Previsibilidade: based on consistency (deferimento rate)
            if (cards[2]) cards[2].textContent = Math.min(data.taxaDeferimento + 10, 100) + '%';

            // Update "Taxa de Unanimidade" and "Tempo Medio" inline stats if present
            const inlineStats = page.querySelectorAll('[style*="font-size: 24px"]');
            if (inlineStats[1]) inlineStats[1].textContent = data.taxaDeferimento + '%';
        }
    };

    // ============================================
    // PAGE: Metricas (Dashboard)
    // ============================================
    const PageMetricas = {
        _data: null,

        async init() {
            const page = document.getElementById('page-metricas');
            if (page) page.classList.add('active');

            // Check Supabase connection status
            this.checkSupabaseStatus();

            // Try fetching live data, fall back to DOM-based stats
            let usingReal = false;
            try {
                const data = await API.get('/api/metricas/exportar');
                if (data && data.totalDeliberacoes > 0) {
                    this._data = data;
                    this._applyData(data);
                    usingReal = true;
                } else {
                    this._data = this._readFromDOM();
                }
            } catch (e) {
                console.warn('PageMetricas: API indisponivel, usando dados do DOM');
                this._data = this._readFromDOM();
            }
            setDataMode('page-metricas', usingReal);

            this.animateCounters();
            this.renderBarChart();
            this._loadDiretoresTable();
            this._loadInstitucional();
            this._loadCompetitivo();
        },

        async checkSupabaseStatus() {
            const bar = document.getElementById('supabase-status-bar');
            const text = document.getElementById('supabase-status-text');
            if (!bar || !text) return;

            bar.style.display = 'flex';
            text.textContent = 'Verificando conexao Supabase...';

            // Retry up to 3 times with increasing delay (server may still be starting)
            const maxRetries = 3;
            const delays = [2000, 3000, 5000];

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 10000);

                    const resp = await fetch('/api/supabase/status', { signal: controller.signal });
                    clearTimeout(timeout);

                    if (!resp.ok) throw new Error('HTTP ' + resp.status);

                    const data = await resp.json();
                    if (data.connected) {
                        bar.classList.add('connected');
                        bar.classList.remove('disconnected');
                        text.textContent = 'Supabase conectado — dados sincronizados';
                        setTimeout(() => { bar.style.display = 'none'; }, 4000);
                        return;
                    } else {
                        bar.classList.add('disconnected');
                        bar.classList.remove('connected');
                        const msg = data.message || 'Supabase nao configurado';
                        const envInfo = data.env
                            ? ' (URL: ' + (data.env.url_set ? 'OK' : 'falta') + ', Key: ' + (data.env.anon_key_set ? 'OK' : 'falta') + ')'
                            : '';
                        text.textContent = msg + envInfo;
                        return;
                    }
                } catch (e) {
                    if (attempt < maxRetries - 1) {
                        text.textContent = 'Verificando conexao... (tentativa ' + (attempt + 2) + '/' + maxRetries + ')';
                        await new Promise(function(r) { setTimeout(r, delays[attempt]); });
                    } else {
                        bar.classList.add('disconnected');
                        const reason = e.name === 'AbortError' ? 'timeout' : e.message;
                        text.textContent = 'Dados locais em uso — servidor nao respondeu (' + reason + '). Verifique se o servidor esta rodando.';
                    }
                }
            }
        },

        /** Read stat values directly from the HTML elements */
        _readFromDOM() {
            const val = (id) => {
                const el = document.getElementById(id);
                return el ? el.textContent.trim() : '0';
            };
            return {
                totalDelib: val('metricas-total-delib'),
                pleitoExterno: val('metricas-pleito-externo'),
                taxaAprovacao: val('metricas-taxa-aprovacao'),
                totalReunioes: val('metricas-total-reunioes')
            };
        },

        /** Apply fetched data to the stat cards */
        _applyData(data) {
            const map = {
                'metricas-total-delib': data.totalDelib ?? data.total_deliberacoes,
                'metricas-pleito-externo': data.pleitoExterno ?? data.pleito_externo,
                'metricas-taxa-aprovacao': data.taxaAprovacao ?? data.taxa_aprovacao,
                'metricas-total-reunioes': data.totalReunioes ?? data.total_reunioes
            };
            Object.entries(map).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el && value !== undefined) {
                    el.textContent = value;
                }
            });
        },

        /** Animate stat card numbers counting up from 0 */
        animateCounters() {
            const ids = [
                'metricas-total-delib',
                'metricas-pleito-externo',
                'metricas-taxa-aprovacao',
                'metricas-total-reunioes'
            ];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                const raw = el.textContent.trim();
                const isPercent = raw.includes('%');
                const target = parseFloat(raw.replace('%', '').replace(',', '.')) || 0;
                const duration = 1200;
                const startTime = performance.now();
                el.textContent = isPercent ? '0%' : '0';

                const step = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // easeOutCubic
                    const ease = 1 - Math.pow(1 - progress, 3);
                    const current = target * ease;
                    if (isPercent) {
                        el.textContent = (target % 1 !== 0 ? current.toFixed(1) : Math.round(current)) + '%';
                    } else {
                        el.textContent = Math.round(current);
                    }
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        el.textContent = raw; // restore exact original text
                    }
                };
                requestAnimationFrame(step);
            });
        },

        /** Re-render bar chart dynamically from its data or from DOM items */
        renderBarChart() {
            const chartEl = document.querySelector('#page-metricas .bar-chart');
            if (!chartEl) return;
            const items = chartEl.querySelectorAll('.bar-item');
            if (!items.length) return;

            // Read existing data
            const data = [];
            items.forEach(item => {
                const label = item.querySelector('.bar-label')?.textContent.trim() || '';
                const value = parseInt(item.querySelector('.bar-value')?.textContent.trim(), 10) || 0;
                data.push({ label, value });
            });

            // Sort descending
            data.sort((a, b) => b.value - a.value);
            const max = data[0]?.value || 1;

            // Rebuild with animation
            chartEl.innerHTML = '';
            data.forEach((d, i) => {
                const pct = Math.round((d.value / max) * 100);
                const item = document.createElement('div');
                item.className = 'bar-item';
                item.innerHTML =
                    '<span class="bar-label">' + d.label + '</span>' +
                    '<div class="bar-track"><div class="bar-fill" style="width: 0%; transition: width 0.8s cubic-bezier(.4,0,.2,1) ' + (i * 0.08) + 's;"></div></div>' +
                    '<span class="bar-value">' + d.value + '</span>';
                chartEl.appendChild(item);
                // Trigger animation after append
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        item.querySelector('.bar-fill').style.width = pct + '%';
                    });
                });
            });
        },

        async exportar() {
            const data = await API.get('/api/metricas/exportar');
            if (data) {
                Utils.exportJSON(data, 'iris_metricas_' + new Date().toISOString().split('T')[0] + '.json');
            }
        },

        async _loadDiretoresTable() {
            const agencia = document.getElementById('dashboard-filtro-agencia')?.value || 'ARTESP';
            try {
                const data = await API.get('/api/metricas/por-diretor?agencia=' + agencia);
                const tbody = document.getElementById('metricas-diretores-tbody');
                if (!tbody) return;
                const rows = data?.por_diretor || data?.diretores || [];
                if (rows.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:24px;">Sem dados de diretores</td></tr>';
                    return;
                }
                tbody.innerHTML = rows.slice(0, 10).map(d => {
                    const total = (d.total_votos || d.participacoes || 0);
                    const fav = d.favoraveis || d.FAVORABLE || 0;
                    const contra = d.contrarios || d.AGAINST || 0;
                    const taxa = fav + contra > 0 ? ((fav / (fav + contra)) * 100).toFixed(1) : '–';
                    return `<tr>
                        <td><strong>${d.nome || d.diretor || '–'}</strong></td>
                        <td style="color:var(--text-secondary);font-size:12px;">${d.cargo || '–'}</td>
                        <td><strong>${total}</strong></td>
                        <td><span class="badge badge-success">${fav}</span></td>
                        <td><span class="badge badge-danger">${contra}</span></td>
                        <td><strong style="color:var(--success);">${taxa !== '–' ? taxa + '%' : '–'}</strong></td>
                    </tr>`;
                }).join('');

                // Populate director selector for detail view
                const sel = document.getElementById('metricas-diretor-select');
                if (sel && sel.options.length === 1) {
                    rows.forEach(d => {
                        const opt = document.createElement('option');
                        opt.value = d.nome || d.diretor || '';
                        opt.textContent = d.nome || d.diretor || '';
                        sel.appendChild(opt);
                    });
                }
            } catch(e) { /* silently fail */ }
        },

        async carregarDiretor(nome) {
            if (!nome) return;
            const container = document.getElementById('metricas-diretor-detalhe');
            if (!container) return;
            container.innerHTML = '<div style="text-align:center;padding:32px;"><div class="spinner" style="margin:0 auto;display:block;"></div></div>';

            try {
                const agencia = document.getElementById('dashboard-filtro-agencia')?.value || 'ARTESP';
                const data = await API.get('/api/metricas/diretor-detalhe?nome=' + encodeURIComponent(nome) + '&agencia=' + agencia);
                if (!data || data.error) {
                    container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:32px;">Dados não encontrados para este diretor</div>';
                    return;
                }
                const m = data.metricas || {};
                const temas = (data.top_temas || []).map(t =>
                    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="font-size:12px;color:var(--text-secondary);min-width:160px;">${t.tema}</span>
                        <div style="flex:1;height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden;">
                            <div style="height:100%;background:var(--primary);border-radius:3px;width:${Math.round((t.total/((data.top_temas[0]?.total)||1))*100)}%;"></div>
                        </div>
                        <span style="font-size:12px;font-weight:600;">${t.total}</span>
                    </div>`
                ).join('');

                container.innerHTML = `
                    <div class="stats-grid" style="margin-bottom:20px;">
                        <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Total Votos</span></div><div class="stat-card-value">${m.total_votos||0}</div></div>
                        <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Pleitos Externos</span></div><div class="stat-card-value primary">${m.pct_externos||0}%</div><div class="stat-card-subtitle">${m.votos_externos||0} votos</div></div>
                        <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Taxa Deferimento</span></div><div class="stat-card-value success">${m.taxa_deferimento||0}%</div></div>
                        <div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Votos Divergentes</span></div><div class="stat-card-value danger">${m.total_divergentes||0}</div></div>
                    </div>
                    <div class="grid-2">
                        <div><h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">Top 5 Temas</h4>${temas || '<div style="color:var(--text-secondary);font-size:12px;">Sem dados de temas</div>'}</div>
                        <div><h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">Tendência Mensal</h4>
                        <div id="inst-tendencia-chart" style="font-size:12px;color:var(--text-secondary);">
                        ${(data.tendencia_mensal||[]).slice(-6).map(t =>
                            `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);">
                                <span>${t.mes}</span>
                                <span style="color:var(--success);">+${t.favoravel||0}</span>
                                <span style="color:var(--danger);">-${t.contra||0}</span>
                            </div>`
                        ).join('') || 'Sem dados de tendência'}
                        </div></div>
                    </div>`;
            } catch(e) {
                container.innerHTML = '<div style="color:var(--danger);padding:16px;">Erro ao carregar dados do diretor</div>';
            }
        },

        async _loadInstitucional() {
            try {
                const agencia = document.getElementById('dashboard-filtro-agencia')?.value || 'ARTESP';
                const data = await API.get('/api/metricas/institucional?agencia=' + agencia);
                if (!data) return;
                const r = data.resumo || {};

                const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
                const reunioesPorAno = data.reunioes_por_ano || [];
                set('inst-total-reunioes', reunioesPorAno.reduce((s, a) => s + a.total_reunioes, 0));
                set('inst-intervalo', r.intervalo_medio_dias || '–');
                set('inst-pct-interna', (r.pct_interna || 0) + '%');
                set('inst-atos', r.atos_normativos || 0);

                // Render bar chart for reunioes por ano
                const chartEl = document.getElementById('inst-reunioes-chart');
                if (chartEl && reunioesPorAno.length > 0) {
                    const max = Math.max(...reunioesPorAno.map(a => a.total_reunioes));
                    chartEl.innerHTML = reunioesPorAno.map(a => `
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span style="min-width:40px;font-size:12px;color:var(--text-secondary);">${a.ano}</span>
                            <div style="flex:1;height:18px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">
                                <div style="height:100%;background:var(--primary);border-radius:3px;width:${Math.round((a.total_reunioes/max)*100)}%;transition:width .6s;"></div>
                            </div>
                            <span style="font-size:12px;font-weight:600;min-width:20px;">${a.total_reunioes}</span>
                        </div>`).join('');
                }

                // Render stacked bar for pauta por ano
                const pautaEl = document.getElementById('inst-pauta-chart');
                if (pautaEl && reunioesPorAno.length > 0) {
                    pautaEl.innerHTML = reunioesPorAno.map(a => {
                        const total = (a.pauta_interna || 0) + (a.pauta_externa || 0);
                        const pctInt = total > 0 ? Math.round((a.pauta_interna / total) * 100) : 0;
                        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span style="min-width:40px;font-size:12px;color:var(--text-secondary);">${a.ano}</span>
                            <div style="flex:1;height:18px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;display:flex;">
                                <div style="height:100%;background:#8b5cf6;width:${pctInt}%;"></div>
                                <div style="height:100%;background:#06b6d4;width:${100 - pctInt}%;"></div>
                            </div>
                            <span style="font-size:11px;color:var(--text-secondary);">${pctInt}% int.</span>
                        </div>`;
                    }).join('');
                }
            } catch(e) { /* silently fail */ }
        },

        async _loadCompetitivo() {
            try {
                const agencia = document.getElementById('dashboard-filtro-agencia')?.value || 'ARTESP';
                const data = await API.get('/api/diretores?agencia=' + agencia);
                const tbody = document.getElementById('competitivo-tbody');
                if (!tbody) return;
                const diretores = data?.diretores || [];
                if (diretores.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:32px;">Nenhum diretor encontrado</td></tr>';
                    return;
                }
                tbody.innerHTML = diretores.map(d => {
                    const v = d.votos || {};
                    const total = d.participacoes || 0;
                    const fav = v.FAVORABLE || 0;
                    const taxa = fav + (v.AGAINST || 0) > 0 ? Math.round((fav / (fav + (v.AGAINST || 0))) * 100) : '–';
                    return `<tr>
                        <td><strong>${d.nome || '–'}</strong><br><span style="font-size:11px;color:var(--text-secondary);">${d.cargo || ''}</span></td>
                        <td style="font-size:12px;">${d.agencia || agencia}</td>
                        <td style="color:var(--success);font-weight:600;">${fav}</td>
                        <td style="color:var(--danger);">${v.AGAINST || 0}</td>
                        <td>${v.ABSTENTION || 0}</td>
                        <td>${v.ABSENT || 0}</td>
                        <td>${d.colegiado || 0}</td>
                        <td style="color:var(--warning);">${d.divergente || 0}</td>
                        <td><strong>${total}</strong></td>
                        <td>${taxa !== '–' ? `<strong>${taxa}%</strong>` : '–'}</td>
                    </tr>`;
                }).join('');
            } catch(e) {
                const tbody = document.getElementById('competitivo-tbody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:24px;">Erro ao carregar análise competitiva</td></tr>';
            }
        }
    };

    // ============================================
    // PAGE: Boletim
    // ============================================
    const PageBoletim = {
        _agencyNames: {
            artesp: 'ARTESP',
            aneel: 'ANEEL',
            anatel: 'ANATEL',
            anp: 'ANP',
            anvisa: 'ANVISA',
            anac: 'ANAC',
            antt: 'ANTT',
            antaq: 'ANTAQ',
            ans: 'ANS',
            anm: 'ANM'
        },

        init() {
            const page = document.getElementById('page-boletim');
            if (page) {
                page.classList.add('active');
            }

            // Bind agency selector
            const agencySelect = document.getElementById('boletim-agencia');
            if (agencySelect) {
                agencySelect.addEventListener('change', (e) => {
                    this.switchAgency(e.target.value);
                });
            }
        },

        /** Update boletim title based on selected agency */
        switchAgency(agency) {
            const titleEl = document.getElementById('boletim-titulo');
            if (!titleEl) return;
            const name = this._agencyNames[agency] || agency.toUpperCase();
            const mesSelect = document.getElementById('boletim-mes');
            const anoSelect = document.getElementById('boletim-ano');
            const meses = {
                '01': 'Janeiro', '02': 'Fevereiro', '03': 'Marco',
                '04': 'Abril', '05': 'Maio', '06': 'Junho',
                '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
                '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
            };
            const mes = mesSelect ? (meses[mesSelect.value] || mesSelect.value) : '';
            const ano = anoSelect ? anoSelect.value : '';
            titleEl.textContent = 'Boletim ' + name + ' \u2014 ' + mes + '/' + ano;
        },

        /** Generate boletim with loading state and simulated success */
        gerar() {
            const mes = document.getElementById('boletim-mes')?.value;
            const ano = document.getElementById('boletim-ano')?.value;
            const agencia = document.getElementById('boletim-agencia')?.value || 'artesp';
            const name = this._agencyNames[agencia] || agencia.toUpperCase();

            // Find or create a status element
            let statusEl = document.getElementById('boletim-status');
            if (!statusEl) {
                const mainCard = document.querySelector('.boletim-main-card');
                if (mainCard) {
                    statusEl = document.createElement('div');
                    statusEl.id = 'boletim-status';
                    statusEl.style.cssText = 'padding: 16px 24px; text-align: center; font-size: 14px;';
                    mainCard.appendChild(statusEl);
                }
            }

            if (statusEl) {
                statusEl.style.color = 'var(--primary)';
                statusEl.innerHTML =
                    '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">' +
                    '<div class="spinner" style="width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;"></div>' +
                    'Gerando boletim ' + name + ' para ' + (mes || '') + '/' + (ano || '') + '...' +
                    '</div>';

                // Add spinner keyframes if not present
                if (!document.getElementById('boletim-spinner-style')) {
                    const style = document.createElement('style');
                    style.id = 'boletim-spinner-style';
                    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
                    document.head.appendChild(style);
                }
            }

            // Simulate generation after 2 seconds
            setTimeout(() => {
                if (statusEl) {
                    statusEl.style.color = 'var(--success)';
                    statusEl.innerHTML =
                        '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" style="vertical-align:middle;margin-right:6px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' +
                        'Boletim gerado com sucesso! Pronto para download.';
                    // Auto-clear after 5s
                    setTimeout(() => {
                        if (statusEl) statusEl.innerHTML = '';
                    }, 5000);
                }
            }, 2000);
        },

        imprimir() {
            window.print();
        }
    };

    // ============================================
    // PAGE: Auditoria
    // ============================================
    const PageAuditoria = {
        init() {
            const page = document.getElementById('page-auditoria');
            if (page) {
                page.classList.add('active');
            }

            this.animateMetrics();
            this.renderAlertTimeline();

            // Bind click expand/collapse on alert items
            const alertItems = document.querySelectorAll('#page-auditoria .alert-item-clickable');
            alertItems.forEach(item => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => this.toggleAlertDetails(item));
            });

            // Bind "Executar Auditoria" button
            const auditBtn = document.getElementById('btn-executar-auditoria');
            if (auditBtn) {
                auditBtn.addEventListener('click', () => this.runAudit());
            }
        },

        /** Animate the stat card values counting up from 0 */
        animateMetrics() {
            const ids = [
                'auditoria-criticos',
                'auditoria-medios',
                'auditoria-analisadas',
                'auditoria-conformidade'
            ];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                const raw = el.textContent.trim();
                const isPercent = raw.includes('%');
                const target = parseFloat(raw.replace('%', '').replace(',', '.')) || 0;
                const duration = 1000;
                const startTime = performance.now();
                el.textContent = isPercent ? '0%' : '0';

                const step = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const ease = 1 - Math.pow(1 - progress, 3);
                    const current = target * ease;
                    if (isPercent) {
                        el.textContent = (target % 1 !== 0 ? current.toFixed(1) : Math.round(current)) + '%';
                    } else {
                        el.textContent = Math.round(current);
                    }
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        el.textContent = raw;
                    }
                };
                requestAnimationFrame(step);
            });
        },

        /** Add relative time ("ha X dias") to alert-meta spans */
        renderAlertTimeline() {
            const alertMetas = document.querySelectorAll('#page-auditoria .alert-meta');
            const now = new Date();
            alertMetas.forEach(meta => {
                const spans = meta.querySelectorAll('span');
                spans.forEach(span => {
                    const text = span.textContent.trim();
                    const match = text.match(/^Detectado:\s*(\d{2})\/(\d{2})\/(\d{4})$/);
                    if (match) {
                        const day = parseInt(match[1], 10);
                        const month = parseInt(match[2], 10) - 1;
                        const year = parseInt(match[3], 10);
                        const detected = new Date(year, month, day);
                        const diffMs = now - detected;
                        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                        let relative;
                        if (diffDays === 0) {
                            relative = 'hoje';
                        } else if (diffDays === 1) {
                            relative = 'ha 1 dia';
                        } else {
                            relative = 'ha ' + diffDays + ' dias';
                        }
                        span.textContent = text + ' (' + relative + ')';
                    }
                });
            });
        },

        /** Expand or collapse alert details on click */
        toggleAlertDetails(el) {
            const body = el.querySelector('.alert-body');
            if (!body) return;
            const isCollapsed = body.style.display === 'none';
            if (isCollapsed) {
                body.style.display = '';
                body.style.maxHeight = body.scrollHeight + 'px';
                body.style.opacity = '1';
                el.classList.remove('collapsed');
            } else {
                body.style.display = 'none';
                body.style.maxHeight = '0';
                body.style.opacity = '0';
                el.classList.add('collapsed');
            }
        },

        /** Simulate running an audit with a progress bar */
        runAudit() {
            const page = document.getElementById('page-auditoria');
            if (!page) return;

            // Prevent double-run
            if (document.getElementById('audit-progress-container')) return;

            const container = document.createElement('div');
            container.id = 'audit-progress-container';
            container.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;padding:0;';

            const bar = document.createElement('div');
            bar.id = 'audit-progress-bar';
            bar.style.cssText = 'height:4px;background:var(--primary);width:0%;transition:width 0.3s ease;border-radius:0 2px 2px 0;';
            container.appendChild(bar);

            // Status banner below the bar
            const banner = document.createElement('div');
            banner.style.cssText = 'background:var(--card-bg);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;gap:10px;font-size:14px;color:var(--text-secondary);';
            banner.innerHTML =
                '<div class="spinner" style="width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;"></div>' +
                '<span id="audit-status-text">Iniciando auditoria forense...</span>';
            container.appendChild(banner);

            // Spinner keyframes
            if (!document.getElementById('audit-spinner-style')) {
                const style = document.createElement('style');
                style.id = 'audit-spinner-style';
                style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
                document.head.appendChild(style);
            }

            document.body.appendChild(container);

            const statusText = document.getElementById('audit-status-text');
            const steps = [
                { pct: 15, text: 'Coletando dados de deliberacoes...' },
                { pct: 35, text: 'Analisando padroes de votacao...' },
                { pct: 55, text: 'Verificando concentracao de relatorias...' },
                { pct: 75, text: 'Calculando indices de conformidade...' },
                { pct: 90, text: 'Gerando relatorio de anomalias...' },
                { pct: 100, text: 'Auditoria concluida com sucesso!' }
            ];

            let stepIndex = 0;
            const interval = setInterval(() => {
                if (stepIndex < steps.length) {
                    bar.style.width = steps[stepIndex].pct + '%';
                    if (statusText) statusText.textContent = steps[stepIndex].text;
                    stepIndex++;
                } else {
                    clearInterval(interval);
                    // Show completion state
                    bar.style.background = 'var(--success)';
                    banner.querySelector('.spinner')?.remove();
                    banner.style.color = 'var(--success)';
                    // Remove after 3 seconds
                    setTimeout(() => {
                        container.remove();
                    }, 3000);
                }
            }, 600);
        }
    };

    // ============================================
    // PAGE: Grafo de Vinculos — removido
    // ============================================
    const PageGrafo = { init() {}, destroy() {} };

    // ============================================
    // PAGE: Monitoramento 24/7
    // ============================================
    const PageMonitoramento = {
        _polling: null,

        async init() {
            const page = document.getElementById('page-monitoramento');
            page.classList.add('active');
            await this.loadRealStatus();
            await this.loadNovosDocumentos();
            // Start polling every 60 seconds
            this._polling = setInterval(() => this.loadRealStatus(), 60000);
        },

        destroy() {
            if (this._polling) { clearInterval(this._polling); this._polling = null; }
        },

        async loadRealStatus() {
            try {
                const response = await fetch('/api/monitoramento/status');
                const data = await response.json();

                const elemento = document.getElementById('monitor-ultima');
                if (elemento && data.ultimaVerificacao) {
                    const diff = Math.round((Date.now() - new Date(data.ultimaVerificacao).getTime()) / 60000);
                    elemento.textContent = diff < 1 ? 'agora' : `ha ${diff} min`;
                } else if (elemento) {
                    elemento.textContent = 'nunca';
                }

                const statusEl = document.getElementById('monitor-status');
                if (statusEl) {
                    statusEl.textContent = data.ativo ? 'Ativo' : 'Inativo';
                    statusEl.className = data.ativo ? 'stat-card-value success' : 'stat-card-value danger';
                }

                // Update entidades count
                const entEl = document.getElementById('monitor-entidades');
                if (entEl) entEl.textContent = data.documentosConhecidos || 0;

                // Update pending alerts count
                const pendEl = document.getElementById('monitor-pendentes');
                if (pendEl) pendEl.textContent = data.novosDocumentos || 0;

                if (data.ativo) {
                    setDataMode('page-monitoramento', true);
                }
            } catch (error) {
                console.warn('[Monitor] API indisponivel:', error.message);
                const elemento = document.getElementById('monitor-ultima');
                if (elemento) elemento.textContent = 'indisponivel';
            }
        },

        async loadNovosDocumentos() {
            try {
                const data = await API.get('/api/monitoramento/novos');
                if (data && data.documentos && data.documentos.length > 0) {
                    const list = document.getElementById('monitor-deliberações');
                    if (list) {
                        list.innerHTML = data.documentos.slice(0, 5).map(doc => `
                            <div class="monitor-item">
                                <div class="monitor-icon">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div class="monitor-content">
                                    <div class="monitor-title">${doc.titulo || doc.link || 'Documento'}</div>
                                    <div class="monitor-meta">${doc.lido ? 'Lido' : 'Novo'} - ${doc.data || ''}</div>
                                </div>
                                <span class="badge ${doc.lido ? 'badge-secondary' : 'badge-primary'}">${doc.lido ? 'Lido' : 'Novo'}</span>
                            </div>
                        `).join('');
                    }
                }
            } catch (err) {
                console.warn('[Monitor] Novos docs indisponivel:', err.message);
            }
        },

        async iniciar() {
            try {
                const data = await API.post('/api/monitoramento/iniciar', {});
                if (data && data.sucesso) {
                    alert('Monitoramento iniciado! Verificacao a cada 30 minutos.');
                    await this.loadRealStatus();
                } else {
                    alert(data?.mensagem || 'Erro ao iniciar');
                }
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        },

        async parar() {
            try {
                const data = await API.post('/api/monitoramento/parar', {});
                if (data && data.sucesso) {
                    alert('Monitoramento parado.');
                    await this.loadRealStatus();
                } else {
                    alert(data?.mensagem || 'Erro ao parar');
                }
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        },

        async verificarAgora() {
            try {
                const data = await API.post('/api/monitoramento/verificar-agora', {});
                if (data) {
                    alert(`Verificacao concluida. ${data.novosEncontrados || 0} novos documentos.`);
                    await this.loadRealStatus();
                    await this.loadNovosDocumentos();
                }
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        },

        async configurar() {
            const acao = prompt('Escolha: 1 = Iniciar, 2 = Parar, 3 = Verificar Agora');
            if (acao === '1') await this.iniciar();
            else if (acao === '2') await this.parar();
            else if (acao === '3') await this.verificarAgora();
        }
    };

    // ============================================
    // PAGE: Dossiês Automáticos — Sherlocker-style
    // ============================================
    const PageDossie = {
        entidades: [],
        dossieAtual: null,

        async init() {
            const page = document.getElementById('page-dossie');
            page.classList.add('active');
            await this.loadEntidades();
        },

        async loadEntidades() {
            try {
                const response = await fetch('/api/dossie-entidades');
                const data = await response.json();
                if (data.success && data.entidades) {
                    this.entidades = data.entidades;
                    this.renderTable();
                    this.updateStats();
                    // Hide demo banner if real data
                    if (data.entidades.length > 1) {
                        const banner = document.querySelector('#page-dossie .demo-banner');
                        if (banner) banner.style.display = 'none';
                    }
                }
            } catch (error) {
                console.warn('[Dossiê] API indisponível:', error.message);
                this.renderEmptyState();
            }
        },

        updateStats() {
            const e = this.entidades;
            document.getElementById('dossie-total').textContent = e.length;
            document.getElementById('dossie-processando').textContent = '0';
            document.getElementById('dossie-empresas').textContent = e.filter(x => x.tipo === 'empresa').length;
            document.getElementById('dossie-diretores').textContent = e.filter(x => x.tipo === 'diretor').length;
        },

        renderTable() {
            const tbody = document.getElementById('dossie-table-body');
            if (!this.entidades.length) { this.renderEmptyState(); return; }
            const tipoBadge = { empresa: 'badge-secondary', diretor: 'badge-primary', agencia: 'badge-warning' };
            const tipoLabel = { empresa: 'Empresa', diretor: 'Diretor', agencia: 'Agência' };
            tbody.innerHTML = this.entidades.slice(0, 30).map(e => `
                <tr>
                    <td><strong>${e.nome}</strong></td>
                    <td><span class="badge ${tipoBadge[e.tipo] || 'badge-secondary'}">${tipoLabel[e.tipo] || e.tipo}</span></td>
                    <td>${e.deliberacoes}</td>
                    <td>--</td>
                    <td>--</td>
                    <td><span class="badge badge-success">Disponível</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="App.PageDossie.visualizar('${e.nome.replace(/'/g,"\\'")}')">Gerar</button>
                        <button class="btn btn-secondary btn-sm" onclick="App.PageDossie.verNoGrafo('${e.nome.replace(/'/g,"\\'")}')">Grafo</button>
                    </td>
                </tr>
            `).join('');
        },

        renderEmptyState() {
            const tbody = document.getElementById('dossie-table-body');
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">
                Nenhuma entidade encontrada. <a href="/upload" data-route="/upload" style="color:var(--primary);text-decoration:underline;">Faça upload de PDFs</a> para gerar dossiês.
            </td></tr>`;
        },

        verNoGrafo(nome) {
            window.location.hash = '#/grafo';
            setTimeout(() => { if(App.PageGrafo) App.PageGrafo.selectEntity(nome); }, 300);
        },

        async visualizar(nome) {
            this.dossieAtual = nome;
            try {
                const response = await fetch(`/api/dossie/${encodeURIComponent(nome)}`);
                const data = await response.json();
                if (data.success) {
                    this.renderDossie(data);
                }
            } catch (error) {
                console.warn('[Dossiê] Erro ao carregar:', error.message);
            }
        },

        // Called from graph's "Dossiê" button
        async loadEntityDossie(nome) {
            await this.loadEntidades();
            await this.visualizar(nome);
        },

        renderDossie(data) {
            const container = document.getElementById('dossie-table-body');
            const tipoLabel = { diretor: 'Diretor(a)', empresa: 'Empresa', agencia: 'Agência' };
            const tipoColor = { diretor: '#60a5fa', empresa: '#fbbf24', agencia: '#a78bfa' };
            const initials = data.entidade.split(' ').filter(w => w.length > 1).map(w => w[0]).join('').substring(0, 2).toUpperCase();

            // Replace entire card body with the dossie view
            const cardBody = container.closest('.card-body');
            let html = `
                <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <button class="btn btn-secondary btn-sm" onclick="App.PageDossie.voltarLista()">← Voltar à lista</button>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-outline btn-sm" onclick="App.PageDossie.verNoGrafo('${data.entidade.replace(/'/g,"\\'")}')">Ver no Grafo</button>
                        <button class="btn btn-primary btn-sm" onclick="App.PageDossie.exportarPDF('${data.entidade.replace(/'/g,"\\'")}')">Exportar PDF</button>
                    </div>
                </div>

                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
                        <div style="width:56px;height:56px;border-radius:50%;background:${tipoColor[data.tipo]}20;border:2px solid ${tipoColor[data.tipo]};display:flex;align-items:center;justify-content:center;font-weight:700;color:${tipoColor[data.tipo]};font-size:18px;flex-shrink:0;">
                            ${initials}
                        </div>
                        <div style="flex:1;">
                            <h3 style="margin:0;font-size:18px;">${data.entidade}</h3>
                            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
                                <span style="padding:2px 10px;border-radius:9999px;background:${tipoColor[data.tipo]}15;color:${tipoColor[data.tipo]};font-size:12px;font-weight:600;">${tipoLabel[data.tipo]}</span>
                                <span style="color:var(--text-muted);font-size:12px;">Gerado em ${new Date(data.geradoEm).toLocaleString('pt-BR')}</span>
                                ${data.resumo.primeiraData ? '<span style="color:var(--text-muted);font-size:12px;">Período: ' + data.resumo.primeiraData + ' — ' + (data.resumo.ultimaData || 'atual') + '</span>' : ''}
                            </div>
                        </div>
                    </div>

                    <div id="dossie-cnpj-data"></div>

                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
                        <div style="background:var(--bg-main);padding:12px;border-radius:8px;text-align:center;">
                            <div style="font-size:22px;font-weight:700;color:var(--primary);">${data.resumo.totalDeliberacoes}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Deliberações</div>
                        </div>
                        <div style="background:var(--bg-main);padding:12px;border-radius:8px;text-align:center;">
                            <div style="font-size:22px;font-weight:700;color:#4ade80;">${data.resumo.deferidos}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Deferidos</div>
                        </div>
                        <div style="background:var(--bg-main);padding:12px;border-radius:8px;text-align:center;">
                            <div style="font-size:22px;font-weight:700;color:#f87171;">${data.resumo.indeferidos}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Indeferidos</div>
                        </div>
                        <div style="background:var(--bg-main);padding:12px;border-radius:8px;text-align:center;">
                            <div style="font-size:22px;font-weight:700;color:#a78bfa;">${data.resumo.totalConexoes}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Conexões</div>
                        </div>
                    </div>
                </div>`;

            // Voting pattern for directors
            if (data.padraoVotos) {
                const pv = data.padraoVotos;
                html += `
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;">
                    <h4 style="margin:0 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Padrão de Votação</h4>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                        <div style="text-align:center;">
                            <div style="font-size:28px;font-weight:700;color:#60a5fa;">${pv.total}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Total de Votos</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:28px;font-weight:700;color:#4ade80;">${pv.aFavor}</div>
                            <div style="font-size:11px;color:var(--text-muted);">A Favor</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:28px;font-weight:700;color:#f87171;">${pv.contra}</div>
                            <div style="font-size:11px;color:var(--text-muted);">Contra</div>
                        </div>
                    </div>
                    <div style="margin-top:12px;background:var(--bg-main);border-radius:6px;overflow:hidden;height:8px;display:flex;">
                        <div style="background:#4ade80;width:${pv.total>0?(pv.aFavor/pv.total*100):50}%;"></div>
                        <div style="background:#f87171;width:${pv.total>0?(pv.contra/pv.total*100):50}%;"></div>
                    </div>
                    <div style="margin-top:8px;font-size:12px;color:var(--text-muted);text-align:center;">Taxa de deferimento: <strong style="color:var(--primary);">${pv.taxaDeferimento}%</strong></div>
                </div>`;
            }

            // Alerts
            if (data.alertas && data.alertas.length > 0) {
                const nivelColor = { alto: '#f87171', medio: '#fbbf24', info: '#60a5fa' };
                const nivelIcon = { alto: '⚠', medio: '⚡', info: 'ℹ' };
                html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;">
                    <h4 style="margin:0 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Alertas e Riscos</h4>
                    ${data.alertas.map(a => `
                        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:${nivelColor[a.nivel]}10;border:1px solid ${nivelColor[a.nivel]}30;border-radius:8px;margin-bottom:8px;">
                            <span style="font-size:18px;">${nivelIcon[a.nivel]}</span>
                            <div>
                                <div style="font-weight:600;color:${nivelColor[a.nivel]};">${a.mensagem}</div>
                                <div style="font-size:12px;color:var(--text-muted);">${a.detalhe}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
            }

            // Connected entities
            html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px;">`;
            // Directors
            html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;">
                <h4 style="margin:0 0 10px;font-size:13px;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;">Diretores (${data.conexoes.diretores.length})</h4>
                ${data.conexoes.diretores.slice(0,8).map(d => `
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;" class="clickable-row" onclick="App.PageDossie.visualizar('${d.nome.replace(/'/g,"\\'")}')">
                        <span style="color:var(--text-main);cursor:pointer;">${d.nome}</span>
                        <span style="color:var(--text-muted);">${d.deliberacoes}x</span>
                    </div>
                `).join('')}
                ${data.conexoes.diretores.length === 0 ? '<div style="color:var(--text-muted);font-size:12px;">Nenhum</div>' : ''}
            </div>`;
            // Companies
            html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;">
                <h4 style="margin:0 0 10px;font-size:13px;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;">Empresas (${data.conexoes.empresas.length})</h4>
                ${data.conexoes.empresas.slice(0,8).map(e => `
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;" class="clickable-row" onclick="App.PageDossie.visualizar('${e.nome.replace(/'/g,"\\'")}')">
                        <span style="color:var(--text-main);cursor:pointer;">${e.nome}</span>
                        <span style="color:var(--text-muted);">${e.deliberacoes}x</span>
                    </div>
                `).join('')}
                ${data.conexoes.empresas.length === 0 ? '<div style="color:var(--text-muted);font-size:12px;">Nenhuma</div>' : ''}
            </div>`;
            // Themes
            html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;">
                <h4 style="margin:0 0 10px;font-size:13px;color:#4ade80;text-transform:uppercase;letter-spacing:1px;">Temas (${data.conexoes.temas.length})</h4>
                ${data.conexoes.temas.slice(0,8).map(t => `
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;">
                        <span style="color:var(--text-main);">${t.nome}</span>
                        <span style="color:var(--text-muted);">${t.ocorrencias}x</span>
                    </div>
                `).join('')}
                ${data.conexoes.temas.length === 0 ? '<div style="color:var(--text-muted);font-size:12px;">Nenhum</div>' : ''}
            </div>`;
            html += `</div>`;

            // Enhanced Timeline
            if (data.timeline && data.timeline.length > 0) {
                const totalItems = data.timeline.reduce((s, t) => s + t.itens.length, 0);
                const deferidos = data.timeline.reduce((s, t) => s + t.itens.filter(i => i.resultado === 'Deferido').length, 0);
                const indeferidos = data.timeline.reduce((s, t) => s + t.itens.filter(i => i.resultado === 'Indeferido').length, 0);

                html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <h4 style="margin:0;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Timeline Cronológica</h4>
                        <div style="display:flex;gap:6px;">
                            <button class="btn btn-outline btn-sm dossie-timeline-filter active" data-filter="all" onclick="App.PageDossie.filterTimeline('all')">Todos (${totalItems})</button>
                            <button class="btn btn-outline btn-sm dossie-timeline-filter" data-filter="Deferido" onclick="App.PageDossie.filterTimeline('Deferido')" style="color:#4ade80;">Deferidos (${deferidos})</button>
                            <button class="btn btn-outline btn-sm dossie-timeline-filter" data-filter="Indeferido" onclick="App.PageDossie.filterTimeline('Indeferido')" style="color:#f87171;">Indeferidos (${indeferidos})</button>
                        </div>
                    </div>

                    <!-- Mini trend chart -->
                    <div style="margin-bottom:16px;background:var(--bg-main);border-radius:8px;padding:12px;">
                        <canvas id="dossie-timeline-chart" width="600" height="80"></canvas>
                    </div>

                    <div id="dossie-timeline-list" style="max-height:500px;overflow-y:auto;">
                    ${data.timeline.slice(0,30).map(t => `
                        <div class="dossie-timeline-group" style="border-left:3px solid var(--primary);padding-left:16px;margin-bottom:20px;position:relative;">
                            <div style="position:absolute;left:-7px;top:0;width:11px;height:11px;border-radius:50%;background:var(--primary);border:2px solid var(--bg-card);"></div>
                            <div style="font-weight:700;font-size:14px;color:var(--primary);margin-bottom:6px;">${t.data}
                                <span style="font-weight:400;font-size:12px;color:var(--text-muted);margin-left:8px;">${t.itens.length} deliberaç${t.itens.length === 1 ? 'ão' : 'ões'}</span>
                            </div>
                            ${t.itens.map(item => {
                                const resultColor = item.resultado === 'Deferido' ? '#4ade80' : item.resultado === 'Indeferido' ? '#f87171' : '#94a3b8';
                                return `
                                <div class="dossie-timeline-item" data-resultado="${item.resultado || ''}" style="background:var(--bg-main);padding:10px 14px;border-radius:8px;margin-bottom:6px;font-size:12px;border-left:3px solid ${resultColor};transition:opacity 0.2s;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;">
                                        <div>
                                            <span style="font-weight:600;color:var(--text-primary);">${item.numero || 'Deliberação'}</span>
                                            ${item.interessado ? '<span style="color:var(--text-muted);margin-left:8px;">' + item.interessado + '</span>' : ''}
                                        </div>
                                        <span style="padding:2px 8px;border-radius:9999px;background:${resultColor}15;color:${resultColor};font-size:10px;font-weight:600;">${item.resultado || 'Pendente'}</span>
                                    </div>
                                    ${item.microtema ? '<div style="color:var(--text-muted);margin-top:4px;display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;border-radius:50%;background:#8b5cf6;flex-shrink:0;"></span>' + item.microtema + '</div>' : ''}
                                    ${item.confianca ? '<div style="margin-top:4px;display:flex;align-items:center;gap:6px;"><div style="flex:1;background:var(--surface);border-radius:3px;height:3px;overflow:hidden;max-width:80px;"><div style="background:' + (item.confianca > 70 ? '#4ade80' : '#fbbf24') + ';width:' + item.confianca + '%;height:100%;"></div></div><span style="font-size:10px;color:var(--text-muted);">' + item.confianca + '% conf.</span></div>' : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    `).join('')}
                    </div>
                </div>`;
            }

            cardBody.innerHTML = html;

            // Render mini trend chart for timeline
            this._renderTimelineChart(data.timeline || []);

            // If company, try CNPJ enrichment
            if (data.tipo === 'empresa') {
                this._enrichWithCNPJ(data.entidade);
            }
        },

        _renderTimelineChart(timeline) {
            const canvas = document.getElementById('dossie-timeline-chart');
            if (!canvas || !timeline.length) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width = canvas.parentElement.clientWidth - 24;
            const H = 80;
            canvas.height = H;
            ctx.clearRect(0, 0, W, H);

            const data = timeline.map(t => ({
                label: t.data,
                total: t.itens.length,
                deferidos: t.itens.filter(i => i.resultado === 'Deferido').length,
                indeferidos: t.itens.filter(i => i.resultado === 'Indeferido').length
            })).reverse(); // chronological order

            const maxVal = Math.max(1, ...data.map(d => d.total));
            const barW = Math.min(30, (W - 20) / data.length - 4);

            data.forEach((d, i) => {
                const x = 10 + i * (barW + 4);
                const totalH = (d.total / maxVal) * (H - 20);
                const defH = (d.deferidos / maxVal) * (H - 20);
                const indH = (d.indeferidos / maxVal) * (H - 20);

                // Deferidos (green)
                ctx.fillStyle = 'rgba(74,222,128,0.7)';
                ctx.fillRect(x, H - 10 - defH, barW, defH);

                // Indeferidos (red) stacked on top
                ctx.fillStyle = 'rgba(248,113,113,0.7)';
                ctx.fillRect(x, H - 10 - defH - indH, barW, indH);

                // Remaining (gray)
                const otherH = totalH - defH - indH;
                if (otherH > 0) {
                    ctx.fillStyle = 'rgba(148,163,184,0.3)';
                    ctx.fillRect(x, H - 10 - totalH, barW, otherH);
                }
            });
        },

        filterTimeline(filter) {
            // Update active button
            document.querySelectorAll('.dossie-timeline-filter').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
            // Filter items
            document.querySelectorAll('.dossie-timeline-item').forEach(item => {
                if (filter === 'all') {
                    item.style.display = '';
                    item.style.opacity = '1';
                } else {
                    const match = item.dataset.resultado === filter;
                    item.style.display = match ? '' : 'none';
                }
            });
            // Hide empty groups
            document.querySelectorAll('.dossie-timeline-group').forEach(group => {
                const visible = group.querySelectorAll('.dossie-timeline-item[style*="display: none"]').length;
                const total = group.querySelectorAll('.dossie-timeline-item').length;
                group.style.display = (filter !== 'all' && visible === total) ? 'none' : '';
            });
        },

        async _enrichWithCNPJ(empresaNome) {
            const cnpjContainer = document.getElementById('dossie-cnpj-data');
            if (!cnpjContainer) return;

            // Try to find empresa in the known list first
            try {
                const resp = await fetch('/api/cnpj-busca?nome=' + encodeURIComponent(empresaNome));
                const data = await resp.json();
                if (data.success && data.empresa) {
                    cnpjContainer.innerHTML = `
                        <div style="background:var(--bg-main);border-radius:8px;padding:12px;margin-bottom:16px;display:flex;align-items:center;gap:12px;border:1px solid var(--border);">
                            <div style="width:36px;height:36px;border-radius:8px;background:#fbbf2420;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <svg fill="none" stroke="#fbbf24" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                            </div>
                            <div>
                                <div style="font-weight:600;font-size:13px;color:var(--text-primary);">${data.empresa.nome}</div>
                                <div style="font-size:11px;color:var(--text-muted);">Setor: ${data.empresa.setor} · Tipo: ${data.empresa.tipo}</div>
                            </div>
                            <div style="margin-left:auto;font-size:11px;color:var(--text-muted);">Base IRIS</div>
                        </div>`;
                }
            } catch (_) { /* silently fail */ }
        },

        voltarLista() {
            this.dossieAtual = null;
            const cardBody = document.getElementById('dossie-table-body').closest('.card-body');
            cardBody.innerHTML = `<div class="table-wrapper"><table class="table"><thead><tr>
                <th>Entidade</th><th>Tipo</th><th>Deliberações</th><th>Alertas</th><th>Gerado em</th><th>Status</th><th>Ações</th>
            </tr></thead><tbody id="dossie-table-body"></tbody></table></div>`;
            this.renderTable();
        },

        novo() {
            // Show entity selector
            if (this.entidades.length === 0) {
                alert('Nenhuma entidade disponível. Faça upload de PDFs primeiro.');
                return;
            }
            const nome = prompt('Digite o nome da entidade para gerar o dossiê:');
            if (nome) this.visualizar(nome);
        },

        exportar(nome) {
            this.exportarPDF(nome);
        },

        exportarPDF(nome) {
            // Open server-rendered PDF-ready page
            window.open('/api/dossie-pdf/' + encodeURIComponent(nome), '_blank');
        }
    };

    // ============================================
    // PAGE: Cruzamento de Dados
    // ============================================
    const PageCruzamento = {
        async init() {
            const page = document.getElementById('page-cruzamento');
            page.classList.add('active');
            await this.loadStatus();
            this.bindEvents();
        },

        async loadStatus() {
            try {
                const data = await API.get('/api/cruzamento/status');
                if (data && data.success) {
                    const integracoes = data.integracoes || {};
                    const ativos = Object.values(integracoes).filter(i => i.status === 'ativo').length;
                    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
                    el('cruzamento-bases', ativos);
                    el('cruzamento-divergencias', data.bases_futuras?.length || 0);
                    setDataMode('page-cruzamento', true);

                    // Update base cards with real status
                    this.renderBasesStatus(integracoes);
                }
            } catch (err) {
                console.warn('[Cruzamento] API indisponivel:', err.message);
            }
        },

        renderBasesStatus(integracoes) {
            const grid = document.getElementById('cruzamento-bases-grid');
            if (!grid) return;
            // Update status indicators on existing cards
            const cards = grid.querySelectorAll('.base-card');
            const keys = Object.keys(integracoes);
            cards.forEach((card, i) => {
                if (keys[i]) {
                    const info = integracoes[keys[i]];
                    const statusEl = card.querySelector('.base-status');
                    if (statusEl) {
                        statusEl.className = 'base-status ' + (info.status === 'ativo' ? 'active' : 'inactive');
                        statusEl.innerHTML = `<span class="status-dot"></span>${info.status === 'ativo' ? 'Conectada' : 'Pendente'}`;
                    }
                }
            });
        },

        bindEvents() {
            // Wire CNPJ search if input exists
            const cnpjInput = document.getElementById('cruzamento-cnpj-input');
            const cnpjBtn = document.getElementById('cruzamento-cnpj-btn');
            if (cnpjBtn) {
                cnpjBtn.addEventListener('click', () => this.buscarCNPJ());
            }
            if (cnpjInput) {
                cnpjInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.buscarCNPJ();
                });
            }
        },

        async buscarCNPJ() {
            const input = document.getElementById('cruzamento-cnpj-input');
            if (!input || !input.value.trim()) return;
            const cnpj = input.value.replace(/[^\d]/g, '');
            if (cnpj.length < 14) { alert('CNPJ deve ter 14 digitos'); return; }

            try {
                const data = await API.get(`/api/cruzamento/cnpj/${cnpj}`);
                if (data && data.success) {
                    const result = document.getElementById('cruzamento-resultado');
                    if (result) {
                        result.innerHTML = `<div class="card" style="margin-top:16px;"><div class="card-body">
                            <h3>${data.dados?.nome || 'Empresa'}</h3>
                            <p>Situacao: ${data.dados?.situacao || '-'}</p>
                            <p>Atividade: ${data.dados?.atividade_principal?.[0]?.text || '-'}</p>
                        </div></div>`;
                    }
                } else {
                    alert(data?.erro || 'Erro ao consultar CNPJ');
                }
            } catch (err) {
                alert('Erro na consulta: ' + err.message);
            }
        },

        async sincronizar() {
            try {
                const data = await API.get('/api/cruzamento/status');
                if (data && data.success) {
                    alert(`Status atualizado: ${Object.values(data.integracoes).filter(i => i.status === 'ativo').length} bases ativas`);
                    await this.loadStatus();
                }
            } catch (err) {
                alert('Erro ao sincronizar: ' + err.message);
            }
        },

        resolver(id) {
            alert(`Resolvendo divergencia #${id}`);
        }
    };

    // ============================================
    // PAGE: Upload de PDFs
    // ============================================
    const PageUpload = {
        pdfs: [],
        _dropzoneSetup: false,

        async init() {
            const page = document.getElementById('page-upload');
            page.classList.add('active');

            this.setupDropzone();
            await this.load();
        },

        setupDropzone() {
            if (this._dropzoneSetup) return;
            const dropzone = document.getElementById('upload-dropzone');
            const input = document.getElementById('upload-input');

            if (!dropzone || !input) return;
            this._dropzoneSetup = true;

            // Drag and drop handlers
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
                if (files.length > 0) {
                    this.uploadFiles(files);
                }
            });

            // Click to select
            dropzone.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    input.click();
                }
            });

            input.addEventListener('change', () => {
                const files = Array.from(input.files);
                if (files.length > 0) {
                    this.uploadFiles(files);
                }
            });
        },

        async load() {
            // Preserve in-memory pdfs; only fetch from API if empty (no server storage on Vercel)
            if (this.pdfs.length === 0) {
                const response = await API.get('/api/pdfs');
                const serverPdfs = response?.pdfs || [];
                if (serverPdfs.length > 0) this.pdfs = serverPdfs;
            }
            this.updateStats();
            this.renderTable();
        },

        updateStats() {
            const total = this.pdfs.length;
            const pendentes = this.pdfs.filter(p => p.status === 'pendente').length;
            const analisados = this.pdfs.filter(p => p.status === 'analisado').length;
            const erros = this.pdfs.filter(p => p.status === 'erro').length;
            const deliberacoes = this.pdfs.reduce((sum, p) => sum + (p.deliberacoes_count || 0), 0);

            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setEl('upload-total', total);
            setEl('upload-pendentes', pendentes);
            setEl('upload-analisados', analisados);
            setEl('upload-erros', erros);
            setEl('upload-deliberacoes', deliberacoes);
        },

        async uploadFiles(files) {
            const progressDiv = document.getElementById('upload-progress');
            const progressBar = document.getElementById('upload-progress-bar');
            const progressText = document.getElementById('upload-progress-text');
            const progressPercent = document.getElementById('upload-progress-percent');

            progressDiv.style.display = 'block';

            // Helper: read file as pure base64 (no data: prefix)
            const fileToBase64 = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result;
                        // strip "data:...;base64," prefix
                        const b64 = result.includes(',') ? result.split(',')[1] : result;
                        resolve(b64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            };

            // Store files in browser memory (no server upload needed)
            const addToQueue = async (file) => {
                // Dedup: skip if same file (name + size) already in queue
                const jaExiste = this.pdfs.some(p => p.nome === file.name && p.tamanho === file.size);
                if (jaExiste) {
                    return { file: file.name, sucesso: false, duplicado: true, erro: 'Já na fila' };
                }
                try {
                    const b64 = await fileToBase64(file);
                    this.pdfs.push({
                        nome: file.name,
                        tamanho: file.size,
                        status: 'pendente',
                        pdf_base64: b64,
                        deliberacoes_count: 0
                    });
                    return { file: file.name, sucesso: true };
                } catch (error) {
                    return { file: file.name, sucesso: false, erro: error.message };
                }
            };

            let successCount = 0, errorCount = 0, duplicateCount = 0, completed = 0;
            const errorFiles = [];
            const CONCURRENCY = 3;
            const total = files.length;

            // Process files in parallel batches of CONCURRENCY
            for (let i = 0; i < total; i += CONCURRENCY) {
                const batch = Array.from(files).slice(i, i + CONCURRENCY);
                const batchNames = batch.map(f => f.name).join(', ');
                const pct = Math.round((completed / total) * 100);

                progressText.textContent = `Enviando ${batch.length} PDFs em paralelo... ${completed + 1}-${Math.min(completed + batch.length, total)} de ${total}`;
                progressPercent.textContent = pct + '%';
                progressBar.style.width = pct + '%';
                progressBar.classList.remove('success', 'danger');

                const results = await Promise.all(batch.map(addToQueue));

                for (const r of results) {
                    completed++;
                    if (r.sucesso) {
                        successCount++;
                    } else if (r.duplicado) {
                        duplicateCount++;
                    } else {
                        errorCount++;
                        errorFiles.push(`${r.file}: ${r.erro || 'Erro desconhecido'}`);
                    }
                }
            }

            // Show clear final status
            progressBar.style.width = '100%';
            const dupMsg = duplicateCount > 0 ? `, ${duplicateCount} duplicado${duplicateCount > 1 ? 's ignorados' : ' ignorado'}` : '';
            if (errorCount === 0) {
                progressText.textContent = `Upload concluído! ${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso${dupMsg}.`;
                progressPercent.textContent = '100%';
                progressBar.classList.add('success');
                if (duplicateCount > 0) {
                    this._showToast(`${duplicateCount} arquivo(s) ignorado(s) — já estavam na fila`, 'warning', 5000);
                }
            } else {
                progressText.textContent = `Upload finalizado: ${successCount} sucesso, ${errorCount} erro${errorCount > 1 ? 's' : ''}${dupMsg}`;
                progressPercent.textContent = '';
                progressBar.classList.add(successCount > 0 ? 'success' : 'danger');
                // Show error details as toast
                if (errorFiles.length > 0) {
                    const errMsg = errorFiles.join('\n');
                    this._showToast('Erros no upload:\n' + errMsg, 'error', 8000);
                }
            }

            setTimeout(() => {
                progressDiv.style.display = 'none';
                progressBar.style.width = '0%';
                progressBar.classList.remove('success', 'danger');
            }, errorCount > 0 ? 6000 : 3000);

            await this.load();
        },

        // Toast notification system
        _showToast(message, type = 'info', duration = 4000) {
            let container = document.getElementById('iris-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'iris-toast-container';
                container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;max-width:420px;';
                document.body.appendChild(container);
            }
            const colors = { success: '#166534', error: '#991b1b', info: '#1e40af', warning: '#92400e' };
            const bgColors = { success: 'rgba(22,101,52,0.95)', error: 'rgba(153,27,27,0.95)', info: 'rgba(30,64,175,0.95)', warning: 'rgba(146,64,14,0.95)' };
            const toast = document.createElement('div');
            toast.style.cssText = `background:${bgColors[type]};color:#fff;padding:12px 16px;border-radius:10px;font-size:13px;line-height:1.5;box-shadow:0 8px 24px rgba(0,0,0,0.3);transform:translateX(120%);transition:transform 0.3s ease;white-space:pre-line;border-left:4px solid ${colors[type]};`;
            toast.textContent = message;
            container.appendChild(toast);
            requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
            setTimeout(() => {
                toast.style.transform = 'translateX(120%)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        async uploadFromUrl() {
            const urlInput = document.getElementById('upload-url');
            const url = urlInput?.value?.trim();

            if (!url) {
                this._showToast('Digite uma URL válida para importar', 'warning');
                return;
            }

            this._showToast('Baixando PDF da URL...', 'info', 10000);

            try {
                const response = await API.post('/api/upload-url', { url });
                if (response?.sucesso) {
                    urlInput.value = '';
                    await this.load();
                    this._showToast('PDF importado com sucesso!', 'success');
                } else {
                    this._showToast('Erro: ' + (response?.erro || 'Erro desconhecido'), 'error', 6000);
                }
            } catch (error) {
                this._showToast('Erro ao baixar PDF: ' + error.message, 'error', 6000);
            }
        },

        async analisar(index) {
            try {
                const response = await API.post(`/api/analisar-pdf/${index}`);
                if (response?.sucesso) {
                    await this.load();
                    this._showToast('Análise concluída com sucesso!', 'success');
                } else {
                    this._showToast('Erro na análise: ' + (response?.erro || 'Erro desconhecido'), 'error', 6000);
                }
            } catch (error) {
                this._showToast('Erro ao analisar: ' + error.message, 'error', 6000);
            }
        },

        async excluir(index) {
            if (!confirm('Excluir este PDF?')) return;

            try {
                await API.delete(`/api/pdf/${index}`);
                await this.load();
            } catch (error) {
                alert('Erro ao excluir: ' + error.message);
            }
        },

        // ========== BATCH ANALYSIS ==========
        selectedFiles: new Set(),
        batchRunning: false,
        batchCancelled: false,

        toggleSelectAll(checked) {
            const pendentes = this.pdfs
                .map((pdf, index) => ({ pdf, index }))
                .filter(item => item.pdf.status === 'pendente');

            this.selectedFiles.clear();

            if (checked) {
                pendentes.forEach(item => this.selectedFiles.add(item.index));
            }

            // Update checkboxes in table
            document.querySelectorAll('.pdf-checkbox').forEach(cb => {
                const idx = parseInt(cb.dataset.index);
                cb.checked = this.selectedFiles.has(idx);
            });

            // Sync header checkboxes
            const selectAll1 = document.getElementById('batch-select-all');
            const selectAll2 = document.getElementById('table-select-all');
            if (selectAll1) selectAll1.checked = checked;
            if (selectAll2) selectAll2.checked = checked;

            this.updateBatchUI();
        },

        toggleFileSelection(index, checked) {
            if (checked) {
                this.selectedFiles.add(index);
            } else {
                this.selectedFiles.delete(index);
            }
            this.updateBatchUI();
        },

        updateBatchUI() {
            const count = this.selectedFiles.size;
            const countEl = document.getElementById('batch-selected-count');
            const startBtn = document.getElementById('batch-start-btn');

            if (countEl) {
                countEl.textContent = count === 1 ? '1 arquivo selecionado' : `${count} arquivos selecionados`;
            }
            if (startBtn) {
                startBtn.disabled = count === 0 || this.batchRunning;
            }
        },

        async startBatchAnalysis() {
            if (this.selectedFiles.size === 0 || this.batchRunning) return;

            this.batchRunning = true;
            this.batchCancelled = false;

            const parallelCount = parseInt(document.getElementById('batch-parallel-count').value) || 3;
            const selectedIndices = Array.from(this.selectedFiles);
            const total = selectedIndices.length;
            let completed = 0;
            let errors = 0;
            let processing = 0;

            // Show progress container
            const progressContainer = document.getElementById('batch-progress-container');
            const startBtn = document.getElementById('batch-start-btn');
            progressContainer.style.display = 'block';
            startBtn.disabled = true;

            const updateProgress = () => {
                document.getElementById('batch-completed').textContent = completed;
                document.getElementById('batch-processing').textContent = processing;
                document.getElementById('batch-remaining').textContent = total - completed - errors - processing;
                document.getElementById('batch-errors').textContent = errors;

                const percent = Math.round(((completed + errors) / total) * 100);
                document.getElementById('batch-progress-bar').style.width = percent + '%';
                document.getElementById('batch-progress-title').textContent =
                    `Processando lote... ${completed + errors}/${total}`;
            };

            // Process files in parallel batches
            const queue = [...selectedIndices];
            const activePromises = new Map();

            const processNext = async () => {
                if (this.batchCancelled || queue.length === 0) return;

                const index = queue.shift();
                processing++;
                updateProgress();

                // Show current file being processed
                const currentFilesEl = document.getElementById('batch-current-files');
                const currentFiles = Array.from(activePromises.keys())
                    .map(idx => this.pdfs[idx]?.nome || `Arquivo ${idx + 1}`);
                currentFilesEl.innerHTML = currentFiles.length > 0
                    ? `<strong>Processando:</strong> ${currentFiles.join(', ')}`
                    : '';

                try {
                    const pdf = this.pdfs[index];
                    if (!pdf || !pdf.pdf_base64) {
                        errors++;
                    } else {
                        pdf.status = 'analisando';
                        this.renderTable();
                        const resp = await fetch('/api/pdf_analyze', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                pdf_base64: pdf.pdf_base64,
                                filename: pdf.nome,
                                agencia: pdf.agencia || 'ARTESP'
                            })
                        });
                        const result = await resp.json();
                        if (result && result.skipped) {
                            pdf.status = 'ignorado';
                            pdf.erro = result.reason || 'PDF já processado anteriormente';
                            completed++;
                        } else if (result && !result.error) {
                            pdf.status = 'analisado';
                            pdf.deliberacoes_count = result.total || 0;
                            pdf.deliberacoes = result.deliberacoes || [];
                            completed++;
                        } else {
                            pdf.status = 'erro';
                            pdf.erro = result?.error || 'Erro desconhecido';
                            errors++;
                        }
                        this.renderTable();
                    }
                } catch (error) {
                    console.error('Erro ao analisar:', error);
                    if (this.pdfs[index]) {
                        this.pdfs[index].status = 'erro';
                        this.pdfs[index].erro = error.message;
                    }
                    errors++;
                } finally {
                    processing--;
                    activePromises.delete(index);
                    updateProgress();

                    // Start next if available
                    if (!this.batchCancelled && queue.length > 0) {
                        const promise = processNext();
                        if (queue.length > 0) {
                            activePromises.set(queue[0], promise);
                        }
                    }
                }
            };

            // Start initial batch
            const initialBatch = Math.min(parallelCount, queue.length);
            const startPromises = [];
            for (let i = 0; i < initialBatch; i++) {
                if (queue.length > 0) {
                    const idx = queue[0];
                    const promise = processNext();
                    activePromises.set(idx, promise);
                    startPromises.push(promise);
                }
            }

            // Wait for all to complete
            while (activePromises.size > 0 || queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));

                // Keep spawning new processes
                while (!this.batchCancelled && queue.length > 0 && activePromises.size < parallelCount) {
                    const idx = queue[0];
                    const promise = processNext();
                    activePromises.set(idx, promise);
                }
            }

            // Finish up
            this.batchRunning = false;
            this.selectedFiles.clear();

            const ignorados = this.pdfs.filter(p => p.status === 'ignorado').length;
            document.getElementById('batch-progress-title').textContent =
                this.batchCancelled
                    ? 'Análise cancelada!'
                    : `Análise concluída! ${completed} sucesso, ${errors} erros${ignorados > 0 ? `, ${ignorados} ignorado(s)` : ''}`;
            document.getElementById('batch-current-files').innerHTML = '';

            // Refresh deliberações page if active so new data shows immediately
            if (completed > 0) {
                const activePage = document.querySelector('.page-view.active');
                if (activePage && activePage.id === 'page-deliberacoes' && typeof App !== 'undefined' && App.PageDeliberacoes && App.PageDeliberacoes._loadFromAPI) {
                    App.PageDeliberacoes.filter();
                }
            }

            // Reload the list
            await this.load();

            // Reset UI after delay
            setTimeout(() => {
                progressContainer.style.display = 'none';
                document.getElementById('batch-progress-bar').style.width = '0%';
                this.updateBatchUI();
            }, 3000);
        },

        cancelBatch() {
            this.batchCancelled = true;
            document.getElementById('batch-progress-title').textContent = 'Cancelando...';
        },

        render() {
            const tbody = document.getElementById('upload-table-body');

            if (this.pdfs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">Nenhum PDF carregado ainda</div></td></tr>';
                return;
            }

            tbody.innerHTML = this.pdfs.map((pdf, index) => {
                const statusClass = pdf.status === 'analisado' ? 'badge-success' :
                                   pdf.status === 'erro' ? 'badge-danger' :
                                   pdf.status === 'analisando' ? 'badge-warning' : 'badge-secondary';
                const statusLabel = pdf.status === 'analisado' ? 'Analisado' :
                                   pdf.status === 'erro' ? 'Erro' :
                                   pdf.status === 'analisando' ? 'Analisando...' : 'Pendente';
                const tamanho = pdf.size ? (pdf.size / 1024 / 1024).toFixed(2) + ' MB' : '-';
                const isPendente = pdf.status === 'pendente';
                const isChecked = this.selectedFiles.has(index);

                return `<tr>
                    <td>
                        ${isPendente
                            ? `<input type="checkbox" class="pdf-checkbox" data-index="${index}" ${isChecked ? 'checked' : ''} onchange="App.PageUpload.toggleFileSelection(${index}, this.checked)">`
                            : ''}
                    </td>
                    <td>${index + 1}</td>
                    <td><span class="file-name">${pdf.nome || pdf.filename || 'Arquivo ' + (index + 1)}</span></td>
                    <td>${tamanho}</td>
                    <td>
                        <span class="badge ${statusClass}">${statusLabel}</span>
                        ${pdf.status === 'erro' && pdf.erro ? `<div class="upload-error-msg" title="${pdf.erro.replace(/"/g, '&quot;')}">${pdf.erro.length > 80 ? pdf.erro.substring(0, 80) + '…' : pdf.erro}</div>` : ''}
                    </td>
                    <td>${pdf.deliberacoes_count || 0}</td>
                    <td>
                        <div class="action-buttons">
                            ${isPendente ? `<button class="btn btn-primary btn-sm" onclick="App.PageUpload.analisarPdf(${index})">Analisar</button>` : ''}
                            ${pdf.status === 'analisado' ? `<button class="btn btn-secondary btn-sm" onclick="App.PageUpload.verResultado(${index})">Ver Resultado</button>` : ''}
                            <button class="btn btn-danger btn-sm" onclick="App.PageUpload.excluir(${index})">Excluir</button>
                        </div>
                    </td>
                </tr>`;
            }).join('');

            this.updateBatchUI();
        },

        // ── Analysis functionality (merged from PageAnalise) ──
        async analisarPdf(index) {
            const pdf = this.pdfs[index];
            if (!pdf) return;

            const statusCard = document.getElementById('analise-status-card');
            const statusText = document.getElementById('analise-status-text');
            const statusPercent = document.getElementById('analise-status-percent');
            const progressBar = document.getElementById('analise-progress-bar');

            if (statusCard) statusCard.style.display = 'block';
            if (statusText) statusText.textContent = 'Analisando: ' + pdf.nome;
            if (statusPercent) statusPercent.textContent = '0%';
            if (progressBar) progressBar.style.width = '0%';

            pdf.status = 'analisando';
            this.renderTable();

            try {
                let progress = 0;
                const progressInterval = setInterval(() => {
                    if (progress < 85) {
                        progress += Math.random() * 8;
                        const pct = Math.min(85, Math.round(progress));
                        if (statusPercent) statusPercent.textContent = pct + '%';
                        if (progressBar) progressBar.style.width = pct + '%';
                    }
                }, 600);

                const response = await fetch('/api/pdf_analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pdf_base64: pdf.pdf_base64,
                        filename: pdf.nome,
                        agencia: 'ARTESP'
                    })
                });
                const result = await response.json();
                clearInterval(progressInterval);

                if (result && result.skipped) {
                    pdf.status = 'ignorado';
                    pdf.erro = result.reason || 'PDF já processado anteriormente';
                    if (statusText) statusText.textContent = `⚠ ${pdf.nome}: já processado anteriormente`;
                    if (statusPercent) statusPercent.textContent = '100%';
                    if (progressBar) progressBar.style.width = '100%';
                    this._showToast('PDF já processado: ' + pdf.nome, 'warning', 5000);
                    setTimeout(() => { if (statusCard) statusCard.style.display = 'none'; }, 3000);
                } else if (result && !result.error) {
                    pdf.status = 'analisado';
                    pdf.deliberacoes_count = result.total || 0;
                    pdf.deliberacoes = result.deliberacoes || [];

                    if (statusText) statusText.textContent = `✓ ${pdf.nome}: ${result.total || 0} deliberação(ões) extraída(s)`;
                    if (statusPercent) statusPercent.textContent = '100%';
                    if (progressBar) progressBar.style.width = '100%';

                    if (result.deliberacoes && result.deliberacoes.length > 0) {
                        this.mostrarResultado(result);
                    }
                    setTimeout(() => { if (statusCard) statusCard.style.display = 'none'; }, 3000);
                } else {
                    pdf.status = 'erro';
                    pdf.erro = result?.error || 'Erro desconhecido';
                    if (statusText) statusText.textContent = 'Erro: ' + pdf.erro;
                    if (progressBar) progressBar.style.width = '0%';
                    this._showToast('Erro na análise: ' + pdf.erro, 'error', 6000);
                }
            } catch (error) {
                pdf.status = 'erro';
                pdf.erro = error.message;
                if (statusText) statusText.textContent = 'Erro: ' + error.message;
                this._showToast('Erro ao analisar: ' + error.message, 'error', 6000);
            }
            this.updateStats();
            this.renderTable();
        },

        async analisarTodosPendentes() {
            const pendentes = this.pdfs.filter(p => p.status === 'pendente');

            if (pendentes.length === 0) {
                this._showToast('Nenhum PDF pendente para análise', 'warning');
                return;
            }

            // Select all pendentes and trigger batch analysis
            this.selectedFiles.clear();
            pendentes.forEach(p => {
                const idx = this.pdfs.indexOf(p);
                if (idx >= 0) this.selectedFiles.add(idx);
            });
            this.updateBatchUI();
            await this.startBatchAnalysis();
        },

        mostrarResultado(response) {
            const card = document.getElementById('analise-resultados-card');
            const content = document.getElementById('analise-resultados-content');
            if (!card || !content) return;

            card.style.display = 'block';

            const deliberacoes = response.deliberacoes || [];
            const deferidos = deliberacoes.filter(d => d.resultado === 'Deferido').length;
            const indeferidos = deliberacoes.filter(d => d.resultado === 'Indeferido').length;
            const parciais = deliberacoes.filter(d => d.resultado === 'Parcialmente Deferido').length;

            content.innerHTML = `
                <div class="deliberacoes-summary">
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <div class="summary-value">${deliberacoes.length}</div>
                            <div class="summary-label">Total Extraídas</div>
                        </div>
                        <div class="summary-stat success">
                            <div class="summary-value">${deferidos}</div>
                            <div class="summary-label">Deferidas</div>
                        </div>
                        <div class="summary-stat warning">
                            <div class="summary-value">${parciais}</div>
                            <div class="summary-label">Parciais</div>
                        </div>
                        <div class="summary-stat danger">
                            <div class="summary-value">${indeferidos}</div>
                            <div class="summary-label">Indeferidas</div>
                        </div>
                    </div>
                </div>
                ${deliberacoes.length > 0 ? `
                <div class="deliberacoes-list">
                    ${deliberacoes.map((d, i) => {
                        const resultadoClass = d.resultado === 'Deferido' ? 'badge-success' :
                                              d.resultado === 'Parcialmente Deferido' ? 'badge-warning' :
                                              d.resultado === 'Indeferido' ? 'badge-danger' : 'badge-secondary';
                        const votosAFavor = d.votos_a_favor || [];
                        const votosContra = d.votos_contra || [];
                        const totalVotos = votosAFavor.length + votosContra.length;

                        return `
                        <div class="deliberacao-card">
                            <div class="deliberacao-header">
                                <div class="deliberacao-info">
                                    <span class="deliberacao-numero">${d.numero_deliberacao || 'Deliberação ' + (i + 1)}</span>
                                    <span class="deliberacao-reuniao">Reunião ${d.reuniao_ordinaria || '-'}</span>
                                    ${d.data_reuniao ? `<span class="deliberacao-data">${new Date(d.data_reuniao).toLocaleDateString('pt-BR')}</span>` : ''}
                                </div>
                                <span class="badge ${resultadoClass}">${d.resultado || '-'}</span>
                            </div>
                            <div class="deliberacao-body">
                                <div class="deliberacao-row">
                                    <span class="deliberacao-label">Interessado:</span>
                                    <span class="deliberacao-value">${d.interessado || '-'}</span>
                                </div>
                                <div class="deliberacao-row">
                                    <span class="deliberacao-label">Processo:</span>
                                    <span class="deliberacao-value processo">${d.processo || '-'}</span>
                                </div>
                                ${d.microtema ? `
                                <div class="deliberacao-row">
                                    <span class="deliberacao-label">Microtema:</span>
                                    <span class="badge badge-outline">${d.microtema}</span>
                                </div>` : ''}
                                ${d.classificacao ? `
                                <div class="deliberacao-row">
                                    <span class="deliberacao-label">Classificação:</span>
                                    <span class="deliberacao-value">${d.classificacao}</span>
                                </div>` : ''}
                            </div>
                            ${totalVotos > 0 ? `
                            <div class="deliberacao-votos">
                                <div class="votos-header">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Votação dos Diretores
                                </div>
                                <div class="votos-grid">
                                    ${votosAFavor.length > 0 ? `
                                    <div class="votos-column favor">
                                        <div class="votos-title">A Favor (${votosAFavor.length})</div>
                                        <div class="votos-list">${votosAFavor.map(v => `<span class="voto-diretor">${v}</span>`).join('')}</div>
                                    </div>` : ''}
                                    ${votosContra.length > 0 ? `
                                    <div class="votos-column contra">
                                        <div class="votos-title">Contra (${votosContra.length})</div>
                                        <div class="votos-list">${votosContra.map(v => `<span class="voto-diretor">${v}</span>`).join('')}</div>
                                    </div>` : ''}
                                </div>
                            </div>` : ''}
                            <div class="deliberacao-footer">
                                <span class="agencia-badge">${d.agencia || 'ARTESP'}</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>` : ''}
            `;
        },

        verResultado(index) {
            const pdf = this.pdfs[index];
            if (pdf && pdf.deliberacoes) {
                this.mostrarResultado({ deliberacoes: pdf.deliberacoes });
            }
        }
    };

    // PageAnalise now redirects to the unified PageUpload page
    const PageAnalise = {
        async init() {
            // Redirect to unified upload page
            Router.navigate('/upload');
        },
        async load() {},
        analisar(index) { PageUpload.analisarPdf(index); },
        analisarTodos() { PageUpload.analisarTodosPendentes(); },
        mostrarResultado(r) { PageUpload.mostrarResultado(r); },
        verResultado(i) { PageUpload.verResultado(i); }
    };

    // ============================================
    // PAGE: Hub de Noticias e Analise
    // ============================================
    const PageHub = {
        // Agencias Federais completas
        agenciasFederais: [
            { sigla: 'ANA', nome: 'Agência Nacional de Águas', setor: 'saneamento', diretores: 5, mandato: 4, fonte: 'API SNIRH + RSS', rss: 'gov.br/ana/pt-br/noticias', viabilidade: 'alta', cor: '#60A5FA' },
            { sigla: 'ANEEL', nome: 'Agência Nacional de Energia Elétrica', setor: 'energia', diretores: 5, mandato: 5, fonte: 'API aberta + RSS', rss: 'gov.br/aneel/pt-br/noticias', viabilidade: 'alta', cor: '#FFEF4D' },
            { sigla: 'ANATEL', nome: 'Agência Nacional de Telecomunicações', setor: 'telecom', diretores: 5, mandato: 5, fonte: 'API dados.anatel.gov.br', rss: 'gov.br/anatel/pt-br/noticias', viabilidade: 'alta', cor: '#4ADE80' },
            { sigla: 'ANP', nome: 'Agência Nacional do Petróleo', setor: 'petroleo', diretores: 4, mandato: 4, fonte: 'API + dados abertos', rss: 'gov.br/anp/pt-br/noticias', viabilidade: 'alta', cor: '#F472B6' },
            { sigla: 'ANVISA', nome: 'Agência Nacional de Vigilância Sanitária', setor: 'saude', diretores: 5, mandato: 5, fonte: 'API + RSS', rss: 'gov.br/anvisa/pt-br/noticias', viabilidade: 'alta', cor: '#A78BFA' },
            { sigla: 'ANS', nome: 'Agência Nacional de Saúde Suplementar', setor: 'saude', diretores: 5, mandato: 5, fonte: 'API dados.ans.gov.br', rss: 'gov.br/ans/pt-br/noticias', viabilidade: 'alta', cor: '#F97316' },
            { sigla: 'ANTT', nome: 'Agência Nacional de Transportes Terrestres', setor: 'transporte', diretores: 5, mandato: 5, fonte: 'API + PNCP', rss: 'gov.br/antt/pt-br/noticias', viabilidade: 'alta', cor: '#14B8A6' },
            { sigla: 'ANTAQ', nome: 'Agência Nacional de Transportes Aquaviários', setor: 'transporte', diretores: 3, mandato: 4, fonte: 'Dados abertos', rss: 'gov.br/antaq/pt-br/noticias', viabilidade: 'media', cor: '#06B6D4' },
            { sigla: 'ANAC', nome: 'Agência Nacional de Aviação Civil', setor: 'aviacao', diretores: 5, mandato: 5, fonte: 'API + dados abertos', rss: 'gov.br/anac/pt-br/noticias', viabilidade: 'alta', cor: '#8B5CF6' },
            { sigla: 'ANM', nome: 'Agência Nacional de Mineração', setor: 'mineracao', diretores: 5, mandato: 4, fonte: 'API SIGMINE', rss: 'gov.br/anm/pt-br/noticias', viabilidade: 'alta', cor: '#EF4444' },
            { sigla: 'ANCINE', nome: 'Agência Nacional do Cinema', setor: 'cinema', diretores: 4, mandato: 4, fonte: 'RSS', rss: 'gov.br/ancine/pt-br/noticias', viabilidade: 'media', cor: '#EC4899' }
        ],

        // Orgaos complementares
        orgaosComplementares: [
            { sigla: 'TCU', nome: 'Tribunal de Contas da União', fonte: 'RSS', rss: 'portal.tcu.gov.br/imprensa/noticias' },
            { sigla: 'CGU', nome: 'Controladoria-Geral da União', fonte: 'RSS', rss: 'gov.br/cgu/pt-br/noticias' },
            { sigla: 'DOU', nome: 'Diário Oficial da União', fonte: 'API REST', rss: 'in.gov.br/servicos/api' },
            { sigla: 'PNCP', nome: 'Portal Nacional de Contratações', fonte: 'API REST', rss: 'pncp.gov.br/api' }
        ],

        // Agencias Estaduais
        agenciasEstaduais: [
            { sigla: 'ARTESP', nome: 'Agência de Transporte do Estado de São Paulo', estado: 'SP', setor: 'transporte' },
            { sigla: 'ARSESP', nome: 'Agência Reguladora de Serviços Públicos de SP', estado: 'SP', setor: 'saneamento' },
            { sigla: 'ARSAE-MG', nome: 'Agência Reguladora de Serviços de Abast. de Água de MG', estado: 'MG', setor: 'saneamento' },
            { sigla: 'AGEPAR', nome: 'Agência Reguladora do Paraná', estado: 'PR', setor: 'multisetorial' },
            { sigla: 'ARCE', nome: 'Agência Reguladora do Ceará', estado: 'CE', setor: 'multisetorial' },
            { sigla: 'AGERBA', nome: 'Agência de Regulação da Bahia', estado: 'BA', setor: 'multisetorial' },
            { sigla: 'ARPE', nome: 'Agência de Regulação de Pernambuco', estado: 'PE', setor: 'multisetorial' },
            { sigla: 'ADASA', nome: 'Agência Reguladora de Águas do DF', estado: 'DF', setor: 'saneamento' },
            { sigla: 'AGENERSA', nome: 'Agência Reguladora de Energia e Saneamento do RJ', estado: 'RJ', setor: 'energia' },
            { sigla: 'AGERGS', nome: 'Agência Estadual de Regulação do RS', estado: 'RS', setor: 'multisetorial' },
            { sigla: 'ARSAM', nome: 'Agência Reguladora dos Serviços do Amazonas', estado: 'AM', setor: 'multisetorial' },
            { sigla: 'ARSAL', nome: 'Agência Reguladora de Serviços de Alagoas', estado: 'AL', setor: 'multisetorial' },
            { sigla: 'AGRESPI', nome: 'Agência de Regulação do Piauí', estado: 'PI', setor: 'multisetorial' },
            { sigla: 'AGR', nome: 'Agência Goiana de Regulação', estado: 'GO', setor: 'multisetorial' },
            { sigla: 'AGEPAN', nome: 'Agência de Regulação do Mato Grosso do Sul', estado: 'MS', setor: 'multisetorial' },
            { sigla: 'AGER-MT', nome: 'Agência de Regulação do Mato Grosso', estado: 'MT', setor: 'multisetorial' },
            { sigla: 'ARESC', nome: 'Agência de Regulação de Santa Catarina', estado: 'SC', setor: 'multisetorial' },
            { sigla: 'AGEAC', nome: 'Agência Reguladora do Acre', estado: 'AC', setor: 'multisetorial' },
            { sigla: 'ATR', nome: 'Agência Tocantinense de Regulação', estado: 'TO', setor: 'multisetorial' },
            { sigla: 'ARSEP', nome: 'Agência Reguladora do Rio Grande do Norte', estado: 'RN', setor: 'multisetorial' },
            { sigla: 'ARPB', nome: 'Agência de Regulação da Paraíba', estado: 'PB', setor: 'multisetorial' },
            { sigla: 'AGRESE', nome: 'Agência Reguladora de Sergipe', estado: 'SE', setor: 'multisetorial' },
            { sigla: 'MOB', nome: 'Agência de Mobilidade de Recife', estado: 'PE', setor: 'transporte' }
        ],

        // Noticias simuladas (placeholder para RSS/API real)
        noticias: [
            { agencia: 'ANEEL', tipo: 'resolucao', titulo: 'ANEEL aprova revisão tarifária extraordinária para distribuidoras do Nordeste', resumo: 'A diretoria colegiada da ANEEL aprovou nesta terça-feira a revisão tarifária extraordinária que afeta 8 distribuidoras de energia da região Nordeste, com impacto médio de 5,2% nas tarifas residenciais.', data: '2026-02-18', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ANVISA', tipo: 'noticia', titulo: 'ANVISA publica novas regras para rotulagem de alimentos ultraprocessados', resumo: 'Resolução da Diretoria Colegiada estabelece novos critérios para advertências frontais em embalagens, com prazo de adequação até dezembro de 2026.', data: '2026-02-17', esfera: 'federal', fonte: 'Portal ANVISA' },
            { agencia: 'ANATEL', tipo: 'consulta', titulo: 'ANATEL abre consulta pública sobre regulamentação do 6G', resumo: 'Consulta Pública n. 12/2026 visa colher contribuições da sociedade sobre o marco regulatório para tecnologias de sexta geração de telecomunicações.', data: '2026-02-17', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ARTESP', tipo: 'deliberacao', titulo: 'ARTESP delibera sobre reajuste de pedágio na Rodovia Anhanguera', resumo: 'A 1178ª Reunião Ordinária da Diretoria analisou o pleito da concessionária para reajuste anual do pedágio com base no IPCA acumulado.', data: '2026-02-16', esfera: 'estadual', fonte: 'ARTESP Transparência' },
            { agencia: 'ANA', tipo: 'resolucao', titulo: 'ANA estabelece novas regras para outorga de uso de recursos hídricos', resumo: 'Resolução define critérios atualizados para concessão de outorga em bacias hidrográficas críticas, priorizando abastecimento humano.', data: '2026-02-15', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ANP', tipo: 'noticia', titulo: 'ANP divulga resultado do 4º Ciclo de Oferta Permanente', resumo: 'Leilão arrecadou R$ 1,2 bilhão em bônus de assinatura, com 15 blocos arrematados por 8 empresas nacionais e internacionais.', data: '2026-02-15', esfera: 'federal', fonte: 'Portal ANP' },
            { agencia: 'ANTT', tipo: 'resolucao', titulo: 'ANTT regulamenta serviço de transporte rodoviário interestadual por aplicativo', resumo: 'Nova resolução cria categoria específica para transporte por plataformas digitais, com requisitos de segurança e qualidade.', data: '2026-02-14', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ARSESP', tipo: 'deliberacao', titulo: 'ARSESP aprova revisão tarifária da SABESP para ciclo 2026-2030', resumo: 'Agência estadual concluiu processo de revisão tarifária periódica da SABESP, definindo novo nível de receita requerida.', data: '2026-02-14', esfera: 'estadual', fonte: 'ARSESP' },
            { agencia: 'ANAC', tipo: 'noticia', titulo: 'ANAC autoriza operação de drones autônomos para entregas urbanas', resumo: 'Regulamentação permite operações BVLOS (além da linha de visada) em áreas urbanas específicas, mediante certificação.', data: '2026-02-13', esfera: 'federal', fonte: 'Portal ANAC' },
            { agencia: 'ANS', tipo: 'resolucao', titulo: 'ANS atualiza Rol de Procedimentos com 12 novas coberturas obrigatórias', resumo: 'Atualização inclui terapias gênicas, novos medicamentos oncológicos e procedimentos de saúde mental no rol obrigatório.', data: '2026-02-13', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'TCU', tipo: 'auditoria', titulo: 'TCU identifica irregularidades em contratos de concessão rodoviária', resumo: 'Relatório de auditoria aponta sobrepreço de R$ 340 milhões em obras de duplicação previstas em contratos de concessão federal.', data: '2026-02-12', esfera: 'federal', fonte: 'Portal TCU' },
            { agencia: 'ANM', tipo: 'noticia', titulo: 'ANM intensifica fiscalização de barragens com potencial de dano alto', resumo: 'Agência anuncia plano de fiscalização emergencial para 47 barragens classificadas com Nível de Emergência 1 e 2.', data: '2026-02-12', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'DOU', tipo: 'decreto', titulo: 'Governo nomeia dois novos diretores para a ANATEL', resumo: 'Decreto presidencial publicado no DOU nomeia novos integrantes para a diretoria colegiada da agência de telecomunicações.', data: '2026-02-11', esfera: 'federal', fonte: 'API DOU' },
            { agencia: 'AGERGS', tipo: 'deliberacao', titulo: 'AGERGS homologa tarifas do transporte metropolitano de Porto Alegre', resumo: 'Diretoria colegiada homologou o reajuste de 8,3% nas tarifas do sistema de transporte metropolitano do RS.', data: '2026-02-10', esfera: 'estadual', fonte: 'AGERGS' }
        ],

        // Mandatos de diretores (dados públicos do DOU / gov.br)
        // Fonte: Diário Oficial da União, portais oficiais das agências
        // Atualizado: Fev/2026 - dados verificados em fontes oficiais
        mandatos: [
            { nome: 'Sandoval de Araújo Feitosa Neto', cargo: 'Diretor-Geral', agencia: 'ANEEL', fim: '2027-12-31', cor: '#FFEF4D' },
            { nome: 'Agnes Maria de Aragão da Costa', cargo: 'Diretora', agencia: 'ANEEL', fim: '2028-12-31', cor: '#FFEF4D' },
            { nome: 'Willamy Moreira Frota', cargo: 'Diretor', agencia: 'ANEEL', fim: '2029-12-31', cor: '#FFEF4D' },
            { nome: 'Carlos Manuel Baigorri', cargo: 'Presidente', agencia: 'ANATEL', fim: '2026-11-03', cor: '#4ADE80' },
            { nome: 'Octávio Penna Pieranti', cargo: 'Conselheiro', agencia: 'ANATEL', fim: '2028-12-31', cor: '#4ADE80' },
            { nome: 'Artur Watt Neto', cargo: 'Diretor-Geral', agencia: 'ANP', fim: '2029-12-31', cor: '#F472B6' },
            { nome: 'Symone Araújo', cargo: 'Diretora', agencia: 'ANP', fim: '2027-12-31', cor: '#F472B6' },
            { nome: 'Leandro Pinheiro Safatle', cargo: 'Diretor-Presidente', agencia: 'ANVISA', fim: '2030-12-31', cor: '#A78BFA' },
            { nome: 'Daniel Meirelles Fernandes Pereira', cargo: 'Diretor', agencia: 'ANVISA', fim: '2028-12-31', cor: '#A78BFA' },
            { nome: 'Wadih Nemer Damous Filho', cargo: 'Diretor-Presidente', agencia: 'ANS', fim: '2029-12-31', cor: '#F97316' },
            { nome: 'Eliane Medeiros', cargo: 'Diretora de Fiscalização', agencia: 'ANS', fim: '2026-12-31', cor: '#F97316' },
            { nome: 'Guilherme Sampaio', cargo: 'Diretor-Geral', agencia: 'ANTT', fim: '2030-12-31', cor: '#14B8A6' },
            { nome: 'Felipe Fernandes Queiroz', cargo: 'Diretor', agencia: 'ANTT', fim: '2027-12-31', cor: '#14B8A6' },
            { nome: 'Frederico Carvalho Dias', cargo: 'Diretor-Geral', agencia: 'ANTAQ', fim: '2030-12-31', cor: '#06B6D4' },
            { nome: 'Tiago Chagas Faierstein', cargo: 'Diretor-Presidente', agencia: 'ANAC', fim: '2030-12-31', cor: '#8B5CF6' },
            { nome: 'Tiago Sousa Pereira', cargo: 'Diretor', agencia: 'ANAC', fim: '2026-12-31', cor: '#8B5CF6' },
            { nome: 'Ana Carolina Argolo', cargo: 'Diretora-Presidente Interina', agencia: 'ANA', fim: '2026-12-31', cor: '#60A5FA' },
            { nome: 'André Isper Rodrigues Barnabé', cargo: 'Diretor-Presidente', agencia: 'ARTESP', fim: '2027-12-31', cor: '#FBBF24' },
            { nome: 'João Carlos Accioly', cargo: 'Presidente Interino', agencia: 'CVM', fim: '2026-12-31', cor: '#22D3EE' },
            { nome: 'Thiago Mesquita Nunes', cargo: 'Diretor-Presidente', agencia: 'ARSESP', fim: '2027-12-31', cor: '#EC4899' }
        ],

        currentTab: 'todas',
        noticiasReais: [],
        carregandoNoticias: false,
        usarNoticiasReais: true, // Flag para alternar entre mock e real

        async init() {
            const page = document.getElementById('page-hub');
            page.classList.add('active');

            // Carrega notícias reais da API
            if (this.usarNoticiasReais) {
                await this.fetchNoticiasReais();
            }

            this.renderNews();
            this.renderFontes();
            this.renderTabelaFederais();
            this.renderEstaduais();
            this.renderRoadmap();
            this.updateStats();
            this.renderChart();
            this.updatePdfsCount();
            this.updateDeliberacoesCount();
            this.bindEvents();
        },

        _period: 'mensal',

        setPeriod(period) {
            this._period = period;
            document.querySelectorAll('#hub-period-toggle .period-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.period === period);
            });
            this.renderChart();
        },

        // Chart.js — Deliberation trends
        renderChart() {
            const canvas = document.getElementById('hub-chart-deliberacoes');
            if (!canvas || typeof Chart === 'undefined') return;
            if (this._chart) { this._chart.destroy(); }

            const dataByPeriod = {
                semanal: { labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], values: [4, 7, 3, 9, 5, 2, 6] },
                mensal: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'], values: [15, 24, 11, 21, 32, 23] },
                anual: { labels: ['2020', '2021', '2022', '2023', '2024', '2025'], values: [98, 124, 87, 143, 167, 89] }
            };
            const { labels, values } = dataByPeriod[this._period] || dataByPeriod.mensal;
            const total = values.reduce((a, b) => a + b, 0);
            const el = document.getElementById('hub-chart-total');
            if (el) el.textContent = total;

            this._chart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Deliberações',
                        data: values,
                        backgroundColor: 'rgba(249, 115, 22, 0.85)',
                        borderColor: 'rgba(249, 115, 22, 1)',
                        borderWidth: 0,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#1C1C1C', titleColor: '#fff', bodyColor: '#8A8FA8', borderColor: '#2A2A2A', borderWidth: 1, cornerRadius: 8, padding: 12 }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5A5F72', font: { size: 11 } } },
                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5A5F72', font: { size: 11 } } }
                    }
                }
            });
        },

        async updatePdfsCount() {
            try {
                const data = await API.get('/api/pdfs');
                const el = document.getElementById('hub-pdfs-count');
                if (el && data) el.textContent = data.total || 0;
            } catch (e) { /* silent */ }
        },

        async updateDeliberacoesCount() {
            try {
                const data = await API.get('/api/deliberacoes?limit=1');
                const el = document.querySelector('.hub-stat-viabilidade');
                if (el && data && typeof data.total === 'number') {
                    el.textContent = data.total;
                }
            } catch (e) { /* silent — keeps static value from updateStats() */ }
        },

        async fetchNoticiasReais(forceRefresh = false) {
            if (this.carregandoNoticias) return;

            this.carregandoNoticias = true;
            const container = document.getElementById('hub-news-container');
            if (container) {
                // Skeleton loading instead of spinner
                container.innerHTML = '<div class="skeleton-news-grid">' +
                    Array(5).fill(0).map(() => `
                        <div class="skeleton-news-item skeleton">
                            <div class="skeleton-badge skeleton"></div>
                            <div class="skeleton-body">
                                <div class="skeleton-text short skeleton"></div>
                                <div class="skeleton-text long skeleton"></div>
                                <div class="skeleton-text medium skeleton"></div>
                            </div>
                        </div>
                    `).join('') + '</div>';
            }

            try {
                const params = new URLSearchParams({
                    limite: '50',
                    forceRefresh: forceRefresh ? 'true' : 'false'
                });

                // Usa endpoint com inteligencia (cruzamento com deliberacoes)
                const response = await fetch('/api/noticias/inteligencia?' + params);
                const data = await response.json();

                if (data.success && data.noticias) {
                    this.noticiasReais = data.noticias.map(function(n) {
                        return {
                            agencia: n.agencia,
                            tipo: n.tipo || 'noticia',
                            titulo: n.titulo,
                            resumo: n.resumo,
                            data: n.data,
                            esfera: n.esfera || 'federal',
                            fonte: n.fonte,
                            link: n.link,
                            cor: n.cor,
                            inteligencia: n.inteligencia || null
                        };
                    });
                    this.statsInteligencia = {
                        comInteligencia: data.comInteligencia || 0,
                        deliberacoesDisponiveis: data.deliberacoesDisponiveis || 0,
                        alertasDisparados: data.alertasDisparados || 0
                    };
                    console.log('[Hub] ' + this.noticiasReais.length + ' noticias | ' + data.comInteligencia + ' com inteligencia');
                }
            } catch (error) {
                console.warn('[Hub] Fallback para noticias sem inteligencia:', error.message);
                // Fallback: tenta endpoint simples
                try {
                    var resp2 = await fetch('/api/noticias?limite=50');
                    var data2 = await resp2.json();
                    if (data2.success && data2.noticias) {
                        this.noticiasReais = data2.noticias;
                    }
                } catch (e2) {
                    this.noticiasReais = [];
                }
            }

            this.carregandoNoticias = false;
        },

        bindEvents() {
            // Tabs de noticias
            document.querySelectorAll('#page-hub .hub-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    document.querySelectorAll('#page-hub .hub-tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    this.currentTab = e.target.dataset.tab;
                    this.renderNews();
                });
            });

            // Filtros
            const filtroSetor = document.getElementById('hub-filtro-setor');
            const filtroEsfera = document.getElementById('hub-filtro-esfera');
            if (filtroSetor) filtroSetor.addEventListener('change', () => this.renderNews());
            if (filtroEsfera) filtroEsfera.addEventListener('change', () => this.renderNews());
        },

        updateStats() {
            const totalFederais = this.agenciasFederais.length;
            const totalEstaduais = this.agenciasEstaduais.length;
            const totalDiretores = this.agenciasFederais.reduce((s, a) => s + a.diretores, 0);
            const totalAlta = this.agenciasFederais.filter(a => a.viabilidade === 'alta').length;
            const totalFontes = this.agenciasFederais.length + this.orgaosComplementares.length;

            const elAgencias = document.querySelector('.hub-stat-agencias');
            const elFontes = document.querySelector('.hub-stat-fontes');
            const elDiretores = document.querySelector('.hub-stat-diretores');
            const elViabilidade = document.querySelector('.hub-stat-viabilidade');

            if (elAgencias) elAgencias.textContent = totalFederais + totalEstaduais;
            if (elFontes) elFontes.textContent = totalFontes;
            if (elDiretores) elDiretores.textContent = totalDiretores;
            if (elViabilidade) elViabilidade.textContent = totalAlta + '/' + totalFederais;
        },

        getFilteredNews() {
            // Usa notícias reais se disponíveis, senão fallback para dados de demonstração
            let news = this.noticiasReais.length > 0 ? [...this.noticiasReais] : [...this.noticias];
            const tab = this.currentTab;
            const setor = document.getElementById('hub-filtro-setor')?.value || '';
            const esfera = document.getElementById('hub-filtro-esfera')?.value || '';

            if (tab === 'federal') news = news.filter(n => n.esfera === 'federal');
            if (tab === 'estadual') news = news.filter(n => n.esfera === 'estadual');
            if (tab === 'resolucoes') news = news.filter(n => n.tipo === 'resolucao' || n.tipo === 'deliberacao' || n.tipo === 'decreto');

            if (setor) {
                const agenciasSiglas = this.agenciasFederais.filter(a => a.setor === setor).map(a => a.sigla);
                news = news.filter(n => agenciasSiglas.includes(n.agencia));
            }
            if (esfera) {
                news = news.filter(n => n.esfera === esfera);
            }

            return news;
        },

        getAgenciaColor(sigla) {
            const ag = this.agenciasFederais.find(a => a.sigla === sigla);
            return ag ? ag.cor : '#FFEF4D';
        },

        getTipoBadge(tipo) {
            const tipos = {
                resolucao: { label: 'Resolução', bg: 'rgba(74,222,128,0.2)', color: '#4ADE80' },
                noticia: { label: 'Notícia', bg: 'rgba(96,165,250,0.2)', color: '#60A5FA' },
                consulta: { label: 'Consulta Pública', bg: 'rgba(251,191,36,0.2)', color: '#FBBF24' },
                deliberacao: { label: 'Deliberação', bg: 'rgba(255,239,77,0.2)', color: '#FFEF4D' },
                decreto: { label: 'Decreto', bg: 'rgba(167,139,250,0.2)', color: '#A78BFA' },
                auditoria: { label: 'Auditoria', bg: 'rgba(248,113,113,0.2)', color: '#F87171' }
            };
            return tipos[tipo] || tipos.noticia;
        },

        renderNews() {
            const container = document.getElementById('hub-news-container');
            if (!container) return;

            const news = this.getFilteredNews();

            if (news.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="36" height="36">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">Nenhuma noticia encontrada</div>
                        <div class="empty-state-text">As noticias sao buscadas em tempo real dos RSS oficiais das agencias reguladoras. Verifique sua conexao ou tente novamente.</div>
                        <div class="empty-state-action">
                            <button class="btn btn-primary btn-sm" onclick="App.PageHub.fetchNoticiasReais(true).then(() => App.PageHub.renderNews())">
                                Tentar novamente
                            </button>
                        </div>
                    </div>`;
                return;
            }

            container.innerHTML = '<div class="hub-news-list">' + news.map(function(n) {
                var cor = PageHub.getAgenciaColor(n.agencia);
                var tipo = PageHub.getTipoBadge(n.tipo);
                var dataFormatada = new Date(n.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                var intel = n.inteligencia;
                var temIntel = intel && intel.temInteligencia;

                // Badge de inteligencia (cruzamento com deliberacoes)
                var intelBadgeHtml = '';
                if (temIntel) {
                    var numDelibs = intel.deliberacoesRelacionadas.length;
                    var empresasHtml = intel.empresasMencionadas.map(function(e) {
                        return '<span class="intel-empresa-chip">' + e + '</span>';
                    }).join('');

                    var delibsHtml = intel.deliberacoesRelacionadas.slice(0, 3).map(function(d) {
                        var decisaoCor = (d.decisao || '').toLowerCase().includes('deferido') && !(d.decisao || '').toLowerCase().includes('indeferido')
                            ? '#4ADE80' : (d.decisao || '').toLowerCase().includes('indeferido') ? '#F87171' : '#FBBF24';
                        return '<div class="intel-delib-item">' +
                            '<span class="intel-delib-proc">' + (d.processo || 'S/N') + '</span>' +
                            '<span class="intel-delib-decisao" style="color:' + decisaoCor + ';">' + (d.decisao || '-') + '</span>' +
                            '<span class="intel-delib-data">' + (d.data_reuniao || '') + '</span>' +
                            '</div>';
                    }).join('');

                    intelBadgeHtml = '<div class="intel-section">' +
                        '<div class="intel-badge" onclick="this.parentElement.classList.toggle(\'expanded\')">' +
                            '<span class="intel-icon">&#x1F4CA;</span> ' +
                            numDelibs + ' delibera' + (numDelibs === 1 ? 'cao' : 'coes') + ' relacionada' + (numDelibs === 1 ? '' : 's') +
                        '</div>' +
                        (empresasHtml ? '<div class="intel-empresas">' + empresasHtml + '</div>' : '') +
                        '<div class="intel-delibs-detail">' + delibsHtml + '</div>' +
                    '</div>';
                }

                return '<div class="hub-news-item' + (temIntel ? ' has-intelligence' : '') + '">' +
                    '<div class="hub-news-badge" style="background: ' + cor + '20; color: ' + cor + ';">' +
                        n.agencia +
                    '</div>' +
                    '<div class="hub-news-content">' +
                        '<div class="hub-news-meta">' +
                            '<span class="hub-news-agency" style="color: ' + cor + ';">' + n.agencia + '</span>' +
                            '<span class="hub-news-type" style="background: ' + tipo.bg + '; color: ' + tipo.color + ';">' + tipo.label + '</span>' +
                            '<span class="hub-news-date">' + dataFormatada + '</span>' +
                            (temIntel ? '<span class="intel-indicator" title="Cruzamento com deliberacoes da IRIS">INTEL</span>' : '') +
                        '</div>' +
                        '<div class="hub-news-title">' + (n.link ? '<a href="' + n.link + '" target="_blank" rel="noopener noreferrer">' + n.titulo + '</a>' : n.titulo) + '</div>' +
                        '<div class="hub-news-excerpt">' + n.resumo + '</div>' +
                        intelBadgeHtml +
                        '<div class="hub-news-footer">' +
                            '<div class="hub-news-source">' +
                                '<span class="hub-news-source-dot"></span>' +
                                n.fonte +
                            '</div>' +
                            (n.link ? '<a href="' + n.link + '" target="_blank" rel="noopener noreferrer" class="hub-news-link">Ver original</a>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('') + '</div>';

            // Adiciona indicador de fonte de dados
            const isRealData = this.noticiasReais.length > 0;
            const badge = document.createElement('div');
            badge.className = 'hub-data-source-badge';
            badge.innerHTML = isRealData
                ? '<span class="badge-live">AO VIVO</span> Dados de fontes oficiais (gov.br)'
                : '<span class="badge-demo">DEMO</span> Dados de demonstração';
            container.insertBefore(badge, container.firstChild);
        },

        renderFontes() {
            var container = document.getElementById('hub-fontes-container');
            if (!container) return;

            // Renderiza Radar Regulatorio (dados reais) + Fontes + Alertas
            container.innerHTML = '<div class="hub-sidebar-sections">' +
                '<div id="hub-radar-section" class="hub-sidebar-section">' +
                    '<h4 class="hub-sidebar-title">Radar Regulatorio</h4>' +
                    '<div id="hub-radar-content" class="hub-radar-loading">Carregando radar...</div>' +
                '</div>' +
                '<div id="hub-alertas-section" class="hub-sidebar-section">' +
                    '<h4 class="hub-sidebar-title">Alertas Configurados</h4>' +
                    '<div id="hub-alertas-content"></div>' +
                    '<div class="hub-alerta-form">' +
                        '<select id="hub-alerta-tipo" class="hub-alerta-select">' +
                            '<option value="empresa">Empresa</option>' +
                            '<option value="tema">Tema</option>' +
                            '<option value="agencia">Agencia</option>' +
                        '</select>' +
                        '<input id="hub-alerta-valor" type="text" placeholder="Ex: CCR, tarifa, ANEEL" class="hub-alerta-input">' +
                        '<button onclick="App.PageHub.criarAlerta()" class="hub-alerta-btn">+</button>' +
                    '</div>' +
                '</div>' +
                '<div class="hub-sidebar-section">' +
                    '<h4 class="hub-sidebar-title">Fontes de Dados</h4>' +
                    '<div id="hub-fontes-list"></div>' +
                '</div>' +
            '</div>';

            // Fontes de dados
            var fontes = [
                { nome: 'DOU - Diario Oficial', tipo: 'API REST', status: 'online', cor: '#A78BFA' },
                { nome: 'Gov.br RSS (28 fontes)', tipo: 'RSS Feed', status: 'online', cor: '#60A5FA' },
                { nome: 'ANEEL Dados Abertos', tipo: 'API REST', status: 'online', cor: '#FFEF4D' },
                { nome: 'ANP Composicao', tipo: 'Web', status: 'online', cor: '#14B8A6' }
            ];

            var fontesList = document.getElementById('hub-fontes-list');
            if (fontesList) {
                fontesList.innerHTML = fontes.map(function(f) {
                    return '<div class="hub-fonte-item">' +
                        '<div class="hub-fonte-icon" style="background: ' + f.cor + '20; color: ' + f.cor + ';">' +
                            '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>' +
                        '</div>' +
                        '<div class="hub-fonte-info">' +
                            '<div class="hub-fonte-nome">' + f.nome + '</div>' +
                            '<div class="hub-fonte-tipo">' + f.tipo + '</div>' +
                        '</div>' +
                        '<div class="hub-fonte-status ' + f.status + '"></div>' +
                    '</div>';
                }).join('');
            }

            // Carrega radar regulatorio (async)
            this.carregarRadar();
            // Carrega alertas
            this.carregarAlertas();
        },

        async carregarRadar() {
            var radarEl = document.getElementById('hub-radar-content');
            if (!radarEl) return;

            try {
                var resp = await fetch('/api/inteligencia/radar?dias=7');
                var data = await resp.json();

                if (data.success && data.temas && data.temas.length > 0) {
                    var maxIntensidade = data.temas[0].intensidade || 1;
                    radarEl.innerHTML = data.temas.slice(0, 8).map(function(t) {
                        var pct = Math.round((t.intensidade / maxIntensidade) * 100);
                        var cores = {
                            critico: '#EF4444',
                            alto: '#F97316',
                            medio: '#FBBF24',
                            baixo: '#6B7280'
                        };
                        var cor = cores[t.nivel] || '#6B7280';
                        return '<div class="radar-item">' +
                            '<div class="radar-item-header">' +
                                '<span class="radar-tema">' + t.temaLabel + '</span>' +
                                '<span class="radar-count" style="color:' + cor + ';">' + t.total + '</span>' +
                            '</div>' +
                            '<div class="radar-bar-bg">' +
                                '<div class="radar-bar-fill" style="width:' + pct + '%; background:' + cor + ';"></div>' +
                            '</div>' +
                            '<div class="radar-detail">' +
                                t.noticias + ' not. | ' + t.deliberacoes + ' delib.' +
                                (t.empresas.length > 0 ? ' | ' + t.empresas.slice(0, 2).join(', ') : '') +
                            '</div>' +
                        '</div>';
                    }).join('');

                    if (data.temasQuentes > 0) {
                        radarEl.innerHTML = '<div class="radar-alert">' + data.temasQuentes + ' tema(s) quente(s) esta semana</div>' + radarEl.innerHTML;
                    }
                } else {
                    radarEl.innerHTML = '<div class="radar-empty">Nenhum tema detectado nos ultimos 7 dias. Colete PDFs para ativar o radar.</div>';
                }
            } catch (e) {
                radarEl.innerHTML = '<div class="radar-empty">Radar indisponivel</div>';
            }
        },

        async carregarAlertas() {
            var alertasEl = document.getElementById('hub-alertas-content');
            if (!alertasEl) return;

            try {
                var resp = await fetch('/api/inteligencia/alertas');
                var data = await resp.json();

                if (data.success && data.alertas.length > 0) {
                    alertasEl.innerHTML = data.alertas.map(function(a) {
                        var tipoIcon = a.tipo === 'empresa' ? '&#x1F3E2;' : a.tipo === 'tema' ? '&#x1F4CB;' : '&#x1F3DB;';
                        return '<div class="alerta-item">' +
                            '<span class="alerta-icon">' + tipoIcon + '</span>' +
                            '<span class="alerta-valor">' + a.valor + '</span>' +
                            '<span class="alerta-tipo-tag">' + a.tipo + '</span>' +
                            '<button class="alerta-remove" onclick="App.PageHub.removerAlerta(\'' + a.id + '\')" title="Remover">x</button>' +
                        '</div>';
                    }).join('');
                } else {
                    alertasEl.innerHTML = '<div class="alertas-empty">Nenhum alerta. Crie um abaixo.</div>';
                }
            } catch (e) {
                alertasEl.innerHTML = '<div class="alertas-empty">Alertas indisponiveis</div>';
            }
        },

        async criarAlerta() {
            var tipo = document.getElementById('hub-alerta-tipo');
            var valor = document.getElementById('hub-alerta-valor');
            if (!tipo || !valor || !valor.value.trim()) return;

            try {
                await fetch('/api/inteligencia/alertas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tipo: tipo.value, valor: valor.value.trim() })
                });
                valor.value = '';
                this.carregarAlertas();
            } catch (e) {
                console.error('[Hub] Erro ao criar alerta:', e.message);
            }
        },

        async removerAlerta(id) {
            try {
                await fetch('/api/inteligencia/alertas/' + id, { method: 'DELETE' });
                this.carregarAlertas();
            } catch (e) {
                console.error('[Hub] Erro ao remover alerta:', e.message);
            }
        },

        renderTabelaFederais() {
            const container = document.getElementById('hub-tabela-federais');
            if (!container) return;

            container.innerHTML = this.agenciasFederais.map(a => {
                const viabClasse = a.viabilidade === 'alta' ? 'viabilidade-alta' : 'viabilidade-media';
                const viabTexto = a.viabilidade === 'alta' ? 'Alta' : 'Media';

                return `
                    <tr>
                        <td><strong style="color: ${a.cor};">${a.sigla}</strong><br><span style="font-size:11px; color: var(--text-muted);">${a.nome}</span></td>
                        <td>${this.formatSetor(a.setor)}</td>
                        <td><span style="font-size:12px;">${a.fonte}</span></td>
                        <td style="text-align:center;">${a.diretores}</td>
                        <td style="text-align:center;">${a.mandato} anos</td>
                        <td><span class="badge ${viabClasse}" style="padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600;">${viabTexto}</span></td>
                    </tr>
                `;
            }).join('');
        },

        formatSetor(setor) {
            const setores = {
                energia: 'Energia',
                telecom: 'Telecomunicações',
                transporte: 'Transportes',
                saude: 'Saúde',
                saneamento: 'Saneamento',
                petroleo: 'Petróleo e Gás',
                mineracao: 'Mineração',
                aviacao: 'Aviação Civil',
                cinema: 'Cinema/Audiovisual',
                multisetorial: 'Multisetorial'
            };
            return setores[setor] || setor;
        },

        renderEstaduais() {
            const container = document.getElementById('hub-estaduais-container');
            if (!container) return;

            container.innerHTML = this.agenciasEstaduais.map(a => `
                <div class="hub-estadual-card">
                    <div class="hub-estadual-sigla">${a.sigla}</div>
                    <div class="hub-estadual-info">
                        <div class="hub-estadual-nome">${a.nome}</div>
                        <div class="hub-estadual-estado">${a.estado} - ${this.formatSetor(a.setor)}</div>
                    </div>
                </div>
            `).join('');
        },

        renderRoadmap() {
            const container = document.getElementById('hub-roadmap-container');
            if (!container) return;

            const fases = [
                {
                    numero: 1,
                    titulo: 'Notícias das Agências',
                    desc: 'Criar scrapers e RSS readers para cada agência. A maioria publica notícias via RSS ou tem página paginável. Armazenar em Supabase.',
                    status: 'active',
                    items: ['RSS Readers', 'Web Scrapers', 'Supabase Storage', 'Feed Aggregator']
                },
                {
                    numero: 2,
                    titulo: 'Mandatos dos Diretores',
                    desc: 'Dados públicos do Diário Oficial da União (DOU). Criar tabela de diretores com mandatos e alertas automáticos de troca.',
                    status: 'pending',
                    items: ['API DOU', 'Tabela Diretores', 'Alertas Automáticos', 'Decretos']
                },
                {
                    numero: 3,
                    titulo: 'Decisões e Resoluções',
                    desc: 'Scraping do DOU para resoluções. ANEEL/ANA publicam em formato estruturado. Classificar por setor regulatório.',
                    status: 'pending',
                    items: ['Scraping DOU', 'Classificação por Setor', 'Dados Estruturados', 'Timeline']
                }
            ];

            container.innerHTML = '<div class="hub-roadmap">' + fases.map(f => `
                <div class="hub-roadmap-fase">
                    <div class="hub-roadmap-marker ${f.status}">
                        ${f.status === 'done' ? '&#10003;' : f.numero}
                    </div>
                    <div class="hub-roadmap-content">
                        <div class="hub-roadmap-title">Fase ${f.numero} — ${f.titulo}</div>
                        <div class="hub-roadmap-desc">${f.desc}</div>
                        <div class="hub-roadmap-items">
                            ${f.items.map(i => '<span class="hub-roadmap-tag">' + i + '</span>').join('')}
                        </div>
                    </div>
                </div>
            `).join('') + '</div>';
        }
    };

    // ============================================
    // PAGE: Agencias (Visualizacao Isometrica 3D)
    // ============================================
    const PageAgencias = {
        searchTerm: '',
        filtroEsfera: '',
        filtroSetor: '',
        viewMode: 'grid',
        agenciasFromApi: null,

        coresSetor: {
            'Energia Elétrica': '#FFEF4D',
            'Telecomunicações': '#4ADE80',
            'Petróleo e Gás': '#F472B6',
            'Vigilância Sanitária': '#A78BFA',
            'Aviação Civil': '#8B5CF6',
            'Transportes Terrestres': '#60A5FA',
            'Transportes Aquaviários': '#22D3EE',
            'Águas': '#06B6D4',
            'Cinema e Audiovisual': '#FB923C',
            'Saúde Suplementar': '#F87171',
            'Mineração': '#818CF8',
            'Transporte Rodoviário SP': '#FFEF4D',
            'Saneamento e Energia SP': '#34D399',
            'Transportes MG': '#FCD34D',
            'Transporte Rodoviário RS': '#93C5FD'
        },

        agencias: [
            { id: 'artesp', nome: 'ARTESP', nomeCompleto: 'Agência de Transporte do Estado de São Paulo', setor: 'Transporte Rodoviário SP', esfera: 'Estadual', uf: 'SP', decisoes: 1247, aprovadas: 892, cor: '#FFEF4D', lei: 'Decreto nº 46.486/2002', vinculacao: 'Governo do Estado de SP', diretores: [
                { nome: 'André Ísper Rodrigues Barnabé', cargo: 'Diretor-Presidente', iniciais: 'AI', mandato: '2023-2027' },
                { nome: 'Diego Albert Zanatto', cargo: 'Diretor de Fiscalização', iniciais: 'DZ', mandato: '2023-2027' },
                { nome: 'Fernanda Esbízaro Rodrigues Rudnik', cargo: 'Diretora de Planejamento', iniciais: 'FR', mandato: '2023-2027' },
                { nome: 'Raquel França Carneiro', cargo: 'Diretora de Investimentos', iniciais: 'RC', mandato: '2023-2027' }
            ]},
            { id: 'aneel', nome: 'ANEEL', nomeCompleto: 'Agência Nacional de Energia Elétrica', setor: 'Energia Elétrica', esfera: 'Federal', uf: 'DF', decisoes: 2456, aprovadas: 1842, cor: '#FFEF4D', lei: 'Lei nº 9.427/1996', vinculacao: 'Min. de Minas e Energia', diretores: [
                { nome: 'Sandoval de Araújo Feitosa Neto', cargo: 'Diretor-Geral', iniciais: 'SF', mandato: '2022-2027' },
                { nome: 'Agnes Maria de Aragão da Costa', cargo: 'Diretora', iniciais: 'AC', mandato: '2022-2028' },
                { nome: 'Fernando Luiz Mosna Ferreira da Silva', cargo: 'Diretor', iniciais: 'FM', mandato: '2022-2026' },
                { nome: 'Willamy Moreira Frota', cargo: 'Diretor', iniciais: 'WF', mandato: '2025-2029' },
                { nome: 'Gentil Nogueira de Sá Júnior', cargo: 'Diretor', iniciais: 'GS', mandato: '2025-2030' }
            ]},
            { id: 'anatel', nome: 'ANATEL', nomeCompleto: 'Agência Nacional de Telecomunicações', setor: 'Telecomunicações', esfera: 'Federal', uf: 'DF', decisoes: 1890, aprovadas: 1512, cor: '#4ADE80', lei: 'Lei nº 9.472/1997', vinculacao: 'Min. das Comunicações', diretores: [
                { nome: 'Carlos Manuel Baigorri', cargo: 'Presidente', iniciais: 'CB', mandato: '2022-2026' },
                { nome: 'Alexandre Reis Siqueira Freire', cargo: 'Conselheiro', iniciais: 'AF', mandato: '2022-2027' },
                { nome: 'Octávio Penna Pieranti', cargo: 'Conselheiro', iniciais: 'OP', mandato: '2025-2028' },
                { nome: 'Edson Victor Eugênio de Holanda', cargo: 'Conselheiro', iniciais: 'EH', mandato: '2025-2029' }
            ]},
            { id: 'anp', nome: 'ANP', nomeCompleto: 'Agência Nacional do Petróleo, Gás Natural e Biocombustíveis', setor: 'Petróleo e Gás', esfera: 'Federal', uf: 'DF', decisoes: 1234, aprovadas: 987, cor: '#F472B6', lei: 'Lei nº 9.478/1997', vinculacao: 'Min. de Minas e Energia', diretores: [
                { nome: 'Artur Watt Neto', cargo: 'Diretor-Geral', iniciais: 'AW', mandato: '2025-2029' },
                { nome: 'Symone Christine de Santana Araújo', cargo: 'Diretora', iniciais: 'SA', mandato: '2023-2027' },
                { nome: 'Daniel Maia Vieira', cargo: 'Diretor', iniciais: 'DM', mandato: '2022-2026' },
                { nome: 'Fernando Wandscheer de Moura Alves', cargo: 'Diretor', iniciais: 'FM', mandato: '2022-2026' },
                { nome: 'Pietro Adamo Sampaio Mendes', cargo: 'Diretor', iniciais: 'PM', mandato: '2025-2029' }
            ]},
            { id: 'anvisa', nome: 'ANVISA', nomeCompleto: 'Agência Nacional de Vigilância Sanitária', setor: 'Vigilância Sanitária', esfera: 'Federal', uf: 'DF', decisoes: 3210, aprovadas: 2568, cor: '#A78BFA', lei: 'Lei nº 9.782/1999', vinculacao: 'Min. da Saúde', diretores: [
                { nome: 'Leandro Pinheiro Safatle', cargo: 'Diretor-Presidente', iniciais: 'LS', mandato: '2025-2030' },
                { nome: 'Daniel Meirelles Fernandes Pereira', cargo: 'Diretor', iniciais: 'DP', mandato: '2023-2028' },
                { nome: 'Daniela Marreco Cerqueira', cargo: 'Diretora', iniciais: 'DC', mandato: '2025-2030' },
                { nome: 'Thiago Lopes Cardoso Campos', cargo: 'Diretor', iniciais: 'TC', mandato: '2025-2030' }
            ]},
            { id: 'anac', nome: 'ANAC', nomeCompleto: 'Agência Nacional de Aviação Civil', setor: 'Aviação Civil', esfera: 'Federal', uf: 'DF', decisoes: 980, aprovadas: 784, cor: '#8B5CF6', lei: 'Lei nº 11.182/2005', vinculacao: 'Min. de Portos e Aeroportos', diretores: [
                { nome: 'Tiago Chagas Faierstein', cargo: 'Diretor-Presidente', iniciais: 'TF', mandato: '2025-2030' },
                { nome: 'Tiago Sousa Pereira', cargo: 'Diretor', iniciais: 'TP', mandato: '2022-2026' },
                { nome: 'Luiz Ricardo de Souza Nascimento', cargo: 'Diretor', iniciais: 'LN', mandato: '2022-2026' },
                { nome: 'Rui Chagas Mesquita', cargo: 'Diretor', iniciais: 'RM', mandato: '2025-2030' },
                { nome: 'Antônio Mathias Nogueira Moreira', cargo: 'Diretor', iniciais: 'AM', mandato: '2025-2030' }
            ]},
            { id: 'antt', nome: 'ANTT', nomeCompleto: 'Agência Nacional de Transportes Terrestres', setor: 'Transportes Terrestres', esfera: 'Federal', uf: 'DF', decisoes: 1567, aprovadas: 1175, cor: '#60A5FA', lei: 'Lei nº 10.233/2001', vinculacao: 'Min. dos Transportes', diretores: [
                { nome: 'Guilherme Theo Rodrigues da Rocha Sampaio', cargo: 'Diretor-Geral', iniciais: 'GS', mandato: '2025-2030' },
                { nome: 'Alex Antônio de Azevedo Cruz', cargo: 'Diretor', iniciais: 'AC', mandato: '2025-2030' },
                { nome: 'Felipe Fernandes Queiroz', cargo: 'Diretor', iniciais: 'FQ', mandato: '2023-2027' }
            ]},
            { id: 'antaq', nome: 'ANTAQ', nomeCompleto: 'Agência Nacional de Transportes Aquaviários', setor: 'Transportes Aquaviários', esfera: 'Federal', uf: 'DF', decisoes: 678, aprovadas: 475, cor: '#22D3EE', lei: 'Lei nº 10.233/2001', vinculacao: 'Min. de Portos e Aeroportos', diretores: [
                { nome: 'Frederico Carvalho Dias', cargo: 'Diretor-Geral', iniciais: 'FD', mandato: '2025-2030' },
                { nome: 'Wilson Lima Filho', cargo: 'Diretor', iniciais: 'WL', mandato: '2025-2029' }
            ]},
            { id: 'ana', nome: 'ANA', nomeCompleto: 'Agência Nacional de Águas e Saneamento Básico', setor: 'Águas', esfera: 'Federal', uf: 'DF', decisoes: 890, aprovadas: 712, cor: '#06B6D4', lei: 'Lei nº 9.984/2000', vinculacao: 'Min. do Meio Ambiente', diretores: [
                { nome: 'Ana Carolina Argolo Nascimento de Castro', cargo: 'Diretora-Presidente Interina', iniciais: 'AC', mandato: '2026-2026' },
                { nome: 'Larissa Oliveira Rego', cargo: 'Diretora', iniciais: 'LR', mandato: '2025-2030' },
                { nome: 'Cristiane Collet Battiston', cargo: 'Diretora', iniciais: 'CB', mandato: '2025-2030' },
                { nome: 'Leonardo Goes Silva', cargo: 'Diretor', iniciais: 'LG', mandato: '2025-2030' }
            ]},
            { id: 'ancine', nome: 'ANCINE', nomeCompleto: 'Agência Nacional do Cinema', setor: 'Cinema e Audiovisual', esfera: 'Federal', uf: 'RJ', decisoes: 345, aprovadas: 276, cor: '#FB923C', lei: 'MP nº 2.228-1/2001', vinculacao: 'Min. da Cultura', diretores: [
                { nome: 'Alex Braga Muniz', cargo: 'Diretor-Presidente', iniciais: 'AM', mandato: '2023-2027' }
            ]},
            { id: 'ans', nome: 'ANS', nomeCompleto: 'Agência Nacional de Saúde Suplementar', setor: 'Saúde Suplementar', esfera: 'Federal', uf: 'RJ', decisoes: 1890, aprovadas: 1323, cor: '#F87171', lei: 'Lei nº 9.961/2000', vinculacao: 'Min. da Saúde', diretores: [
                { nome: 'Wadih Nemer Damous Filho', cargo: 'Diretor-Presidente', iniciais: 'WD', mandato: '2025-2029' },
                { nome: 'Eliane Aparecida de Castro Medeiros', cargo: 'Diretora de Fiscalização', iniciais: 'EM', mandato: '2022-2026' },
                { nome: 'Jorge Antônio Aquino Lopes', cargo: 'Diretor', iniciais: 'JL', mandato: '2024-2029' },
                { nome: 'Lenise Barcellos de Mello Secchin', cargo: 'Diretora', iniciais: 'LS', mandato: '2025-2030' }
            ]},
            { id: 'anm', nome: 'ANM', nomeCompleto: 'Agência Nacional de Mineração', setor: 'Mineração', esfera: 'Federal', uf: 'DF', decisoes: 892, aprovadas: 654, cor: '#818CF8', lei: 'Lei nº 13.575/2017', vinculacao: 'Min. de Minas e Energia', diretores: [
                { nome: 'Mauro Henrique Moreira Sousa', cargo: 'Diretor-Geral', iniciais: 'MM', mandato: '2022-2026' },
                { nome: 'José Fernando de Mendonça Gomes Junior', cargo: 'Diretor', iniciais: 'JG', mandato: '2022-2026' }
            ]},
            { id: 'arsesp', nome: 'ARSESP', nomeCompleto: 'Agência Reguladora de Serviços Públicos de SP', setor: 'Saneamento e Energia SP', esfera: 'Estadual', uf: 'SP', decisoes: 567, aprovadas: 397, cor: '#34D399', lei: 'LC nº 1.025/2007', vinculacao: 'Governo do Estado de SP', diretores: [
                { nome: 'Thiago Mesquita Nunes', cargo: 'Diretor-Presidente', iniciais: 'TN', mandato: '2023-2027' }
            ]},
            { id: 'agetransp', nome: 'AGETRANSP', nomeCompleto: 'Agência Reguladora de Transportes do RJ', setor: 'Transportes', esfera: 'Estadual', uf: 'RJ', decisoes: 423, aprovadas: 296, cor: '#FCA5A5', lei: 'Lei nº 4.555/2005', vinculacao: 'Governo do Estado do RJ', diretores: []},
            { id: 'agergs', nome: 'AGERGS', nomeCompleto: 'Agência Estadual de Regulação do RS', setor: 'Transporte Rodoviário RS', esfera: 'Estadual', uf: 'RS', decisoes: 389, aprovadas: 272, cor: '#93C5FD', lei: 'Lei nº 10.931/1997', vinculacao: 'Governo do Estado do RS', diretores: []},
            { id: 'agemg', nome: 'AGEMG', nomeCompleto: 'Agência Reguladora de Transportes de MG', setor: 'Transportes MG', esfera: 'Estadual', uf: 'MG', decisoes: 512, aprovadas: 358, cor: '#FCD34D', lei: 'Lei nº 23.304/2019', vinculacao: 'Governo do Estado de MG', diretores: []}
        ],

        init() {
            const page = document.getElementById('page-agencias');
            page.classList.add('active');
            this.fetchAgenciasFromApi();
            this.bindFilters();
            this.render();
        },

        async fetchAgenciasFromApi() {
            try {
                const resp = await fetch('/api/agencias-reguladoras');
                const data = await resp.json();
                if (data.success && data.agencias) {
                    this.agenciasFromApi = data.agencias;
                    // Merge API data with local data
                    for (const apiAg of data.agencias) {
                        const local = this.agencias.find(a => a.nome === apiAg.sigla);
                        if (local) {
                            local.diretores = apiAg.diretores.map(d => ({
                                nome: d.nome, cargo: d.cargo,
                                iniciais: d.nome.split(' ').filter((_,i,arr) => i === 0 || i === arr.length - 1).map(w => w[0]).join(''),
                                mandato: d.mandato || ''
                            }));
                            local.lei = apiAg.lei_criacao || local.lei;
                            local.vinculacao = apiAg.vinculacao || local.vinculacao;
                        }
                    }
                    this.render();
                }
            } catch (e) {
                console.warn('[Agencias] API indisponível, usando dados locais');
            }
        },

        bindFilters() {
            const esferaFilter = document.getElementById('filtro-esfera');
            const setorFilter = document.getElementById('filtro-setor');
            const searchInput = document.getElementById('agencia-search-input');

            if (esferaFilter) esferaFilter.addEventListener('change', (e) => { this.filtroEsfera = e.target.value; this.render(); });
            if (setorFilter) setorFilter.addEventListener('change', (e) => { this.filtroSetor = e.target.value; this.render(); });
            if (searchInput) searchInput.addEventListener('input', (e) => { this.searchTerm = e.target.value.toLowerCase(); this.render(); });
        },

        getFiltered() {
            return this.agencias.filter(a => {
                if (this.filtroEsfera && a.esfera.toLowerCase() !== this.filtroEsfera) return false;
                if (this.filtroSetor && !a.setor.toLowerCase().includes(this.filtroSetor)) return false;
                if (this.searchTerm && !a.nome.toLowerCase().includes(this.searchTerm) && !a.nomeCompleto.toLowerCase().includes(this.searchTerm) && !a.setor.toLowerCase().includes(this.searchTerm)) return false;
                return true;
            });
        },

        render() {
            const filtered = this.getFiltered();
            this.updateStats(filtered);
            this.renderAgencyCards(filtered);
            this.renderComparisonTable(filtered);
        },

        updateStats(filtered) {
            const all = filtered || this.agencias;
            const totalDecisoes = all.reduce((sum, a) => sum + a.decisoes, 0);
            const totalAprovadas = all.reduce((sum, a) => sum + a.aprovadas, 0);
            const totalDiretores = all.reduce((sum, a) => sum + (a.diretores ? a.diretores.length : 0), 0);
            const taxaMedia = totalDecisoes > 0 ? Math.round((totalAprovadas / totalDecisoes) * 100) : 0;
            const federais = all.filter(a => a.esfera === 'Federal').length;
            const estaduais = all.filter(a => a.esfera === 'Estadual').length;

            const statsEl = document.querySelectorAll('#page-agencias .stats-value');
            if (statsEl.length >= 4) {
                statsEl[0].textContent = all.length;
                statsEl[1].textContent = totalDecisoes.toLocaleString('pt-BR');
                statsEl[2].textContent = taxaMedia + '%';
                statsEl[3].textContent = totalDiretores;
            }
            const subtitles = document.querySelectorAll('#page-agencias .stat-card-subtitle');
            if (subtitles.length >= 1) {
                subtitles[0].textContent = `${federais} federais, ${estaduais} estaduais`;
            }
        },

        renderAgencyCards(filtered) {
            const container = document.getElementById('agency-cards-container');
            if (!container) return;

            if (filtered.length === 0) {
                container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">Nenhuma agência encontrada com os filtros selecionados.</div>';
                return;
            }

            container.innerHTML = filtered.map(a => {
                const cor = this.coresSetor[a.setor] || a.cor || '#FFEF4D';
                const taxa = a.decisoes > 0 ? Math.round((a.aprovadas / a.decisoes) * 100) : 0;
                const diretoresCount = (a.diretores || []).length;

                return `
                <div class="agency-card-modern" style="--agency-color: ${cor};">
                    <div class="agency-card-top">
                        <div class="agency-card-sigla" style="background: ${cor}18; color: ${cor}; border: 1px solid ${cor}30;">${a.nome}</div>
                        <span class="agency-badge-modern ${a.esfera === 'Federal' ? 'federal' : 'estadual'}">${a.esfera}${a.uf ? ' · ' + a.uf : ''}</span>
                    </div>
                    <div class="agency-card-name">${a.nomeCompleto}</div>
                    <div class="agency-card-setor">${a.setor}</div>
                    ${a.vinculacao ? `<div class="agency-card-vinc">${a.vinculacao}</div>` : ''}
                    <div class="agency-card-metrics">
                        <div class="agency-metric">
                            <div class="agency-metric-value" style="color: ${cor};">${a.decisoes.toLocaleString('pt-BR')}</div>
                            <div class="agency-metric-label">Deliberações</div>
                        </div>
                        <div class="agency-metric">
                            <div class="agency-metric-value" style="color: var(--success);">${taxa}%</div>
                            <div class="agency-metric-label">Deferimento</div>
                        </div>
                        <div class="agency-metric">
                            <div class="agency-metric-value">${diretoresCount}</div>
                            <div class="agency-metric-label">Diretores</div>
                        </div>
                    </div>
                    ${diretoresCount > 0 ? `
                    <div class="agency-card-directors">
                        <div class="agency-directors-avatars">
                            ${(a.diretores || []).slice(0, 5).map(d => `
                                <div class="agency-avatar-mini" style="background: ${cor};" title="${d.nome} — ${d.cargo}${d.mandato ? ' (' + d.mandato + ')' : ''}">${d.iniciais}</div>
                            `).join('')}
                            ${diretoresCount > 5 ? `<div class="agency-avatar-mini more">+${diretoresCount - 5}</div>` : ''}
                        </div>
                    </div>` : '<div class="agency-card-directors-empty">Dados de diretoria pendentes</div>'}
                    ${a.lei ? `<div class="agency-card-lei">${a.lei}</div>` : ''}
                </div>
            `}).join('');
        },

        renderComparisonTable(filtered) {
            const tbody = document.querySelector('#page-agencias table tbody');
            if (!tbody) return;

            tbody.innerHTML = filtered.map(a => {
                const cor = this.coresSetor[a.setor] || a.cor || '#FFEF4D';
                const taxa = a.decisoes > 0 ? Math.round((a.aprovadas / a.decisoes) * 100) : 0;
                const diretoresCount = (a.diretores || []).length;

                return `<tr>
                    <td><strong style="color: ${cor};">${a.nome}</strong></td>
                    <td><span class="badge ${a.esfera === 'Federal' ? 'badge-warning' : 'badge-info'}">${a.esfera}</span></td>
                    <td>${a.setor}</td>
                    <td>${a.decisoes.toLocaleString('pt-BR')}</td>
                    <td>${a.aprovadas.toLocaleString('pt-BR')}</td>
                    <td><span style="color: var(--success);">${taxa}%</span></td>
                    <td>${diretoresCount}</td>
                </tr>`;
            }).join('');
        }
    };

    // ============================================
    // PAGE: Mapa do Brasil (D3 + TopoJSON)
    // ============================================
    const PageMapa = {
        selectedState: null,
        _d3Rendered: false,
        _tooltip: null,

        // Mapeamento de código IBGE (codarea) → sigla do estado
        ibgeToSigla: {
            '12': 'AC', '27': 'AL', '13': 'AM', '16': 'AP', '29': 'BA',
            '23': 'CE', '53': 'DF', '32': 'ES', '52': 'GO', '21': 'MA',
            '31': 'MG', '50': 'MS', '51': 'MT', '15': 'PA', '25': 'PB',
            '26': 'PE', '22': 'PI', '41': 'PR', '33': 'RJ', '24': 'RN',
            '11': 'RO', '14': 'RR', '43': 'RS', '42': 'SC', '28': 'SE',
            '35': 'SP', '17': 'TO'
        },

        // Dados base dos estados
        estados: {
            'SP': { nome: 'São Paulo', regiao: 'Sudeste', agencias: ['ARTESP', 'ARSESP'] },
            'RJ': { nome: 'Rio de Janeiro', regiao: 'Sudeste', agencias: ['AGENERSA'] },
            'MG': { nome: 'Minas Gerais', regiao: 'Sudeste', agencias: ['ARSAE-MG'] },
            'RS': { nome: 'Rio Grande do Sul', regiao: 'Sul', agencias: ['AGERGS'] },
            'PR': { nome: 'Paraná', regiao: 'Sul', agencias: ['AGEPAR'] },
            'SC': { nome: 'Santa Catarina', regiao: 'Sul', agencias: ['AGESC'] },
            'BA': { nome: 'Bahia', regiao: 'Nordeste', agencias: ['AGERBA'] },
            'GO': { nome: 'Goiás', regiao: 'Centro-Oeste', agencias: ['AGR'] },
            'PE': { nome: 'Pernambuco', regiao: 'Nordeste', agencias: ['ARPE'] },
            'CE': { nome: 'Ceará', regiao: 'Nordeste', agencias: ['ARCE'] },
            'PA': { nome: 'Pará', regiao: 'Norte', agencias: ['ARCON'] },
            'AM': { nome: 'Amazonas', regiao: 'Norte', agencias: ['ARSAM'] },
            'DF': { nome: 'Distrito Federal', regiao: 'Centro-Oeste', agencias: ['ADASA'] },
            'MT': { nome: 'Mato Grosso', regiao: 'Centro-Oeste', agencias: ['AGER-MT'] },
            'MS': { nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste', agencias: ['AGEPAN'] },
            'MA': { nome: 'Maranhão', regiao: 'Nordeste', agencias: ['ARSEMA'] },
            'RN': { nome: 'Rio Grande do Norte', regiao: 'Nordeste', agencias: ['ARSEP'] },
            'PI': { nome: 'Piauí', regiao: 'Nordeste', agencias: [] },
            'AL': { nome: 'Alagoas', regiao: 'Nordeste', agencias: ['ARSAL'] },
            'PB': { nome: 'Paraíba', regiao: 'Nordeste', agencias: ['ARPB'] },
            'ES': { nome: 'Espírito Santo', regiao: 'Sudeste', agencias: ['ARSES'] },
            'RO': { nome: 'Rondônia', regiao: 'Norte', agencias: [] },
            'TO': { nome: 'Tocantins', regiao: 'Norte', agencias: [] },
            'AC': { nome: 'Acre', regiao: 'Norte', agencias: [] },
            'AP': { nome: 'Amapá', regiao: 'Norte', agencias: [] },
            'RR': { nome: 'Roraima', regiao: 'Norte', agencias: [] },
            'SE': { nome: 'Sergipe', regiao: 'Nordeste', agencias: [] }
        },

        // Dados de deliberações por estado (preenchidos via stateData ou DB)
        stateData: [],

        async init() {
            this.stateData = [];
            await this._loadStateData();
            this.renderTopStates();
            await this.renderD3Map();
        },

        async _loadStateData() {
            try {
                const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ENV || {};
                if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
                const res = await fetch(
                    `${SUPABASE_URL}/rest/v1/deliberacoes_extraidas?select=agencia,decisao&limit=5000`,
                    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
                );
                if (!res.ok) return;
                const rows = await res.json();
                // Count by state (map agencia → state sigla)
                const agenciaToSigla = { 'ARTESP': 'SP', 'ARSESP': 'SP', 'AGENERSA': 'RJ', 'ARSAE-MG': 'MG',
                    'AGERGS': 'RS', 'AGEPAR': 'PR', 'AGESC': 'SC', 'AGERBA': 'BA', 'AGR': 'GO',
                    'ARPE': 'PE', 'ARCE': 'CE', 'ARCON': 'PA', 'ARSAM': 'AM', 'ADASA': 'DF',
                    'AGER-MT': 'MT', 'AGEPAN': 'MS', 'ARSEMA': 'MA', 'ARSEP': 'RN', 'ARSAL': 'AL',
                    'ARPB': 'PB', 'ARSES': 'ES', 'ANATEL': 'DF', 'ANEEL': 'DF', 'ANP': 'DF',
                    'ANVISA': 'DF', 'ANAC': 'DF', 'ANM': 'DF', 'ANA': 'DF', 'ANTT': 'DF' };
                const counts = {};
                for (const row of rows) {
                    const sigla = agenciaToSigla[row.agencia] || null;
                    if (sigla) counts[sigla] = (counts[sigla] || 0) + 1;
                }
                this.stateData = Object.entries(counts).map(([sigla, total]) => ({ sigla, total }));
            } catch (e) {
                // Use static fallback
                this.stateData = [
                    { sigla: 'SP', total: 4521 }, { sigla: 'RJ', total: 2134 },
                    { sigla: 'MG', total: 1876 }, { sigla: 'RS', total: 1245 },
                    { sigla: 'PR', total: 1123 }, { sigla: 'SC', total: 892 },
                    { sigla: 'BA', total: 743 }, { sigla: 'GO', total: 612 },
                    { sigla: 'PE', total: 534 }, { sigla: 'CE', total: 489 },
                    { sigla: 'PA', total: 312 }, { sigla: 'DF', total: 287 }
                ];
            }
        },

        _getTotalForState(sigla) {
            const entry = this.stateData.find(s => s.sigla === sigla);
            return entry ? entry.total : 0;
        },

        async renderD3Map() {
            const container = document.getElementById('mapa-brasil-container');
            if (!container) return;
            if (this._d3Rendered) return;

            container.innerHTML = '<p style="color:var(--text-tertiary);padding:20px;text-align:center;font-size:13px;">Carregando mapa...</p>';

            try {
                if (typeof d3 === 'undefined') {
                    container.innerHTML = '<p style="color:var(--text-tertiary);padding:20px;text-align:center">D3.js não disponível</p>';
                    return;
                }

                const geoData = await d3.json(
                    'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR' +
                    '?formato=application/json&resolucao=2&qualidade=minima'
                );

                container.innerHTML = '';
                const width = container.clientWidth || 700;
                const height = Math.round(width * 0.72);

                const svg = d3.select(container)
                    .append('svg')
                    .attr('viewBox', `0 0 ${width} ${height}`)
                    .attr('width', '100%')
                    .attr('height', height)
                    .style('background', 'transparent')
                    .style('display', 'block');

                const projection = d3.geoMercator().fitSize([width - 20, height - 20], geoData);
                const pathGen = d3.geoPath().projection(projection);

                const maxVal = Math.max(...this.stateData.map(s => s.total || 0), 1);
                const colorScale = d3.scaleSequential()
                    .domain([0, maxVal])
                    .interpolator(d3.interpolate('#1e2533', '#F97316'));

                // Tooltip
                this._tooltip = d3.select(container)
                    .append('div')
                    .style('position', 'absolute')
                    .style('pointer-events', 'none')
                    .style('background', '#1a2035')
                    .style('border', '1px solid #2a3550')
                    .style('border-radius', '6px')
                    .style('padding', '8px 12px')
                    .style('font-size', '12px')
                    .style('color', '#e2e8f0')
                    .style('opacity', '0')
                    .style('transition', 'opacity 0.15s')
                    .style('z-index', '10')
                    .style('white-space', 'nowrap');

                const self = this;
                d3.select(container).style('position', 'relative');

                svg.append('g')
                    .selectAll('path')
                    .data(geoData.features)
                    .join('path')
                    .attr('d', pathGen)
                    .attr('fill', d => {
                        const sigla = self.ibgeToSigla[d.properties.codarea];
                        return colorScale(self._getTotalForState(sigla));
                    })
                    .attr('stroke', '#0d1117')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .style('transition', 'opacity 0.15s')
                    .on('mouseover', function(event, d) {
                        d3.select(this).style('opacity', 0.8);
                        const sigla = self.ibgeToSigla[d.properties.codarea];
                        const estado = self.estados[sigla] || {};
                        const total = self._getTotalForState(sigla);
                        self._tooltip
                            .style('opacity', '1')
                            .html(`<strong>${estado.nome || sigla || 'Estado'}</strong><br>` +
                                  `Deliberações: <strong style="color:#F97316">${total.toLocaleString('pt-BR')}</strong><br>` +
                                  `Região: ${estado.regiao || '—'}`);
                    })
                    .on('mousemove', function(event) {
                        const [mx, my] = d3.pointer(event, container);
                        self._tooltip
                            .style('left', (mx + 14) + 'px')
                            .style('top', (my - 10) + 'px');
                    })
                    .on('mouseout', function() {
                        d3.select(this).style('opacity', 1);
                        self._tooltip.style('opacity', '0');
                    })
                    .on('click', function(event, d) {
                        const sigla = self.ibgeToSigla[d.properties.codarea];
                        if (sigla) self.selectState(sigla);
                    });

                // State labels for larger states
                const largStates = ['SP', 'MG', 'BA', 'GO', 'MT', 'PA', 'AM', 'PR', 'RS'];
                svg.append('g')
                    .selectAll('text')
                    .data(geoData.features.filter(d => largStates.includes(self.ibgeToSigla[d.properties.codarea])))
                    .join('text')
                    .attr('transform', d => {
                        const [cx, cy] = pathGen.centroid(d);
                        return `translate(${cx},${cy})`;
                    })
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'central')
                    .attr('font-size', '9px')
                    .attr('font-weight', '600')
                    .attr('fill', '#ffffff')
                    .attr('pointer-events', 'none')
                    .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)')
                    .text(d => self.ibgeToSigla[d.properties.codarea] || '');

                this._d3Rendered = true;

            } catch (e) {
                container.innerHTML = `<p style="color:var(--text-tertiary);padding:20px;text-align:center">Erro ao carregar mapa: ${e.message}</p>`;
            }
        },

        renderTopStates() {
            const container = document.getElementById('mapa-top-states');
            if (!container) return;
            const sorted = [...this.stateData].sort((a, b) => b.total - a.total).slice(0, 10);
            container.innerHTML = sorted.map((s, i) => {
                const estado = this.estados[s.sigla] || { nome: s.sigla };
                return `
                <div class="top-state-row" onclick="App.PageMapa.selectState('${s.sigla}')" style="cursor:pointer">
                    <span class="rank">${i + 1}</span>
                    <span class="code" style="background:#F97316;color:#0f172a;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700">${s.sigla}</span>
                    <span class="name" style="flex:1">${estado.nome}</span>
                    <span class="value" style="font-weight:600;color:#F97316">${s.total.toLocaleString('pt-BR')}</span>
                </div>`;
            }).join('');
        },

        selectState(sigla) {
            this.selectedState = sigla;
            const estado = this.estados[sigla] || { nome: sigla };
            const total = this._getTotalForState(sigla);
            const infoEl = document.getElementById('mapa-info-panel');
            if (infoEl) {
                infoEl.innerHTML = `
                    <div class="info-panel-header">
                        <span class="info-panel-icon" style="background:rgba(249,115,22,0.15);color:#F97316">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </span>
                        <span style="font-weight:600;color:var(--text-primary)">${estado.nome || sigla}</span>
                    </div>
                    <div style="padding:12px 0;font-size:13px;color:var(--text-secondary)">
                        <div style="margin-bottom:6px">Região: <strong>${estado.regiao || '—'}</strong></div>
                        <div style="margin-bottom:6px">Deliberações: <strong style="color:#F97316;font-size:18px">${total.toLocaleString('pt-BR')}</strong></div>
                        <div>Agências: <strong>${(estado.agencias || []).join(', ') || '—'}</strong></div>
                    </div>`;
            }
        },

        destroy() {
            this._d3Rendered = false;
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
            const container = document.getElementById('mapa-brasil-container');
            if (container) container.innerHTML = '';
        }
    };


    // ============================================
    // PAGE: Radar Regulatorio
    // ============================================
    const PageRadar = {
        currentTab: 'dashboard',
        agenciasInfo: {
            artesp: { nome: 'Agência de Transporte do Estado de São Paulo', sigla: 'ARTESP', reunioes: 2, diretores: 4, deliberacoes: 25, setores: 6 },
            aneel: { nome: 'Agência Nacional de Energia Elétrica', sigla: 'ANEEL', reunioes: 8, diretores: 5, deliberacoes: 145, setores: 4 },
            anatel: { nome: 'Agência Nacional de Telecomunicações', sigla: 'ANATEL', reunioes: 6, diretores: 4, deliberacoes: 98, setores: 5 },
            anp: { nome: 'Agência Nacional do Petróleo', sigla: 'ANP', reunioes: 5, diretores: 5, deliberacoes: 78, setores: 3 },
            anvisa: { nome: 'Agência Nacional de Vigilância Sanitária', sigla: 'ANVISA', reunioes: 10, diretores: 3, deliberacoes: 210, setores: 8 },
            anac: { nome: 'Agência Nacional de Aviação Civil', sigla: 'ANAC', reunioes: 4, diretores: 2, deliberacoes: 56, setores: 3 },
            antt: { nome: 'Agência Nacional de Transportes Terrestres', sigla: 'ANTT', reunioes: 7, diretores: 3, deliberacoes: 120, setores: 4 },
            antaq: { nome: 'Agência Nacional de Transportes Aquaviários', sigla: 'ANTAQ', reunioes: 3, diretores: 2, deliberacoes: 34, setores: 2 },
            ans: { nome: 'Agência Nacional de Saúde Suplementar', sigla: 'ANS', reunioes: 6, diretores: 2, deliberacoes: 89, setores: 5 },
            anm: { nome: 'Agência Nacional de Mineração', sigla: 'ANM', reunioes: 4, diretores: 2, deliberacoes: 67, setores: 3 }
        },

        init() {
            const page = document.getElementById('page-radar');
            page.classList.add('active');
            this.bindEvents();
            this.updateAgencyInfo('artesp');
        },

        bindEvents() {
            document.querySelectorAll('.radar-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    document.querySelectorAll('.radar-tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    this.currentTab = e.target.dataset.radarTab;
                    this.renderContent();
                });
            });

            const agSelect = document.getElementById('radar-agencia');
            if (agSelect) {
                agSelect.addEventListener('change', (e) => this.updateAgencyInfo(e.target.value));
            }
        },

        updateAgencyInfo(agencyKey) {
            const info = this.agenciasInfo[agencyKey];
            if (!info) return;

            const nomeEl = document.getElementById('radar-agencia-nome');
            if (nomeEl) nomeEl.textContent = info.nome;

            const kpis = document.querySelectorAll('#page-radar .radar-kpi-value');
            if (kpis.length >= 4) {
                kpis[0].textContent = info.reunioes;
                kpis[1].textContent = info.diretores;
                kpis[2].textContent = info.deliberacoes;
                kpis[3].textContent = info.setores;
            }
        },

        renderContent() {
            const dashboardContent = document.getElementById('radar-dashboard-content');
            if (this.currentTab === 'dashboard' && dashboardContent) {
                dashboardContent.style.display = 'block';
            } else if (dashboardContent) {
                dashboardContent.style.display = 'block';
            }
        }
    };

    // ============================================
    // PAGE: Analytics Avançado
    // ============================================
    const PageAnalytics = {
        _trendData: null,
        _corrData: null,

        async init() {
            const page = document.getElementById('page-analytics');
            if (page) page.classList.add('active');
            await Promise.all([this.loadTendencias(), this.loadCorrelacoes()]);
        },

        async loadTendencias() {
            try {
                const resp = await fetch('/api/analytics/tendencias');
                const data = await resp.json();
                if (!data.success) return;
                this._trendData = data;

                // Update stats
                const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
                el('analytics-total', data.total_deliberacoes);
                el('analytics-empresas', data.ranking_empresas.length);
                el('analytics-diretores', data.diversidade_tematica.length);
                el('analytics-temas', [...new Set(data.heatmap.map(h => h.tema))].length);

                this.renderTrendChart(data.tendencias);
                this.renderRanking(data.ranking_empresas);
                this.renderHeatmap(data.heatmap, data.diversidade_tematica);
                this.renderDiversidade(data.diversidade_tematica);
            } catch (err) {
                console.warn('[Analytics] Erro:', err.message);
            }
        },

        async loadCorrelacoes() {
            try {
                const resp = await fetch('/api/analytics/correlacoes');
                const data = await resp.json();
                if (!data.success) return;
                this._corrData = data;
                this.renderCorrelacoes(data.correlacoes);
            } catch (err) {
                console.warn('[Analytics] Correlações erro:', err.message);
            }
        },

        renderTrendChart(tendencias) {
            const canvas = document.getElementById('analytics-trend-chart');
            if (!canvas || !tendencias.length) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width = canvas.parentElement.clientWidth - 32;
            const H = canvas.height = 260;
            const pad = { top: 20, right: 20, bottom: 40, left: 50 };
            const chartW = W - pad.left - pad.right;
            const chartH = H - pad.top - pad.bottom;

            ctx.clearRect(0, 0, W, H);
            ctx.font = '11px Inter, sans-serif';

            const maxVal = Math.max(1, ...tendencias.map(t => t.total));

            // Grid lines
            const gridSteps = 5;
            ctx.strokeStyle = 'rgba(148,163,184,0.1)';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            for (let i = 0; i <= gridSteps; i++) {
                const y = pad.top + chartH - (i / gridSteps) * chartH;
                ctx.beginPath();
                ctx.moveTo(pad.left, y);
                ctx.lineTo(W - pad.right, y);
                ctx.stroke();
                ctx.fillText(Math.round((maxVal / gridSteps) * i), pad.left - 8, y + 4);
            }

            // X labels
            ctx.textAlign = 'center';
            ctx.fillStyle = '#94a3b8';
            const step = Math.max(1, Math.floor(tendencias.length / 8));
            tendencias.forEach((t, i) => {
                if (i % step === 0) {
                    const x = pad.left + (i / (tendencias.length - 1 || 1)) * chartW;
                    ctx.fillText(t.mes.substring(5), x, H - pad.bottom + 16);
                }
            });

            // Draw lines
            const drawLine = (getData, color, alpha) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.lineJoin = 'round';
                tendencias.forEach((t, i) => {
                    const x = pad.left + (i / (tendencias.length - 1 || 1)) * chartW;
                    const y = pad.top + chartH - (getData(t) / maxVal) * chartH;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Fill area
                const lastX = pad.left + chartW;
                ctx.lineTo(lastX, pad.top + chartH);
                ctx.lineTo(pad.left, pad.top + chartH);
                ctx.closePath();
                ctx.fillStyle = color.replace('1)', alpha + ')');
                ctx.fill();
            };

            drawLine(t => t.total, 'rgba(139,92,246,1)', '0.08');
            drawLine(t => t.deferidos, 'rgba(74,222,128,1)', '0.05');
            drawLine(t => t.indeferidos, 'rgba(248,113,113,1)', '0.05');

            // Legend
            const legends = [
                { label: 'Total', color: '#8b5cf6' },
                { label: 'Deferidos', color: '#4ade80' },
                { label: 'Indeferidos', color: '#f87171' }
            ];
            let lx = pad.left;
            ctx.font = '11px Inter, sans-serif';
            legends.forEach(l => {
                ctx.fillStyle = l.color;
                ctx.fillRect(lx, H - 12, 12, 3);
                ctx.fillStyle = '#94a3b8';
                ctx.textAlign = 'left';
                ctx.fillText(l.label, lx + 16, H - 7);
                lx += ctx.measureText(l.label).width + 32;
            });
        },

        renderRanking(empresas) {
            const container = document.getElementById('analytics-ranking-body');
            if (!container) return;
            if (!empresas.length) { container.innerHTML = '<p style="color:var(--text-muted);">Nenhuma empresa encontrada.</p>'; return; }

            const max = empresas[0].total;
            container.innerHTML = empresas.slice(0, 10).map((e, i) => {
                const pct = Math.round((e.total / max) * 100);
                const taxaColor = e.taxa > 70 ? '#4ade80' : e.taxa > 40 ? '#fbbf24' : '#f87171';
                return '<div style="margin-bottom:10px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">' +
                        '<span style="color:var(--text-primary);font-weight:500;">' + (i+1) + '. ' + e.nome + '</span>' +
                        '<span style="color:var(--text-muted);">' + e.total + ' delib. · <span style="color:' + taxaColor + ';">' + e.taxa + '% def.</span></span>' +
                    '</div>' +
                    '<div style="background:var(--surface);border-radius:4px;overflow:hidden;height:6px;display:flex;">' +
                        '<div style="background:#4ade80;width:' + Math.round((e.deferidos/Math.max(1,e.total))*100) + '%;"></div>' +
                        '<div style="background:#f87171;width:' + Math.round((e.indeferidos/Math.max(1,e.total))*100) + '%;"></div>' +
                    '</div>' +
                '</div>';
            }).join('');
        },

        renderHeatmap(heatmap, diversidade) {
            const canvas = document.getElementById('analytics-heatmap-chart');
            if (!canvas || !heatmap.length) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width = canvas.parentElement.clientWidth - 32;
            const H = canvas.height = 260;

            ctx.clearRect(0, 0, W, H);

            // Get unique directors and themes (top 6 each)
            const diretores = [...new Set(heatmap.map(h => h.diretor))].slice(0, 6);
            const temas = [...new Set(heatmap.map(h => h.tema))].slice(0, 8);

            if (!diretores.length || !temas.length) return;

            const padLeft = 120;
            const padTop = 30;
            const cellW = Math.min(60, (W - padLeft - 20) / temas.length);
            const cellH = Math.min(35, (H - padTop - 20) / diretores.length);
            const maxCount = Math.max(1, ...heatmap.map(h => h.count));

            // Draw column headers (themes)
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            temas.forEach((tema, j) => {
                const x = padLeft + j * cellW + cellW / 2;
                const label = tema.length > 8 ? tema.substring(0, 7) + '…' : tema;
                ctx.fillText(label, x, padTop - 8);
            });

            // Draw rows
            diretores.forEach((dir, i) => {
                const y = padTop + i * cellH;
                // Row label
                ctx.fillStyle = '#cbd5e1';
                ctx.textAlign = 'right';
                ctx.font = '11px Inter, sans-serif';
                const dirLabel = dir.length > 16 ? dir.substring(0, 15) + '…' : dir;
                ctx.fillText(dirLabel, padLeft - 8, y + cellH / 2 + 4);

                // Cells
                temas.forEach((tema, j) => {
                    const x = padLeft + j * cellW;
                    const entry = heatmap.find(h => h.diretor === dir && h.tema === tema);
                    const count = entry ? entry.count : 0;
                    const intensity = count / maxCount;

                    // Color: purple gradient
                    const r = Math.round(139 * intensity);
                    const g = Math.round(92 * intensity);
                    const b = Math.round(246 * intensity);
                    ctx.fillStyle = count > 0 ? 'rgba(' + r + ',' + g + ',' + b + ',' + (0.2 + intensity * 0.8) + ')' : 'rgba(148,163,184,0.05)';
                    ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

                    // Count text
                    if (count > 0) {
                        ctx.fillStyle = intensity > 0.5 ? '#fff' : '#94a3b8';
                        ctx.textAlign = 'center';
                        ctx.font = '10px Inter, sans-serif';
                        ctx.fillText(count, x + cellW / 2, y + cellH / 2 + 3);
                    }
                });
            });
        },

        renderCorrelacoes(correlacoes) {
            const container = document.getElementById('analytics-correlacoes-body');
            if (!container) return;
            if (!correlacoes.length) { container.innerHTML = '<p style="color:var(--text-muted);">Sem dados de correlação.</p>'; return; }

            container.innerHTML = '<div style="max-height:260px;overflow-y:auto;">' +
                correlacoes.slice(0, 15).map(c => {
                    const barColor = c.taxa_concordancia > 80 ? '#4ade80' : c.taxa_concordancia > 50 ? '#fbbf24' : '#f87171';
                    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
                                '<span style="color:var(--text-primary);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">' + c.d1 + '</span>' +
                                '<span style="color:var(--text-muted);">×</span>' +
                                '<span style="color:var(--text-primary);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">' + c.d2 + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div style="width:80px;background:var(--surface);border-radius:3px;height:6px;overflow:hidden;flex-shrink:0;">' +
                            '<div style="background:' + barColor + ';width:' + c.taxa_concordancia + '%;height:100%;"></div>' +
                        '</div>' +
                        '<span style="color:' + barColor + ';font-weight:600;width:40px;text-align:right;flex-shrink:0;">' + c.taxa_concordancia + '%</span>' +
                    '</div>';
                }).join('') +
            '</div>';
        },

        renderDiversidade(diversidade) {
            const container = document.getElementById('analytics-diversidade-body');
            if (!container) return;
            if (!diversidade.length) { container.innerHTML = '<p style="color:var(--text-muted);">Sem dados.</p>'; return; }

            const maxTemas = Math.max(1, diversidade[0].temas_distintos);
            const colors = ['#8b5cf6', '#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#34d399'];

            container.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">' +
                diversidade.slice(0, 8).map((d, idx) => {
                    const pct = Math.round((d.temas_distintos / maxTemas) * 100);
                    return '<div style="background:var(--surface);border-radius:10px;padding:14px;">' +
                        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
                            '<div style="width:36px;height:36px;border-radius:50%;background:' + colors[idx % colors.length] + '20;border:2px solid ' + colors[idx % colors.length] + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:' + colors[idx % colors.length] + ';">' +
                                d.diretor.split(' ').map(function(w){return w[0]||'';}).join('').substring(0,2).toUpperCase() +
                            '</div>' +
                            '<div>' +
                                '<div style="font-weight:600;font-size:13px;color:var(--text-primary);">' + d.diretor + '</div>' +
                                '<div style="font-size:11px;color:var(--text-muted);">' + d.temas_distintos + ' temas distintos</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="display:flex;flex-wrap:wrap;gap:4px;">' +
                            d.temas.slice(0, 5).map(function(t) {
                                return '<span style="font-size:10px;padding:2px 8px;border-radius:9999px;background:var(--surface-hover);color:var(--text-secondary);">' + t + '</span>';
                            }).join('') +
                            (d.temas.length > 5 ? '<span style="font-size:10px;padding:2px 8px;border-radius:9999px;background:var(--surface-hover);color:var(--text-muted);">+' + (d.temas.length - 5) + '</span>' : '') +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>';
        }
    };

    // ============================================
    // PAGE: Landing Page — Conheça a IRIS
    // ============================================
    const PageLanding = {
        modulesData: [
            { id:'dashboard', title:'Dashboard Geral', desc:'KPIs consolidados, taxa de deferimento, tendências temporais e visão 360° da atividade regulatória.', cat:'analise', icon:'pie-chart' },
            { id:'deliberacoes', title:'Deliberações', desc:'Lista pesquisável com filtros por tipo, decisão, tema, empresa e diretor. Exportação em múltiplos formatos.', cat:'coleta', icon:'file-text' },
            { id:'monitor', title:'Monitor de Reuniões', desc:'Processamento de PDFs em tempo real com extração automática de deliberações, votos e decisões.', cat:'coleta', icon:'monitor' },
            { id:'diretores', title:'Diretores e Mandatos', desc:'Composição da diretoria, timeline de mandatos, expiração e histórico de participação em reuniões.', cat:'analise', icon:'users' },
            { id:'jurimetria', title:'Jurimetria', desc:'Padrões de votação, divergências entre diretores, análise comparativa e previsibilidade de decisões.', cat:'analise', icon:'scale' },
            { id:'governanca', title:'Governança Regulatória', desc:'Conformidade, transparência, aderência normativa e indicadores de qualidade regulatória.', cat:'auditoria', icon:'building' },
            { id:'boletim', title:'Boletim Mensal', desc:'Resumo executivo automático com principais decisões, tendências e alertas do período.', cat:'analise', icon:'newspaper' },
            { id:'upload', title:'Upload de PDFs', desc:'Drag-and-drop para análise manual de documentos regulatórios com processamento inteligente.', cat:'coleta', icon:'upload' },
            { id:'analise', title:'Análise de PDFs', desc:'Extração e estruturação de dados de documentos regulatórios com classificação automática por IA.', cat:'coleta', icon:'file-search' },
            { id:'auditoria', title:'Auditoria Forense', desc:'Detecção de anomalias, padrões suspeitos e desvios estatísticos em decisões regulatórias.', cat:'auditoria', icon:'shield' },
            { id:'agencias', title:'Agências Reguladoras', desc:'Visão comparativa multi-agência com métricas de desempenho e análise cruzada.', cat:'visualizacao', icon:'landmark' },
            { id:'mapa', title:'Mapa do Brasil', desc:'Distribuição geográfica de deliberações, concessões e atividade regulatória por região.', cat:'visualizacao', icon:'map' },
            { id:'grafo', title:'Rede de Conexões', desc:'Grafo de relações entre diretores, empresas e temas regulatórios. Inteligência de rede.', cat:'visualizacao', icon:'network' },
            { id:'noticias', title:'Feed de Notícias', desc:'RSS regulatório em tempo real com 34+ fontes oficiais, filtros por agência e setor.', cat:'coleta', icon:'rss' },
        ],

        faqData: [
            { q:'O que a IRIS faz que eu não consigo com uma planilha?', a:'Planilhas armazenam dados. A IRIS gera inteligência: classifica automaticamente, detecta padrões, mapeia conexões e identifica anomalias que análise manual jamais encontraria.' },
            { q:'Quais agências reguladoras são cobertas?', a:'Atualmente a IRIS processa dados da ARTESP com arquitetura pronta para expandir para ANEEL, ANP, ANATEL, ANVISA, ANTT e outras agências federais e estaduais.' },
            { q:'Os dados são atualizados em tempo real?', a:'A IRIS faz varredura automática a cada 30 minutos e processa novos documentos assim que publicados.' },
            { q:'Preciso instalar algum software?', a:'Não. A IRIS é 100% web, acessível por qualquer navegador moderno.' },
            { q:'Como funciona a detecção de anomalias?', a:'Algoritmos analisam padrões históricos de votação, tempo de tramitação e consistência de decisões para identificar desvios estatisticamente significativos.' },
            { q:'Posso fazer upload dos meus próprios documentos?', a:'Sim. O módulo de Upload aceita PDFs via drag-and-drop e os processa com a mesma inteligência da coleta automática.' },
            { q:'Quem pode se beneficiar da IRIS?', a:'Empresas reguladas, escritórios de advocacia, consultorias, áreas de compliance, pesquisadores e qualquer profissional que precise entender decisões regulatórias.' },
            { q:'Como solicito uma demonstração?', a:'Preencha o formulário nesta página ou entre em contato diretamente. Fazemos uma demo personalizada para seu caso de uso.' },
        ],

        moduleIcons: {
            'pie-chart': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>',
            'file-text': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
            'monitor': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
            'users': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
            'scale': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>',
            'building': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
            'newspaper': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>',
            'upload': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>',
            'file-search': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"/></svg>',
            'shield': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
            'landmark': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>',
            'map': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>',
            'network': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><circle cx="6" cy="6" r="3" stroke-width="2"/><circle cx="18" cy="18" r="3" stroke-width="2"/><circle cx="18" cy="6" r="3" stroke-width="2"/><circle cx="6" cy="18" r="3" stroke-width="2"/><path stroke-width="2" d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
            'rss': '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>',
        },

        formStep: 1,
        selectedAgencies: [],

        init() {
            const page = document.getElementById('page-landing');
            page.classList.add('active');
            this.renderModules('all');
            this.renderFAQ();
            this.animateCounters();
            this.setupScrollAnimations();
            this.initCarousel();
            this.bindEvents();
        },

        renderModules(filter) {
            const grid = document.getElementById('lp-modules-grid');
            if (!grid) return;
            const catMap = { coleta:'Coleta', analise:'Análise', visualizacao:'Visualização', auditoria:'Auditoria' };
            const catClass = { coleta:'lp-cat-coleta', analise:'lp-cat-analise', visualizacao:'lp-cat-visualizacao', auditoria:'lp-cat-auditoria' };
            const filtered = filter === 'all' ? this.modulesData : this.modulesData.filter(m => m.cat === filter);
            grid.innerHTML = filtered.map(m => `
                <div class="lp-module-card lp-fade-in" data-cat="${m.cat}">
                    <div class="lp-module-card-header">
                        <div class="lp-module-card-icon">${this.moduleIcons[m.icon] || ''}</div>
                        <div>
                            <h3>${m.title}</h3>
                            <span class="lp-module-card-cat ${catClass[m.cat]}">${catMap[m.cat]}</span>
                        </div>
                    </div>
                    <p>${m.desc}</p>
                </div>
            `).join('');
            // Trigger fade-in after render
            requestAnimationFrame(() => {
                grid.querySelectorAll('.lp-fade-in').forEach((el, i) => {
                    setTimeout(() => el.classList.add('lp-visible'), i * 60);
                });
            });
        },

        renderFAQ() {
            const list = document.getElementById('lp-faq-list');
            if (!list) return;
            list.innerHTML = this.faqData.map((f, i) => `
                <div class="lp-faq-item${i === 0 ? ' open' : ''}">
                    <button class="lp-faq-question" data-faq="${i}">
                        ${f.q}
                        <svg class="lp-faq-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <div class="lp-faq-answer"><p>${f.a}</p></div>
                </div>
            `).join('');
        },

        animateCounters() {
            const els = document.querySelectorAll('#page-landing .lp-hero-stat-value[data-target], #page-landing .lp-roi-value[data-target]');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting || entry.target.dataset.animated) return;
                    entry.target.dataset.animated = 'true';
                    const target = parseInt(entry.target.dataset.target);
                    const suffix = entry.target.dataset.suffix || '';
                    const start = performance.now();
                    const duration = 2000;
                    const step = (now) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                        entry.target.textContent = Math.floor(eased * target) + suffix;
                        if (progress < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                });
            }, { threshold: 0.3 });
            els.forEach(el => observer.observe(el));
        },

        setupScrollAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('lp-visible');
                    }
                });
            }, { threshold: 0.1, rootMargin: '-50px' });
            document.querySelectorAll('#page-landing .lp-fade-in').forEach(el => observer.observe(el));
        },

        // Carousel
        currentSlide: 0,
        carouselTimer: null,

        initCarousel() {
            const slides = document.querySelectorAll('#page-landing .lp-screenshot-slide');
            if (!slides.length) return;

            document.getElementById('lp-carousel-prev')?.addEventListener('click', () => this.prevSlide());
            document.getElementById('lp-carousel-next')?.addEventListener('click', () => this.nextSlide());
            document.getElementById('lp-carousel-dots')?.addEventListener('click', (e) => {
                const dot = e.target.closest('.lp-carousel-dot');
                if (dot) this.goToSlide(parseInt(dot.dataset.slide));
            });

            this.carouselTimer = setInterval(() => this.nextSlide(), 5000);
        },

        goToSlide(index) {
            const slides = document.querySelectorAll('#page-landing .lp-screenshot-slide');
            const dots = document.querySelectorAll('#page-landing .lp-carousel-dot');
            if (!slides.length) return;
            this.currentSlide = ((index % slides.length) + slides.length) % slides.length;
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            slides[this.currentSlide].classList.add('active');
            if (dots[this.currentSlide]) dots[this.currentSlide].classList.add('active');
            // Reset auto-advance
            clearInterval(this.carouselTimer);
            this.carouselTimer = setInterval(() => this.nextSlide(), 5000);
        },

        nextSlide() { this.goToSlide(this.currentSlide + 1); },
        prevSlide() { this.goToSlide(this.currentSlide - 1); },

        bindEvents() {
            // Module filters
            document.querySelectorAll('#page-landing .lp-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#page-landing .lp-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.renderModules(btn.dataset.filter);
                });
            });

            // FAQ accordion
            document.getElementById('lp-faq-list')?.addEventListener('click', (e) => {
                const btn = e.target.closest('.lp-faq-question');
                if (!btn) return;
                const item = btn.closest('.lp-faq-item');
                const wasOpen = item.classList.contains('open');
                document.querySelectorAll('.lp-faq-item').forEach(i => i.classList.remove('open'));
                if (!wasOpen) item.classList.add('open');
            });

            // Agency selection
            document.getElementById('lp-agencies-select')?.addEventListener('click', (e) => {
                const btn = e.target.closest('.lp-agency-btn');
                if (!btn) return;
                btn.classList.toggle('selected');
                const agency = btn.dataset.agency;
                if (this.selectedAgencies.includes(agency)) {
                    this.selectedAgencies = this.selectedAgencies.filter(a => a !== agency);
                } else {
                    this.selectedAgencies.push(agency);
                }
            });

            // Form navigation
            document.getElementById('lp-form-next')?.addEventListener('click', () => this.nextStep());
            document.getElementById('lp-form-back')?.addEventListener('click', () => this.prevStep());

            // Smooth scroll for anchor links within landing
            document.getElementById('page-landing')?.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#lp-"]');
                if (!link) return;
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        },

        nextStep() {
            // Validate current step
            if (this.formStep === 1) {
                const name = document.getElementById('lp-name')?.value?.trim();
                const email = document.getElementById('lp-email')?.value?.trim();
                if (!name || !email) return;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
            }
            if (this.formStep === 2) {
                const company = document.getElementById('lp-company')?.value?.trim();
                const role = document.getElementById('lp-role')?.value;
                if (!company || !role) return;
            }
            if (this.formStep === 3) {
                if (this.selectedAgencies.length === 0) return;
            }
            if (this.formStep === 4) {
                this.submitForm();
                return;
            }

            this.formStep++;
            this.updateFormUI();
        },

        prevStep() {
            if (this.formStep <= 1) return;
            this.formStep--;
            this.updateFormUI();
        },

        updateFormUI() {
            document.querySelectorAll('#page-landing .lp-form-step').forEach(s => s.classList.remove('active'));
            const current = document.querySelector(`#page-landing .lp-form-step[data-step="${this.formStep}"]`);
            if (current) current.classList.add('active');

            const bar = document.getElementById('lp-form-progress-bar');
            if (bar) bar.style.width = (this.formStep * 25) + '%';

            const label = document.getElementById('lp-step-current');
            if (label) label.textContent = this.formStep;

            const back = document.getElementById('lp-form-back');
            if (back) back.style.visibility = this.formStep > 1 ? 'visible' : 'hidden';

            const next = document.getElementById('lp-form-next');
            if (next) next.textContent = this.formStep === 4 ? 'Solicitar Demo' : 'Próximo';
        },

        async submitForm() {
            const data = {
                name: document.getElementById('lp-name')?.value?.trim(),
                email: document.getElementById('lp-email')?.value?.trim(),
                phone: document.getElementById('lp-phone')?.value?.trim(),
                company: document.getElementById('lp-company')?.value?.trim(),
                role: document.getElementById('lp-role')?.value,
                agencies: this.selectedAgencies,
                description: document.getElementById('lp-description')?.value?.trim(),
            };

            try {
                await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } catch (e) {
                console.log('[LEAD]', JSON.stringify(data));
            }

            // Show success
            document.querySelectorAll('#page-landing .lp-form-step').forEach(s => s.classList.remove('active'));
            const success = document.getElementById('lp-form-success');
            if (success) success.style.display = 'block';
            const nav = document.getElementById('lp-form-nav');
            if (nav) nav.style.display = 'none';
            const progressLabel = document.querySelector('#page-landing .lp-form-step-label');
            if (progressLabel) progressLabel.style.display = 'none';
        }
    };

    // ============================================
    // APP INITIALIZATION
    // ============================================
    const App = {
        Router,
        Icons,
        API,
        Utils,
        PageDeliberacoes,
        PageMonitor,
        PageDiretores,
        PageJurimetria,
        PageGovernanca,
        PageMetricas,
        PageBoletim,
        PageAuditoria,
        PageUpload,
        PageAnalise,
        PageHub,
        PageAgencias,
        PageMapa,
        PageRadar,
        PagePainelRegulatorio,
        PageSetores,
        PageMicrotemas,
        PageEmpresas,
        PageHistorico,
        PageGrafo,
        PageMonitoramento,
        PageDossie,
        PageCruzamento,
        PageAnalytics,
        PageLanding,

        init() {
            // Register routes
            Router.register('/hub', () => {
                PageMonitor.destroy();
                PageHub.init();
            });
            Router.register('/deliberacoes', () => {
                PageMonitor.destroy();
                PageDeliberacoes.init();
            });
            Router.register('/monitor', () => PageMonitor.init());
            Router.register('/diretores', () => {
                PageMonitor.destroy();
                PageDiretores.init();
            });
            Router.register('/jurimetria', () => {
                PageMonitor.destroy();
                PageJurimetria.init();
            });
            Router.register('/governanca', () => {
                PageMonitor.destroy();
                PageGovernanca.init();
            });
            Router.register('/metricas', () => {
                PageMonitor.destroy();
                PageMetricas.init();
            });
            Router.register('/boletim', () => {
                PageMonitor.destroy();
                PageBoletim.init();
            });
            Router.register('/auditoria', () => {
                PageMonitor.destroy();
                PageAuditoria.init();
            });
            Router.register('/upload', () => {
                PageMonitor.destroy();
                PageUpload.init();
            });
            Router.register('/analise', () => {
                PageMonitor.destroy();
                PageAnalise.init();
            });
            Router.register('/agencias', () => {
                PageMonitor.destroy();
                PageAgencias.init();
            });
            Router.register('/mapa', () => {
                PageMonitor.destroy();
                PageMapa.init();
            });
            Router.register('/radar', () => {
                PageMonitor.destroy();
                PageRadar.init();
            });
            Router.register('/painel-regulatorio', () => {
                PageMonitor.destroy();
                PagePainelRegulatorio.init();
            });
            Router.register('/setores', () => {
                PageMonitor.destroy();
                PageSetores.init();
            });
            Router.register('/microtemas', () => {
                PageMonitor.destroy();
                PageMicrotemas.init();
            });
            Router.register('/empresas', () => {
                PageMonitor.destroy();
                PageEmpresas.init();
            });
            Router.register('/historico', () => {
                PageMonitor.destroy();
                PageHistorico.init();
            });
            Router.register('/monitoramento', () => {
                PageMonitor.destroy();
                PageMonitoramento.destroy();
                PageMonitoramento.init();
            });
            Router.register('/dossie', () => {
                PageMonitor.destroy();
                PageDossie.init();
            });
            Router.register('/cruzamento', () => {
                PageMonitor.destroy();
                PageCruzamento.init();
            });
            Router.register('/analytics', () => {
                PageMonitor.destroy();
                PageAnalytics.init();
            });
            Router.register('/landing', () => {
                PageMonitor.destroy();
                PageLanding.init();
            });
            Router.register('/', () => {
                PageMonitor.destroy();
                PageHub.init();
            });
            Router.register('/app', () => {
                PageMonitor.destroy();
                PageHub.init();
            });

            // Initialize router
            Router.init();

            // Mobile menu: show hamburger on small screens
            const mobileBtn = document.getElementById('mobile-menu-btn');
            function checkMobile() {
                if (mobileBtn) mobileBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
            }
            checkMobile();
            window.addEventListener('resize', checkMobile);

            // Close sidebar on route change (mobile)
            const origNavigate = Router.navigate.bind(Router);
            Router.navigate = function(path) {
                if (window.innerWidth <= 768) {
                    const sidebar = document.querySelector('.sidebar');
                    const overlay = document.getElementById('sidebar-overlay');
                    if (sidebar) sidebar.classList.remove('open');
                    if (overlay) overlay.classList.remove('active');
                }
                origNavigate(path);
            };

            // Render sparklines in stat cards
            this.renderSparklines();

            console.log('IRIS Platform initialized');
        },

        renderSparklines() {
            document.querySelectorAll('.stat-card-sparkline[data-values]').forEach(function(el) {
                const values = el.dataset.values.split(',').map(Number);
                const max = Math.max.apply(null, values);
                if (!max) return;
                el.innerHTML = values.map(function(v, i) {
                    const h = Math.round((v / max) * 100);
                    const isLast = i === values.length - 1;
                    return '<div class="spark-bar" style="height:' + h + '%' + (isLast ? ';opacity:1' : '') + '"></div>';
                }).join('');
            });
        },

        onGlobalAgencyChange(agencia) {
            // Propagate agency change to active page if it supports it
            const active = document.querySelector('.page-view.active');
            if (!active) return;
            const pageId = active.id;
            if (pageId === 'page-deliberacoes' && PageDeliberacoes._loadFromAPI) {
                const agSelect = document.getElementById('filtro-agencia');
                if (agSelect) { agSelect.value = agencia; PageDeliberacoes.filter(); }
            } else if (pageId === 'page-diretores' && PageDiretores.loadRealData) {
                PageDiretores.currentAgencia = agencia;
                PageDiretores.loadRealData();
            } else if (pageId === 'page-metricas' && PageMetricas._loadInstitucional) {
                PageMetricas._loadInstitucional(agencia);
                PageMetricas._loadDiretoresTable(agencia);
            }
        }
    };

    // Export to window
    window.App = App;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

})();

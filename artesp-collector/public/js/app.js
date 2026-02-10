/**
 * IRIS Platform - Single Page Application
 * Instituto de Regulacao, Inovacao e Sustentabilidade
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
            const path = window.location.pathname || '/metricas';
            const handler = this.routes[path] || this.routes['/metricas'];

            // Update active nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.route === path) {
                    item.classList.add('active');
                }
            });

            // Update breadcrumb
            const pageNames = {
                '/metricas': 'Dashboard Geral',
                '/deliberacoes': 'Deliberacoes',
                '/monitor': 'Monitor de Reunioes',
                '/diretores': 'Diretores e Mandatos',
                '/jurimetria': 'Jurimetria',
                '/governanca': 'Governanca Regulatoria',
                '/boletim': 'Boletim Mensal',
                '/auditoria': 'Auditoria Forense',
                '/upload': 'Upload de PDFs',
                '/analise': 'Analise de PDFs',
                '/agencias': 'Agencias Reguladoras',
                '/mapa': 'Mapa do Brasil'
            };
            const breadcrumb = document.getElementById('breadcrumb-page');
            if (breadcrumb) {
                breadcrumb.textContent = pageNames[path] || 'Inteligencia Regulatoria';
            }

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

        async init() {
            const page = document.getElementById('page-deliberacoes');
            page.classList.add('active');

            Utils.showLoading('deliberacoes-table-body');

            const response = await API.get('/api/deliberacoes');
            this.data = response?.deliberacoes || [];
            this.filtered = [...this.data];

            this.populateFilters();
            this.updateStats();
            this.render();
        },

        populateFilters() {
            const microtemas = [...new Set(this.data.map(d => d.microtema).filter(Boolean))];
            const select = document.getElementById('filtro-microtema');
            if (select) {
                select.innerHTML = '<option value="">Todos</option>' +
                    microtemas.map(m => `<option value="${m}">${m}</option>`).join('');
            }
        },

        filter() {
            const decisao = document.getElementById('filtro-decisao')?.value || '';
            const tipo = document.getElementById('filtro-tipo')?.value || '';
            const microtema = document.getElementById('filtro-microtema')?.value || '';
            const busca = document.getElementById('filtro-busca')?.value?.toLowerCase() || '';

            this.filtered = this.data.filter(d => {
                if (decisao && d.decisao !== decisao) return false;
                if (tipo === 'externo' && d.pauta_interna) return false;
                if (tipo === 'interno' && !d.pauta_interna) return false;
                if (microtema && d.microtema !== microtema) return false;
                if (busca) {
                    const texto = `${d.processo} ${d.interessado} ${d.resumo_pleito}`.toLowerCase();
                    if (!texto.includes(busca)) return false;
                }
                return true;
            });

            this.updateStats();
            this.render();
        },

        updateStats() {
            const total = this.filtered.length;
            const deferidas = this.filtered.filter(d => d.decisao === 'Deferido').length;
            const indeferidas = this.filtered.filter(d => d.decisao === 'Indeferido').length;
            const taxa = total > 0 ? ((deferidas / total) * 100).toFixed(1) : 0;

            document.getElementById('stat-total-delibs').textContent = total;
            document.getElementById('stat-deferidas').textContent = deferidas;
            document.getElementById('stat-indeferidas').textContent = indeferidas;
            document.getElementById('stat-taxa').textContent = taxa + '%';
        },

        render() {
            const tbody = document.getElementById('deliberacoes-table-body');

            if (this.filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">Nenhuma deliberacao encontrada</div></td></tr>';
                return;
            }

            tbody.innerHTML = this.filtered.map(d => {
                const decisaoClass = d.decisao === 'Deferido' ? 'badge-deferido' :
                                    d.decisao === 'Indeferido' ? 'badge-indeferido' : '';
                const tipoClass = d.pauta_interna ? 'badge-interno' : 'badge-externo';
                const tipoLabel = d.pauta_interna ? 'Ato Interno' : 'Pleito Externo';

                return `<tr>
                    <td><span class="processo-link">${d.processo || '-'}</span></td>
                    <td>${d.interessado || '-'}</td>
                    <td>${d.microtema || '-'}</td>
                    <td><span class="badge ${decisaoClass}">${d.decisao || '-'}</span></td>
                    <td><span class="badge ${tipoClass}">${tipoLabel}</span></td>
                    <td>${d.numero_reuniao || '-'}</td>
                    <td>${d.data_reuniao || '-'}</td>
                </tr>`;
            }).join('');
        },

        exportCSV() {
            if (this.filtered.length === 0) {
                alert('Nenhuma deliberacao para exportar');
                return;
            }
            Utils.exportCSV(this.filtered, [
                { key: 'processo', label: 'Processo' },
                { key: 'interessado', label: 'Interessado' },
                { key: 'microtema', label: 'Microtema' },
                { key: 'decisao', label: 'Decisao' },
                { key: 'numero_reuniao', label: 'Reuniao' },
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
                    'processado': 'Concluido',
                    'erro': 'Erro'
                };

                let html = `<div class="meeting-card ${statusClass}">
                    <div class="meeting-header">
                        <div class="meeting-info">
                            <h3>${r.numero_reuniao || 'Reuniao ' + r.id.substring(0, 8)}</h3>
                            <p>${r.data_reuniao || 'Data nao identificada'} - ${r.tipo || 'deliberacao'}</p>
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
                    html += `<div class="meeting-delibs"><h4>${r.deliberacoes_count} deliberacoes extraidas</h4></div>`;
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
            if (!confirm('Excluir esta reuniao e todas suas deliberacoes?')) return;
            await API.delete(`/api/reunioes-monitoradas/${id}`);
            await this.load();
        }
    };

    // ============================================
    // PAGE: Diretores
    // ============================================
    const PageDiretores = {
        diretores: [
            { nome: 'Milton Persoli', iniciais: 'MP', cargo: 'Diretor-Presidente', inicio: '2021-01-15', fim: null, ativo: true, reunioes: 156, votos: 245, favoravel: 78.2, contrario: 15.5 },
            { nome: 'Marcos Antonio Ribeiro', iniciais: 'MR', cargo: 'Diretor de Fiscalizacao', inicio: '2020-06-01', fim: null, ativo: true, reunioes: 178, votos: 198, favoravel: 65.4, contrario: 28.3 },
            { nome: 'Patricia Vanzolini', iniciais: 'PV', cargo: 'Diretora de Planejamento', inicio: '2022-03-10', fim: null, ativo: true, reunioes: 98, votos: 212, favoravel: 82.1, contrario: 12.3 },
            { nome: 'Carlos Eduardo Silva', iniciais: 'CS', cargo: 'Diretor de Investimentos', inicio: '2021-08-20', fim: null, ativo: true, reunioes: 134, votos: 187, favoravel: 71.2, contrario: 22.4 },
            { nome: 'Ana Maria Santos', iniciais: 'AS', cargo: 'Diretora de Regulacao', inicio: '2019-01-10', fim: '2023-06-30', ativo: false, reunioes: 210, votos: 312, favoravel: 74.5, contrario: 18.2 }
        ],

        init() {
            const page = document.getElementById('page-diretores');
            page.classList.add('active');
            this.renderCards();
            this.renderGantt();
        },

        renderCards() {
            const grid = document.getElementById('diretores-grid');

            grid.innerHTML = this.diretores.map(d => {
                const statusClass = d.ativo ? 'status-active' : 'status-inactive';
                const statusLabel = d.ativo ? 'Ativo' : 'Encerrado';
                const periodo = d.fim ? Utils.formatDateShort(d.inicio) + ' - ' + Utils.formatDateShort(d.fim) : Utils.formatDateShort(d.inicio) + ' - Atual';

                return `<div class="director-card">
                    <div class="director-header">
                        <div class="director-avatar">${d.iniciais}</div>
                        <div class="director-info">
                            <h3>${d.nome}</h3>
                            <div class="role">${d.cargo}</div>
                            <div class="period">${periodo}</div>
                            <span class="director-status ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                    <div class="director-body">
                        <div class="director-stats">
                            <div class="stat-item"><div class="value">${d.reunioes}</div><div class="label">Reunioes</div></div>
                            <div class="stat-item"><div class="value">${d.votos}</div><div class="label">Votos</div></div>
                            <div class="stat-item"><div class="value green">${d.favoravel}%</div><div class="label">Favoravel</div></div>
                            <div class="stat-item"><div class="value red">${d.contrario}%</div><div class="label">Contrario</div></div>
                        </div>
                        <div class="director-bar">
                            <div class="director-bar-label"><span>Taxa de Aprovacao</span><span>${d.favoravel}%</span></div>
                            <div class="bar-track"><div class="bar-fill green" style="width: ${d.favoravel}%;"></div></div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        },

        renderGantt() {
            const container = document.getElementById('gantt-chart');
            const startYear = 2019;
            const endYear = 2026;
            const totalMonths = (endYear - startYear) * 12;

            container.innerHTML = this.diretores.map(d => {
                const startDate = new Date(d.inicio);
                const endDate = d.fim ? new Date(d.fim) : new Date();
                const startOffset = ((startDate.getFullYear() - startYear) * 12 + startDate.getMonth()) / totalMonths * 100;
                const duration = ((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)) / totalMonths * 100;
                const barClass = d.ativo ? '' : 'ended';

                return `<div class="gantt-row">
                    <div class="gantt-label">${d.nome}</div>
                    <div class="gantt-bars">
                        <div class="gantt-bar ${barClass}" style="left: ${startOffset}%; width: ${Math.min(duration, 100 - startOffset)}%;">
                            ${d.cargo.split(' ')[0]}
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
        // Diretores base com informacoes estaticas
        diretoresBase: [
            {
                nome: 'Andre Isper Rodrigues Barnabe',
                variantes: ['André Isper Rodrigues Barnabé', 'Andre Isper', 'Barnabé', 'Barnabe'],
                cargo: 'Diretor-Presidente',
                iniciais: 'AI',
                inicio: '2024-09-10',
                ativo: true
            },
            {
                nome: 'Diego Albert Zanatto',
                variantes: ['Diego Zanatto', 'Zanatto'],
                cargo: 'Diretor de Fiscalizacao',
                iniciais: 'DZ',
                inicio: '2024-09-10',
                ativo: true
            },
            {
                nome: 'Fernanda Esbizaro Rodrigues Rudnik',
                variantes: ['Fernanda Esbizaro', 'Rudnik'],
                cargo: 'Diretora de Planejamento',
                iniciais: 'FR',
                inicio: '2024-09-10',
                ativo: true
            },
            {
                nome: 'Raquel Franca Carneiro',
                variantes: ['Raquel França Carneiro', 'Raquel Carneiro', 'Carneiro'],
                cargo: 'Diretora de Investimentos',
                iniciais: 'RC',
                inicio: '2024-09-10',
                ativo: true
            }
        ],
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
            this.renderMandatos();
            this.renderGantt();
            this.renderVotingMatrix();
            this.renderParticipationList();
            this.renderDirectorSelector();
            this.renderDirectorProfile();
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
                            <span class="mandato-status ${d.ativo ? 'active' : 'inactive'}">${d.ativo ? 'Em Exercicio' : 'Encerrado'}</span>
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

            const startYear = 2019;
            const endYear = 2026;
            const totalMonths = (endYear - startYear) * 12;

            container.innerHTML = this.diretores.map(d => {
                const startDate = new Date(d.inicio);
                const endDate = d.ativo ? new Date() : new Date(d.fim || new Date());
                const startOffset = ((startDate.getFullYear() - startYear) * 12 + startDate.getMonth()) / totalMonths * 100;
                const duration = ((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)) / totalMonths * 100;
                const barClass = d.ativo ? '' : 'ended';

                return `<div class="gantt-row">
                    <div class="gantt-label">${d.nome.split(' ').slice(0, 2).join(' ')}</div>
                    <div class="gantt-bars">
                        <div class="gantt-bar ${barClass}" style="left: ${startOffset}%; width: ${Math.min(duration, 100 - startOffset)}%;">
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
                            <div class="participation-count">${d.participacoes} participacoes</div>
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
                        <div class="director-option-stats">${d.participacoes} participacoes colegiadas</div>
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
                        <span class="profile-status">${d.ativo ? 'Em Exercicio' : 'Encerrado'}</span>
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

                <div class="profile-alert" style="background: rgba(201, 162, 39, 0.1); border-left: 3px solid var(--accent);">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p>Dados extraidos automaticamente dos PDFs processados. Os valores refletem a <strong>participacao institucional</strong> identificada nas deliberacoes analisadas.</p>
                </div>

                <div class="profile-tabs">
                    <button class="profile-tab active" onclick="App.PageJurimetria.switchProfileTab(this, 'juridico')">Metricas</button>
                    <button class="profile-tab" onclick="App.PageJurimetria.switchProfileTab(this, 'historico')">Temas</button>
                    <button class="profile-tab" onclick="App.PageJurimetria.switchProfileTab(this, 'tendencias')">Decisoes</button>
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
                            <span class="badge badge-externo">${t.count} deliberacoes</span>
                        </div>
                    `).join('')
                    : '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum tema identificado nas deliberacoes deste diretor.</div>';

                content.innerHTML = `
                    <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        Temas das Deliberacoes
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
                            <div style="font-size: 0.9rem; margin-top: 8px;">${d.votosDeferido || 0} decisoes deferidas</div>
                        </div>
                        <div style="background: rgba(248, 113, 113, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--danger);">${taxaInd}%</div>
                            <div style="color: var(--text-secondary); margin-top: 4px;">Taxa de Indeferimento</div>
                            <div style="font-size: 0.9rem; margin-top: 8px;">${d.votosIndeferido || 0} decisoes indeferidas</div>
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
        init() {
            const page = document.getElementById('page-governanca');
            page.classList.add('active');
        }
    };

    // ============================================
    // PAGE: Metricas (Dashboard)
    // ============================================
    const PageMetricas = {
        init() {
            const page = document.getElementById('page-metricas');
            if (page) {
                page.classList.add('active');
            }
        },

        async exportar() {
            const data = await API.get('/api/metricas/exportar');
            if (data) {
                Utils.exportJSON(data, 'iris_metricas_' + new Date().toISOString().split('T')[0] + '.json');
            }
        }
    };

    // ============================================
    // PAGE: Boletim
    // ============================================
    const PageBoletim = {
        init() {
            const page = document.getElementById('page-boletim');
            page.classList.add('active');
        },

        gerar() {
            const mes = document.getElementById('boletim-mes')?.value;
            alert('Gerando boletim para ' + mes + '...\nEsta funcionalidade sera conectada a API de geracao de boletins.');
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
            page.classList.add('active');
        }
    };

    // ============================================
    // PAGE: Upload de PDFs
    // ============================================
    const PageUpload = {
        pdfs: [],

        async init() {
            const page = document.getElementById('page-upload');
            page.classList.add('active');

            this.setupDropzone();
            await this.load();
        },

        setupDropzone() {
            const dropzone = document.getElementById('upload-dropzone');
            const input = document.getElementById('upload-input');

            if (!dropzone || !input) return;

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
            const response = await API.get('/api/pdfs');
            this.pdfs = response?.pdfs || [];
            this.updateStats();
            this.render();
        },

        updateStats() {
            const total = this.pdfs.length;
            const pendentes = this.pdfs.filter(p => p.status === 'pendente').length;
            const analisados = this.pdfs.filter(p => p.status === 'analisado').length;
            const erros = this.pdfs.filter(p => p.status === 'erro').length;

            document.getElementById('upload-total').textContent = total;
            document.getElementById('upload-pendentes').textContent = pendentes;
            document.getElementById('upload-analisados').textContent = analisados;
            document.getElementById('upload-erros').textContent = erros;
        },

        render() {
            const tbody = document.getElementById('upload-table-body');

            if (this.pdfs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">Nenhum PDF carregado ainda</div></td></tr>';
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

                return `<tr>
                    <td>${index + 1}</td>
                    <td><span class="file-name">${pdf.nome || pdf.filename || 'Arquivo ' + (index + 1)}</span></td>
                    <td>${tamanho}</td>
                    <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td>${pdf.deliberacoes_count || 0}</td>
                    <td>
                        <div class="action-buttons">
                            ${pdf.status === 'pendente' ? `<button class="btn btn-primary btn-sm" onclick="App.PageUpload.analisar(${index})">Analisar</button>` : ''}
                            <button class="btn btn-danger btn-sm" onclick="App.PageUpload.excluir(${index})">Excluir</button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        },

        async uploadFiles(files) {
            const progressDiv = document.getElementById('upload-progress');
            const progressBar = document.getElementById('upload-progress-bar');
            const progressText = document.getElementById('upload-progress-text');
            const progressPercent = document.getElementById('upload-progress-percent');

            progressDiv.style.display = 'block';

            // Helper function to convert file to base64
            const fileToBase64 = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            };

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                progressText.textContent = `Enviando ${file.name}... (${i + 1}/${files.length})`;
                progressPercent.textContent = Math.round((i / files.length) * 100) + '%';
                progressBar.style.width = Math.round((i / files.length) * 100) + '%';

                try {
                    // Convert file to base64
                    const base64 = await fileToBase64(file);

                    const response = await fetch('/api/upload-pdf', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            arquivo: base64,
                            nomeArquivo: file.name
                        })
                    });
                    const result = await response.json();
                    if (!result.sucesso) {
                        console.error('Erro no upload:', result.erro);
                    }
                } catch (error) {
                    console.error('Erro no upload:', error);
                }
            }

            progressText.textContent = 'Upload concluido!';
            progressPercent.textContent = '100%';
            progressBar.style.width = '100%';

            setTimeout(() => {
                progressDiv.style.display = 'none';
                progressBar.style.width = '0%';
            }, 2000);

            await this.load();
        },

        async uploadFromUrl() {
            const urlInput = document.getElementById('upload-url');
            const url = urlInput?.value?.trim();

            if (!url) {
                alert('Digite uma URL valida');
                return;
            }

            try {
                const response = await API.post('/api/upload-url', { url });
                if (response?.sucesso) {
                    urlInput.value = '';
                    await this.load();
                    alert('PDF baixado com sucesso!');
                } else {
                    alert('Erro: ' + (response?.erro || 'Erro desconhecido'));
                }
            } catch (error) {
                alert('Erro ao baixar PDF: ' + error.message);
            }
        },

        async analisar(index) {
            try {
                const response = await API.post(`/api/analisar-pdf/${index}`);
                if (response?.sucesso) {
                    await this.load();
                } else {
                    alert('Erro: ' + (response?.erro || 'Erro na analise'));
                }
            } catch (error) {
                alert('Erro ao analisar: ' + error.message);
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
        }
    };

    // ============================================
    // PAGE: Analise de PDFs
    // ============================================
    const PageAnalise = {
        pdfs: [],
        analisando: false,

        async init() {
            const page = document.getElementById('page-analise');
            page.classList.add('active');
            await this.load();
        },

        async load() {
            const response = await API.get('/api/pdfs');
            this.pdfs = response?.pdfs || [];
            this.updateStats();
            this.render();
        },

        updateStats() {
            const total = this.pdfs.length;
            const pendentes = this.pdfs.filter(p => p.status === 'pendente').length;
            const concluidos = this.pdfs.filter(p => p.status === 'analisado').length;
            const deliberacoes = this.pdfs.reduce((sum, p) => sum + (p.deliberacoes_count || 0), 0);

            document.getElementById('analise-total').textContent = total;
            document.getElementById('analise-pendentes').textContent = pendentes;
            document.getElementById('analise-concluidos').textContent = concluidos;
            document.getElementById('analise-deliberacoes').textContent = deliberacoes;
        },

        render() {
            const tbody = document.getElementById('analise-table-body');

            if (this.pdfs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">Nenhum PDF disponivel. Faca upload na pagina de Upload.</div></td></tr>';
                return;
            }

            tbody.innerHTML = this.pdfs.map((pdf, index) => {
                const statusClass = pdf.status === 'analisado' ? 'badge-success' :
                                   pdf.status === 'erro' ? 'badge-danger' :
                                   pdf.status === 'analisando' ? 'badge-warning' : 'badge-secondary';
                const statusLabel = pdf.status === 'analisado' ? 'Analisado' :
                                   pdf.status === 'erro' ? 'Erro' :
                                   pdf.status === 'analisando' ? 'Analisando...' : 'Pendente';

                return `<tr>
                    <td>${index + 1}</td>
                    <td><span class="file-name">${pdf.nome || pdf.filename || 'Arquivo ' + (index + 1)}</span></td>
                    <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td>${pdf.deliberacoes_count || 0}</td>
                    <td>${pdf.ultima_analise || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            ${pdf.status !== 'analisando' ? `<button class="btn btn-primary btn-sm" onclick="App.PageAnalise.analisar(${index})">Analisar</button>` : '<span class="badge badge-warning">Em andamento</span>'}
                            ${pdf.status === 'analisado' ? `<button class="btn btn-secondary btn-sm" onclick="App.PageAnalise.verResultado(${index})">Ver Resultado</button>` : ''}
                        </div>
                    </td>
                </tr>`;
            }).join('');
        },

        async analisar(index) {
            const statusCard = document.getElementById('analise-status-card');
            const statusText = document.getElementById('analise-status-text');
            const statusPercent = document.getElementById('analise-status-percent');
            const progressBar = document.getElementById('analise-progress-bar');

            statusCard.style.display = 'block';
            statusText.textContent = 'Analisando PDF ' + (index + 1) + '...';
            statusPercent.textContent = '0%';
            progressBar.style.width = '0%';

            try {
                // Simular progresso
                let progress = 0;
                const progressInterval = setInterval(() => {
                    if (progress < 90) {
                        progress += Math.random() * 10;
                        statusPercent.textContent = Math.min(90, Math.round(progress)) + '%';
                        progressBar.style.width = Math.min(90, Math.round(progress)) + '%';
                    }
                }, 500);

                const response = await API.post(`/api/analisar-pdf/${index}`);

                clearInterval(progressInterval);

                if (response?.sucesso) {
                    statusText.textContent = 'Analise concluida!';
                    statusPercent.textContent = '100%';
                    progressBar.style.width = '100%';

                    if (response.deliberacoes) {
                        this.mostrarResultado(response);
                    }

                    setTimeout(() => {
                        statusCard.style.display = 'none';
                    }, 2000);

                    await this.load();
                } else {
                    statusText.textContent = 'Erro: ' + (response?.erro || 'Erro desconhecido');
                    progressBar.style.width = '0%';
                }
            } catch (error) {
                statusText.textContent = 'Erro: ' + error.message;
            }
        },

        async analisarTodos() {
            const pendentes = this.pdfs.filter(p => p.status === 'pendente');

            if (pendentes.length === 0) {
                alert('Nenhum PDF pendente para analisar');
                return;
            }

            const statusCard = document.getElementById('analise-status-card');
            const statusText = document.getElementById('analise-status-text');
            const statusPercent = document.getElementById('analise-status-percent');
            const progressBar = document.getElementById('analise-progress-bar');

            statusCard.style.display = 'block';
            this.analisando = true;

            try {
                const response = await API.post('/api/analisar-todos');

                if (response?.sucesso) {
                    statusText.textContent = `Analise concluida! ${response.total_deliberacoes || 0} deliberacoes extraidas.`;
                    statusPercent.textContent = '100%';
                    progressBar.style.width = '100%';

                    setTimeout(() => {
                        statusCard.style.display = 'none';
                    }, 3000);

                    await this.load();
                } else {
                    statusText.textContent = 'Erro: ' + (response?.erro || 'Erro desconhecido');
                }
            } catch (error) {
                statusText.textContent = 'Erro: ' + error.message;
            }

            this.analisando = false;
        },

        mostrarResultado(response) {
            const card = document.getElementById('analise-resultados-card');
            const content = document.getElementById('analise-resultados-content');

            card.style.display = 'block';

            const deliberacoes = response.deliberacoes || [];

            content.innerHTML = `
                <div class="result-summary">
                    <div class="result-stat">
                        <div class="value">${deliberacoes.length}</div>
                        <div class="label">Deliberacoes Extraidas</div>
                    </div>
                </div>
                ${deliberacoes.length > 0 ? `
                <div class="result-list" style="margin-top: 16px; max-height: 400px; overflow-y: auto;">
                    ${deliberacoes.slice(0, 10).map((d, i) => `
                        <div class="result-item" style="padding: 12px; background: var(--background); border-radius: var(--radius); margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <strong>${d.processo || 'Processo ' + (i + 1)}</strong>
                                <span class="badge ${d.decisao === 'Deferido' ? 'badge-success' : 'badge-danger'}">${d.decisao || '-'}</span>
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary);">${d.interessado || '-'}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${d.microtema || '-'}</div>
                        </div>
                    `).join('')}
                    ${deliberacoes.length > 10 ? `<div style="text-align: center; padding: 12px; color: var(--text-secondary);">... e mais ${deliberacoes.length - 10} deliberacoes</div>` : ''}
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

    // ============================================
    // PAGE: Agencias (Visualizacao Isometrica 3D)
    // ============================================
    const PageAgencias = {
        agencias: [
            {
                id: 'artesp',
                nome: 'ARTESP',
                nomeCompleto: 'Agencia de Transporte do Estado de SP',
                decisoes: 1247,
                aprovadas: 892,
                pendentes: 45,
                cor: '#FFEF4D',
                diretores: [
                    { nome: 'Andre Isper Rodrigues Barnabe', cargo: 'Diretor-Presidente', iniciais: 'AI' },
                    { nome: 'Diego Albert Zanatto', cargo: 'Diretor de Fiscalizacao', iniciais: 'DZ' },
                    { nome: 'Fernanda Esbizaro Rodrigues Rudnik', cargo: 'Diretora de Planejamento', iniciais: 'FR' },
                    { nome: 'Raquel Franca Carneiro', cargo: 'Diretora de Investimentos', iniciais: 'RC' }
                ]
            },
            {
                id: 'anm',
                nome: 'ANM',
                nomeCompleto: 'Agencia Nacional de Mineracao',
                decisoes: 892,
                aprovadas: 654,
                pendentes: 78,
                cor: '#60A5FA',
                diretores: [
                    { nome: 'Mauro Henrique Moreira Sousa', cargo: 'Diretor-Geral', iniciais: 'MM' },
                    { nome: 'Luiz Paniago Neves', cargo: 'Diretor Substituto', iniciais: 'LP' },
                    { nome: 'Fabio Fernando Borges', cargo: 'Diretor Substituto', iniciais: 'FB' },
                    { nome: 'Caio Mario Trivellato Seabra Filho', cargo: 'Diretor', iniciais: 'CT' },
                    { nome: 'Jose Fernando de Mendonca Gomes Junior', cargo: 'Diretor', iniciais: 'JG' }
                ]
            }
        ],

        init() {
            const page = document.getElementById('page-agencias');
            page.classList.add('active');
            this.renderAgenciasGrid();
            this.updateStats();
        },

        setupInteractivity() {
            const cards = document.querySelectorAll('.iso-card');
            cards.forEach((card, index) => {
                const agencia = this.agencias[index];
                if (!agencia) return;

                // Atualiza dados dinamicos
                const decisoesEl = card.querySelector('.iso-metric-value');
                const aprovEl = card.querySelectorAll('.iso-metric-value')[1];
                const pendEl = card.querySelectorAll('.iso-metric-value')[2];

                if (decisoesEl) decisoesEl.textContent = agencia.decisoes.toLocaleString('pt-BR');

                // Efeitos de hover interativos
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'rotateX(55deg) rotateZ(-45deg) translateZ(40px)';
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'rotateX(55deg) rotateZ(-45deg) translateZ(20px)';
                });

                // Click para ver detalhes
                card.addEventListener('click', () => {
                    this.showAgenciaDetails(agencia);
                });
            });
        },

        updateStats() {
            const totalDecisoes = this.agencias.reduce((sum, a) => sum + a.decisoes, 0);
            const totalAprovadas = this.agencias.reduce((sum, a) => sum + a.aprovadas, 0);
            const totalPendentes = this.agencias.reduce((sum, a) => sum + a.pendentes, 0);
            const taxaMedia = Math.round((totalAprovadas / totalDecisoes) * 100);

            // Atualiza stats cards se existirem
            const statsEl = document.querySelectorAll('#page-agencias .stats-value');
            if (statsEl.length >= 4) {
                statsEl[0].textContent = this.agencias.length;
                statsEl[1].textContent = totalDecisoes.toLocaleString('pt-BR');
                statsEl[2].textContent = totalAprovadas.toLocaleString('pt-BR');
                statsEl[3].textContent = taxaMedia + '%';
            }
        },

        showAgenciaDetails(agencia) {
            const taxa = Math.round((agencia.aprovadas / agencia.decisoes) * 100);
            const diretoresInfo = agencia.diretores
                ? '\n\nDiretoria Colegiada:\n' + agencia.diretores.map(d => `- ${d.nome} (${d.cargo})`).join('\n')
                : '';
            alert(`${agencia.nome}\n${agencia.nomeCompleto}\n\nDecisoes: ${agencia.decisoes.toLocaleString('pt-BR')}\nAprovadas: ${agencia.aprovadas.toLocaleString('pt-BR')} (${taxa}%)\nPendentes: ${agencia.pendentes}${diretoresInfo}`);
        },

        renderAgenciasGrid() {
            const grid = document.getElementById('agencias-iso-grid');
            if (!grid) return;

            grid.innerHTML = this.agencias.map(a => `
                <div class="iso-card" data-agencia="${a.id}" style="--card-color: ${a.cor};">
                    <div class="iso-card-face iso-card-top">
                        <div class="iso-card-header">
                            <div class="iso-card-icon" style="background: ${a.cor}20; color: ${a.cor};">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            </div>
                            <div class="iso-card-title">${a.nome}</div>
                        </div>
                        <div class="iso-card-subtitle">${a.nomeCompleto}</div>
                        <div class="iso-card-metrics">
                            <div class="iso-metric">
                                <div class="iso-metric-value">${a.decisoes.toLocaleString('pt-BR')}</div>
                                <div class="iso-metric-label">Decisoes</div>
                            </div>
                            <div class="iso-metric">
                                <div class="iso-metric-value" style="color: #4ADE80;">${a.aprovadas.toLocaleString('pt-BR')}</div>
                                <div class="iso-metric-label">Aprovadas</div>
                            </div>
                            <div class="iso-metric">
                                <div class="iso-metric-value" style="color: #FB923C;">${a.pendentes}</div>
                                <div class="iso-metric-label">Pendentes</div>
                            </div>
                        </div>
                        <div class="iso-card-directors">
                            <div class="iso-directors-label">Diretoria (${a.diretores?.length || 0})</div>
                            <div class="iso-directors-avatars">
                                ${(a.diretores || []).slice(0, 4).map(d => `<div class="iso-director-avatar" title="${d.nome} - ${d.cargo}">${d.iniciais}</div>`).join('')}
                                ${(a.diretores?.length > 4) ? `<div class="iso-director-more">+${a.diretores.length - 4}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="iso-card-face iso-card-front"></div>
                    <div class="iso-card-face iso-card-side"></div>
                </div>
            `).join('');

            this.setupInteractivity();
        }
    };

    // ============================================
    // PAGE: Mapa do Brasil
    // ============================================
    const PageMapa = {
        estados: {
            'SP': { nome: 'Sao Paulo', decisoes: 4521, taxa: 78.5 },
            'RJ': { nome: 'Rio de Janeiro', decisoes: 2134, taxa: 72.3 },
            'MG': { nome: 'Minas Gerais', decisoes: 1876, taxa: 81.2 },
            'RS': { nome: 'Rio Grande do Sul', decisoes: 1245, taxa: 75.8 },
            'PR': { nome: 'Parana', decisoes: 1123, taxa: 79.4 },
            'BA': { nome: 'Bahia', decisoes: 987, taxa: 68.9 },
            'SC': { nome: 'Santa Catarina', decisoes: 876, taxa: 82.1 },
            'GO': { nome: 'Goias', decisoes: 654, taxa: 71.5 },
            'PE': { nome: 'Pernambuco', decisoes: 543, taxa: 65.7 },
            'CE': { nome: 'Ceara', decisoes: 432, taxa: 69.2 },
            'DF': { nome: 'Distrito Federal', decisoes: 398, taxa: 84.3 },
            'PA': { nome: 'Para', decisoes: 321, taxa: 62.8 },
            'MT': { nome: 'Mato Grosso', decisoes: 287, taxa: 73.4 },
            'ES': { nome: 'Espirito Santo', decisoes: 265, taxa: 77.1 },
            'MS': { nome: 'Mato Grosso do Sul', decisoes: 234, taxa: 74.6 },
            'MA': { nome: 'Maranhao', decisoes: 198, taxa: 61.3 },
            'AM': { nome: 'Amazonas', decisoes: 176, taxa: 58.9 },
            'RN': { nome: 'Rio Grande do Norte', decisoes: 154, taxa: 66.4 },
            'PB': { nome: 'Paraiba', decisoes: 143, taxa: 64.8 },
            'AL': { nome: 'Alagoas', decisoes: 121, taxa: 63.2 },
            'PI': { nome: 'Piaui', decisoes: 98, taxa: 59.7 },
            'SE': { nome: 'Sergipe', decisoes: 87, taxa: 67.3 },
            'RO': { nome: 'Rondonia', decisoes: 76, taxa: 71.2 },
            'TO': { nome: 'Tocantins', decisoes: 65, taxa: 68.5 },
            'AC': { nome: 'Acre', decisoes: 43, taxa: 55.8 },
            'AP': { nome: 'Amapa', decisoes: 32, taxa: 53.1 },
            'RR': { nome: 'Roraima', decisoes: 21, taxa: 52.4 }
        },

        regioes: {
            'Sudeste': { estados: ['SP', 'RJ', 'MG', 'ES'], cor: '#FFEF4D' },
            'Sul': { estados: ['PR', 'SC', 'RS'], cor: '#4ADE80' },
            'Nordeste': { estados: ['BA', 'PE', 'CE', 'MA', 'RN', 'PB', 'AL', 'PI', 'SE'], cor: '#60A5FA' },
            'Centro-Oeste': { estados: ['GO', 'MT', 'MS', 'DF'], cor: '#F472B6' },
            'Norte': { estados: ['PA', 'AM', 'RO', 'TO', 'AC', 'AP', 'RR'], cor: '#A78BFA' }
        },

        init() {
            const page = document.getElementById('page-mapa');
            page.classList.add('active');
            this.setupMapInteractivity();
            this.updateStats();
            this.renderRanking();
        },

        setupMapInteractivity() {
            const svgPaths = document.querySelectorAll('#brazil-map path[data-state]');
            const tooltip = document.getElementById('map-tooltip');

            svgPaths.forEach(path => {
                const stateCode = path.getAttribute('data-state');
                const estado = this.estados[stateCode];

                if (!estado) return;

                // Cor baseada na quantidade de decisoes
                const maxDecisoes = 4521; // SP
                const intensity = Math.min(1, estado.decisoes / maxDecisoes);
                const baseColor = this.getRegionColor(stateCode);
                path.style.fill = baseColor;
                path.style.opacity = 0.4 + (intensity * 0.6);

                path.addEventListener('mouseenter', (e) => {
                    path.style.opacity = 1;
                    path.style.filter = 'brightness(1.2)';
                    if (tooltip) {
                        tooltip.innerHTML = `
                            <strong>${estado.nome} (${stateCode})</strong><br>
                            Decisoes: ${estado.decisoes.toLocaleString('pt-BR')}<br>
                            Taxa Aprovacao: ${estado.taxa}%
                        `;
                        tooltip.style.display = 'block';
                        tooltip.style.left = (e.pageX + 10) + 'px';
                        tooltip.style.top = (e.pageY + 10) + 'px';
                    }
                });

                path.addEventListener('mousemove', (e) => {
                    if (tooltip) {
                        tooltip.style.left = (e.pageX + 10) + 'px';
                        tooltip.style.top = (e.pageY + 10) + 'px';
                    }
                });

                path.addEventListener('mouseleave', () => {
                    path.style.opacity = 0.4 + (intensity * 0.6);
                    path.style.filter = 'none';
                    if (tooltip) {
                        tooltip.style.display = 'none';
                    }
                });

                path.addEventListener('click', () => {
                    this.showStateDetails(stateCode, estado);
                });
            });
        },

        getRegionColor(stateCode) {
            for (const [regiao, data] of Object.entries(this.regioes)) {
                if (data.estados.includes(stateCode)) {
                    return data.cor;
                }
            }
            return '#FFEF4D';
        },

        updateStats() {
            const totalDecisoes = Object.values(this.estados).reduce((sum, e) => sum + e.decisoes, 0);
            const mediaAprovacao = Object.values(this.estados).reduce((sum, e) => sum + e.taxa, 0) / Object.keys(this.estados).length;

            const statsEl = document.querySelectorAll('#page-mapa .mapa-stat-value');
            if (statsEl.length >= 4) {
                statsEl[0].textContent = Object.keys(this.estados).length;
                statsEl[1].textContent = totalDecisoes.toLocaleString('pt-BR');
                statsEl[2].textContent = Math.round(mediaAprovacao) + '%';
                statsEl[3].textContent = Object.keys(this.regioes).length;
            }
        },

        renderRanking() {
            const list = document.getElementById('state-ranking-list');
            if (!list) return;

            const sorted = Object.entries(this.estados)
                .sort((a, b) => b[1].decisoes - a[1].decisoes)
                .slice(0, 10);

            list.innerHTML = sorted.map(([code, data], index) => `
                <div class="ranking-item">
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-info">
                        <div class="ranking-state">${data.nome}</div>
                        <div class="ranking-stats">${data.decisoes.toLocaleString('pt-BR')} decisoes</div>
                    </div>
                    <div class="ranking-badge" style="background: ${this.getRegionColor(code)}20; color: ${this.getRegionColor(code)};">
                        ${data.taxa}%
                    </div>
                </div>
            `).join('');
        },

        showStateDetails(code, estado) {
            alert(`${estado.nome} (${code})\n\nDecisoes: ${estado.decisoes.toLocaleString('pt-BR')}\nTaxa de Aprovacao: ${estado.taxa}%`);
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
        PageAgencias,
        PageMapa,

        init() {
            // Register routes
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
            Router.register('/', () => {
                PageMonitor.destroy();
                PageMetricas.init();
            });
            Router.register('/app', () => {
                PageMonitor.destroy();
                PageMetricas.init();
            });

            // Initialize router
            Router.init();

            console.log('IRIS Platform initialized');
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

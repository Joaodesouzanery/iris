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
            const path = window.location.pathname || '/deliberacoes';
            const handler = this.routes[path] || this.routes['/deliberacoes'];

            // Update active nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.route === path) {
                    item.classList.add('active');
                }
            });

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
        diretores: [
            { nome: 'Milton Persoli', cargo: 'Diretor-Presidente', iniciais: 'MP', totalVotos: 245, pctFavoravel: 78.2, pctContrario: 15.5, pctVista: 6.3, relatorias: 42, taxaSucessoRelator: 92.3, rigoroso: false },
            { nome: 'Marcos Antonio Ribeiro', cargo: 'Diretor de Fiscalizacao', iniciais: 'MR', totalVotos: 198, pctFavoravel: 65.4, pctContrario: 28.3, pctVista: 6.3, relatorias: 35, taxaSucessoRelator: 88.6, rigoroso: true },
            { nome: 'Patricia Vanzolini', cargo: 'Diretora de Planejamento', iniciais: 'PV', totalVotos: 212, pctFavoravel: 82.1, pctContrario: 12.3, pctVista: 5.6, relatorias: 38, taxaSucessoRelator: 94.7, rigoroso: false },
            { nome: 'Carlos Eduardo Silva', cargo: 'Diretor de Investimentos', iniciais: 'CS', totalVotos: 187, pctFavoravel: 71.2, pctContrario: 22.4, pctVista: 6.4, relatorias: 31, taxaSucessoRelator: 90.3, rigoroso: false }
        ],

        init() {
            const page = document.getElementById('page-jurimetria');
            page.classList.add('active');
            this.renderCards();
            this.renderMatrix();
        },

        renderCards() {
            const grid = document.getElementById('jurimetria-grid');

            grid.innerHTML = this.diretores.map(d => `
                <div class="director-card">
                    <div class="director-header">
                        <div class="director-avatar">${d.iniciais}</div>
                        <div class="director-info">
                            <h3>${d.nome}${d.rigoroso ? '<span class="badge-rigorous">Rigoroso</span>' : ''}</h3>
                            <p>${d.cargo}</p>
                        </div>
                    </div>
                    <div class="director-stats">
                        <div class="director-stat">
                            <div class="value">${d.totalVotos}</div>
                            <div class="label">Total Votos</div>
                        </div>
                        <div class="director-stat">
                            <div class="value green">${d.pctFavoravel.toFixed(1)}%</div>
                            <div class="label">Favoravel</div>
                        </div>
                        <div class="director-stat">
                            <div class="value red">${d.pctContrario.toFixed(1)}%</div>
                            <div class="label">Contrario</div>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <div class="metric-row">
                            <div class="metric-label"><span>Taxa Aprovacao como Relator</span><span>${d.taxaSucessoRelator.toFixed(1)}%</span></div>
                            <div class="metric-bar"><div class="metric-fill green" style="width: ${d.taxaSucessoRelator}%;"></div></div>
                        </div>
                        <div class="metric-row">
                            <div class="metric-label"><span>Relatorias</span><span>${d.relatorias} casos</span></div>
                            <div class="metric-bar"><div class="metric-fill" style="width: ${d.relatorias / 50 * 100}%;"></div></div>
                        </div>
                    </div>
                </div>
            `).join('');
        },

        renderMatrix() {
            const container = document.getElementById('jurimetria-matrix');
            const reunioes = ['RO-245', 'RO-246', 'RO-247', 'RO-248', 'RO-249'];

            let html = '<table class="voting-matrix"><thead><tr><th>Diretor</th>';
            reunioes.forEach(r => html += `<th>${r}</th>`);
            html += '<th>% Favoravel</th></tr></thead><tbody>';

            this.diretores.forEach(d => {
                html += `<tr><td class="name">${d.nome}</td>`;
                reunioes.forEach(() => {
                    const rand = Math.random();
                    if (rand > 0.25) html += '<td class="vote-favor">F</td>';
                    else if (rand > 0.1) html += '<td class="vote-contra">C</td>';
                    else html += '<td class="vote-vista">V</td>';
                });
                html += `<td style="color: #4ade80; font-weight: 600;">${d.pctFavoravel.toFixed(1)}%</td></tr>`;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
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
        async init() {
            const page = document.getElementById('page-metricas');
            page.classList.add('active');

            Utils.showLoading('metricas-content');

            try {
                const [resumo, porDiretor, porTema, institucional] = await Promise.all([
                    API.get('/api/metricas/resumo'),
                    API.get('/api/metricas/por-diretor'),
                    API.get('/api/metricas/por-tema'),
                    API.get('/api/metricas/institucional')
                ]);

                this.render(resumo, porDiretor, porTema, institucional);
            } catch (e) {
                Utils.showEmpty('metricas-content', 'Erro ao carregar metricas');
            }
        },

        render(resumo, porDiretor, porTema, institucional) {
            if (!resumo || resumo.totalDeliberacoes === 0) {
                document.getElementById('metricas-content').innerHTML = `
                    <div class="empty-state">
                        <h2 style="color: #c9a227;">Nenhuma deliberacao analisada</h2>
                        <p>Faca upload de PDFs e analise-os para ver as metricas.</p>
                        <button class="btn btn-primary" style="margin-top: 20px;" onclick="App.Router.navigate('/monitor')">Ir para Monitor</button>
                    </div>`;
                return;
            }

            const totalDecisoes = resumo.deferidos + resumo.indeferidos;
            const pctDeferido = totalDecisoes > 0 ? Math.round((resumo.deferidos / totalDecisoes) * 100) : 0;

            let html = `
                <h2 class="section-title">Metricas de Valor Regulatorio</h2>
                <div class="cards-grid">
                    <div class="metric-card"><h3>Deliberacoes Processadas</h3><div class="value">${resumo.totalDeliberacoes}</div></div>
                    <div class="metric-card"><h3>PDFs Analisados</h3><div class="value">${resumo.pdfsAnalisados}</div><div class="subtitle">de ${resumo.totalPdfs} carregados</div></div>
                    <div class="metric-card"><h3>% Classificadas</h3><div class="value green">${resumo.percentualClassificado}%</div></div>
                    <div class="metric-card"><h3>Microtemas</h3><div class="value purple">${resumo.microtemasIdentificados}</div></div>
                    <div class="metric-card"><h3>Deferidos</h3><div class="value green">${resumo.deferidos}</div><div class="subtitle">${resumo.taxaDeferimento}% do total</div></div>
                    <div class="metric-card"><h3>Indeferidos</h3><div class="value red">${resumo.indeferidos}</div></div>
                    <div class="metric-card"><h3>Diretores Mapeados</h3><div class="value">${resumo.diretoresMapeados}</div></div>
                    <div class="metric-card"><h3>Pauta Externa</h3><div class="value">${resumo.pautaExterna}</div><div class="subtitle">pleitos de terceiros</div></div>
                </div>

                <div class="two-columns">
                    <div class="chart-container">
                        <div class="chart-title">Resultado das Deliberacoes</div>
                        <div class="bar-chart">
                            <div class="bar-item"><span class="bar-label">Deferidos</span><div class="bar-track"><div class="bar-fill" style="width: ${pctDeferido}%">${resumo.deferidos}</div></div></div>
                            <div class="bar-item"><span class="bar-label">Indeferidos</span><div class="bar-track"><div class="bar-fill red" style="width: ${100 - pctDeferido}%">${resumo.indeferidos}</div></div></div>
                        </div>
                    </div>
                    <div class="chart-container">
                        <div class="chart-title">Pauta Interna vs Externa</div>
                        <div class="bar-chart">
                            <div class="bar-item"><span class="bar-label">Pauta Externa</span><div class="bar-track"><div class="bar-fill" style="width: ${institucional?.percentualPautaExterna || 0}%">${institucional?.pautaExterna || 0}</div></div></div>
                            <div class="bar-item"><span class="bar-label">Pauta Interna</span><div class="bar-track"><div class="bar-fill purple" style="width: ${institucional?.percentualPautaInterna || 0}%">${institucional?.pautaInterna || 0}</div></div></div>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn btn-primary" onclick="App.PageMetricas.exportar()">Exportar Dados (JSON)</button>
                </div>`;

            document.getElementById('metricas-content').innerHTML = html;
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
            Router.register('/', () => {
                PageMonitor.destroy();
                PageDeliberacoes.init();
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

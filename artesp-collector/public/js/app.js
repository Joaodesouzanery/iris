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
            const path = window.location.pathname || '/hub';
            const handler = this.routes[path] || this.routes['/hub'];

            // Update active nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.route === path) {
                    item.classList.add('active');
                }
            });

            // Update breadcrumb
            const pageNames = {
                '/hub': 'Hub de Inteligencia Regulatoria',
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
                '/mapa': 'Mapa do Brasil',
                '/radar': 'Radar Regulatorio',
                '/painel-regulatorio': 'Painel Regulatorio',
                '/setores': 'Setores Regulados',
                '/microtemas': 'Microtemas',
                '/empresas': 'Empresas',
                '/historico': 'Historico',
                '/grafo': 'Grafo de Conexoes',
                '/monitoramento': 'Monitoramento 24/7',
                '/dossie': 'Dossies Automaticos',
                '/cruzamento': 'Cruzamento de Dados'
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

        // Dados de exemplo para demonstracao
        sampleData: [
            {
                id: 1,
                processo: 'SEI! n° 134.00037303/2024-01',
                interessado: 'Viacao Cometa S/A',
                microtema: 'Outros',
                decisao: 'Deferido',
                pauta_interna: false,
                numero_reuniao: '1176',
                data_reuniao: '2025-12-18',
                votos_favor: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                votos_contra: null,
                resumo_pleito: 'A Viacao Cometa S/A solicitou o ressarcimento referente a utilizacao do servico de transporte intermunicipal com beneficio tarifario de gratuidade, conforme previsto no Decreto n° 68.937, de 3 de outubro de 2024, que estabelece a gratuidade nos dias 6 e 27 de outubro de 2024.',
                fundamento_decisao: 'RECOMENDA O DEFERIMENTO do pedido da operadora Viacao Cometa S/A, para conceder o ressarcimento no Servico Regular Rodoviario de 18.366 (dezoito mil, trezentos e sessenta e seis) gratuidades, no montante de R$ 1.029.792,49 (um milhao, vinte e nove mil, setecentos e noventa e dois reais e quarenta e nove centavos), decorrente dos impactos do Decreto n° 68.937, de 03 de outubro de 2024.'
            },
            {
                id: 2,
                processo: 'SEI! n° 134.00038201/2024-02',
                interessado: 'Concessionaria ViaOeste S/A',
                microtema: 'Rodovias',
                decisao: 'Deferido',
                pauta_interna: false,
                numero_reuniao: '1176',
                data_reuniao: '2025-12-18',
                votos_favor: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                votos_contra: null,
                resumo_pleito: 'A Concessionaria ViaOeste S/A solicitou aprovacao do projeto de ampliacao da faixa de pedagio no km 42 da Rodovia Raposo Tavares.',
                fundamento_decisao: 'RECOMENDA O DEFERIMENTO do pedido de ampliacao, considerando os estudos de demanda e seguranca viaria apresentados.'
            },
            {
                id: 3,
                processo: 'SEI! n° 134.00039102/2024-03',
                interessado: 'EMTU - Empresa Metropolitana de Transportes Urbanos',
                microtema: 'Onibus',
                decisao: 'Deferido',
                pauta_interna: true,
                numero_reuniao: '1175',
                data_reuniao: '2025-12-11',
                votos_favor: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                votos_contra: null,
                resumo_pleito: 'Solicitacao de aprovacao de novas linhas metropolitanas para atendimento da regiao de Guarulhos.',
                fundamento_decisao: 'RECOMENDA O DEFERIMENTO considerando o estudo de demanda e viabilidade operacional.'
            },
            {
                id: 4,
                processo: 'SEI! n° 134.00040003/2024-04',
                interessado: 'AutoBan Concessionaria S/A',
                microtema: 'Regulacao',
                decisao: 'Indeferido',
                pauta_interna: false,
                numero_reuniao: '1175',
                data_reuniao: '2025-12-11',
                votos_favor: [],
                votos_contra: ['Andre Isper Rodrigues Barnabe', 'Diego Albert Zanatto', 'Fernanda Esbizaro Rodrigues Rudnik', 'Raquel Franca Carneiro'],
                resumo_pleito: 'Pedido de revisao extraordinaria de tarifas devido a variacao cambial.',
                fundamento_decisao: 'RECOMENDA O INDEFERIMENTO por nao atender aos requisitos contratuais estabelecidos.'
            }
        ],

        async init() {
            const page = document.getElementById('page-deliberacoes');
            page.classList.add('active');

            const container = document.getElementById('deliberacoes-list');
            if (container) {
                container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Carregando deliberacoes...</span></div>';
            }

            try {
                const response = await API.get('/api/deliberacoes');
                this.data = response?.deliberacoes || [];
                if (this.data.length === 0) {
                    // Usar dados de exemplo se nao houver dados reais
                    this.data = this.sampleData;
                }
            } catch (e) {
                // Usar dados de exemplo em caso de erro
                this.data = this.sampleData;
            }
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
            const container = document.getElementById('deliberacoes-list');
            if (!container) return;

            if (this.filtered.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhuma deliberacao encontrada</div>';
                return;
            }

            container.innerHTML = this.filtered.map((d, index) => {
                const votos = d.votos_favor || [];
                const tipoLabel = d.pauta_interna ? 'Pauta Interna' : 'Pauta Externa';
                const dataFormatada = this.formatDate(d.data_reuniao);

                return `
                <div class="deliberacao-card" onclick="App.PageDeliberacoes.openModal(${index})">
                    <div class="deliberacao-card-header">
                        <div class="deliberacao-number">
                            <div class="deliberacao-badge">${d.numero_reuniao || '-'}</div>
                            <span class="deliberacao-agency">ARTESP</span>
                        </div>
                        <div class="deliberacao-main-info">
                            <div class="deliberacao-title">
                                ${d.interessado || 'Interessado nao identificado'}
                            </div>
                            <div class="deliberacao-processo">${d.processo || 'Processo nao identificado'}</div>
                            <div class="deliberacao-meta">
                                <span class="deliberacao-meta-item">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    ${dataFormatada}
                                </span>
                                <span class="deliberacao-meta-item">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                                    ${d.microtema || 'Nao classificado'}
                                </span>
                                <span class="deliberacao-meta-item">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    ${tipoLabel}
                                </span>
                            </div>
                        </div>
                        <div class="deliberacao-decision">
                            <span class="decision-badge ${d.decisao?.toLowerCase() || ''}">${d.decisao || '-'}</span>
                        </div>
                    </div>
                    <div class="deliberacao-card-body">
                        <div class="deliberacao-resumo">${this.truncate(d.resumo_pleito, 200)}</div>
                        <div class="deliberacao-votos">
                            ${votos.slice(0, 4).map(v => `
                                <span class="voto-chip">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    ${this.getFirstLastName(v)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                `;
            }).join('');
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
                            <div class="modal-agency-name">ARTESP</div>
                            <div class="modal-date">${dataFormatada}</div>
                        </div>
                    </div>
                    <div class="modal-info-grid">
                        <div class="modal-info-item">
                            <div class="modal-info-label">Agencia</div>
                            <div class="modal-info-value">ARTESP</div>
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
    // PAGE: Diretores/Mandatos
    // ============================================
    const PageDiretores = {
        selectedAgency: 'artesp',

        agenciasData: {
            artesp: {
                nome: 'ARTESP',
                cor: '#c9a227',
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
                    { nome: 'Rodovias', valor: 48, cor: '#c9a227' },
                    { nome: 'Onibus', valor: 21, cor: '#c9a227' },
                    { nome: 'Regulacao', valor: 12, cor: '#c9a227' },
                    { nome: 'Marcos Legais', valor: 5, cor: '#c9a227' },
                    { nome: 'Ferrovias', valor: 1, cor: '#c9a227' }
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
                        inicio: '2023-04-15',
                        termino: '2027-04-14',
                        ativo: true,
                        participacoes: 78,
                        relatorias: 12,
                        favoravel: 72,
                        desfavoravel: 4,
                        vista: 2
                    },
                    {
                        nome: 'Luiz Paniago Neves',
                        cargo: 'Diretor Substituto',
                        iniciais: 'LP',
                        inicio: '2023-06-01',
                        termino: '2027-05-31',
                        ativo: true,
                        participacoes: 65,
                        relatorias: 8,
                        favoravel: 60,
                        desfavoravel: 3,
                        vista: 2
                    },
                    {
                        nome: 'Fabio Fernando Borges',
                        cargo: 'Diretor Substituto',
                        iniciais: 'FB',
                        inicio: '2022-11-20',
                        termino: '2026-11-19',
                        ativo: true,
                        participacoes: 89,
                        relatorias: 15,
                        favoravel: 82,
                        desfavoravel: 5,
                        vista: 2
                    },
                    {
                        nome: 'Caio Mario Trivellato Seabra Filho',
                        cargo: 'Diretor',
                        iniciais: 'CT',
                        inicio: '2024-02-10',
                        termino: '2028-02-09',
                        ativo: true,
                        participacoes: 45,
                        relatorias: 5,
                        favoravel: 44,
                        desfavoravel: 0,
                        vista: 1
                    },
                    {
                        nome: 'Jose Fernando de Mendonca Gomes Junior',
                        cargo: 'Diretor',
                        iniciais: 'JG',
                        inicio: '2024-03-01',
                        termino: '2028-02-29',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 3,
                        favoravel: 40,
                        desfavoravel: 0,
                        vista: 2
                    }
                ],
                stats: {
                    diretoresAtivos: 5,
                    participacoesColegiadas: 319,
                    taxaConsenso: 94,
                    deliberacoes: 156
                },
                votos: {
                    favoravel: 298,
                    desfavoravel: 12,
                    vista: 6,
                    relator: 3
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
                        termino: '2027-11-03',
                        ativo: true,
                        participacoes: 156,
                        relatorias: 28,
                        favoravel: 148,
                        desfavoravel: 5,
                        vista: 3
                    },
                    {
                        nome: 'Artur Coimbra de Oliveira',
                        cargo: 'Conselheiro',
                        iniciais: 'AC',
                        inicio: '2021-02-05',
                        termino: '2026-02-04',
                        ativo: true,
                        participacoes: 189,
                        relatorias: 35,
                        favoravel: 180,
                        desfavoravel: 6,
                        vista: 3
                    },
                    {
                        nome: 'Alexandre Freire',
                        cargo: 'Conselheiro',
                        iniciais: 'AF',
                        inicio: '2023-06-15',
                        termino: '2028-06-14',
                        ativo: true,
                        participacoes: 98,
                        relatorias: 18,
                        favoravel: 94,
                        desfavoravel: 2,
                        vista: 2
                    }
                ],
                stats: {
                    diretoresAtivos: 3,
                    participacoesColegiadas: 443,
                    taxaConsenso: 96,
                    deliberacoes: 234
                },
                votos: {
                    favoravel: 422,
                    desfavoravel: 13,
                    vista: 8,
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
                        nome: 'Agnes Maria de Aragao da Costa',
                        cargo: 'Diretora-Presidente',
                        iniciais: 'AC',
                        inicio: '2024-01-10',
                        termino: '2029-01-09',
                        ativo: true,
                        participacoes: 87,
                        relatorias: 15,
                        favoravel: 82,
                        desfavoravel: 3,
                        vista: 2
                    },
                    {
                        nome: 'Ricardo Lavorato',
                        cargo: 'Diretor',
                        iniciais: 'RL',
                        inicio: '2022-08-20',
                        termino: '2027-08-19',
                        ativo: true,
                        participacoes: 145,
                        relatorias: 25,
                        favoravel: 138,
                        desfavoravel: 4,
                        vista: 3
                    },
                    {
                        nome: 'Fernando Mosna',
                        cargo: 'Diretor',
                        iniciais: 'FM',
                        inicio: '2023-03-15',
                        termino: '2028-03-14',
                        ativo: true,
                        participacoes: 112,
                        relatorias: 20,
                        favoravel: 108,
                        desfavoravel: 2,
                        vista: 2
                    }
                ],
                stats: {
                    diretoresAtivos: 3,
                    participacoesColegiadas: 344,
                    taxaConsenso: 97,
                    deliberacoes: 198
                },
                votos: {
                    favoravel: 328,
                    desfavoravel: 9,
                    vista: 7,
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

        init() {
            const page = document.getElementById('page-diretores');
            page.classList.add('active');

            this.setupAgencyTabs();
            this.renderAll();
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
            this.renderCards();
            this.renderGantt();
            this.renderVotingMatrix();
            this.renderSetoresChart();
            this.renderParticipationList();
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
                        <div class="participation-count">${d.participacoes} participacoes</div>
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
        init() {
            const page = document.getElementById('page-setores');
            page.classList.add('active');
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
            { titulo: 'Resolucao no 001/2026 - Diretrizes de Fiscalizacao', data: '04/01/2026', setor: 'Rodovias', tipo: 'Resolucao', natureza: 'nova', relevancia: 'alta' },
            { titulo: 'Deliberacao no 15/2026 - Tarifas de Pedagio', data: '03/01/2026', setor: 'Rodovias', tipo: 'Deliberacao', natureza: 'alteracao', relevancia: 'alta' },
            { titulo: 'Portaria no 042/2026 - Procedimentos de Vistoria', data: '02/01/2026', setor: 'Ferrovias', tipo: 'Portaria', natureza: 'nova', relevancia: 'media' },
            { titulo: 'Resolucao no 998/2025 - Revogacao de Normativo', data: '27/12/2025', setor: 'Rodovias', tipo: 'Resolucao', natureza: 'revogacao', relevancia: 'baixa' },
            { titulo: 'Deliberacao no 14/2026 - Indicadores de Qualidade', data: '01/01/2026', setor: 'Rodovias', tipo: 'Deliberacao', natureza: 'alteracao', relevancia: 'media' },
            { titulo: 'Resolucao no 002/2026 - Normas de Seguranca Ferroviaria', data: '05/01/2026', setor: 'Ferrovias', tipo: 'Resolucao', natureza: 'nova', relevancia: 'alta' },
            { titulo: 'Deliberacao no 16/2026 - Reajuste Tarifario Aeroportuario', data: '06/01/2026', setor: 'Aeroportos', tipo: 'Deliberacao', natureza: 'alteracao', relevancia: 'alta' },
            { titulo: 'Portaria no 043/2026 - Inspecao de Terminais Portuarios', data: '07/01/2026', setor: 'Portos', tipo: 'Portaria', natureza: 'nova', relevancia: 'media' },
            { titulo: 'Resolucao no 003/2026 - Padrao de Sinalizacao', data: '08/01/2026', setor: 'Rodovias', tipo: 'Resolucao', natureza: 'nova', relevancia: 'media' },
            { titulo: 'Deliberacao no 17/2026 - Concessao de Rodovia SP-300', data: '09/01/2026', setor: 'Rodovias', tipo: 'Deliberacao', natureza: 'nova', relevancia: 'alta' },
            { titulo: 'Resolucao no 997/2025 - Revogacao de Taxas Aeroportuarias', data: '26/12/2025', setor: 'Aeroportos', tipo: 'Resolucao', natureza: 'revogacao', relevancia: 'media' },
            { titulo: 'Portaria no 044/2026 - Manutencao de Vias Ferreas', data: '10/01/2026', setor: 'Ferrovias', tipo: 'Portaria', natureza: 'alteracao', relevancia: 'baixa' },
            { titulo: 'Deliberacao no 18/2026 - Seguro de Cargas Portuarias', data: '11/01/2026', setor: 'Portos', tipo: 'Deliberacao', natureza: 'nova', relevancia: 'media' },
            { titulo: 'Resolucao no 004/2026 - Limite de Velocidade em Tuneis', data: '12/01/2026', setor: 'Rodovias', tipo: 'Resolucao', natureza: 'alteracao', relevancia: 'alta' }
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
                    alert('Exportacao em desenvolvimento. Os dados serao exportados em formato CSV/PDF.');
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
            if (pageInfo) pageInfo.textContent = `Pagina ${this.currentPage} de ${totalPages}`;
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
    // PAGE: Microtemas
    // ============================================
    const PageMicrotemas = {
        init() {
            const page = document.getElementById('page-microtemas');
            page.classList.add('active');
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
                container.innerHTML = '<span class="empresas-none">Nenhuma empresa detectada ainda. Faca upload e analise de PDFs para detectar empresas automaticamente.</span>';
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
        init() {
            const page = document.getElementById('page-historico');
            page.classList.add('active');
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
                        inicio: '2023-04-15',
                        termino: '2027-04-14',
                        ativo: true,
                        participacoes: 78,
                        relatorias: 12
                    },
                    {
                        nome: 'Luiz Paniago Neves',
                        cargo: 'Diretor Substituto',
                        iniciais: 'LP',
                        inicio: '2023-06-01',
                        termino: '2027-05-31',
                        ativo: true,
                        participacoes: 65,
                        relatorias: 8
                    },
                    {
                        nome: 'Fabio Fernando Borges',
                        cargo: 'Diretor Substituto',
                        iniciais: 'FB',
                        inicio: '2022-11-20',
                        termino: '2026-11-19',
                        ativo: true,
                        participacoes: 89,
                        relatorias: 15
                    },
                    {
                        nome: 'Caio Mario Trivellato Seabra Filho',
                        cargo: 'Diretor',
                        iniciais: 'CT',
                        inicio: '2024-02-10',
                        termino: '2028-02-09',
                        ativo: true,
                        participacoes: 45,
                        relatorias: 5
                    },
                    {
                        nome: 'Jose Fernando de Mendonca Gomes Junior',
                        cargo: 'Diretor',
                        iniciais: 'JG',
                        inicio: '2024-03-01',
                        termino: '2028-02-29',
                        ativo: true,
                        participacoes: 42,
                        relatorias: 3
                    }
                ],
                stats: {
                    diretoresAtivos: 5,
                    participacoesColegiadas: 319,
                    taxaConsenso: 94,
                    deliberacoes: 156
                },
                votos: {
                    favoravel: 298,
                    desfavoravel: 12,
                    vista: 6,
                    relator: 3
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
    // PAGE: Grafo de Conexoes
    // ============================================
    const PageGrafo = {
        nodes: [],
        links: [],
        zoom: 1,

        init() {
            const page = document.getElementById('page-grafo');
            page.classList.add('active');
            this.renderGraph();
            this.setupFilters();
        },

        setupFilters() {
            const filter = document.getElementById('grafo-tipo-filter');
            if (filter) {
                filter.addEventListener('change', () => this.renderGraph());
            }
        },

        renderGraph() {
            const container = document.getElementById('grafo-container');
            if (!container) return;

            // Dados de exemplo para o grafo
            const nodes = [
                { id: 1, name: 'CCR S.A.', type: 'empresa', x: 300, y: 250, size: 50 },
                { id: 2, name: 'Ecovias', type: 'empresa', x: 500, y: 150, size: 40 },
                { id: 3, name: 'Patricia Vanzolini', type: 'diretor', x: 200, y: 100, size: 35 },
                { id: 4, name: 'Carlos Andrade', type: 'diretor', x: 400, y: 350, size: 35 },
                { id: 5, name: 'Marcos Ribeiro', type: 'diretor', x: 150, y: 300, size: 35 },
                { id: 6, name: 'ViaOeste', type: 'empresa', x: 450, y: 250, size: 45 },
                { id: 7, name: 'AutoBAn', type: 'empresa', x: 550, y: 300, size: 38 },
                { id: 8, name: 'Interessado A', type: 'interessado', x: 250, y: 400, size: 25 },
                { id: 9, name: 'Interessado B', type: 'interessado', x: 350, y: 450, size: 25 },
                { id: 10, name: 'Holding XYZ', type: 'empresa', x: 600, y: 200, size: 30 }
            ];

            const links = [
                { source: 1, target: 6, type: 'controle' },
                { source: 1, target: 2, type: 'participacao' },
                { source: 3, target: 1, type: 'direcao' },
                { source: 4, target: 2, type: 'direcao' },
                { source: 5, target: 1, type: 'direcao' },
                { source: 6, target: 7, type: 'participacao' },
                { source: 8, target: 2, type: 'interesse' },
                { source: 9, target: 6, type: 'interesse' },
                { source: 10, target: 1, type: 'participacao' },
                { source: 10, target: 7, type: 'controle' },
                { source: 4, target: 10, type: 'vinculo', hidden: true }
            ];

            const colors = {
                empresa: '#FFEF4D',
                diretor: '#60a5fa',
                interessado: '#34d399'
            };

            const linkColors = {
                controle: '#FFEF4D',
                participacao: '#94a3b8',
                direcao: '#60a5fa',
                interesse: '#34d399',
                vinculo: '#ef4444'
            };

            let svg = `<svg width="100%" height="100%" viewBox="0 0 700 500" style="transform: scale(${this.zoom});">`;
            svg += '<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/></marker></defs>';

            // Desenhar links
            links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (source && target) {
                    const color = linkColors[link.type] || '#64748b';
                    const dashArray = link.hidden ? '5,5' : 'none';
                    const opacity = link.hidden ? '0.5' : '0.7';
                    svg += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"
                            stroke="${color}" stroke-width="2" stroke-dasharray="${dashArray}" opacity="${opacity}"
                            marker-end="url(#arrowhead)"/>`;
                }
            });

            // Desenhar nodes
            nodes.forEach(node => {
                const color = colors[node.type] || '#94a3b8';
                svg += `<g class="graph-node" onclick="PageGrafo.selectNode(${node.id})" style="cursor: pointer;">
                    <circle cx="${node.x}" cy="${node.y}" r="${node.size / 2}" fill="${color}" opacity="0.8"/>
                    <circle cx="${node.x}" cy="${node.y}" r="${node.size / 2 + 3}" fill="none" stroke="${color}" stroke-width="2" opacity="0.3"/>
                    <text x="${node.x}" y="${node.y + node.size / 2 + 15}" text-anchor="middle" fill="#e2e8f0" font-size="11">${node.name}</text>
                </g>`;
            });

            svg += '</svg>';

            // Legenda
            svg += `<div style="position: absolute; bottom: 16px; left: 16px; background: rgba(15, 23, 42, 0.9); padding: 12px; border-radius: 8px; font-size: 12px;">
                <div style="display: flex; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 12px; border-radius: 50%; background: ${colors.empresa};"></span> Empresa</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 12px; border-radius: 50%; background: ${colors.diretor};"></span> Diretor</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 12px; border-radius: 50%; background: ${colors.interessado};"></span> Interessado</div>
                </div>
            </div>`;

            container.innerHTML = svg;
        },

        selectNode(nodeId) {
            const detalhes = document.getElementById('grafo-detalhes');
            if (!detalhes) return;

            const nodeData = {
                1: { name: 'CCR S.A.', type: 'Empresa', cnpj: '02.846.056/0001-97', deliberacoes: 45, conexoes: 8, alertas: 2 },
                2: { name: 'Ecovias dos Imigrantes', type: 'Empresa', cnpj: '03.158.863/0001-92', deliberacoes: 38, conexoes: 5, alertas: 3 },
                3: { name: 'Patricia Vanzolini', type: 'Diretora', cargo: 'Diretora Presidente', deliberacoes: 156, conexoes: 4, alertas: 0 },
                4: { name: 'Carlos Henrique Andrade', type: 'Diretor', cargo: 'Diretor de Fiscalizacao', deliberacoes: 89, conexoes: 6, alertas: 1 },
                5: { name: 'Marcos Ribeiro', type: 'Diretor', cargo: 'Diretor de Regulacao', deliberacoes: 112, conexoes: 5, alertas: 2 }
            };

            const data = nodeData[nodeId] || { name: 'Entidade', type: 'Desconhecido', deliberacoes: 0, conexoes: 0, alertas: 0 };

            detalhes.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #60a5fa); margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${data.type === 'Empresa' ? 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' : 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'}"></path></svg>
                    </div>
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${data.name}</h3>
                    <span class="badge ${data.type === 'Empresa' ? 'badge-secondary' : 'badge-primary'}">${data.type}</span>
                </div>
                ${data.cnpj ? `<div style="padding: 8px 0; border-bottom: 1px solid var(--border);"><span style="color: var(--text-muted); font-size: 12px;">CNPJ</span><div style="font-weight: 500;">${data.cnpj}</div></div>` : ''}
                ${data.cargo ? `<div style="padding: 8px 0; border-bottom: 1px solid var(--border);"><span style="color: var(--text-muted); font-size: 12px;">Cargo</span><div style="font-weight: 500;">${data.cargo}</div></div>` : ''}
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;">
                    <div style="text-align: center; padding: 12px; background: var(--background); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${data.deliberacoes}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">Deliberacoes</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: var(--background); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 700; color: #60a5fa;">${data.conexoes}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">Conexoes</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: var(--background); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 700; color: ${data.alertas > 0 ? '#f59e0b' : '#22c55e'};">${data.alertas}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">Alertas</div>
                    </div>
                </div>
                <button class="btn btn-primary" style="width: 100%; margin-top: 16px;" onclick="PageDossie.visualizar('${data.name.toLowerCase().replace(/ /g, '-')}')">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Ver Dossie Completo
                </button>
            `;
        },

        zoomIn() {
            this.zoom = Math.min(this.zoom + 0.2, 2);
            this.renderGraph();
        },

        zoomOut() {
            this.zoom = Math.max(this.zoom - 0.2, 0.5);
            this.renderGraph();
        },

        resetView() {
            this.zoom = 1;
            this.renderGraph();
        },

        exportar() {
            alert('Funcionalidade de exportacao em desenvolvimento');
        }
    };

    // ============================================
    // PAGE: Monitoramento 24/7
    // ============================================
    const PageMonitoramento = {
        init() {
            const page = document.getElementById('page-monitoramento');
            page.classList.add('active');
            this.startPolling();
        },

        startPolling() {
            // Simular atualizacao em tempo real
            this.updateLastCheck();
        },

        updateLastCheck() {
            const elemento = document.getElementById('monitor-ultima');
            if (elemento) {
                elemento.textContent = 'ha 2 min';
            }
        },

        configurar() {
            alert('Configuracao de alertas em desenvolvimento');
        }
    };

    // ============================================
    // PAGE: Dossies Automaticos
    // ============================================
    const PageDossie = {
        init() {
            const page = document.getElementById('page-dossie');
            page.classList.add('active');
        },

        novo() {
            alert('Criacao de novo dossie em desenvolvimento');
        },

        visualizar(id) {
            alert(`Visualizando dossie: ${id}`);
        },

        exportar(id) {
            alert(`Exportando dossie ${id} como PDF`);
        }
    };

    // ============================================
    // PAGE: Cruzamento de Dados
    // ============================================
    const PageCruzamento = {
        init() {
            const page = document.getElementById('page-cruzamento');
            page.classList.add('active');
        },

        sincronizar() {
            alert('Sincronizacao de bases em desenvolvimento');
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
                    const response = await API.post(`/api/analisar-pdf/${index}`);
                    if (!response?.sucesso) {
                        errors++;
                    } else {
                        completed++;
                    }
                } catch (error) {
                    console.error('Erro ao analisar:', error);
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

            document.getElementById('batch-progress-title').textContent =
                this.batchCancelled
                    ? 'Analise cancelada!'
                    : `Analise concluida! ${completed} sucesso, ${errors} erros`;
            document.getElementById('batch-current-files').innerHTML = '';

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

            this.updateBatchUI();
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

            // Contagem por resultado
            const deferidos = deliberacoes.filter(d => d.resultado === 'Deferido').length;
            const indeferidos = deliberacoes.filter(d => d.resultado === 'Indeferido').length;
            const parciais = deliberacoes.filter(d => d.resultado === 'Parcialmente Deferido').length;

            content.innerHTML = `
                <div class="deliberacoes-summary">
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <div class="summary-value">${deliberacoes.length}</div>
                            <div class="summary-label">Total Extraidas</div>
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
                                    <span class="deliberacao-numero">${d.numero_deliberacao || 'Deliberacao ' + (i + 1)}</span>
                                    <span class="deliberacao-reuniao">Reuniao ${d.reuniao_ordinaria || '-'}</span>
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
                                    <span class="deliberacao-label">Classificacao:</span>
                                    <span class="deliberacao-value">${d.classificacao}</span>
                                </div>` : ''}
                            </div>

                            ${totalVotos > 0 ? `
                            <div class="deliberacao-votos">
                                <div class="votos-header">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Votacao dos Diretores
                                </div>
                                <div class="votos-grid">
                                    ${votosAFavor.length > 0 ? `
                                    <div class="votos-column favor">
                                        <div class="votos-title">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                            A Favor (${votosAFavor.length})
                                        </div>
                                        <div class="votos-list">
                                            ${votosAFavor.map(v => `<span class="voto-diretor">${v}</span>`).join('')}
                                        </div>
                                    </div>` : ''}
                                    ${votosContra.length > 0 ? `
                                    <div class="votos-column contra">
                                        <div class="votos-title">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            Contra (${votosContra.length})
                                        </div>
                                        <div class="votos-list">
                                            ${votosContra.map(v => `<span class="voto-diretor">${v}</span>`).join('')}
                                        </div>
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

    // ============================================
    // PAGE: Hub de Noticias e Analise
    // ============================================
    const PageHub = {
        // Agencias Federais completas
        agenciasFederais: [
            { sigla: 'ANA', nome: 'Agencia Nacional de Aguas', setor: 'saneamento', diretores: 5, mandato: 4, fonte: 'API SNIRH + RSS', rss: 'gov.br/ana/pt-br/noticias', viabilidade: 'alta', cor: '#60A5FA' },
            { sigla: 'ANEEL', nome: 'Agencia Nacional de Energia Eletrica', setor: 'energia', diretores: 5, mandato: 5, fonte: 'API aberta + RSS', rss: 'gov.br/aneel/pt-br/noticias', viabilidade: 'alta', cor: '#FFEF4D' },
            { sigla: 'ANATEL', nome: 'Agencia Nacional de Telecomunicacoes', setor: 'telecom', diretores: 5, mandato: 5, fonte: 'API dados.anatel.gov.br', rss: 'gov.br/anatel/pt-br/noticias', viabilidade: 'alta', cor: '#4ADE80' },
            { sigla: 'ANP', nome: 'Agencia Nacional do Petroleo', setor: 'petroleo', diretores: 4, mandato: 4, fonte: 'API + dados abertos', rss: 'gov.br/anp/pt-br/noticias', viabilidade: 'alta', cor: '#F472B6' },
            { sigla: 'ANVISA', nome: 'Agencia Nacional de Vigilancia Sanitaria', setor: 'saude', diretores: 5, mandato: 5, fonte: 'API + RSS', rss: 'gov.br/anvisa/pt-br/noticias', viabilidade: 'alta', cor: '#A78BFA' },
            { sigla: 'ANS', nome: 'Agencia Nacional de Saude Suplementar', setor: 'saude', diretores: 5, mandato: 5, fonte: 'API dados.ans.gov.br', rss: 'gov.br/ans/pt-br/noticias', viabilidade: 'alta', cor: '#F97316' },
            { sigla: 'ANTT', nome: 'Agencia Nacional de Transportes Terrestres', setor: 'transporte', diretores: 5, mandato: 5, fonte: 'API + PNCP', rss: 'gov.br/antt/pt-br/noticias', viabilidade: 'alta', cor: '#14B8A6' },
            { sigla: 'ANTAQ', nome: 'Agencia Nacional de Transportes Aquaviarios', setor: 'transporte', diretores: 3, mandato: 4, fonte: 'Dados abertos', rss: 'gov.br/antaq/pt-br/noticias', viabilidade: 'media', cor: '#06B6D4' },
            { sigla: 'ANAC', nome: 'Agencia Nacional de Aviacao Civil', setor: 'aviacao', diretores: 5, mandato: 5, fonte: 'API + dados abertos', rss: 'gov.br/anac/pt-br/noticias', viabilidade: 'alta', cor: '#8B5CF6' },
            { sigla: 'ANM', nome: 'Agencia Nacional de Mineracao', setor: 'mineracao', diretores: 5, mandato: 4, fonte: 'API SIGMINE', rss: 'gov.br/anm/pt-br/noticias', viabilidade: 'alta', cor: '#EF4444' },
            { sigla: 'ANCINE', nome: 'Agencia Nacional do Cinema', setor: 'cinema', diretores: 4, mandato: 4, fonte: 'RSS', rss: 'gov.br/ancine/pt-br/noticias', viabilidade: 'media', cor: '#EC4899' }
        ],

        // Orgaos complementares
        orgaosComplementares: [
            { sigla: 'TCU', nome: 'Tribunal de Contas da Uniao', fonte: 'RSS', rss: 'portal.tcu.gov.br/imprensa/noticias' },
            { sigla: 'CGU', nome: 'Controladoria-Geral da Uniao', fonte: 'RSS', rss: 'gov.br/cgu/pt-br/noticias' },
            { sigla: 'DOU', nome: 'Diario Oficial da Uniao', fonte: 'API REST', rss: 'in.gov.br/servicos/api' },
            { sigla: 'PNCP', nome: 'Portal Nacional de Contratacoes', fonte: 'API REST', rss: 'pncp.gov.br/api' }
        ],

        // Agencias Estaduais
        agenciasEstaduais: [
            { sigla: 'ARTESP', nome: 'Agencia de Transporte do Estado de Sao Paulo', estado: 'SP', setor: 'transporte' },
            { sigla: 'ARSESP', nome: 'Agencia Reguladora de Servicos Publicos de SP', estado: 'SP', setor: 'saneamento' },
            { sigla: 'ARSAE-MG', nome: 'Agencia Reguladora de Servicos de Abast. de Agua de MG', estado: 'MG', setor: 'saneamento' },
            { sigla: 'AGEPAR', nome: 'Agencia Reguladora do Parana', estado: 'PR', setor: 'multisetorial' },
            { sigla: 'ARCE', nome: 'Agencia Reguladora do Ceara', estado: 'CE', setor: 'multisetorial' },
            { sigla: 'AGERBA', nome: 'Agencia de Regulacao da Bahia', estado: 'BA', setor: 'multisetorial' },
            { sigla: 'ARPE', nome: 'Agencia de Regulacao de Pernambuco', estado: 'PE', setor: 'multisetorial' },
            { sigla: 'ADASA', nome: 'Agencia Reguladora de Aguas do DF', estado: 'DF', setor: 'saneamento' },
            { sigla: 'AGENERSA', nome: 'Agencia Reguladora de Energia e Saneamento do RJ', estado: 'RJ', setor: 'energia' },
            { sigla: 'AGERGS', nome: 'Agencia Estadual de Regulacao do RS', estado: 'RS', setor: 'multisetorial' },
            { sigla: 'ARSAM', nome: 'Agencia Reguladora dos Servicos do Amazonas', estado: 'AM', setor: 'multisetorial' },
            { sigla: 'ARSAL', nome: 'Agencia Reguladora de Servicos de Alagoas', estado: 'AL', setor: 'multisetorial' },
            { sigla: 'AGRESPI', nome: 'Agencia de Regulacao do Piaui', estado: 'PI', setor: 'multisetorial' },
            { sigla: 'AGR', nome: 'Agencia Goiana de Regulacao', estado: 'GO', setor: 'multisetorial' },
            { sigla: 'AGEPAN', nome: 'Agencia de Regulacao do Mato Grosso do Sul', estado: 'MS', setor: 'multisetorial' },
            { sigla: 'AGER-MT', nome: 'Agencia de Regulacao do Mato Grosso', estado: 'MT', setor: 'multisetorial' },
            { sigla: 'ARESC', nome: 'Agencia de Regulacao de Santa Catarina', estado: 'SC', setor: 'multisetorial' },
            { sigla: 'AGEAC', nome: 'Agencia Reguladora do Acre', estado: 'AC', setor: 'multisetorial' },
            { sigla: 'ATR', nome: 'Agencia Tocantinense de Regulacao', estado: 'TO', setor: 'multisetorial' },
            { sigla: 'ARSEP', nome: 'Agencia Reguladora do Rio Grande do Norte', estado: 'RN', setor: 'multisetorial' },
            { sigla: 'ARPB', nome: 'Agencia de Regulacao da Paraiba', estado: 'PB', setor: 'multisetorial' },
            { sigla: 'AGRESE', nome: 'Agencia Reguladora de Sergipe', estado: 'SE', setor: 'multisetorial' },
            { sigla: 'MOB', nome: 'Agencia de Mobilidade de Recife', estado: 'PE', setor: 'transporte' }
        ],

        // Noticias simuladas (placeholder para RSS/API real)
        noticias: [
            { agencia: 'ANEEL', tipo: 'resolucao', titulo: 'ANEEL aprova revisao tarifaria extraordinaria para distribuidoras do Nordeste', resumo: 'A diretoria colegiada da ANEEL aprovou nesta terca-feira a revisao tarifaria extraordinaria que afeta 8 distribuidoras de energia da regiao Nordeste, com impacto medio de 5,2% nas tarifas residenciais.', data: '2026-02-18', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ANVISA', tipo: 'noticia', titulo: 'ANVISA publica novas regras para rotulagem de alimentos ultraprocessados', resumo: 'Resolucao da Diretoria Colegiada estabelece novos criterios para advertencias frontais em embalagens, com prazo de adequacao ate dezembro de 2026.', data: '2026-02-17', esfera: 'federal', fonte: 'Portal ANVISA' },
            { agencia: 'ANATEL', tipo: 'consulta', titulo: 'ANATEL abre consulta publica sobre regulamentacao do 6G', resumo: 'Consulta Publica n. 12/2026 visa colher contribuicoes da sociedade sobre o marco regulatorio para tecnologias de sexta geracao de telecomunicacoes.', data: '2026-02-17', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ARTESP', tipo: 'deliberacao', titulo: 'ARTESP delibera sobre reajuste de pedagio na Rodovia Anhanguera', resumo: 'A 1178a Reuniao Ordinaria da Diretoria analisou o pleito da concessionaria para reajuste anual do pedágio com base no IPCA acumulado.', data: '2026-02-16', esfera: 'estadual', fonte: 'ARTESP Transparencia' },
            { agencia: 'ANA', tipo: 'resolucao', titulo: 'ANA estabelece novas regras para outorga de uso de recursos hidricos', resumo: 'Resolucao define criterios atualizados para concessao de outorga em bacias hidrograficas criticas, priorizando abastecimento humano.', data: '2026-02-15', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ANP', tipo: 'noticia', titulo: 'ANP divulga resultado do 4o Ciclo de Oferta Permanente', resumo: 'Leilao arrecadou R$ 1,2 bilhao em bonus de assinatura, com 15 blocos arrematados por 8 empresas nacionais e internacionais.', data: '2026-02-15', esfera: 'federal', fonte: 'Portal ANP' },
            { agencia: 'ANTT', tipo: 'resolucao', titulo: 'ANTT regulamenta servico de transporte rodoviario interestadual por aplicativo', resumo: 'Nova resolucao cria categoria especifica para transporte por plataformas digitais, com requisitos de seguranca e qualidade.', data: '2026-02-14', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'ARSESP', tipo: 'deliberacao', titulo: 'ARSESP aprova revisao tarifaria da SABESP para ciclo 2026-2030', resumo: 'Agencia estadual concluiu processo de revisao tarifaria periodica da SABESP, definindo novo nivel de receita requerida.', data: '2026-02-14', esfera: 'estadual', fonte: 'ARSESP' },
            { agencia: 'ANAC', tipo: 'noticia', titulo: 'ANAC autoriza operacao de drones autonomos para entregas urbanas', resumo: 'Regulamentacao permite operacoes BVLOS (alem da linha de visada) em areas urbanas especificas, mediante certificacao.', data: '2026-02-13', esfera: 'federal', fonte: 'Portal ANAC' },
            { agencia: 'ANS', tipo: 'resolucao', titulo: 'ANS atualiza Rol de Procedimentos com 12 novas coberturas obrigatorias', resumo: 'Atualizacao inclui terapias genicas, novos medicamentos oncologicos e procedimentos de saude mental no rol obrigatorio.', data: '2026-02-13', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'TCU', tipo: 'auditoria', titulo: 'TCU identifica irregularidades em contratos de concessao rodoviaria', resumo: 'Relatorio de auditoria aponta sobrepreco de R$ 340 milhoes em obras de duplicacao previstas em contratos de concessao federal.', data: '2026-02-12', esfera: 'federal', fonte: 'Portal TCU' },
            { agencia: 'ANM', tipo: 'noticia', titulo: 'ANM intensifica fiscalizacao de barragens com potencial de dano alto', resumo: 'Agencia anuncia plano de fiscalizacao emergencial para 47 barragens classificadas com Nivel de Emergencia 1 e 2.', data: '2026-02-12', esfera: 'federal', fonte: 'RSS gov.br' },
            { agencia: 'DOU', tipo: 'decreto', titulo: 'Governo nomeia dois novos diretores para a ANATEL', resumo: 'Decreto presidencial publicado no DOU nomeia novos integrantes para a diretoria colegiada da agencia de telecomunicacoes.', data: '2026-02-11', esfera: 'federal', fonte: 'API DOU' },
            { agencia: 'AGERGS', tipo: 'deliberacao', titulo: 'AGERGS homologa tarifas do transporte metropolitano de Porto Alegre', resumo: 'Diretoria colegiada homologou o reajuste de 8,3% nas tarifas do sistema de transporte metropolitano do RS.', data: '2026-02-10', esfera: 'estadual', fonte: 'AGERGS' }
        ],

        // Mandatos de diretores (dados publicos do DOU)
        mandatos: [
            { nome: 'Sandoval Feitosa Neto', cargo: 'Diretor-Presidente', agencia: 'ANATEL', fim: '2026-11-05', cor: '#4ADE80' },
            { nome: 'Agnes Maria de Aragao da Costa', cargo: 'Diretora', agencia: 'ANEEL', fim: '2026-07-15', cor: '#FFEF4D' },
            { nome: 'Cristiana Fortini', cargo: 'Diretora', agencia: 'ANTT', fim: '2026-09-20', cor: '#14B8A6' },
            { nome: 'Alex Machado Campos', cargo: 'Diretor', agencia: 'ANVISA', fim: '2027-01-10', cor: '#A78BFA' },
            { nome: 'Fernando Saraiva Fernandes', cargo: 'Diretor', agencia: 'ANP', fim: '2026-12-30', cor: '#F472B6' },
            { nome: 'Paulo Roberto Vanderlei Rebello', cargo: 'Diretor-Presidente', agencia: 'ANS', fim: '2027-03-15', cor: '#F97316' },
            { nome: 'Andre Isper Rodrigues Barnabe', cargo: 'Diretor-Presidente', agencia: 'ARTESP', fim: '2027-06-01', cor: '#FFEF4D' },
            { nome: 'Tiago Pereira Lima', cargo: 'Diretor-Presidente', agencia: 'ANAC', fim: '2027-08-22', cor: '#8B5CF6' }
        ],

        currentTab: 'todas',

        init() {
            const page = document.getElementById('page-hub');
            page.classList.add('active');
            this.renderNews();
            this.renderMandatos();
            this.renderFontes();
            this.renderTabelaFederais();
            this.renderEstaduais();
            this.renderRoadmap();
            this.updateStats();
            this.bindEvents();
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
            let news = [...this.noticias];
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
                resolucao: { label: 'Resolucao', bg: 'rgba(74,222,128,0.2)', color: '#4ADE80' },
                noticia: { label: 'Noticia', bg: 'rgba(96,165,250,0.2)', color: '#60A5FA' },
                consulta: { label: 'Consulta Publica', bg: 'rgba(251,191,36,0.2)', color: '#FBBF24' },
                deliberacao: { label: 'Deliberacao', bg: 'rgba(255,239,77,0.2)', color: '#FFEF4D' },
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
                container.innerHTML = '<div class="empty-state"><p>Nenhuma noticia encontrada para os filtros selecionados.</p></div>';
                return;
            }

            container.innerHTML = '<div class="hub-news-list">' + news.map(n => {
                const cor = this.getAgenciaColor(n.agencia);
                const tipo = this.getTipoBadge(n.tipo);
                const dataFormatada = new Date(n.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

                return `
                    <div class="hub-news-item">
                        <div class="hub-news-badge" style="background: ${cor}20; color: ${cor};">
                            ${n.agencia}
                        </div>
                        <div class="hub-news-content">
                            <div class="hub-news-meta">
                                <span class="hub-news-agency" style="color: ${cor};">${n.agencia}</span>
                                <span class="hub-news-type" style="background: ${tipo.bg}; color: ${tipo.color};">${tipo.label}</span>
                                <span class="hub-news-date">${dataFormatada}</span>
                            </div>
                            <div class="hub-news-title">${n.titulo}</div>
                            <div class="hub-news-excerpt">${n.resumo}</div>
                            <div class="hub-news-source">
                                <span class="hub-news-source-dot"></span>
                                ${n.fonte}
                            </div>
                        </div>
                    </div>
                `;
            }).join('') + '</div>';
        },

        renderMandatos() {
            const container = document.getElementById('hub-mandatos-container');
            if (!container) return;

            const hoje = new Date();
            const mandatosOrdenados = [...this.mandatos].sort((a, b) => new Date(a.fim) - new Date(b.fim));

            container.innerHTML = mandatosOrdenados.map(m => {
                const fim = new Date(m.fim + 'T12:00:00');
                const diffMs = fim - hoje;
                const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const diffMeses = Math.ceil(diffDias / 30);

                let classe = 'expiring-far';
                let restanteColor = 'var(--success)';
                let restanteText = diffMeses + ' meses';

                if (diffDias < 0) {
                    classe = 'expiring-soon';
                    restanteColor = 'var(--danger)';
                    restanteText = 'Expirado';
                } else if (diffDias <= 180) {
                    classe = 'expiring-soon';
                    restanteColor = 'var(--danger)';
                    restanteText = diffDias + ' dias';
                } else if (diffDias <= 365) {
                    classe = 'expiring-medium';
                    restanteColor = 'var(--warning)';
                }

                const iniciais = m.nome.split(' ').filter((_, i, arr) => i === 0 || i === arr.length - 1).map(p => p[0]).join('');

                return `
                    <div class="hub-mandato-item ${classe}">
                        <div class="hub-mandato-avatar" style="background: ${m.cor};">${iniciais}</div>
                        <div class="hub-mandato-info">
                            <div class="hub-mandato-nome">${m.nome}</div>
                            <div class="hub-mandato-cargo">${m.cargo} - ${m.agencia}</div>
                        </div>
                        <div class="hub-mandato-prazo">
                            <div class="hub-mandato-data">${fim.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</div>
                            <div class="hub-mandato-restante" style="color: ${restanteColor};">${restanteText}</div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderFontes() {
            const container = document.getElementById('hub-fontes-container');
            if (!container) return;

            const fontes = [
                { nome: 'DOU - Diario Oficial', tipo: 'API REST', status: 'online', cor: '#A78BFA' },
                { nome: 'PNCP - Contratacoes', tipo: 'API REST', status: 'online', cor: '#4ADE80' },
                { nome: 'Gov.br RSS', tipo: 'RSS Feed', status: 'online', cor: '#60A5FA' },
                { nome: 'ANEEL Dados Abertos', tipo: 'API REST', status: 'online', cor: '#FFEF4D' },
                { nome: 'ANATEL Dados', tipo: 'API REST', status: 'online', cor: '#14B8A6' },
                { nome: 'ANS Dados Abertos', tipo: 'API REST', status: 'online', cor: '#F97316' },
                { nome: 'ANA SNIRH', tipo: 'API', status: 'online', cor: '#06B6D4' },
                { nome: 'ANM SIGMINE', tipo: 'API', status: 'online', cor: '#EF4444' }
            ];

            container.innerHTML = fontes.map(f => `
                <div class="hub-fonte-item">
                    <div class="hub-fonte-icon" style="background: ${f.cor}20; color: ${f.cor};">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>
                    </div>
                    <div class="hub-fonte-info">
                        <div class="hub-fonte-nome">${f.nome}</div>
                        <div class="hub-fonte-tipo">${f.tipo}</div>
                    </div>
                    <div class="hub-fonte-status ${f.status}"></div>
                </div>
            `).join('');
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
                telecom: 'Telecomunicacoes',
                transporte: 'Transportes',
                saude: 'Saude',
                saneamento: 'Saneamento',
                petroleo: 'Petroleo e Gas',
                mineracao: 'Mineracao',
                aviacao: 'Aviacao Civil',
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
                    titulo: 'Noticias das Agencias',
                    desc: 'Criar scrapers e RSS readers para cada agencia. A maioria publica noticias via RSS ou tem pagina paginavel. Armazenar em Supabase.',
                    status: 'active',
                    items: ['RSS Readers', 'Web Scrapers', 'Supabase Storage', 'Feed Aggregator']
                },
                {
                    numero: 2,
                    titulo: 'Mandatos dos Diretores',
                    desc: 'Dados publicos do Diario Oficial da Uniao (DOU). Criar tabela de diretores com mandatos e alertas automaticos de troca.',
                    status: 'pending',
                    items: ['API DOU', 'Tabela Diretores', 'Alertas Automaticos', 'Decretos']
                },
                {
                    numero: 3,
                    titulo: 'Decisoes e Resolucoes',
                    desc: 'Scraping do DOU para resolucoes. ANEEL/ANA publicam em formato estruturado. Classificar por setor regulatorio.',
                    status: 'pending',
                    items: ['Scraping DOU', 'Classificacao por Setor', 'Dados Estruturados', 'Timeline']
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
        // Icones SVG para cada setor
        icones: {
            transporte: `<svg viewBox="0 0 80 80" fill="none">
                <rect x="8" y="28" width="44" height="28" rx="4" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2"/>
                <rect x="52" y="36" width="20" height="20" rx="3" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2"/>
                <path d="M52 42 h12" stroke="currentColor" stroke-width="2" opacity="0.6"/>
                <circle cx="20" cy="60" r="8" fill="none" stroke="currentColor" stroke-width="3"/>
                <circle cx="20" cy="60" r="3" fill="currentColor"/>
                <circle cx="62" cy="60" r="8" fill="none" stroke="currentColor" stroke-width="3"/>
                <circle cx="62" cy="60" r="3" fill="currentColor"/>
                <path d="M12 36 h32 M12 44 h24" stroke="currentColor" stroke-width="2" opacity="0.4"/>
            </svg>`,
            mineracao: `<svg viewBox="0 0 80 80" fill="none">
                <path d="M10 65 L30 30 L40 42 L55 22 L70 65 Z" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2"/>
                <path d="M18 65 L30 45 L40 55 L50 40 L62 65" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
                <path d="M25 28 L35 18 L40 24 L32 35 Z" fill="currentColor"/>
                <rect x="30" y="32" width="5" height="20" rx="2" fill="currentColor" transform="rotate(-45 32 42)"/>
                <circle cx="58" cy="18" r="6" fill="#FFEF4D" stroke="#FFEF4D" stroke-width="1"/>
                <path d="M58 10 v-4 M58 26 v4 M50 18 h-4 M66 18 h4 M52 12 l-2 -2 M64 24 l2 2 M52 24 l-2 2 M64 12 l2 -2" stroke="#FFEF4D" stroke-width="2"/>
                <rect x="15" y="60" width="12" height="5" rx="1" fill="currentColor" opacity="0.5"/>
                <rect x="45" y="60" width="10" height="5" rx="1" fill="currentColor" opacity="0.5"/>
            </svg>`
        },

        agencias: [
            {
                id: 'artesp',
                nome: 'ARTESP',
                nomeCompleto: 'Agencia de Transporte do Estado de Sao Paulo',
                setor: 'transporte',
                esfera: 'Estadual - SP',
                decisoes: 1247,
                aprovadas: 892,
                pendentes: 45,
                cor: '#FFEF4D',
                corSecundaria: '#e6d645',
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
                setor: 'mineracao',
                esfera: 'Federal',
                decisoes: 892,
                aprovadas: 654,
                pendentes: 78,
                cor: '#60A5FA',
                corSecundaria: '#3b82f6',
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
            this.renderAgencyCards();
            this.updateStats();
        },

        updateStats() {
            const totalDecisoes = this.agencias.reduce((sum, a) => sum + a.decisoes, 0);
            const totalAprovadas = this.agencias.reduce((sum, a) => sum + a.aprovadas, 0);
            const totalDiretores = this.agencias.reduce((sum, a) => sum + (a.diretores ? a.diretores.length : 0), 0);
            const taxaMedia = Math.round((totalAprovadas / totalDecisoes) * 100);

            // Atualiza stats cards se existirem
            const statsEl = document.querySelectorAll('#page-agencias .stats-value');
            if (statsEl.length >= 4) {
                statsEl[0].textContent = this.agencias.length;
                statsEl[1].textContent = totalDecisoes.toLocaleString('pt-BR');
                statsEl[2].textContent = taxaMedia + '%';
                statsEl[3].textContent = totalDiretores;
            }
        },

        renderAgencyCards() {
            const container = document.getElementById('agency-cards-container');
            if (!container) return;

            container.innerHTML = this.agencias.map(a => {
                const icone = this.icones[a.setor] || this.icones.transporte;
                const taxa = Math.round((a.aprovadas / a.decisoes) * 100);

                return `
                <div class="agency-card" style="--agency-color: ${a.cor};">
                    <div class="agency-card-header" style="background: linear-gradient(135deg, ${a.cor}15 0%, transparent 100%);">
                        <div class="agency-icon" style="color: ${a.cor};">
                            ${icone}
                        </div>
                        <div class="agency-title-section">
                            <div class="agency-name" style="color: ${a.cor};">${a.nome}</div>
                            <div class="agency-fullname">${a.nomeCompleto}</div>
                        </div>
                        <span class="agency-badge" style="background: ${a.cor}25; color: ${a.cor};">${a.esfera}</span>
                    </div>
                    <div class="agency-card-body">
                        <div class="agency-stats-row">
                            <div class="agency-stat-box">
                                <div class="agency-stat-value" style="color: ${a.cor};">${a.decisoes.toLocaleString('pt-BR')}</div>
                                <div class="agency-stat-label">Decisoes</div>
                            </div>
                            <div class="agency-stat-box">
                                <div class="agency-stat-value" style="color: #4ADE80;">${a.aprovadas.toLocaleString('pt-BR')}</div>
                                <div class="agency-stat-label">Aprovadas</div>
                            </div>
                            <div class="agency-stat-box">
                                <div class="agency-stat-value" style="color: #4ADE80;">${taxa}%</div>
                                <div class="agency-stat-label">Taxa</div>
                            </div>
                        </div>
                        <div class="agency-directors-section">
                            <div class="agency-directors-title">Diretoria Colegiada</div>
                            <div class="agency-directors-list">
                                ${(a.diretores || []).map(d => `
                                    <div class="agency-director-item">
                                        <div class="agency-director-avatar" style="background: ${a.cor};">${d.iniciais}</div>
                                        <div class="agency-director-info">
                                            <div class="agency-director-name">${d.nome}</div>
                                            <div class="agency-director-role">${d.cargo}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `}).join('');
        }
    };

    // ============================================
    // PAGE: Mapa do Brasil (SVG Interativo)
    // ============================================
    const PageMapa = {
        estados: {
            'SP': { nome: 'Sao Paulo', decisoes: 4521, taxa: 78.5, regiao: 'Sudeste' },
            'RJ': { nome: 'Rio de Janeiro', decisoes: 2134, taxa: 72.3, regiao: 'Sudeste' },
            'MG': { nome: 'Minas Gerais', decisoes: 1876, taxa: 81.2, regiao: 'Sudeste' },
            'RS': { nome: 'Rio Grande do Sul', decisoes: 1245, taxa: 75.8, regiao: 'Sul' },
            'PR': { nome: 'Parana', decisoes: 1123, taxa: 79.4, regiao: 'Sul' },
            'BA': { nome: 'Bahia', decisoes: 987, taxa: 68.9, regiao: 'Nordeste' },
            'SC': { nome: 'Santa Catarina', decisoes: 876, taxa: 82.1, regiao: 'Sul' },
            'GO': { nome: 'Goias', decisoes: 654, taxa: 71.5, regiao: 'Centro-Oeste' },
            'PE': { nome: 'Pernambuco', decisoes: 543, taxa: 65.7, regiao: 'Nordeste' },
            'CE': { nome: 'Ceara', decisoes: 432, taxa: 69.2, regiao: 'Nordeste' },
            'DF': { nome: 'Distrito Federal', decisoes: 398, taxa: 84.3, regiao: 'Centro-Oeste' },
            'PA': { nome: 'Para', decisoes: 321, taxa: 62.8, regiao: 'Norte' },
            'MT': { nome: 'Mato Grosso', decisoes: 287, taxa: 73.4, regiao: 'Centro-Oeste' },
            'ES': { nome: 'Espirito Santo', decisoes: 265, taxa: 77.1, regiao: 'Sudeste' },
            'MS': { nome: 'Mato Grosso do Sul', decisoes: 234, taxa: 74.6, regiao: 'Centro-Oeste' },
            'MA': { nome: 'Maranhao', decisoes: 198, taxa: 61.3, regiao: 'Nordeste' },
            'AM': { nome: 'Amazonas', decisoes: 176, taxa: 58.9, regiao: 'Norte' },
            'RN': { nome: 'Rio Grande do Norte', decisoes: 154, taxa: 66.4, regiao: 'Nordeste' },
            'PB': { nome: 'Paraiba', decisoes: 143, taxa: 64.8, regiao: 'Nordeste' },
            'AL': { nome: 'Alagoas', decisoes: 121, taxa: 63.2, regiao: 'Nordeste' },
            'PI': { nome: 'Piaui', decisoes: 98, taxa: 59.7, regiao: 'Nordeste' },
            'SE': { nome: 'Sergipe', decisoes: 87, taxa: 67.3, regiao: 'Nordeste' },
            'RO': { nome: 'Rondonia', decisoes: 76, taxa: 71.2, regiao: 'Norte' },
            'TO': { nome: 'Tocantins', decisoes: 65, taxa: 68.5, regiao: 'Norte' },
            'AC': { nome: 'Acre', decisoes: 43, taxa: 55.8, regiao: 'Norte' },
            'AP': { nome: 'Amapa', decisoes: 32, taxa: 53.1, regiao: 'Norte' },
            'RR': { nome: 'Roraima', decisoes: 21, taxa: 52.4, regiao: 'Norte' }
        },

        // SVG paths for Brazil states (simplified but accurate)
        statePaths: {
            'AC': 'M78,bindPath53 L108,bindPath53 L108,270 L78,270 Z',
            'AM': 'M90,bindPath120 L220,bindPath120 L240,200 L200,220 L140,220 L90,180 Z',
            'RR': 'M175,bindPath40 L220,bindPath40 L230,95 L185,95 Z',
            'AP': 'M310,bindPath35 L345,bindPath35 L355,90 L300,95 Z',
            'PA': 'M230,bindPath100 L350,bindPath95 L380,180 L320,220 L240,200 Z',
            'MA': 'M350,bindPath140 L410,bindPath130 L420,200 L360,210 Z',
            'PI': 'M385,bindPath180 L430,bindPath165 L435,250 L390,260 Z',
            'CE': 'M420,bindPath135 L470,bindPath130 L465,180 L425,185 Z',
            'RN': 'M465,bindPath140 L505,bindPath140 L500,170 L460,175 Z',
            'PB': 'M455,bindPath175 L505,bindPath170 L500,195 L455,200 Z',
            'PE': 'M420,bindPath195 L505,bindPath195 L500,225 L420,230 Z',
            'AL': 'M470,bindPath225 L500,bindPath225 L495,255 L465,255 Z',
            'SE': 'M455,bindPath255 L475,bindPath255 L470,280 L450,280 Z',
            'BA': 'M380,bindPath220 L460,bindPath250 L440,340 L360,320 Z',
            'TO': 'M320,bindPath200 L380,bindPath200 L375,300 L315,290 Z',
            'GO': 'M300,bindPath280 L375,bindPath285 L365,365 L290,355 Z',
            'DF': 'M345,bindPath305 L365,bindPath305 L362,325 L342,325 Z',
            'MT': 'M190,bindPath220 L300,bindPath230 L295,340 L185,320 Z',
            'MS': 'M230,bindPath330 L300,bindPath340 L290,420 L220,410 Z',
            'MG': 'M340,bindPath320 L430,bindPath320 L420,410 L330,400 Z',
            'ES': 'M425,bindPath360 L465,bindPath355 L460,410 L420,415 Z',
            'RJ': 'M395,bindPath400 L445,bindPath395 L440,435 L390,440 Z',
            'SP': 'M290,bindPath380 L380,bindPath390 L370,455 L280,445 Z',
            'PR': 'M265,bindPath440 L350,bindPath445 L340,500 L255,490 Z',
            'SC': 'M290,bindPath495 L355,bindPath495 L350,540 L285,535 Z',
            'RS': 'M255,bindPath520 L340,bindPath530 L300,610 L235,590 Z',
            'RO': 'M130,bindPath230 L190,bindPath230 L185,310 L125,300 Z'
        },

        // Label positions for each state
        labelPositions: {
            'AC': { x: 93, y: 265 }, 'AM': { x: 165, y: 175 }, 'RR': { x: 202, y: 72 },
            'AP': { x: 327, y: 68 }, 'PA': { x: 305, y: 160 }, 'MA': { x: 385, y: 175 },
            'PI': { x: 410, y: 220 }, 'CE': { x: 445, y: 160 }, 'RN': { x: 482, y: 158 },
            'PB': { x: 480, y: 188 }, 'PE': { x: 462, y: 215 }, 'AL': { x: 482, y: 242 },
            'SE': { x: 462, y: 270 }, 'BA': { x: 420, y: 290 }, 'TO': { x: 347, y: 252 },
            'GO': { x: 337, y: 330 }, 'DF': { x: 353, y: 318 }, 'MT': { x: 242, y: 285 },
            'MS': { x: 260, y: 380 }, 'MG': { x: 385, y: 370 }, 'ES': { x: 442, y: 388 },
            'RJ': { x: 417, y: 420 }, 'SP': { x: 330, y: 425 }, 'PR': { x: 305, y: 475 },
            'SC': { x: 322, y: 520 }, 'RS': { x: 287, y: 570 }, 'RO': { x: 157, y: 275 }
        },

        selectedState: null,

        init() {
            const page = document.getElementById('page-mapa');
            page.classList.add('active');
            this.renderBrazilMap();
            this.renderTopStates();
            this.renderRanking();
        },

        getStateColor(decisoes) {
            const maxDecisoes = 4521;
            const ratio = decisoes / maxDecisoes;

            if (ratio > 0.6) return { fill: '#FFEF4D', opacity: 0.9 };
            if (ratio > 0.4) return { fill: '#FFD93D', opacity: 0.8 };
            if (ratio > 0.25) return { fill: '#6BCB77', opacity: 0.75 };
            if (ratio > 0.1) return { fill: '#4D96FF', opacity: 0.7 };
            return { fill: '#9D65C9', opacity: 0.6 };
        },

        renderBrazilMap() {
            const container = document.getElementById('mapa-brasil-container');
            if (!container) return;

            // Usar mapa estilizado com círculos posicionados geograficamente
            // Este é mais confiável que SVG paths complexos
            const width = 600;
            const height = 700;

            // Posições geográficas aproximadas dos estados no SVG
            const statePositions = {
                'AC': { x: 85, y: 340 }, 'AM': { x: 160, y: 220 }, 'RR': { x: 195, y: 95 },
                'AP': { x: 320, y: 95 }, 'PA': { x: 310, y: 210 }, 'MA': { x: 405, y: 205 },
                'PI': { x: 420, y: 280 }, 'CE': { x: 475, y: 225 }, 'RN': { x: 520, y: 230 },
                'PB': { x: 525, y: 265 }, 'PE': { x: 495, y: 300 }, 'AL': { x: 520, y: 340 },
                'SE': { x: 495, y: 365 }, 'BA': { x: 445, y: 400 }, 'TO': { x: 360, y: 320 },
                'GO': { x: 350, y: 430 }, 'DF': { x: 380, y: 415 }, 'MT': { x: 255, y: 370 },
                'MS': { x: 280, y: 490 }, 'MG': { x: 420, y: 485 }, 'ES': { x: 490, y: 490 },
                'RJ': { x: 460, y: 540 }, 'SP': { x: 365, y: 535 }, 'PR': { x: 330, y: 595 },
                'SC': { x: 350, y: 650 }, 'RS': { x: 310, y: 710 }, 'RO': { x: 150, y: 355 }
            };

            const maxDecisoes = 4521;

            // Criar HTML do mapa
            let mapHTML = `
                <div class="brazil-map-container" style="position: relative; width: 100%; height: ${height}px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; overflow: hidden;">
                    <svg viewBox="0 0 ${width} ${height + 50}" style="width: 100%; height: 100%;">
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#0f172a"/>
                                <stop offset="100%" style="stop-color:#1e293b"/>
                            </linearGradient>
                        </defs>

                        <!-- Contorno simplificado do Brasil -->
                        <path d="M85,340 Q60,300 85,260 Q100,200 160,180 Q195,60 320,70 Q380,80 420,150 Q500,180 540,250 Q560,320 530,400 Q510,500 460,540 Q400,580 350,620 Q320,680 310,750 Q280,720 250,680 Q200,600 220,520 Q200,450 150,400 Q100,380 85,340"
                              fill="none" stroke="rgba(255,239,77,0.15)" stroke-width="2" stroke-dasharray="5,5"/>

                        <!-- Estados como círculos -->
                        ${Object.entries(statePositions).map(([code, pos]) => {
                            const estado = this.estados[code];
                            if (!estado) return '';

                            const ratio = estado.decisoes / maxDecisoes;
                            const minRadius = 18;
                            const maxRadius = 50;
                            const radius = minRadius + (maxRadius - minRadius) * Math.sqrt(ratio);

                            const colorInfo = this.getStateColor(estado.decisoes);

                            return `
                                <g class="state-circle-group" data-state="${code}" style="cursor: pointer;">
                                    <!-- Círculo de fundo com glow -->
                                    <circle cx="${pos.x}" cy="${pos.y}" r="${radius + 4}"
                                            fill="${colorInfo.fill}" fill-opacity="0.15"/>
                                    <!-- Círculo principal -->
                                    <circle cx="${pos.x}" cy="${pos.y}" r="${radius}"
                                            fill="${colorInfo.fill}" fill-opacity="${colorInfo.opacity}"
                                            stroke="${colorInfo.fill}" stroke-width="2" stroke-opacity="0.8"
                                            class="state-main-circle"/>
                                    <!-- Label do estado -->
                                    <text x="${pos.x}" y="${pos.y + 4}"
                                          text-anchor="middle" fill="#0f172a"
                                          font-size="${radius > 30 ? 14 : 11}" font-weight="700"
                                          style="pointer-events: none; text-shadow: 0 1px 2px rgba(255,255,255,0.3);">
                                        ${code}
                                    </text>
                                </g>
                            `;
                        }).join('')}

                        <!-- Linhas de conexão decorativas -->
                        <g stroke="rgba(255,239,77,0.1)" stroke-width="1">
                            <line x1="365" y1="535" x2="420" y2="485"/>
                            <line x1="420" y1="485" x2="445" y2="400"/>
                            <line x1="350" y1="430" x2="420" y2="485"/>
                            <line x1="310" y1="210" x2="405" y2="205"/>
                        </g>
                    </svg>

                    <!-- Tooltip -->
                    <div id="map-tooltip-internal" class="map-tooltip-box" style="display: none; position: absolute; pointer-events: none; z-index: 100;"></div>
                </div>
            `;

            container.innerHTML = mapHTML;

            // Adicionar event listeners para interatividade
            container.querySelectorAll('.state-circle-group').forEach(group => {
                const code = group.dataset.state;
                const estado = this.estados[code];
                const mainCircle = group.querySelector('.state-main-circle');

                group.addEventListener('mouseenter', (e) => {
                    mainCircle.style.filter = 'url(#glow)';
                    mainCircle.style.transform = 'scale(1.1)';
                    mainCircle.style.transformOrigin = 'center';

                    // Mostrar tooltip
                    const tooltip = document.getElementById('mapa-tooltip');
                    if (tooltip && estado) {
                        tooltip.querySelector('.tooltip-state').textContent = estado.nome;
                        tooltip.querySelector('.tooltip-badge').textContent = estado.regiao;
                        tooltip.querySelector('.tooltip-stat-value').textContent = estado.decisoes.toLocaleString('pt-BR');
                        tooltip.querySelector('.tooltip-stat-rate').textContent = estado.taxa + '%';
                        tooltip.style.display = 'block';
                        tooltip.style.left = (e.clientX + 15) + 'px';
                        tooltip.style.top = (e.clientY + 15) + 'px';
                    }
                });

                group.addEventListener('mousemove', (e) => {
                    const tooltip = document.getElementById('mapa-tooltip');
                    if (tooltip) {
                        tooltip.style.left = (e.clientX + 15) + 'px';
                        tooltip.style.top = (e.clientY + 15) + 'px';
                    }
                });

                group.addEventListener('mouseleave', () => {
                    mainCircle.style.filter = 'none';
                    mainCircle.style.transform = 'scale(1)';

                    const tooltip = document.getElementById('mapa-tooltip');
                    if (tooltip) {
                        tooltip.style.display = 'none';
                    }
                });

                group.addEventListener('click', () => {
                    this.selectState(code);
                });
            });
        },

        selectState(code) {
            this.selectedState = code;
            const estado = this.estados[code];
            const panel = document.getElementById('mapa-info-panel');

            // Highlight selected state circle
            document.querySelectorAll('.state-circle-group').forEach(g => {
                const circle = g.querySelector('.state-main-circle');
                if (g.dataset.state === code) {
                    circle.style.strokeWidth = '4';
                    circle.style.filter = 'url(#glow)';
                } else {
                    circle.style.strokeWidth = '2';
                    circle.style.filter = 'none';
                }
            });

            // Update info panel
            panel.innerHTML = `
                <div class="info-panel-header selected">
                    <span class="state-code">${code}</span>
                    <span class="state-name">${estado.nome}</span>
                </div>
                <div class="info-panel-stats">
                    <div class="info-stat">
                        <div class="info-stat-value">${estado.decisoes.toLocaleString('pt-BR')}</div>
                        <div class="info-stat-label">Decisoes</div>
                    </div>
                    <div class="info-stat">
                        <div class="info-stat-value">${estado.taxa}%</div>
                        <div class="info-stat-label">Taxa Deferimento</div>
                    </div>
                </div>
                <div class="info-panel-region">
                    <span class="region-tag">${estado.regiao}</span>
                </div>
                <div class="info-panel-chart">
                    <div class="mini-bar-chart">
                        <div class="bar-fill" style="width: ${(estado.decisoes / 4521 * 100)}%"></div>
                    </div>
                    <span class="chart-label">Volume relativo ao maior (SP)</span>
                </div>
            `;
        },

        renderTopStates() {
            const container = document.getElementById('mapa-top-states');
            if (!container) return;

            const sorted = Object.entries(this.estados)
                .sort((a, b) => b[1].decisoes - a[1].decisoes)
                .slice(0, 5);

            container.innerHTML = sorted.map(([code, estado], index) => {
                const colorInfo = this.getStateColor(estado.decisoes);
                return `
                    <div class="top-state-item" onclick="App.PageMapa.selectState('${code}')">
                        <div class="top-state-rank">${index + 1}</div>
                        <div class="top-state-info">
                            <span class="top-state-code" style="background: ${colorInfo.fill}">${code}</span>
                            <span class="top-state-name">${estado.nome}</span>
                        </div>
                        <div class="top-state-value">${estado.decisoes.toLocaleString('pt-BR')}</div>
                    </div>
                `;
            }).join('');
        },

        renderRanking() {
            const list = document.getElementById('mapa-ranking');
            if (!list) return;

            const sorted = Object.entries(this.estados)
                .sort((a, b) => b[1].decisoes - a[1].decisoes)
                .slice(0, 8);

            list.innerHTML = sorted.map(([code, data], index) => `
                <div class="state-item" data-state="${code}">
                    <div class="state-rank">${index + 1}</div>
                    <div class="state-info">
                        <div class="state-name">${data.nome}</div>
                        <div class="state-bar">
                            <div class="state-bar-fill" style="width: ${(data.decisoes / sorted[0][1].decisoes * 100)}%;"></div>
                        </div>
                    </div>
                    <div class="state-value">${data.decisoes.toLocaleString('pt-BR')}</div>
                </div>
            `).join('');
        }
    };

    // ============================================
    // PAGE: Radar Regulatorio
    // ============================================
    const PageRadar = {
        currentTab: 'dashboard',

        init() {
            const page = document.getElementById('page-radar');
            page.classList.add('active');
            this.bindEvents();
        },

        bindEvents() {
            // Tab switching
            document.querySelectorAll('.radar-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    document.querySelectorAll('.radar-tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    this.currentTab = e.target.dataset.radarTab;
                    this.renderContent();
                });
            });
        },

        renderContent() {
            const dashboardContent = document.getElementById('radar-dashboard-content');
            if (this.currentTab === 'dashboard' && dashboardContent) {
                dashboardContent.style.display = 'block';
            } else if (dashboardContent) {
                dashboardContent.style.display = 'block'; // Keep showing for now
            }
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
            Router.register('/grafo', () => {
                PageMonitor.destroy();
                PageGrafo.init();
            });
            Router.register('/monitoramento', () => {
                PageMonitor.destroy();
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

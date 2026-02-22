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
                '/upload': 'Upload de PDFs',
                '/analise': 'Análise de PDFs',
                '/agencias': 'Agências Reguladoras',
                '/mapa': 'Mapa do Brasil',
                '/radar': 'Radar Regulatório',
                '/painel-regulatorio': 'Painel Regulatório',
                '/setores': 'Setores Regulados',
                '/microtemas': 'Microtemas',
                '/empresas': 'Empresas',
                '/historico': 'Histórico',
                '/grafo': 'Grafo de Conexões',
                '/monitoramento': 'Monitoramento 24/7',
                '/dossie': 'Dossiês Automáticos',
                '/cruzamento': 'Cruzamento de Dados'
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

        // Dados de exemplo para demonstracao
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

        async init() {
            const page = document.getElementById('page-deliberacoes');
            page.classList.add('active');

            const container = document.getElementById('deliberacoes-list');
            if (container) {
                container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Carregando deliberações...</span></div>';
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
                            <div class="modal-info-label">Agência</div>
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
                const response = await fetch('/api/metricas/por-diretor');
                const data = await response.json();

                if (data.success && data.diretores && data.diretores.length > 0) {
                    // Merge real data into ARTESP section
                    const artesp = this.agenciasData.artesp;
                    artesp.diretores = data.diretores.map(d => ({
                        nome: d.nome,
                        cargo: d.cargo || 'Diretor(a)',
                        iniciais: d.nome.split(' ').filter(w => w.length > 2).map(w => w[0]).join('').substring(0, 2).toUpperCase(),
                        inicio: d.inicio || '',
                        termino: d.termino || '',
                        ativo: true,
                        participacoes: d.totalVotos || 0,
                        relatorias: d.relatorias || 0,
                        favoravel: d.favoraveis || 0,
                        desfavoravel: d.contrarios || 0,
                        vista: d.vistas || 0
                    }));
                    artesp.stats.diretoresAtivos = artesp.diretores.length;
                    artesp.stats.participacoesColegiadas = artesp.diretores.reduce((s, d) => s + d.participacoes, 0);
                    artesp.stats.deliberacoes = data.totalDeliberacoes || artesp.stats.deliberacoes;

                    // Hide demo banner
                    const demoBanner = document.querySelector('#page-diretores .demo-banner');
                    if (demoBanner) demoBanner.style.display = 'none';

                    console.log(`[Diretores] ${artesp.diretores.length} diretores carregados dos PDFs reais`);
                }
            } catch (error) {
                console.warn('[Diretores] API indisponível, exibindo dados base:', error.message);
            }
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

                <div class="profile-alert" style="background: rgba(201, 162, 39, 0.1); border-left: 3px solid var(--accent);">
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
            alert('Gerando boletim para ' + mes + '...\nEsta funcionalidade será conectada à API de geração de boletins.');
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
    // PAGE: Análise de Vínculos — Sherlocker-style
    // Select entity first, then render graph on demand
    // ============================================
    const PageGrafo = {
        canvas: null, ctx: null, nodes: [], edges: [], animFrame: null,
        dragging: null, hovering: null, selected: null,
        mouse: { x: 0, y: 0 }, camera: { x: 0, y: 0, zoom: 1 },
        width: 0, height: 0, time: 0, currentCategory: 'all',
        dataLoaded: false,
        _settled: false, _settledFrames: 0,
        _cachedRect: null, _gridCanvas: null,
        _connIndex: null,
        // ----------- Catalog loaded from API (real data) -----------
        catalog: { directors: [], companies: [], themes: [], agencies: [], connections: [] },

        // ========== INIT: Load real data then show selection screen ==========
        async init() {
            document.getElementById('page-grafo').classList.add('active');
            if (!this.dataLoaded) {
                await this.loadRealData();
            }
            this.showSelectionScreen();
        },

        async loadRealData() {
            try {
                const grid = document.getElementById('grafo-entity-grid');
                if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px 0;color:var(--text-muted);">Carregando dados dos PDFs analisados...</div>';

                const response = await fetch('/api/grafo-data-completo');
                const data = await response.json();

                if (data.success && data.nodes && data.nodes.length > 0) {
                    const directors = [], companies = [], themes = [], agencies = [], connections = [];

                    data.nodes.forEach(n => {
                        if (n.type === 'agency') agencies.push({ id: n.id, label: n.label, full: n.full || n.label, setor: n.setor || '', esfera: n.esfera || 'federal', site: n.site || '', lei_criacao: n.lei_criacao || '', vinculacao: n.vinculacao || '', deliberations: n.deliberations || 0 });
                        else if (n.type === 'director') directors.push({ id: n.id, label: n.label, full: n.full || n.label, role: n.role || 'Diretor(a)', mandato: n.mandato || '', initials: n.initials || n.label.split(' ').map(w=>w[0]).join('').substring(0,2), agency: n.agency || '' });
                        else if (n.type === 'company') companies.push({ id: n.id, label: n.label, full: n.full || n.label, sector: n.sector || 'Regulado', contracts: n.contracts || 0, mentions: n.mentions || 0 });
                        else if (n.type === 'theme') themes.push({ id: n.id, label: n.label, count: n.count || 0, category: n.category || 'regulação' });
                    });

                    data.edges.forEach(e => {
                        connections.push({ source: e.source, target: e.target, strength: e.strength || 0.5, label: e.label || '' });
                    });

                    this.catalog = { directors, companies, themes, agencies, connections };
                    this._buildConnIndex();
                    this.dataLoaded = true;
                    console.log(`[Grafo] Dados reais carregados: ${data.nodes.length} nós, ${data.edges.length} conexões`);

                    const demoBanner = document.querySelector('#page-grafo .demo-banner');
                    if (demoBanner && data.nodes.length > 1) demoBanner.style.display = 'none';
                } else {
                    console.warn('[Grafo] Nenhum dado real disponível — faça upload de PDFs para alimentar o grafo');
                    this.catalog = { directors: [], companies: [], themes: [], agencies: [], connections: [] };
                    this._connIndex = {};
                    this.dataLoaded = true;
                }
            } catch (error) {
                console.warn('[Grafo] Erro ao carregar dados reais:', error.message);
                this.catalog = { directors: [], companies: [], themes: [], agencies: [], connections: [] };
                this._connIndex = {};
                this.dataLoaded = true;
            }
        },
        destroy() {
            if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
        },

        // Pre-compute connection counts (avoids O(n²) in getAllEntities)
        _buildConnIndex() {
            this._connIndex = {};
            this.catalog.connections.forEach(cn => {
                this._connIndex[cn.source] = (this._connIndex[cn.source] || 0) + 1;
                this._connIndex[cn.target] = (this._connIndex[cn.target] || 0) + 1;
            });
        },

        // ========== SELECTION SCREEN ==========
        showSelectionScreen() {
            document.getElementById('grafo-selection-screen').style.display = '';
            document.getElementById('grafo-graph-screen').style.display = 'none';
            if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
            this.currentCategory = 'all';
            this.renderEntityGrid();
        },
        getAllEntities() {
            const c = this.catalog;
            const ci = this._connIndex || {};
            const entities = [];
            c.agencies.forEach(a => {
                const dirCount = c.directors.filter(d => d.agency === a.id).length;
                entities.push({ ...a, type: 'agency', icon: 'A', color: '#a78bfa', subtitle: a.full, meta: `${a.deliberations} deliberações · ${dirCount} diretores`, connCount: ci[a.id] || 0 });
            });
            c.directors.forEach(d => {
                entities.push({ ...d, type: 'director', icon: d.initials, color: '#60a5fa', subtitle: d.role, meta: `${ci[d.id] || 0} vínculos`, connCount: ci[d.id] || 0 });
            });
            c.companies.forEach(co => {
                entities.push({ ...co, type: 'company', icon: co.label.charAt(0), color: '#fbbf24', subtitle: co.full, meta: `${co.sector} · ${co.contracts} contratos`, connCount: ci[co.id] || 0 });
            });
            c.themes.forEach(t => {
                entities.push({ ...t, type: 'theme', icon: t.label.charAt(0), color: '#4ade80', subtitle: t.category, meta: `${t.count} ocorrências`, connCount: ci[t.id] || 0 });
            });
            return entities;
        },
        renderEntityGrid(filter) {
            let entities = this.getAllEntities();
            if (this.currentCategory !== 'all') entities = entities.filter(e => e.type === this.currentCategory);
            if (filter) { const q = filter.toLowerCase(); entities = entities.filter(e => e.label.toLowerCase().includes(q) || (e.full || '').toLowerCase().includes(q) || (e.subtitle || '').toLowerCase().includes(q)); }
            const grid = document.getElementById('grafo-entity-grid');
            if (!entities.length) {
                const isSearch = !!filter;
                grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 0;color:var(--text-muted);">
                    ${isSearch ? 'Nenhuma entidade encontrada para esta busca.' : 'Carregando entidades... Se não aparecerem, verifique a conexão com o servidor.'}
                </div>`;
                return;
            }
            const typeLabel = { agency: 'Agência', director: 'Diretor(a)', company: 'Empresa', theme: 'Tema' };
            grid.innerHTML = entities.map(e => `
                <div class="grafo-entity-card" onclick="App.PageGrafo.selectEntity('${e.id}')" data-type="${e.type}">
                    <div class="grafo-entity-card-icon" style="background:${e.color}20;color:${e.color};border:1px solid ${e.color}40;">${e.icon}</div>
                    <div class="grafo-entity-card-body">
                        <div class="grafo-entity-card-name">${e.label}</div>
                        <div class="grafo-entity-card-type" style="color:${e.color}">${typeLabel[e.type]}</div>
                        <div class="grafo-entity-card-meta">${e.meta}</div>
                    </div>
                    <div class="grafo-entity-card-arrow">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </div>
                </div>
            `).join('');
        },
        filterEntities(q) { this.renderEntityGrid(q); },
        filterByCategory(cat) {
            this.currentCategory = cat;
            document.querySelectorAll('.grafo-cat-tab').forEach(b => {
                const active = b.getAttribute('data-cat') === cat;
                b.classList.toggle('active', active);
                b.classList.toggle('btn-primary', active);
                b.classList.toggle('btn-outline', !active);
            });
            this.renderEntityGrid(document.getElementById('grafo-entity-search').value);
        },

        // ========== TYPE/COLOR/RADIUS HELPERS ==========
        _typeConfig: {
            agency:   { color: '#a78bfa', radius: 34 },
            director: { color: '#60a5fa', radius: 28 },
            company:  { color: '#fbbf24', radius: 22 },
            theme:    { color: '#4ade80', radius: 18 }
        },
        _getItemType(item) {
            // Use catalog membership to determine type (IDs are names, not prefixed)
            const c = this.catalog;
            if (c.agencies.some(a => a.id === item.id)) return 'agency';
            if (c.directors.some(d => d.id === item.id)) return 'director';
            if (c.companies.some(co => co.id === item.id)) return 'company';
            if (c.themes.some(t => t.id === item.id)) return 'theme';
            return item.type || 'theme';
        },
        // Track expansion depth for on-demand expansion
        expandedIds: new Set(),
        currentRootId: null,

        // ========== SELECT ENTITY → BUILD GRAPH ==========
        selectEntity(entityId) {
            document.getElementById('grafo-selection-screen').style.display = 'none';
            document.getElementById('grafo-graph-screen').style.display = '';

            this.currentRootId = entityId;
            this.expandedIds = new Set([entityId]);
            this._buildSubgraph(entityId, 1); // Start with 1st degree only
        },

        // Build subgraph showing connections up to the expanded depth
        _buildSubgraph(centerId, degree) {
            const c = this.catalog;
            const relevantIds = new Set();

            // Add all expanded entities and their 1st-degree connections
            this.expandedIds.forEach(eid => {
                relevantIds.add(eid);
                c.connections.forEach(cn => {
                    if (cn.source === eid) relevantIds.add(cn.target);
                    if (cn.target === eid) relevantIds.add(cn.source);
                });
            });

            // Build node/edge arrays
            const allItems = [...c.agencies, ...c.directors, ...c.companies, ...c.themes];
            const nodeMap = {};
            const existingPos = {};
            this.nodes.forEach(n => { existingPos[n.id] = { x: n.x, y: n.y }; });

            allItems.forEach(item => {
                if (!relevantIds.has(item.id)) return;
                const type = this._getItemType(item);
                const cfg = this._typeConfig[type];
                const existing = existingPos[item.id];
                // Pre-parse color to RGB (avoids parseInt every frame)
                const num = parseInt(cfg.color.slice(1), 16);
                nodeMap[item.id] = {
                    ...item, type, color: cfg.color, radius: cfg.radius,
                    _cr: (num >> 16) & 255, _cg: (num >> 8) & 255, _cb: num & 255,
                    x: existing ? existing.x : 0, y: existing ? existing.y : 0,
                    vx: 0, vy: 0, pulsePhase: Math.random() * Math.PI * 2,
                    connections: 0, _isRoot: item.id === this.currentRootId,
                    _isExpanded: this.expandedIds.has(item.id),
                    _depth: this.expandedIds.has(item.id) ? 0 : 1
                };
            });

            this.nodes = Object.values(nodeMap);
            this.edges = [];
            c.connections.forEach(cn => {
                const s = nodeMap[cn.source], t = nodeMap[cn.target];
                if (s && t) {
                    s.connections++; t.connections++;
                    this.edges.push({
                        source: s, target: t, strength: cn.strength, label: cn.label,
                        phase: Math.random() * Math.PI * 2,
                        _particleSpeed: 0.3 + (cn.strength || 0.5) * 0.3
                    });
                }
            });

            // Update stats
            const rootNode = nodeMap[this.currentRootId];
            document.getElementById('grafo-graph-title').textContent = 'Vínculos: ' + (rootNode ? rootNode.label : '');
            document.getElementById('grafo-graph-subtitle').textContent = `${this.nodes.length} entidades · ${this.edges.length} conexões`;
            document.getElementById('intel-total-nodes').textContent = this.nodes.length;
            document.getElementById('intel-total-edges').textContent = this.edges.length;
            const maxDeg = this.nodes.reduce((m, n) => Math.max(m, n.connections), 0);
            document.getElementById('intel-max-degree').textContent = maxDeg;
            const depthEl = document.getElementById('intel-depth');
            if (depthEl) depthEl.textContent = this.expandedIds.size;

            // Layout only new nodes (keep existing positions)
            const hasExisting = Object.keys(existingPos).length > 0;
            if (!hasExisting) {
                this.setupCanvas();
                this.layoutNodes(this.currentRootId);
            } else {
                // Position only new nodes near their connected node
                this.nodes.forEach(n => {
                    if (!existingPos[n.id]) {
                        const connEdge = this.edges.find(e => (e.source === n && existingPos[e.target.id]) || (e.target === n && existingPos[e.source.id]));
                        if (connEdge) {
                            const anchor = connEdge.source === n ? connEdge.target : connEdge.source;
                            n.x = anchor.x + (Math.random() - 0.5) * 120;
                            n.y = anchor.y + (Math.random() - 0.5) * 120;
                        } else {
                            n.x = this.width / 2 + (Math.random() - 0.5) * 200;
                            n.y = this.height / 2 + (Math.random() - 0.5) * 200;
                        }
                    }
                });
            }

            for (let i = 0; i < 200; i++) this.simulateForces(0.4 * (1 - i / 200));
            if (!hasExisting) { this.setupEvents(); this.time = 0; this.animate(); }
        },

        // ========== EXPAND NODE: Double-click to reveal 2nd/3rd degree connections ==========
        expandNode(node) {
            if (this.expandedIds.has(node.id)) return; // Already expanded
            this.expandedIds.add(node.id);
            this._buildSubgraph(node.id, 1);
            // Flash effect to show expansion
            node._expandFlash = this.time;
        },
        layoutNodes(rootId) {
            const cx = this.width / 2, cy = this.height / 2;
            const root = this.nodes.find(n => n.id === rootId);
            if (root) { root.x = cx; root.y = cy; }
            const others = this.nodes.filter(n => n.id !== rootId);
            others.forEach((n, i) => {
                const angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
                const ring = 240 + (Math.random() - 0.5) * 80;
                n.x = cx + Math.cos(angle) * ring;
                n.y = cy + Math.sin(angle) * ring;
            });
        },
        backToSelection() {
            if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
            this.nodes = []; this.edges = [];
            this.dragging = null; this.hovering = null; this.selected = null;
            this.expandedIds.clear();
            this._gridCanvas = null;
            this.showSelectionScreen();
        },

        // ========== GRAPH ENGINE (optimized rendering) ==========
        setupCanvas() {
            this.canvas = document.getElementById('intel-canvas');
            this.ctx = this.canvas.getContext('2d');
            const wrapper = this.canvas.parentElement;
            this.width = wrapper.clientWidth; this.height = wrapper.clientHeight;
            this.canvas.width = this.width * 2; this.canvas.height = this.height * 2;
            this.canvas.style.width = this.width + 'px'; this.canvas.style.height = this.height + 'px';
            this.ctx.setTransform(1,0,0,1,0,0);
            this.ctx.scale(2, 2);
            this.camera = { x: this.width / 2, y: this.height / 2, zoom: 1 };
            this._cachedRect = this.canvas.getBoundingClientRect();
            // Offscreen canvas for static grid (rendered once)
            this._buildGridCanvas();
        },
        _buildGridCanvas() {
            const w = this.width, h = this.height;
            const offscreen = document.createElement('canvas');
            offscreen.width = w * 2; offscreen.height = h * 2;
            const octx = offscreen.getContext('2d');
            octx.scale(2, 2);
            // Clean dark background with subtle radial gradient
            octx.fillStyle = '#080c14';
            octx.fillRect(0, 0, w, h);
            const grad = octx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.6);
            grad.addColorStop(0, 'rgba(42, 66, 140, 0.08)');
            grad.addColorStop(0.5, 'rgba(42, 66, 140, 0.03)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            octx.fillStyle = grad;
            octx.fillRect(0, 0, w, h);
            // Subtle dot pattern instead of grid
            octx.fillStyle = 'rgba(255,255,255,0.03)';
            const dotSpacing = 48;
            for (let gx = dotSpacing; gx < w; gx += dotSpacing) {
                for (let gy = dotSpacing; gy < h; gy += dotSpacing) {
                    octx.beginPath(); octx.arc(gx, gy, 0.5, 0, Math.PI * 2); octx.fill();
                }
            }
            this._gridCanvas = offscreen;
        },
        simulateForces(alpha) {
            const cx=this.width/2,cy=this.height/2;
            const nodes=this.nodes,len=nodes.length;
            // Stronger repulsion for better spacing with circular nodes
            for(let i=0;i<len;i++) {
                const a=nodes[i];
                for(let j=i+1;j<len;j++){
                    const b=nodes[j];
                    const dx=b.x-a.x,dy=b.y-a.y;
                    const distSq=dx*dx+dy*dy;
                    if(distSq>1000000) continue;
                    const dist=Math.sqrt(distSq)||1;
                    const force=8000/distSq*alpha;
                    const fx=(dx/dist)*force,fy=(dy/dist)*force;
                    a.vx-=fx;a.vy-=fy;b.vx+=fx;b.vy+=fy;
                }
            }
            // Spring forces along edges — longer resting distance
            const edges=this.edges,elen=edges.length;
            for(let i=0;i<elen;i++){
                const e=edges[i];
                const dx=e.target.x-e.source.x,dy=e.target.y-e.source.y;
                const dist=Math.sqrt(dx*dx+dy*dy)||1;
                const force=(dist-280)*0.003*e.strength*alpha;
                const fx=(dx/dist)*force,fy=(dy/dist)*force;
                e.source.vx+=fx;e.source.vy+=fy;e.target.vx-=fx;e.target.vy-=fy;
            }
            // Centering + damping + settle detection
            let totalEnergy=0;
            for(let i=0;i<len;i++){
                const n=nodes[i];
                n.vx+=(cx-n.x)*0.0008*alpha;n.vy+=(cy-n.y)*0.0008*alpha;
                n.x+=n.vx;n.y+=n.vy;
                n.vx*=0.88;n.vy*=0.88;
                totalEnergy+=n.vx*n.vx+n.vy*n.vy;
            }
            if(totalEnergy<0.01*len){this._settledFrames++;if(this._settledFrames>30)this._settled=true;}
            else{this._settledFrames=0;this._settled=false;}
        },
        setupEvents() {
            const canvas=this.canvas;
            const clone = canvas.cloneNode(true);
            canvas.parentNode.replaceChild(clone, canvas);
            this.canvas = clone; this.ctx = clone.getContext('2d');
            this.ctx.setTransform(1,0,0,1,0,0); this.ctx.scale(2,2);
            this._cachedRect = clone.getBoundingClientRect();
            const tooltipEl=document.getElementById('intel-tooltip');

            clone.addEventListener('mousemove',(e)=>{
                const rect=this._cachedRect;
                this.mouse.x=(e.clientX-rect.left-this.camera.x+this.width/2)/this.camera.zoom;
                this.mouse.y=(e.clientY-rect.top-this.camera.y+this.height/2)/this.camera.zoom;
                if(this.dragging){this.dragging.x=this.mouse.x;this.dragging.y=this.mouse.y;this._settled=false;this._settledFrames=0;return;}
                let found=null;
                for(let i=this.nodes.length-1;i>=0;i--){const n=this.nodes[i];if(n._hidden)continue;const r=n._isRoot?35:n.type==='agency'?31:n.type==='director'?27:n.type==='company'?25:21;const dx=this.mouse.x-n.x,dy=this.mouse.y-n.y;if(dx*dx+dy*dy<r*r){found=n;break;}}
                if(found!==this.hovering){
                    this.hovering=found;clone.style.cursor=found?'pointer':'grab';
                    if(found){
                        const tl={director:'Diretor(a)',company:'Empresa',theme:'Tema',agency:'Agência'};
                        const expandHint = !this.expandedIds.has(found.id) ? '<br><span style="opacity:0.6;font-size:10px">Duplo-clique para expandir</span>' : '';
                        tooltipEl.innerHTML=`<strong>${found.label}</strong>${tl[found.type]} | ${found.connections} conexões${expandHint}`;
                        tooltipEl.style.display='block';const rx=e.clientX-rect.left,ry=e.clientY-rect.top;tooltipEl.style.left=(rx+15)+'px';tooltipEl.style.top=(ry-10)+'px';
                    } else{tooltipEl.style.display='none';}
                } else if(found){const rx=e.clientX-this._cachedRect.left,ry=e.clientY-this._cachedRect.top;tooltipEl.style.left=(rx+15)+'px';tooltipEl.style.top=(ry-10)+'px';}
            });
            clone.addEventListener('mousedown',(e)=>{
                if(this.hovering){this.dragging=this.hovering;clone.style.cursor='grabbing';}
                else{const sx=e.clientX,sy=e.clientY,cx0=this.camera.x,cy0=this.camera.y;const onM=(ev)=>{this.camera.x=cx0+(ev.clientX-sx);this.camera.y=cy0+(ev.clientY-sy);};const onU=()=>{window.removeEventListener('mousemove',onM);window.removeEventListener('mouseup',onU);};window.addEventListener('mousemove',onM);window.addEventListener('mouseup',onU);}
            });
            clone.addEventListener('mouseup',()=>{this.dragging=null;clone.style.cursor=this.hovering?'pointer':'grab';});
            clone.addEventListener('click',()=>{if(this.hovering){this.selected=this.hovering;this.showNodeInfo(this.hovering);}});
            clone.addEventListener('dblclick',(e)=>{
                e.preventDefault();
                if(this.hovering && !this.expandedIds.has(this.hovering.id)){
                    this.expandNode(this.hovering);
                }
            });
            clone.addEventListener('wheel',(e)=>{e.preventDefault();const d=e.deltaY>0?0.9:1.1;this.camera.zoom=Math.max(0.3,Math.min(3,this.camera.zoom*d));this._settled=false;this._settledFrames=0;});
        },
        filterNodeType(val) { this.nodes.forEach(n=>{ n._hidden = val!=='all' && n.type!==val; }); },
        showNodeInfo(node) {
            document.getElementById('intel-info-title').textContent=node.label;
            const connEdges=this.edges.filter(e=>e.source===node||e.target===node);
            let html='';const tc={director:'#60a5fa',company:'#fbbf24',theme:'#4ade80',agency:'#a78bfa'};
            const tl={director:'Diretor(a)',company:'Empresa',theme:'Tema',agency:'Agência'};
            // Entity info
            html+=`<div class="info-row"><span class="info-label">Tipo</span><span class="info-value" style="color:${tc[node.type]}">${tl[node.type]}</span></div>`;
            if(node.type==='director'){
                html+=`<div class="info-row"><span class="info-label">Cargo</span><span class="info-value">${node.role||'Diretor(a)'}</span></div>`;
                if(node.mandato) html+=`<div class="info-row"><span class="info-label">Mandato</span><span class="info-value">${node.mandato}</span></div>`;
                html+=`<div class="info-row"><span class="info-label">Conexões</span><span class="info-value">${node.connections}</span></div>`;
            } else if(node.type==='company'){
                html+=`<div class="info-row"><span class="info-label">Nome completo</span><span class="info-value" style="font-size:10px">${node.full||node.label}</span></div>`;
                html+=`<div class="info-row"><span class="info-label">Setor</span><span class="info-value">${node.sector||'--'}</span></div>`;
                html+=`<div class="info-row"><span class="info-label">Menções</span><span class="info-value">${node.mentions||node.contracts||0}</span></div>`;
            } else if(node.type==='theme'){
                html+=`<div class="info-row"><span class="info-label">Categoria</span><span class="info-value">${node.category||'--'}</span></div>`;
                html+=`<div class="info-row"><span class="info-label">Ocorrências</span><span class="info-value">${node.count||0}</span></div>`;
            } else if(node.type==='agency'){
                html+=`<div class="info-row"><span class="info-label">Nome</span><span class="info-value" style="font-size:10px">${node.full||node.label}</span></div>`;
                if(node.setor) html+=`<div class="info-row"><span class="info-label">Setor</span><span class="info-value">${node.setor}</span></div>`;
                if(node.esfera) html+=`<div class="info-row"><span class="info-label">Esfera</span><span class="info-value" style="text-transform:capitalize">${node.esfera}</span></div>`;
                if(node.vinculacao) html+=`<div class="info-row"><span class="info-label">Vinculação</span><span class="info-value" style="font-size:10px">${node.vinculacao}</span></div>`;
                if(node.lei_criacao) html+=`<div class="info-row"><span class="info-label">Lei de Criação</span><span class="info-value" style="font-size:10px">${node.lei_criacao}</span></div>`;
                if(node.site) html+=`<div class="info-row"><span class="info-label">Site</span><span class="info-value" style="font-size:10px"><a href="${node.site}" target="_blank" rel="noopener noreferrer" style="color:#58a6ff">${node.site.replace('https://','')}</a></span></div>`;
                html+=`<div class="info-row"><span class="info-label">Deliberações</span><span class="info-value">${node.deliberations||0}</span></div>`;
            }

            // Action buttons — Sherlocker-style
            html+='<div style="display:flex;gap:6px;margin:10px 0 8px">';
            if(!this.expandedIds.has(node.id)) html+=`<button onclick="App.PageGrafo.expandNode(App.PageGrafo.nodes.find(n=>n.id==='${node.id.replace(/'/g,"\\'")}'))" class="btn btn-primary btn-sm" style="font-size:10px;padding:4px 8px;">Expandir</button>`;
            else html+='<span style="font-size:10px;color:#4ade80;display:flex;align-items:center;gap:3px"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Expandido</span>';
            html+=`<button onclick="App.PageGrafo.openDossie('${node.id.replace(/'/g,"\\'")}')" class="btn btn-secondary btn-sm" style="font-size:10px;padding:4px 8px;">Dossiê</button>`;
            html+='</div>';

            // Connected entities
            html+='<hr style="border-color:rgba(96,165,250,0.1);margin:8px 0"><div style="font-size:11px;color:#64748b;margin-bottom:6px">ENTIDADES CONECTADAS ('+connEdges.length+')</div>';
            connEdges.sort((a,b)=>(b.strength||0)-(a.strength||0)).forEach(edge=>{
                const other=edge.source===node?edge.target:edge.source;
                const expanded = this.expandedIds.has(other.id);
                html+=`<div class="info-row" style="cursor:pointer" onclick="App.PageGrafo.expandNode(App.PageGrafo.nodes.find(n=>n.id==='${other.id.replace(/'/g,"\\'")}'))">
                    <span class="info-label" style="display:flex;align-items:center;gap:4px">
                        <span style="width:6px;height:6px;border-radius:50%;background:${tc[other.type]};display:inline-block"></span>${other.label}
                        ${expanded?'<span style="color:#4ade80;font-size:8px">&#10003;</span>':''}
                    </span>
                    <span class="info-value" style="font-size:10px">${edge.label}</span>
                </div>`;
            });
            document.getElementById('intel-info-body').innerHTML=html;
        },
        // Open dossie for entity
        openDossie(entityId) {
            window.location.hash = '#/dossie';
            setTimeout(() => { if(App.PageDossie) App.PageDossie.loadEntityDossie(entityId); }, 200);
        },
        search(q) {
            q=q.toLowerCase().trim();
            // Highlight all matching nodes (not just first), also match full/role/sector
            this.nodes.forEach(n=>{
                const matches = q && (
                    n.label.toLowerCase().includes(q) ||
                    (n.full||'').toLowerCase().includes(q) ||
                    (n.role||'').toLowerCase().includes(q) ||
                    (n.sector||'').toLowerCase().includes(q) ||
                    (n.category||'').toLowerCase().includes(q)
                );
                n._highlighted = matches;
                n._dimmed = q && !matches;
            });
            // Also highlight edges between matching nodes
            if(q){
                const matchCount = this.nodes.filter(n=>n._highlighted).length;
                document.getElementById('intel-search-count').textContent = matchCount > 0 ? `${matchCount} encontrado${matchCount>1?'s':''}` : 'Nenhum resultado';
                document.getElementById('intel-search-count').style.display = 'block';
                const m=this.nodes.find(n=>n._highlighted);
                if(m){this.camera.x=this.width/2-(m.x-this.width/2)*this.camera.zoom;this.camera.y=this.height/2-(m.y-this.height/2)*this.camera.zoom;}
            } else {
                document.getElementById('intel-search-count').style.display = 'none';
            }
        },
        showLabels: true,
        toggleLabels() { this.showLabels = !this.showLabels; },
        zoomIn(){this.camera.zoom=Math.min(3,this.camera.zoom*1.2);},
        zoomOut(){this.camera.zoom=Math.max(0.3,this.camera.zoom/1.2);},
        resetView(){
            this.camera={x:this.width/2,y:this.height/2,zoom:1};this.nodes.forEach(n=>{n._hidden=false;n._highlighted=false;n._dimmed=false;});
            this.selected=null;const ft=document.getElementById('intel-filter-type');if(ft)ft.value='all';const si=document.getElementById('intel-search-input');if(si)si.value='';
            document.getElementById('intel-info-title').textContent='Selecione um Nó';
            document.getElementById('intel-info-body').innerHTML='<p style="color:#475569">Clique em um nó para ver detalhes.</p>';
        },
        _frameCount: 0,
        _lastTimestamp: 0,
        animate(timestamp){
            this._frameCount++;
            const dt = timestamp && this._lastTimestamp ? Math.min((timestamp - this._lastTimestamp) / 1000, 0.05) : 0.016;
            this._lastTimestamp = timestamp || 0;
            this.time += dt;
            if (this.time > 1000) this.time -= 1000;
            if (!this._settled || this.dragging) {
                this.simulateForces(0.01);
            }
            // Skip every other frame when settled and not interacting
            const shouldDraw = !this._settled || this.hovering || this.dragging || this.selected || (this._frameCount % 3 === 0);
            if (shouldDraw) this.draw();
            this.animFrame = requestAnimationFrame((ts) => this.animate(ts));
        },
        // Sherlocker-style rounded rectangle helper
        _roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        },
        draw() {
            const ctx = this.ctx, w = this.width, h = this.height;
            if (this._gridCanvas) {
                ctx.setTransform(1,0,0,1,0,0);
                ctx.drawImage(this._gridCanvas, 0, 0);
                ctx.setTransform(2,0,0,2,0,0);
            } else {
                ctx.clearRect(0, 0, w, h);
                ctx.fillStyle = '#080c14';
                ctx.fillRect(0, 0, w, h);
            }

            ctx.save();
            ctx.translate(this.camera.x - w / 2 + (w / 2) * (1 - this.camera.zoom), this.camera.y - h / 2 + (h / 2) * (1 - this.camera.zoom));
            ctx.scale(this.camera.zoom, this.camera.zoom);

            const typeLabels = { director: 'Diretor(a)', company: 'Empresa', theme: 'Tema', agency: 'Agência' };

            // ── EDGES — curved bezier ──
            this.edges.forEach(edge => {
                if (edge.source._hidden || edge.target._hidden) return;
                const dimmed = edge.source._dimmed && edge.target._dimmed;
                const hl = this.selected && (edge.source === this.selected || edge.target === this.selected);
                const hv = this.hovering && (edge.source === this.hovering || edge.target === this.hovering);
                const active = hl || hv;
                const alpha = dimmed ? 0.03 : active ? 0.6 : 0.12;
                const lw = dimmed ? 0.5 : active ? 2.5 : 1;

                // Compute bezier control point (perpendicular offset)
                const mx = (edge.source.x + edge.target.x) / 2;
                const my = (edge.source.y + edge.target.y) / 2;
                const dx = edge.target.x - edge.source.x;
                const dy = edge.target.y - edge.source.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const curvature = Math.min(dist * 0.15, 40);
                const nx = -dy / dist * curvature;
                const ny = dx / dist * curvature;
                const cpx = mx + nx, cpy = my + ny;

                ctx.beginPath();
                ctx.moveTo(edge.source.x, edge.source.y);
                ctx.quadraticCurveTo(cpx, cpy, edge.target.x, edge.target.y);

                if (active) {
                    // Gradient edge for active connections
                    const grad = ctx.createLinearGradient(edge.source.x, edge.source.y, edge.target.x, edge.target.y);
                    grad.addColorStop(0, `rgba(${edge.source._cr},${edge.source._cg},${edge.source._cb},${alpha})`);
                    grad.addColorStop(1, `rgba(${edge.target._cr},${edge.target._cg},${edge.target._cb},${alpha})`);
                    ctx.strokeStyle = grad;
                } else {
                    ctx.strokeStyle = `rgba(140,150,170,${alpha})`;
                }
                ctx.lineWidth = lw;
                ctx.stroke();

                // Animated particles on active edges
                if (active && !dimmed) {
                    for (let p = 0; p < 3; p++) {
                        const t = ((this.time * edge._particleSpeed * 0.8 + (edge.phase || 0) + p * 0.33) % 1);
                        // Quadratic bezier point
                        const u = 1 - t;
                        const px = u*u*edge.source.x + 2*u*t*cpx + t*t*edge.target.x;
                        const py = u*u*edge.source.y + 2*u*t*cpy + t*t*edge.target.y;
                        const pAlpha = Math.sin(t * Math.PI) * 0.7;
                        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${edge.source._cr},${edge.source._cg},${edge.source._cb},${pAlpha})`;
                        ctx.fill();
                    }
                }

                // Edge label — only on active edges to reduce clutter
                if (this.showLabels && edge.label && active && !dimmed) {
                    const shortLabel = edge.label.length > 22 ? edge.label.substring(0, 20) + '…' : edge.label;
                    ctx.font = '500 9px Inter,-apple-system,BlinkMacSystemFont,sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const tw = ctx.measureText(shortLabel).width;
                    this._roundRect(ctx, cpx - tw / 2 - 8, cpy - 10, tw + 16, 20, 6);
                    ctx.fillStyle = 'rgba(8,12,20,0.92)';
                    ctx.fill();
                    ctx.strokeStyle = `rgba(${edge.source._cr},${edge.source._cg},${edge.source._cb},0.3)`;
                    ctx.lineWidth = 0.5; ctx.stroke();
                    ctx.fillStyle = 'rgba(220,228,240,0.9)';
                    ctx.fillText(shortLabel, cpx, cpy);
                }
            });

            // ── NODES — modern circular design with glow ──
            this.nodes.forEach(node => {
                if (node._hidden) return;
                const dimmed = node._dimmed, isSel = node === this.selected, isHov = node === this.hovering;
                const isHl = node._highlighted, isRoot = node._isRoot;
                const alpha = dimmed ? 0.12 : 1;
                const cr = node._cr, cg = node._cg, cb = node._cb;

                // Node radius based on type and state
                const baseR = isRoot ? 32 : node.type === 'agency' ? 28 : node.type === 'director' ? 24 : node.type === 'company' ? 22 : 18;
                const r = (isSel || isHov) ? baseR + 3 : baseR;

                // Outer glow for active/selected nodes
                if (!dimmed && (isSel || isHov || isRoot || isHl)) {
                    const glowR = r + (isRoot ? 16 : 10);
                    const glow = ctx.createRadialGradient(node.x, node.y, r * 0.8, node.x, node.y, glowR);
                    glow.addColorStop(0, `rgba(${cr},${cg},${cb},${(isSel || isRoot) ? 0.25 : 0.15})`);
                    glow.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.beginPath(); ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
                    ctx.fillStyle = glow; ctx.fill();
                }

                // Main circle — gradient fill
                const grad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, r * 0.1, node.x, node.y, r);
                grad.addColorStop(0, dimmed ? 'rgba(30,35,50,0.4)' : `rgba(${Math.min(cr+40,255)},${Math.min(cg+40,255)},${Math.min(cb+40,255)},${alpha * 0.35})`);
                grad.addColorStop(1, dimmed ? 'rgba(15,18,28,0.3)' : `rgba(${cr},${cg},${cb},${alpha * 0.15})`);
                ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
                ctx.fillStyle = grad; ctx.fill();

                // Circle border
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${dimmed ? 0.08 : (isSel || isRoot) ? 0.9 : isHov ? 0.7 : isHl ? 0.6 : 0.3})`;
                ctx.lineWidth = (isSel || isRoot) ? 2.5 : isHov ? 2 : 1.5;
                ctx.stroke();

                // Inner ring for root
                if (isRoot && !dimmed) {
                    const pulse = Math.sin(this.time * 2.5) * 3 + r + 6;
                    ctx.beginPath(); ctx.arc(node.x, node.y, pulse, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.12)`;
                    ctx.lineWidth = 1; ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([]);
                }

                // Initials inside the circle
                const initials = (node.initials || node.label.split(' ').map(w => w[0]).join('').substring(0, 2)).toUpperCase();
                ctx.font = `700 ${r * 0.55}px Inter,-apple-system,BlinkMacSystemFont,sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * (dimmed ? 0.3 : 0.95)})`;
                ctx.fillText(initials, node.x, node.y);

                // Label below node (pre-computed truncation)
                if (!dimmed || isHl) {
                    const name = node._shortLabel || (node._shortLabel = node.label.length > 18 ? node.label.substring(0, 16) + '…' : node.label);
                    ctx.font = `600 10px Inter,-apple-system,BlinkMacSystemFont,sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                    // Text shadow for readability
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillText(name, node.x + 1, node.y + r + 7);
                    ctx.fillStyle = `rgba(230,237,243,${alpha * 0.9})`;
                    ctx.fillText(name, node.x, node.y + r + 6);
                    // Type badge below label
                    if (isSel || isHov || isRoot) {
                        ctx.font = '400 8px Inter,-apple-system,BlinkMacSystemFont,sans-serif';
                        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * 0.6})`;
                        ctx.fillText(typeLabels[node.type] || node.type, node.x, node.y + r + 20);
                    }
                }

                // Connection count badge
                if (!dimmed && node.connections > 0) {
                    const bx = node.x + r * 0.65, by = node.y - r * 0.65;
                    ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.2)`;
                    ctx.fill();
                    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.5)`;
                    ctx.lineWidth = 1; ctx.stroke();
                    ctx.font = 'bold 7px Inter,-apple-system,sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.9)`;
                    ctx.fillText(node.connections, bx, by);
                }

                // Expansion indicator
                if (!dimmed && node._isExpanded && !isRoot) {
                    const ix = node.x + r * 0.65, iy = node.y + r * 0.65;
                    ctx.beginPath(); ctx.arc(ix, iy, 6, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(74,222,128,0.85)'; ctx.fill();
                    ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#080c14'; ctx.fillText('✓', ix, iy);
                }
                if (!dimmed && !node._isExpanded && !isRoot && node.connections > 0 && isHov) {
                    const ix = node.x + r * 0.65, iy = node.y + r * 0.65;
                    ctx.beginPath(); ctx.arc(ix, iy, 7, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(88,166,255,0.85)'; ctx.fill();
                    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#fff'; ctx.fillText('+', ix, iy + 0.5);
                }

                // Expansion flash (ripple effect)
                if (node._expandFlash && !dimmed) {
                    const elapsed = this.time - node._expandFlash;
                    if (elapsed < 1.5) {
                        const flashR = r + elapsed * 30;
                        const flashAlpha = Math.max(0, 0.35 - elapsed * 0.23);
                        ctx.beginPath(); ctx.arc(node.x, node.y, flashR, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${flashAlpha})`;
                        ctx.lineWidth = 2; ctx.stroke();
                    }
                }
            });
            ctx.restore();
        }
    };

    // ============================================
    // PAGE: Monitoramento 24/7
    // ============================================
    const PageMonitoramento = {
        async init() {
            const page = document.getElementById('page-monitoramento');
            page.classList.add('active');
            await this.loadRealStatus();
        },

        async loadRealStatus() {
            try {
                const response = await fetch('/api/monitoramento/status');
                const data = await response.json();

                const elemento = document.getElementById('monitor-ultima');
                if (elemento && data.ultimaVerificacao) {
                    const diff = Math.round((Date.now() - new Date(data.ultimaVerificacao).getTime()) / 60000);
                    elemento.textContent = diff < 1 ? 'agora' : `há ${diff} min`;
                } else if (elemento) {
                    elemento.textContent = 'nunca';
                }

                const statusEl = document.getElementById('monitor-status');
                if (statusEl) {
                    statusEl.textContent = data.ativo ? 'Ativo' : 'Inativo';
                }
            } catch (error) {
                console.warn('[Monitor] API indisponível:', error.message);
                const elemento = document.getElementById('monitor-ultima');
                if (elemento) elemento.textContent = 'indisponível';
            }
        },

        async configurar() {
            alert('Configure o monitoramento via API: POST /api/monitoramento/iniciar');
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

            // Replace entire card body with the dossie view
            const cardBody = container.closest('.card-body');
            let html = `
                <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
                    <button class="btn btn-secondary btn-sm" onclick="App.PageDossie.voltarLista()">← Voltar à lista</button>
                    <button class="btn btn-primary btn-sm" onclick="App.PageDossie.exportar('${data.entidade.replace(/'/g,"\\'")}')">Exportar PDF</button>
                </div>

                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:${tipoColor[data.tipo]}20;border:2px solid ${tipoColor[data.tipo]};display:flex;align-items:center;justify-content:center;font-weight:700;color:${tipoColor[data.tipo]};font-size:16px;">
                            ${data.entidade.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h3 style="margin:0;font-size:18px;">${data.entidade}</h3>
                            <span style="color:${tipoColor[data.tipo]};font-size:13px;font-weight:500;">${tipoLabel[data.tipo]}</span>
                            <span style="color:var(--text-muted);font-size:12px;margin-left:8px;">Gerado em ${new Date(data.geradoEm).toLocaleString('pt-BR')}</span>
                        </div>
                    </div>

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

            // Timeline
            if (data.timeline && data.timeline.length > 0) {
                html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                    <h4 style="margin:0 0 12px;font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Timeline de Deliberações</h4>
                    <div style="max-height:400px;overflow-y:auto;">
                    ${data.timeline.slice(0,20).map(t => `
                        <div style="border-left:2px solid var(--primary);padding-left:16px;margin-bottom:16px;position:relative;">
                            <div style="position:absolute;left:-5px;top:2px;width:8px;height:8px;border-radius:50%;background:var(--primary);"></div>
                            <div style="font-weight:600;font-size:13px;color:var(--primary);margin-bottom:4px;">${t.data}</div>
                            ${t.itens.map(item => `
                                <div style="background:var(--bg-main);padding:8px 12px;border-radius:6px;margin-bottom:4px;font-size:12px;">
                                    <div style="display:flex;justify-content:space-between;">
                                        <span>${item.numero || item.interessado || 'Deliberação'}</span>
                                        <span class="badge ${item.resultado==='Deferido'?'badge-success':item.resultado==='Indeferido'?'badge-danger':'badge-secondary'}" style="font-size:10px;">${item.resultado || '--'}</span>
                                    </div>
                                    ${item.microtema ? `<div style="color:var(--text-muted);margin-top:2px;">${item.microtema}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                    </div>
                </div>`;
            }

            cardBody.innerHTML = html;
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
            // Generate printable HTML version
            const w = window.open('', '_blank');
            if (!w) { alert('Permita pop-ups para exportar o dossiê.'); return; }
            w.document.write(`<!DOCTYPE html><html><head><title>Dossiê: ${nome}</title>
                <style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;color:#1e293b;}
                h1{border-bottom:2px solid #3b82f6;padding-bottom:8px;}
                .section{margin:24px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px;}
                .badge{padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;}
                .success{background:#dcfce7;color:#166534;}.danger{background:#fee2e2;color:#991b1b;}
                table{width:100%;border-collapse:collapse;}td,th{padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:13px;}
                @media print{body{margin:20px;}}</style></head>
                <body><h1>DOSSIÊ IRIS — ${nome}</h1>
                <p style="color:#64748b;">Gerado em ${new Date().toLocaleString('pt-BR')} | Sistema IRIS — Inteligência Regulatória</p>
                <p>Carregando dados...</p>
                <script>
                    fetch('/api/dossie/${encodeURIComponent(nome)}').then(r=>r.json()).then(d=>{
                        if(!d.success)return;
                        let h='<div class="section"><h2>Resumo</h2><table>';
                        h+='<tr><td>Total de Deliberações</td><td><strong>'+d.resumo.totalDeliberacoes+'</strong></td></tr>';
                        h+='<tr><td>Deferidos</td><td><strong style="color:#166534;">'+d.resumo.deferidos+'</strong></td></tr>';
                        h+='<tr><td>Indeferidos</td><td><strong style="color:#991b1b;">'+d.resumo.indeferidos+'</strong></td></tr>';
                        h+='<tr><td>Confiança Média</td><td>'+d.resumo.confiancaMedia+'%</td></tr>';
                        h+='<tr><td>Período</td><td>'+(d.resumo.primeiraData||'--')+' a '+(d.resumo.ultimaData||'--')+'</td></tr>';
                        h+='</table></div>';
                        if(d.alertas.length){h+='<div class="section"><h2>Alertas</h2>';d.alertas.forEach(a=>{h+='<p><strong>'+a.mensagem+'</strong> — '+a.detalhe+'</p>';});h+='</div>';}
                        h+='<div class="section"><h2>Conexões</h2><h3>Diretores</h3><table>';
                        d.conexoes.diretores.forEach(x=>{h+='<tr><td>'+x.nome+'</td><td>'+x.deliberacoes+' deliberações</td></tr>';});
                        h+='</table><h3>Empresas</h3><table>';
                        d.conexoes.empresas.forEach(x=>{h+='<tr><td>'+x.nome+'</td><td>'+x.deliberacoes+' deliberações</td></tr>';});
                        h+='</table></div>';
                        if(d.timeline.length){h+='<div class="section"><h2>Timeline</h2><table><tr><th>Data</th><th>Deliberação</th><th>Resultado</th></tr>';
                        d.timeline.forEach(t=>{t.itens.forEach(i=>{h+='<tr><td>'+t.data+'</td><td>'+(i.numero||i.interessado||'--')+'</td><td><span class="badge '+(i.resultado==="Deferido"?"success":"danger")+'">'+(i.resultado||'--')+'</span></td></tr>';});});
                        h+='</table></div>';}
                        document.body.innerHTML='<h1>DOSSIÊ IRIS — ${nome}</h1><p style="color:#64748b;">Gerado em '+new Date().toLocaleString('pt-BR')+' | Sistema IRIS</p>'+h+'<p style="margin-top:40px;color:#94a3b8;text-align:center;font-size:11px;">IRIS — Inteligência Regulatória Integrada e Sistêmica</p>';
                        setTimeout(()=>window.print(),500);
                    });
                <\/script></body></html>`);
            w.document.close();
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
            alert('Sincronização de bases em desenvolvimento. Use a API /api/scrape-and-extract para coletar dados da ARTESP.');
        },

        resolver(id) {
            alert(`Resolvendo divergência #${id}`);
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

            let successCount = 0, errorCount = 0;
            const errorFiles = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const pct = Math.round(((i) / files.length) * 100);
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

                progressText.textContent = `Enviando ${file.name} (${sizeMB} MB)... ${i + 1} de ${files.length}`;
                progressPercent.textContent = pct + '%';
                progressBar.style.width = pct + '%';
                progressBar.classList.remove('success', 'danger');

                try {
                    const base64 = await fileToBase64(file);

                    const response = await fetch('/api/upload-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ arquivo: base64, nomeArquivo: file.name })
                    });
                    const result = await response.json();
                    if (result.sucesso) {
                        successCount++;
                    } else {
                        errorCount++;
                        errorFiles.push(`${file.name}: ${result.erro || 'Erro desconhecido'}`);
                    }
                } catch (error) {
                    errorCount++;
                    errorFiles.push(`${file.name}: ${error.message}`);
                }
            }

            // Show clear final status
            progressBar.style.width = '100%';
            if (errorCount === 0) {
                progressText.textContent = `Upload concluído! ${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso.`;
                progressPercent.textContent = '100%';
                progressBar.classList.add('success');
            } else {
                progressText.textContent = `Upload finalizado: ${successCount} sucesso, ${errorCount} erro${errorCount > 1 ? 's' : ''}`;
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
                    ? 'Análise cancelada!'
                    : `Análise concluída! ${completed} sucesso, ${errors} erros`;
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
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">Nenhum PDF disponível. Faça upload na página de Upload.</div></td></tr>';
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
                    statusText.textContent = 'Análise concluída!';
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
                alert('Nenhum PDF pendente para análise');
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
                    statusText.textContent = `Análise concluída! ${response.total_deliberacoes || 0} deliberações extraídas.`;
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
            this.renderMandatos();
            this.renderFontes();
            this.renderTabelaFederais();
            this.renderEstaduais();
            this.renderRoadmap();
            this.updateStats();
            this.bindEvents();
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

                const response = await fetch(`/api/noticias?${params}`);
                const data = await response.json();

                if (data.success && data.noticias) {
                    this.noticiasReais = data.noticias.map(n => ({
                        agencia: n.agencia,
                        tipo: n.tipo || 'noticia',
                        titulo: n.titulo,
                        resumo: n.resumo,
                        data: n.data,
                        esfera: n.esfera || 'federal',
                        fonte: n.fonte,
                        link: n.link,
                        cor: n.cor
                    }));
                    console.log(`[Hub] Carregadas ${this.noticiasReais.length} noticias reais`);
                }
            } catch (error) {
                console.warn('[Hub] Erro ao carregar notícias reais:', error.message);
                this.noticiasReais = [];
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
                            <div class="hub-news-title">${n.link ? `<a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.titulo}</a>` : n.titulo}</div>
                            <div class="hub-news-excerpt">${n.resumo}</div>
                            <div class="hub-news-footer">
                                <div class="hub-news-source">
                                    <span class="hub-news-source-dot"></span>
                                    ${n.fonte}
                                </div>
                                ${n.link ? `<a href="${n.link}" target="_blank" rel="noopener noreferrer" class="hub-news-link">Ver original <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd"/></svg></a>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('') + '</div>';

            // Adiciona indicador de fonte de dados
            const isRealData = this.noticiasReais.length > 0;
            const badge = document.createElement('div');
            badge.className = 'hub-data-source-badge';
            badge.innerHTML = isRealData
                ? '<span class="badge-live">AO VIVO</span> Dados de fontes oficiais (gov.br)'
                : '<span class="badge-demo">DEMO</span> Dados de demonstracao';
            container.insertBefore(badge, container.firstChild);
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
                nomeCompleto: 'Agência Nacional de Mineração',
                setor: 'mineracao',
                esfera: 'Federal',
                decisoes: 892,
                aprovadas: 654,
                pendentes: 78,
                cor: '#60A5FA',
                corSecundaria: '#3b82f6',
                diretores: [
                    { nome: 'Mauro Henrique Moreira Sousa', cargo: 'Diretor-Geral', iniciais: 'MM' },
                    { nome: 'Jose Fernando de Mendonca Gomes Junior', cargo: 'Diretor', iniciais: 'JG' },
                    { nome: 'Luiz Paniago Neves', cargo: 'Diretor Substituto', iniciais: 'LP' },
                    { nome: 'Fabio Fernando Borges', cargo: 'Diretor Substituto', iniciais: 'FB' }
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
    // PAGE: Mapa do Brasil (Leaflet)
    // ============================================
    const PageMapa = {
        map: null,
        markers: [],
        selectedState: null,

        // Dados dos estados com coordenadas
        estados: {
            'SP': { nome: 'Sao Paulo', lat: -23.5505, lng: -46.6333, decisoes: 4521, taxa: 78.5, regiao: 'Sudeste', agencias: ['ARTESP', 'ARSESP'] },
            'RJ': { nome: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, decisoes: 2134, taxa: 72.3, regiao: 'Sudeste', agencias: ['AGENERSA'] },
            'MG': { nome: 'Minas Gerais', lat: -19.9167, lng: -43.9345, decisoes: 1876, taxa: 81.2, regiao: 'Sudeste', agencias: ['ARSAE-MG'] },
            'RS': { nome: 'Rio Grande do Sul', lat: -30.0346, lng: -51.2177, decisoes: 1245, taxa: 75.8, regiao: 'Sul', agencias: ['AGERGS'] },
            'PR': { nome: 'Parana', lat: -25.4284, lng: -49.2733, decisoes: 1123, taxa: 79.4, regiao: 'Sul', agencias: ['AGEPAR'] },
            'BA': { nome: 'Bahia', lat: -12.9714, lng: -38.5014, decisoes: 987, taxa: 68.9, regiao: 'Nordeste', agencias: ['AGERBA'] },
            'SC': { nome: 'Santa Catarina', lat: -27.5954, lng: -48.5480, decisoes: 876, taxa: 82.1, regiao: 'Sul', agencias: ['ARESC'] },
            'GO': { nome: 'Goias', lat: -16.6869, lng: -49.2648, decisoes: 654, taxa: 71.5, regiao: 'Centro-Oeste', agencias: ['AGR'] },
            'PE': { nome: 'Pernambuco', lat: -8.0476, lng: -34.8770, decisoes: 543, taxa: 65.7, regiao: 'Nordeste', agencias: ['ARPE'] },
            'CE': { nome: 'Ceara', lat: -3.7172, lng: -38.5433, decisoes: 432, taxa: 69.2, regiao: 'Nordeste', agencias: ['ARCE'] },
            'DF': { nome: 'Distrito Federal', lat: -15.7942, lng: -47.8822, decisoes: 398, taxa: 84.3, regiao: 'Centro-Oeste', agencias: ['ADASA'] },
            'PA': { nome: 'Para', lat: -1.4558, lng: -48.4902, decisoes: 321, taxa: 62.8, regiao: 'Norte', agencias: [] },
            'MT': { nome: 'Mato Grosso', lat: -15.6010, lng: -56.0979, decisoes: 287, taxa: 73.4, regiao: 'Centro-Oeste', agencias: ['AGER-MT'] },
            'ES': { nome: 'Espirito Santo', lat: -20.3155, lng: -40.3128, decisoes: 265, taxa: 77.1, regiao: 'Sudeste', agencias: [] },
            'MS': { nome: 'Mato Grosso do Sul', lat: -20.4697, lng: -54.6201, decisoes: 234, taxa: 74.6, regiao: 'Centro-Oeste', agencias: ['AGEPAN'] },
            'MA': { nome: 'Maranhao', lat: -2.5297, lng: -44.3028, decisoes: 198, taxa: 61.3, regiao: 'Nordeste', agencias: [] },
            'AM': { nome: 'Amazonas', lat: -3.1190, lng: -60.0217, decisoes: 176, taxa: 58.9, regiao: 'Norte', agencias: ['ARSAM'] },
            'RN': { nome: 'Rio Grande do Norte', lat: -5.7945, lng: -35.2110, decisoes: 154, taxa: 66.4, regiao: 'Nordeste', agencias: ['ARSEP'] },
            'PB': { nome: 'Paraiba', lat: -7.1195, lng: -34.8450, decisoes: 143, taxa: 64.8, regiao: 'Nordeste', agencias: ['ARPB'] },
            'AL': { nome: 'Alagoas', lat: -9.6658, lng: -35.7350, decisoes: 121, taxa: 63.2, regiao: 'Nordeste', agencias: ['ARSAL'] },
            'PI': { nome: 'Piaui', lat: -5.0892, lng: -42.8019, decisoes: 98, taxa: 59.7, regiao: 'Nordeste', agencias: ['AGRESPI'] },
            'SE': { nome: 'Sergipe', lat: -10.9472, lng: -37.0731, decisoes: 87, taxa: 67.3, regiao: 'Nordeste', agencias: ['AGRESE'] },
            'RO': { nome: 'Rondonia', lat: -8.7619, lng: -63.9039, decisoes: 76, taxa: 71.2, regiao: 'Norte', agencias: [] },
            'TO': { nome: 'Tocantins', lat: -10.1753, lng: -48.2982, decisoes: 65, taxa: 68.5, regiao: 'Norte', agencias: ['ATR'] },
            'AC': { nome: 'Acre', lat: -9.9753, lng: -67.8243, decisoes: 43, taxa: 55.8, regiao: 'Norte', agencias: ['AGEAC'] },
            'AP': { nome: 'Amapa', lat: 0.0349, lng: -51.0694, decisoes: 32, taxa: 53.1, regiao: 'Norte', agencias: [] },
            'RR': { nome: 'Roraima', lat: 2.8198, lng: -60.6719, decisoes: 21, taxa: 52.4, regiao: 'Norte', agencias: [] }
        },

        init() {
            const page = document.getElementById('page-mapa');
            page.classList.add('active');
            this.renderLeafletMap();
            this.renderTopStates();
        },

        getStateColor(decisoes) {
            const maxDecisoes = 4521;
            const ratio = decisoes / maxDecisoes;
            if (ratio > 0.5) return '#FFEF4D';
            if (ratio > 0.3) return '#4ade80';
            if (ratio > 0.15) return '#60a5fa';
            if (ratio > 0.05) return '#a78bfa';
            return '#6b7280';
        },

        getMarkerRadius(decisoes) {
            const maxDecisoes = 4521;
            const minRadius = 5;
            const maxRadius = 18;
            const ratio = decisoes / maxDecisoes;
            return minRadius + (maxRadius - minRadius) * Math.sqrt(ratio);
        },

        renderLeafletMap() {
            const container = document.getElementById('mapa-brasil-container');
            if (!container) return;

            // Create map container div
            container.innerHTML = '<div id="leaflet-map" style="width: 100%; height: 100%; min-height: 500px; border-radius: 12px;"></div>';

            // Initialize Leaflet map
            if (this.map) {
                this.map.remove();
            }

            this.map = L.map('leaflet-map', {
                center: [-14.235, -51.9253],
                zoom: 4,
                minZoom: 3,
                maxZoom: 8,
                zoomControl: false
            });

            // Add zoom control to top-right
            L.control.zoom({ position: 'topright' }).addTo(this.map);

            // Dark tile layer (CartoDB Dark Matter)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);

            // Add markers for each state
            this.markers = [];
            Object.entries(this.estados).forEach(([code, estado]) => {
                const color = this.getStateColor(estado.decisoes);
                const radius = this.getMarkerRadius(estado.decisoes);

                // Create circle marker
                const marker = L.circleMarker([estado.lat, estado.lng], {
                    radius: radius,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 0.9,
                    fillOpacity: 0.7
                }).addTo(this.map);

                // Add label (only for states with enough decisions to have visible markers)
                if (estado.decisoes > 100) {
                    const label = L.divIcon({
                        className: 'leaflet-state-label',
                        html: `<span style="color: #fff; font-weight: 600; font-size: 9px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${code}</span>`,
                        iconSize: [20, 14],
                        iconAnchor: [10, 7]
                    });
                    L.marker([estado.lat, estado.lng], { icon: label, interactive: false }).addTo(this.map);
                }

                // Popup content
                const popupContent = `
                    <div class="leaflet-popup-custom">
                        <div class="popup-header" style="background: ${color}; color: #0f172a;">
                            <strong>${estado.nome}</strong>
                        </div>
                        <div class="popup-body">
                            <div class="popup-row"><span>Decisoes:</span><strong>${estado.decisoes.toLocaleString('pt-BR')}</strong></div>
                            <div class="popup-row"><span>Taxa:</span><strong>${estado.taxa}%</strong></div>
                            <div class="popup-row"><span>Regiao:</span><strong>${estado.regiao}</strong></div>
                            ${estado.agencias.length > 0 ? `<div class="popup-row"><span>Agencias:</span><strong>${estado.agencias.join(', ')}</strong></div>` : ''}
                        </div>
                    </div>`;

                marker.bindPopup(popupContent, {
                    className: 'dark-popup',
                    closeButton: true
                });

                // Events
                marker.on('mouseover', function() {
                    this.setStyle({ weight: 4, fillOpacity: 0.9 });
                    this.openPopup();
                });

                marker.on('mouseout', function() {
                    this.setStyle({ weight: 2, fillOpacity: 0.7 });
                });

                marker.on('click', () => {
                    this.selectState(code);
                });

                marker.stateCode = code;
                this.markers.push(marker);
            });

            // Add legend
            const legend = L.control({ position: 'bottomleft' });
            legend.onAdd = () => {
                const div = L.DomUtil.create('div', 'leaflet-legend');
                div.innerHTML = `
                    <div class="legend-title">Volume de Decisoes</div>
                    <div class="legend-items">
                        <div class="legend-item"><span class="legend-color" style="background: #FFEF4D;"></span> Alto (>2000)</div>
                        <div class="legend-item"><span class="legend-color" style="background: #4ade80;"></span> Medio-Alto</div>
                        <div class="legend-item"><span class="legend-color" style="background: #60a5fa;"></span> Medio</div>
                        <div class="legend-item"><span class="legend-color" style="background: #a78bfa;"></span> Baixo</div>
                        <div class="legend-item"><span class="legend-color" style="background: #6b7280;"></span> Muito Baixo</div>
                    </div>`;
                return div;
            };
            legend.addTo(this.map);
        },

        selectState(code) {
            this.selectedState = code;
            const estado = this.estados[code];
            const panel = document.getElementById('mapa-info-panel');

            // Center map on state
            if (this.map && estado) {
                this.map.setView([estado.lat, estado.lng], 6, { animate: true });
            }

            // Highlight marker
            this.markers.forEach(m => {
                if (m.stateCode === code) {
                    m.setStyle({ weight: 4, fillOpacity: 1 });
                    m.openPopup();
                } else {
                    m.setStyle({ weight: 2, fillOpacity: 0.7 });
                }
            });

            if (panel && estado) {
                panel.innerHTML = `
                    <div class="info-header">
                        <span class="state-badge" style="background: ${this.getStateColor(estado.decisoes)}; color: #0f172a;">${code}</span>
                        <h3>${estado.nome}</h3>
                    </div>
                    <div class="info-stats">
                        <div class="info-stat">
                            <span class="stat-value">${estado.decisoes.toLocaleString('pt-BR')}</span>
                            <span class="stat-label">Decisoes</span>
                        </div>
                        <div class="info-stat">
                            <span class="stat-value">${estado.taxa}%</span>
                            <span class="stat-label">Taxa Deferimento</span>
                        </div>
                    </div>
                    <div class="info-region">
                        <span class="region-badge">${estado.regiao}</span>
                    </div>
                    ${estado.agencias.length > 0 ? `
                    <div class="info-agencias">
                        <span class="agencias-label">Agencias Reguladoras:</span>
                        <div class="agencias-list">
                            ${estado.agencias.map(a => `<span class="agencia-badge">${a}</span>`).join('')}
                        </div>
                    </div>` : ''}
                    <div class="info-bar">
                        <div class="bar-label">Volume vs SP</div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: ${(estado.decisoes / 4521 * 100)}%"></div>
                        </div>
                        <span class="bar-value">${Math.round(estado.decisoes / 4521 * 100)}%</span>
                    </div>`;
            }
        },

        renderTopStates() {
            const container = document.getElementById('mapa-top-states');
            if (!container) return;

            const sorted = Object.entries(this.estados)
                .sort((a, b) => b[1].decisoes - a[1].decisoes)
                .slice(0, 5);

            container.innerHTML = sorted.map(([code, estado], index) => `
                <div class="top-state-row" onclick="App.PageMapa.selectState('${code}')">
                    <span class="rank">${index + 1}</span>
                    <span class="code" style="background: ${this.getStateColor(estado.decisoes)}; color: #0f172a;">${code}</span>
                    <span class="name">${estado.nome}</span>
                    <span class="value">${estado.decisoes.toLocaleString('pt-BR')}</span>
                </div>
            `).join('');
        },

        destroy() {
            if (this.map) {
                this.map.remove();
                this.map = null;
            }
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
        PageGrafo,
        PageMonitoramento,
        PageDossie,
        PageCruzamento,

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

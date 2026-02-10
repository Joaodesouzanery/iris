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
    // PAGE: Mapa do Brasil (D3.js)
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

        // Simplified Brazil state coordinates for D3.js visualization
        statePositions: {
            'AC': { x: 120, y: 280, labelPos: 'left' },
            'AM': { x: 200, y: 180, labelPos: 'left' },
            'AP': { x: 340, y: 80, labelPos: 'top' },
            'PA': { x: 340, y: 160, labelPos: 'top' },
            'RR': { x: 220, y: 60, labelPos: 'top' },
            'RO': { x: 180, y: 280, labelPos: 'left' },
            'TO': { x: 380, y: 260, labelPos: 'right' },
            'MA': { x: 440, y: 170, labelPos: 'top' },
            'PI': { x: 480, y: 220, labelPos: 'right' },
            'CE': { x: 530, y: 170, labelPos: 'right' },
            'RN': { x: 570, y: 180, labelPos: 'right' },
            'PB': { x: 570, y: 210, labelPos: 'right' },
            'PE': { x: 550, y: 240, labelPos: 'right' },
            'AL': { x: 560, y: 270, labelPos: 'right' },
            'SE': { x: 540, y: 290, labelPos: 'right' },
            'BA': { x: 480, y: 310, labelPos: 'right' },
            'MT': { x: 260, y: 290, labelPos: 'left' },
            'GO': { x: 360, y: 340, labelPos: 'bottom' },
            'DF': { x: 400, y: 330, labelPos: 'right' },
            'MS': { x: 280, y: 380, labelPos: 'left' },
            'MG': { x: 440, y: 380, labelPos: 'right' },
            'ES': { x: 510, y: 390, labelPos: 'right' },
            'RJ': { x: 480, y: 430, labelPos: 'right' },
            'SP': { x: 380, y: 430, labelPos: 'bottom' },
            'PR': { x: 340, y: 470, labelPos: 'bottom' },
            'SC': { x: 360, y: 510, labelPos: 'bottom' },
            'RS': { x: 320, y: 550, labelPos: 'bottom' }
        },

        selectedState: null,
        svg: null,

        init() {
            const page = document.getElementById('page-mapa');
            page.classList.add('active');
            this.renderD3Map();
            this.renderRanking();
        },

        renderD3Map() {
            const container = document.getElementById('brazil-d3-map');
            if (!container || typeof d3 === 'undefined') {
                console.warn('D3.js not loaded or container not found');
                this.renderFallbackMap();
                return;
            }

            // Clear container
            container.innerHTML = '';

            const width = container.offsetWidth || 600;
            const height = 500;

            // Create SVG
            this.svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', '0 0 650 600');

            // Add gradient definitions
            const defs = this.svg.append('defs');

            // Glow filter for active states
            const glowFilter = defs.append('filter')
                .attr('id', 'glow-active')
                .attr('x', '-50%')
                .attr('y', '-50%')
                .attr('width', '200%')
                .attr('height', '200%');
            glowFilter.append('feGaussianBlur')
                .attr('stdDeviation', '4')
                .attr('result', 'coloredBlur');
            const glowMerge = glowFilter.append('feMerge');
            glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
            glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            // Create state hexagons/circles
            const statesGroup = this.svg.append('g').attr('class', 'states-group');
            const labelsGroup = this.svg.append('g').attr('class', 'labels-group');
            const calloutGroup = this.svg.append('g').attr('class', 'callout-group');

            const maxDecisoes = Math.max(...Object.values(this.estados).map(e => e.decisoes));
            const tooltip = document.getElementById('map-tooltip');

            Object.entries(this.statePositions).forEach(([code, pos]) => {
                const estado = this.estados[code];
                if (!estado) return;

                const intensity = estado.decisoes / maxDecisoes;
                const radius = 20 + (intensity * 15);

                // Create state circle
                const circle = statesGroup.append('circle')
                    .attr('cx', pos.x)
                    .attr('cy', pos.y)
                    .attr('r', radius)
                    .attr('class', 'state-path')
                    .attr('data-state', code)
                    .style('fill', '#1e3a5f')
                    .style('stroke', '#38bdf8')
                    .style('stroke-width', 1.5)
                    .style('cursor', 'pointer')
                    .style('transition', 'all 0.3s ease');

                // State label inside circle
                statesGroup.append('text')
                    .attr('x', pos.x)
                    .attr('y', pos.y + 4)
                    .attr('text-anchor', 'middle')
                    .attr('class', 'state-code')
                    .style('fill', '#e2e8f0')
                    .style('font-size', '11px')
                    .style('font-weight', '700')
                    .style('pointer-events', 'none')
                    .text(code);

                // External labels with callout lines
                const labelOffset = 60;
                let labelX, labelY, lineEndX, lineEndY;

                switch (pos.labelPos) {
                    case 'left':
                        labelX = pos.x - labelOffset - 40;
                        labelY = pos.y;
                        lineEndX = pos.x - radius - 5;
                        lineEndY = pos.y;
                        break;
                    case 'right':
                        labelX = pos.x + labelOffset + 40;
                        labelY = pos.y;
                        lineEndX = pos.x + radius + 5;
                        lineEndY = pos.y;
                        break;
                    case 'top':
                        labelX = pos.x;
                        labelY = pos.y - labelOffset;
                        lineEndX = pos.x;
                        lineEndY = pos.y - radius - 5;
                        break;
                    case 'bottom':
                        labelX = pos.x;
                        labelY = pos.y + labelOffset;
                        lineEndX = pos.x;
                        lineEndY = pos.y + radius + 5;
                        break;
                }

                // Callout line
                calloutGroup.append('line')
                    .attr('x1', lineEndX)
                    .attr('y1', lineEndY)
                    .attr('x2', labelX)
                    .attr('y2', labelY)
                    .attr('class', 'callout-line')
                    .attr('data-state', code)
                    .style('stroke', '#38bdf8')
                    .style('stroke-width', 1)
                    .style('stroke-dasharray', '3,2')
                    .style('opacity', 0);

                // External label group
                const labelGroup = labelsGroup.append('g')
                    .attr('class', 'state-label')
                    .attr('data-state', code)
                    .style('opacity', 0);

                labelGroup.append('text')
                    .attr('x', labelX)
                    .attr('y', labelY - 6)
                    .attr('text-anchor', 'middle')
                    .attr('class', 'label-text')
                    .style('fill', '#e2e8f0')
                    .style('font-size', '10px')
                    .style('font-weight', '500')
                    .text(estado.nome);

                labelGroup.append('text')
                    .attr('x', labelX)
                    .attr('y', labelY + 10)
                    .attr('text-anchor', 'middle')
                    .attr('class', 'label-value')
                    .style('fill', '#f0e68c')
                    .style('font-size', '14px')
                    .style('font-weight', '700')
                    .text(estado.decisoes.toLocaleString('pt-BR'));

                // Event handlers
                circle
                    .on('mouseenter', (event) => {
                        d3.select(event.target)
                            .style('fill', '#2d5a7b')
                            .style('stroke-width', 2)
                            .style('filter', 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))');

                        // Show callout and label
                        d3.select(`.callout-line[data-state="${code}"]`).style('opacity', 0.6);
                        d3.select(`.state-label[data-state="${code}"]`).style('opacity', 1);

                        // Show tooltip
                        if (tooltip) {
                            tooltip.innerHTML = `
                                <div class="tooltip-title">${estado.nome}</div>
                                <div class="tooltip-stats">
                                    <div class="tooltip-stat">
                                        <span class="tooltip-stat-label">Decisoes</span>
                                        <span class="tooltip-stat-value">${estado.decisoes.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div class="tooltip-stat">
                                        <span class="tooltip-stat-label">Taxa Aprovacao</span>
                                        <span class="tooltip-stat-value">${estado.taxa}%</span>
                                    </div>
                                </div>
                            `;
                            tooltip.classList.add('active');
                            const rect = container.getBoundingClientRect();
                            tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
                            tooltip.style.top = (event.clientY - rect.top + 15) + 'px';
                        }
                    })
                    .on('mousemove', (event) => {
                        if (tooltip) {
                            const rect = container.getBoundingClientRect();
                            tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
                            tooltip.style.top = (event.clientY - rect.top + 15) + 'px';
                        }
                    })
                    .on('mouseleave', (event) => {
                        if (this.selectedState !== code) {
                            d3.select(event.target)
                                .style('fill', '#1e3a5f')
                                .style('stroke-width', 1.5)
                                .style('filter', 'none');

                            d3.select(`.callout-line[data-state="${code}"]`).style('opacity', 0);
                            d3.select(`.state-label[data-state="${code}"]`).style('opacity', 0);
                        }

                        if (tooltip) {
                            tooltip.classList.remove('active');
                        }
                    })
                    .on('click', (event) => {
                        // Clear previous selection
                        if (this.selectedState) {
                            d3.select(`.state-path[data-state="${this.selectedState}"]`)
                                .style('fill', '#1e3a5f')
                                .style('stroke', '#38bdf8')
                                .style('filter', 'none');
                            d3.select(`.callout-line[data-state="${this.selectedState}"]`).style('opacity', 0);
                            d3.select(`.state-label[data-state="${this.selectedState}"]`).style('opacity', 0);
                        }

                        // Set new selection
                        this.selectedState = code;
                        d3.select(event.target)
                            .style('fill', '#f0e68c')
                            .style('stroke', '#f0e68c')
                            .style('filter', 'url(#glow-active)');

                        d3.select(`.callout-line[data-state="${code}"]`)
                            .style('stroke', '#f0e68c')
                            .style('opacity', 0.8);
                        d3.select(`.state-label[data-state="${code}"]`).style('opacity', 1);
                    });
            });

            // Add legend
            this.renderMapLegend();
        },

        renderFallbackMap() {
            const container = document.getElementById('brazil-d3-map');
            if (!container) return;

            const html = `
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                    <p style="margin-top: 16px;">Carregando mapa interativo...</p>
                    <p style="font-size: 12px; opacity: 0.7;">Certifique-se de que o D3.js esta carregado</p>
                </div>
            `;
            container.innerHTML = html;
        },

        renderMapLegend() {
            const container = document.querySelector('.d3-map-container');
            if (!container) return;

            // Remove existing legend
            const existingLegend = container.querySelector('.d3-map-legend');
            if (existingLegend) existingLegend.remove();

            const legend = document.createElement('div');
            legend.className = 'd3-map-legend';
            legend.innerHTML = `
                <div class="d3-map-legend-title">Decisoes por Estado</div>
                <div class="d3-map-legend-scale">
                    <div class="d3-map-legend-item">
                        <div class="d3-map-legend-color" style="background: #1e3a5f;"></div>
                        <span>Menor volume</span>
                    </div>
                    <div class="d3-map-legend-item">
                        <div class="d3-map-legend-color" style="background: #38bdf8;"></div>
                        <span>Volume medio</span>
                    </div>
                    <div class="d3-map-legend-item">
                        <div class="d3-map-legend-color" style="background: #f0e68c;"></div>
                        <span>Maior volume</span>
                    </div>
                </div>
            `;
            container.appendChild(legend);
        },

        getRegionColor(stateCode) {
            for (const [regiao, data] of Object.entries(this.regioes)) {
                if (data.estados.includes(stateCode)) {
                    return data.cor;
                }
            }
            return '#FFEF4D';
        },

        renderRanking() {
            const list = document.querySelector('#page-mapa .state-ranking');
            if (!list) return;

            const sorted = Object.entries(this.estados)
                .sort((a, b) => b[1].decisoes - a[1].decisoes)
                .slice(0, 7);

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

            // Add click handlers to ranking items
            list.querySelectorAll('.state-item').forEach(item => {
                item.addEventListener('click', () => {
                    const code = item.dataset.state;
                    const circle = document.querySelector(`.state-path[data-state="${code}"]`);
                    if (circle) {
                        circle.dispatchEvent(new Event('click'));
                    }
                });
                item.style.cursor = 'pointer';
            });
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

// Supabase Configuration
const { createClient } = supabase;
const SUPABASE_URL = 'https://neemeubleifwmryowqzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Asaas Configuration
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = 'your-asaas-api-key';

// State Management
let currentUser = null;
let currentSection = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            if (section) {
                await showSection(section);
                // Close mobile sidebar after navigation
                closeMobileSidebar();
            }
        });
    });
    
    // Modal close
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Sidebar toggle for collapse/expand (desktop)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    
    if (sidebarToggle && adminSidebar) {
        sidebarToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('collapsed');
            // Save state to localStorage
            localStorage.setItem('adminSidebarCollapsed', adminSidebar.classList.contains('collapsed'));
        });
        
        // Restore collapsed state from localStorage
        const isCollapsed = localStorage.getItem('adminSidebarCollapsed') === 'true';
        if (isCollapsed) {
            adminSidebar.classList.add('collapsed');
        }
    }
    
    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            toggleMobileSidebar();
        });
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            closeMobileSidebar();
        });
    }
    
    // Close sidebar on window resize if desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileSidebar();
        }
    });
}

// Mobile sidebar functions
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && sidebarOverlay) {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && sidebarOverlay) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
}

// Authentication
async function checkAuth() {
    try {
        // Verificar se há sessão salva no localStorage
        const savedUser = localStorage.getItem('adminUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Buscar usuário no banco
        const { data: adminUser, error } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !adminUser) {
            throw new Error('Usuário não encontrado');
        }
        
        // Verificar senha usando a função do banco
        const { data: isValid, error: verifyError } = await supabaseClient
            .rpc('verify_password', { 
                password: password, 
                hash: adminUser.password_hash 
            });
        
        if (verifyError || !isValid) {
            throw new Error('Senha incorreta');
        }
        
        // Salvar sessão
        currentUser = {
            id: adminUser.id,
            email: adminUser.email,
            nome: adminUser.nome,
            role: adminUser.role
        };
        
        localStorage.setItem('adminUser', JSON.stringify(currentUser));
        showDashboard();
        
    } catch (error) {
        showNotificationModal('Erro ao fazer login: ' + error.message, 'error');
    }
}

async function logout() {
    try {
        // Remover sessão do localStorage
        localStorage.removeItem('adminUser');
        currentUser = null;
        showLogin();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

function showLogin() {
    const loginContainer = document.getElementById('loginContainer');
    const adminContainer = document.getElementById('adminContainer');
    
    if (loginContainer) loginContainer.style.display = 'flex';
    if (adminContainer) adminContainer.style.display = 'none';
}

function showDashboard() {
    const loginContainer = document.getElementById('loginContainer');
    const adminContainer = document.getElementById('adminContainer');
    const userName = document.getElementById('userName');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (adminContainer) adminContainer.style.display = 'flex';
    if (userName) userName.textContent = currentUser?.email || 'Administrador';
    
    // Load dashboard content
    loadDashboard();
}

// Navigation
async function showSection(section) {
    try {
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        const titles = {
            'dashboard': 'Dashboard',
            'trabalhos': 'Gerenciar Trabalhos',
            'rituais': 'Gerenciar Rituais',
            'categorias': 'Gerenciar Categorias',
            'pedidos': 'Pedidos',
            'clientes': 'Clientes',
            'financeiro': 'Financeiro',
            'configuracoes': 'Configurações do Site'
        };
        
        if (pageTitle && titles[section]) {
            pageTitle.textContent = titles[section];
        }
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-section="${section}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        currentSection = section;
        
        // Load section content
        await loadSectionContent(section);
        
    } catch (error) {
        console.error('Error loading section:', error);
        showError('Erro ao carregar seção. Tente novamente.');
    }
}

// Load section content
async function loadSectionContent(section) {
    const content = document.getElementById('content');
    if (!content) return;
    
    // Hide all sections first
    const allSections = content.querySelectorAll('.section');
    allSections.forEach(sec => {
        sec.style.display = 'none';
    });
    
    switch(section) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'trabalhos':
            await loadTrabalhosSection();
            break;
        case 'rituais':
            await loadRituaisSection();
            break;
        case 'categorias':
            await loadCategoriasSection();
            break;
        case 'pedidos':
            await loadPedidosSection();
            break;
        case 'clientes':
            await loadClientesSection();
            break;
        case 'financeiro':
            await loadFinanceiroSection();
            break;
        case 'configuracoes':
            await loadConfiguracoesSection();
            break;
    }
}

// Dashboard loading
async function loadDashboard() {
    try {
        console.log('Loading dashboard data...');
        
        // Show loading state
        const content = document.getElementById('content');
        if (content) {
            const dashboardSection = document.getElementById('dashboard');
            if (dashboardSection) {
                dashboardSection.style.display = 'block';
            } else {
                // Create dashboard section if it doesn't exist
                createDashboardSection(content);
            }
        }
        
        // Load all dashboard data in parallel
        await Promise.all([
            updateDashboardStats(),
            loadDashboardCharts(),
            loadRecentOrders(),
            loadTopServices(),
            loadMonthlySummary()
        ]);
        
        // Generate activity feed from loaded data
        generateActivityFeed();
        
        console.log('Dashboard loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Erro ao carregar dashboard. Tente novamente.');
    }
}

// Load recent orders for dashboard
async function loadRecentOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('order_with_details')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const container = document.getElementById('recentOrdersList');
        if (!container) return;
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-shopping-bag" style="font-size: 2rem; opacity: 0.5;"></i>
                    <p style="margin-top: 1rem;">Nenhum pedido recente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table style="font-size: 0.9rem;">
                    <thead>
                        <tr>
                            <th>Serviço</th>
                            <th>Cliente</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order.service_nome || '-'}</td>
                                <td>${order.cliente_nome || '-'}</td>
                                <td>R$ ${order.valor_total?.toFixed(2) || '0.00'}</td>
                                <td>${getStatusBadge(order.status)}</td>
                                <td>${new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar pedidos recentes:', error);
        const container = document.getElementById('recentOrdersList');
        if (container) {
            container.innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">Erro ao carregar pedidos</p>`;
        }
    }
}

// Load top services for dashboard
async function loadTopServices() {
    try {
        const { data: services, error } = await supabaseClient
            .rpc('get_popular_services')
            .limit(5);
        
        if (error) throw error;
        
        const container = document.getElementById('topServicesList');
        if (!container) return;
        
        if (!services || services.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-trophy" style="font-size: 2rem; opacity: 0.5;"></i>
                    <p style="margin-top: 1rem;">Nenhum dado disponível</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="padding: 1rem;">
                ${services.map((service, index) => `
                    <div style="display: flex; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--border);">
                        <div style="width: 30px; height: 30px; border-radius: 50%; background: ${index === 0 ? 'linear-gradient(135deg, #ff1a1a, #8B0000)' : index === 1 ? 'linear-gradient(135deg, #c0c0c0, #a0a0a0)' : index === 2 ? 'linear-gradient(135deg, #cd7f32, #a0522d)' : 'var(--dark-card)'}; 
                                    display: flex; align-items: center; justify-content: center; 
                                    color: ${index < 3 ? 'var(--dark)' : 'var(--text-secondary)'}; 
                                    font-weight: bold; font-size: 0.85rem; margin-right: 1rem;">
                            ${index + 1}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary);">${service.service_nome}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${service.total_pedidos} pedidos</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: var(--primary);">R$ ${service.receita_total?.toFixed(2) || '0.00'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar top serviços:', error);
        const container = document.getElementById('topServicesList');
        if (container) {
            container.innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">Erro ao carregar dados</p>`;
        }
    }
}

// Load monthly summary for dashboard
async function loadMonthlySummary() {
    try {
        const { data: revenue, error } = await supabaseClient
            .from('monthly_revenue')
            .select('*')
            .order('mes', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        
        const container = document.getElementById('monthlySummary');
        if (!container) return;
        
        const monthName = revenue ? new Date(revenue.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h3 style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">${monthName}</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="text-align: center; padding: 1rem; background: var(--dark-card); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">R$ ${revenue?.receita_confirmada?.toFixed(2) || '0.00'}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Receita Confirmada</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--dark-card); border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--secondary);">${revenue?.total_pedidos || 0}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">Pedidos</div>
                </div>
            </div>
            <div style="margin-top: 1rem; text-align: center;">
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    <i class="fas fa-info-circle" style="color: var(--primary); margin-right: 0.5rem;"></i>
                    ${revenue?.pedidos_pagos || 0} pedidos pagos de ${revenue?.total_pedidos || 0}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar resumo mensal:', error);
        const container = document.getElementById('monthlySummary');
        if (container) {
            container.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Erro ao carregar resumo</p>`;
        }
    }
}

// Generate activity feed
function generateActivityFeed() {
    const container = document.getElementById('activityList');
    if (!container) return;
    
    // Simulated activities based on recent data
    const activities = [
        { icon: 'fa-shopping-cart', color: '#22c55e', text: 'Novo pedido recebido', time: '2 minutos atrás' },
        { icon: 'fa-user', color: '#3b82f6', text: 'Novo cliente cadastrado', time: '15 minutos atrás' },
        { icon: 'fa-check-circle', color: '#22c55e', text: 'Pagamento confirmado', time: '1 hora atrás' },
        { icon: 'fa-briefcase', color: '#d4af37', text: 'Trabalho atualizado', time: '2 horas atrás' },
        { icon: 'fa-star', color: '#ff1a1a', text: 'Ritual adicionado', time: '3 horas atrás' },
        { icon: 'fa-dollar-sign', color: '#22c55e', text: 'Receita do mês atualizada', time: '5 horas atrás' },
    ];
    
    container.innerHTML = activities.map(activity => `
        <div style="display: flex; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${activity.color}20; 
                        display: flex; align-items: center; justify-content: center; margin-right: 0.75rem;">
                <i class="fas ${activity.icon}" style="color: ${activity.color}; font-size: 0.9rem;"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 0.9rem; color: var(--text-primary);">${activity.text}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// Create dashboard section if it doesn't exist
function createDashboardSection(content) {
    const dashboardHTML = `
        <section id="dashboard" class="section">
            <!-- KPI Cards - Primeira Linha -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="totalRevenue">R$ 0</div>
                    <div class="stat-label">Receita Total</div>
                    <i class="fas fa-dollar-sign stat-icon"></i>
                    <div class="stat-trend" id="revenueTrend">
                        <i class="fas fa-arrow-up"></i> <span>0%</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalPedidos">0</div>
                    <div class="stat-label">Pedidos Totais</div>
                    <i class="fas fa-shopping-cart stat-icon"></i>
                    <div class="stat-trend" id="ordersTrend">
                        <i class="fas fa-arrow-up"></i> <span>0 novos</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalClientes">0</div>
                    <div class="stat-label">Clientes Cadastrados</div>
                    <i class="fas fa-users stat-icon"></i>
                    <div class="stat-trend" id="clientsTrend">
                        <i class="fas fa-arrow-up"></i> <span>0 novos</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="conversionRate">0%</div>
                    <div class="stat-label">Taxa de Conversão</div>
                    <i class="fas fa-chart-line stat-icon"></i>
                    <div class="stat-trend" id="conversionTrend">
                        <i class="fas fa-minus"></i> <span>Estável</span>
                    </div>
                </div>
            </div>

            <!-- Segunda Linha - Serviços -->
            <div class="stats-grid" style="margin-top: 1.5rem;">
                <div class="stat-card">
                    <div class="stat-value" id="totalTrabalhos">0</div>
                    <div class="stat-label">Trabalhos Ativos</div>
                    <i class="fas fa-briefcase stat-icon"></i>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalRituais">0</div>
                    <div class="stat-label">Rituais Ativos</div>
                    <i class="fas fa-star stat-icon"></i>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="avgTicket">R$ 0</div>
                    <div class="stat-label">Ticket Médio</div>
                    <i class="fas fa-receipt stat-icon"></i>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="pendingOrders">0</div>
                    <div class="stat-label">Pedidos Pendentes</div>
                    <i class="fas fa-clock stat-icon"></i>
                    <div class="stat-badge" id="pendingBadge">Aguardando</div>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="charts-grid">
                <div class="chart-card">
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1rem;">
                        <i class="fas fa-chart-line" style="color: var(--primary); margin-right: 0.5rem;"></i>
                        Receita Mensal
                    </h3>
                    <canvas id="revenueChart"></canvas>
                </div>
                <div class="chart-card">
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1rem;">
                        <i class="fas fa-chart-pie" style="color: var(--primary); margin-right: 0.5rem;"></i>
                        Serviços Mais Populares
                    </h3>
                    <canvas id="servicesChart"></canvas>
                </div>
            </div>

            <!-- Terceira Linha - Pedidos Recentes e Atividade -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-shopping-bag" style="color: var(--primary); margin-right: 0.5rem;"></i>
                            Pedidos Recentes
                        </h2>
                        <a href="#" onclick="showSection('pedidos'); return false;" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                            Ver Todos
                        </a>
                    </div>
                    <div id="recentOrdersList">
                        <div class="loading" style="padding: 2rem;">
                            <div class="spinner"></div>
                            Carregando pedidos...
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-bell" style="color: var(--primary); margin-right: 0.5rem;"></i>
                            Atividades Recentes
                        </h2>
                    </div>
                    <div id="activityList" style="max-height: 350px; overflow-y: auto;">
                        <div class="loading" style="padding: 2rem;">
                            <div class="spinner"></div>
                            Carregando atividades...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quarta Linha - Top Serviços e Performance -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-trophy" style="color: var(--primary); margin-right: 0.5rem;"></i>
                            Top Serviços
                        </h2>
                    </div>
                    <div id="topServicesList">
                        <div class="loading" style="padding: 2rem;">
                            <div class="spinner"></div>
                            Carregando...
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-calendar-alt" style="color: var(--primary); margin-right: 0.5rem;"></i>
                            Resumo do Mês
                        </h2>
                    </div>
                    <div id="monthlySummary" style="padding: 1.5rem;">
                        <div class="loading" style="padding: 2rem;">
                            <div class="spinner"></div>
                            Carregando...
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    content.innerHTML = dashboardHTML;
}

async function updateDashboardStats() {
    try {
        // Usar função RPC em vez de view
        const { data: statsArray, error } = await supabaseClient
            .rpc('get_dashboard_stats')
            .limit(1);
        
        if (error) throw error;
        
        const stats = statsArray && statsArray[0] ? statsArray[0] : null;
        
        // Atualizar cards básicos
        updateStatCard('totalTrabalhos', stats.total_trabalhos);
        updateStatCard('totalRituais', stats.total_rituais);
        updateStatCard('totalPedidos', stats.total_pedidos);
        updateStatCard('totalClientes', stats.total_clientes);
        
        // Atualizar métricas financeiras
        const revenueEl = document.getElementById('totalRevenue');
        if (revenueEl) {
            revenueEl.textContent = 'R$ ' + (stats.receita_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }
        
        const avgTicketEl = document.getElementById('avgTicket');
        if (avgTicketEl) {
            avgTicketEl.textContent = 'R$ ' + (stats.ticket_medio || 0).toFixed(2);
        }
        
        const conversionEl = document.getElementById('conversionRate');
        if (conversionEl) {
            const rate = stats.total_pedidos > 0 ? ((stats.pedidos_pagos / stats.total_pedidos) * 100).toFixed(1) : 0;
            conversionEl.textContent = rate + '%';
        }
        
        // Contar pedidos pendentes
        const { data: pendingOrders } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('status', 'pending');
        
        const pendingEl = document.getElementById('pendingOrders');
        if (pendingEl) {
            pendingEl.textContent = pendingOrders?.length || 0;
        }
        
        // Atualizar trends
        updateTrendIndicator('ordersTrend', stats.pedidos_mes_atual || 0, 'novos este mês');
        updateTrendIndicator('clientsTrend', stats.clientes_mes_atual || 0, 'novos este mês');
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Fallback: carregar individualmente se a view não existir
        await loadStatsFallback();
    }
}

function updateTrendIndicator(elementId, value, label) {
    const element = document.getElementById(elementId);
    if (element) {
        const icon = value > 0 ? 'fa-arrow-up' : value < 0 ? 'fa-arrow-down' : 'fa-minus';
        const color = value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#9ca3af';
        element.innerHTML = `<i class="fas ${icon}" style="color: ${color};"></i> <span>${Math.abs(value)} ${label}</span>`;
    }
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value || 0;
    }
}

async function loadStatsFallback() {
    try {
        // Load trabalhos count
        const { data: trabalhos } = await supabaseClient
            .from('trabalhos')
            .select('id')
            .eq('ativo', true);
        
        updateStatCard('totalTrabalhos', trabalhos?.length || 0);
        
        // Load rituais count
        const { data: rituais } = await supabaseClient
            .from('rituais')
            .select('id')
            .eq('ativo', true);
        
        updateStatCard('totalRituais', rituais?.length || 0);
        
        // Load clientes count
        const { data: clientes } = await supabaseClient
            .from('clientes')
            .select('id');
        
        updateStatCard('totalClientes', clientes?.length || 0);
        
    } catch (error) {
        console.error('Erro no fallback de estatísticas:', error);
    }
}

async function loadDashboardCharts() {
    try {
        // Carregar dados para gráfico de receita mensal
        const { data: monthlyData, error: error1 } = await supabaseClient
            .rpc('get_monthly_revenue')
            .limit(12);
        
        if (error1) throw error1;
        
        if (monthlyData && monthlyData.length > 0) {
            createRevenueChart(monthlyData);
        }
        
        // Carregar dados para gráfico de serviços populares
        const { data: popularData, error: error2 } = await supabaseClient
            .rpc('get_popular_services')
            .limit(5);
        
        if (error2) throw error2;
        
        if (popularData && popularData.length > 0) {
            createServicesChart(popularData);
        }
        
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
    }
}

function createRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Limpar gráfico anterior se existir
    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
    }
    
    window.revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => new Date(item.mes).toLocaleDateString('pt-BR', { month: 'short' })),
            datasets: [{
                label: 'Receita',
                data: data.map(item => item.receita_confirmada),
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { 
                        color: '#9ca3af',
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function createServicesChart(data) {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;
    
    // Limpar gráfico anterior se existir
    if (window.servicesChartInstance) {
        window.servicesChartInstance.destroy();
    }
    
    window.servicesChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.service_nome),
            datasets: [{
                data: data.map(item => item.total_pedidos),
                backgroundColor: [
                    '#ff1a1a',
                    '#8B0000',
                    '#3b82f6',
                    '#22c55e',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff' }
                }
            }
        }
    });
}

// Trabalhos Section
async function loadTrabalhosSection() {
    const content = document.getElementById('content');
    if (!content) return;
    
    // Load categories for filter
    const { data: categorias } = await supabaseClient
        .from('categorias')
        .select('*')
        .eq('tipo', 'trabalho')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
    
    const categoriaOptions = (categorias || []).map(cat => 
        `<option value="${cat.id}">${cat.nome}</option>`
    ).join('');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Gerenciar Trabalhos</h2>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <select id="trabalhosCategoriaFilter" onchange="filterTrabalhosByCategoria()" style="padding: 0.5rem; border-radius: 8px; background: var(--dark); color: white; border: 1px solid var(--border);">
                        <option value="">Todas as Categorias</option>
                        ${categoriaOptions}
                    </select>
                    <button class="btn btn-primary" onclick="openTrabalhoModal()">
                        <i class="fas fa-plus"></i> Adicionar Trabalho
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table id="trabalhosTable">
                    <thead>
                        <tr>
                            <th>Serviço</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Formulário</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="loading">
                                <div class="spinner"></div>
                                Carregando trabalhos...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadTrabalhosTable();
}

async function filterTrabalhosByCategoria() {
    const categoriaId = document.getElementById('trabalhosCategoriaFilter')?.value;
    await loadTrabalhosTable(categoriaId);
}

async function loadTrabalhosTable(categoriaFilter = null) {
    try {
        let query = supabaseClient
            .from('trabalhos')
            .select('*, categorias(nome, cor)')
            .order('created_at', { ascending: false });
        
        if (categoriaFilter) {
            query = query.eq('categoria_id', categoriaFilter);
        }
        
        const { data: trabalhos, error } = await query;
        
        if (error) throw error;
        
        const tbody = document.querySelector('#trabalhosTable tbody');
        if (!tbody) return;
        
        if (trabalhos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-briefcase"></i>
                        <h3>Nenhum trabalho encontrado</h3>
                        <p>Clique em "Adicionar Trabalho" para começar</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = trabalhos.map(trabalho => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        ${trabalho.icon_url ? 
                            `<img src="${trabalho.icon_url}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border);">` :
                            `<div style="width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center;"><i class="fas fa-briefcase" style="color: var(--dark); font-size: 1rem;"></i></div>`
                        }
                        <span>${trabalho.nome}</span>
                    </div>
                </td>
                <td>
                    ${trabalho.categorias ? 
                        `<span class="badge" style="background: ${trabalho.categorias.cor || '#8B0000'}; color: white;">${trabalho.categorias.nome}</span>` : 
                        '<span style="color: var(--text-secondary);">-</span>'
                    }
                </td>
                <td>R$ ${trabalho.valor.toFixed(2)}</td>
                <td>
                    ${trabalho.perguntas && trabalho.perguntas.length > 0 ? `<span class="badge badge-info" title="${trabalho.perguntas.length} pergunta(s)"><i class="fas fa-question-circle"></i> ${trabalho.perguntas.length}</span>` : '-'}
                    ${trabalho.requer_imagem ? '<span class="badge badge-info" title="Requer imagem"><i class="fas fa-image"></i></span>' : ''}
                </td>
                <td>${trabalho.ativo ? 
                    '<span class="badge badge-success">Ativo</span>' : 
                    '<span class="badge badge-warning">Inativo</span>'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editTrabalho('${trabalho.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteTrabalho('${trabalho.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar trabalhos:', error);
        const tbody = document.querySelector('#trabalhosTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao carregar trabalhos</h3>
                        <p>${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Rituais Section
async function loadRituaisSection() {
    const content = document.getElementById('content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Gerenciar Rituais</h2>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <select id="rituaisCategoriaFilter" onchange="filterRituaisByCategoria()" style="padding: 0.5rem; border-radius: 8px; background: var(--dark); color: white; border: 1px solid var(--border);">
                        <option value="">Todas as Categorias</option>
                        ${(await supabaseClient.from('categorias').select('*').eq('tipo', 'ritual').eq('ativo', true).order('ordem', { ascending: true })).data?.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('') || ''}
                    </select>
                    <button class="btn btn-primary" onclick="openRitualModal()">
                        <i class="fas fa-plus"></i> Adicionar Ritual
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table id="rituaisTable">
                    <thead>
                        <tr>
                            <th>Serviço</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Formulário</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="loading">
                                <div class="spinner"></div>
                                Carregando rituais...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadRituaisTable();
}

async function filterRituaisByCategoria() {
    const categoriaId = document.getElementById('rituaisCategoriaFilter')?.value;
    await loadRituaisTable(categoriaId);
}

async function loadRituaisTable(categoriaFilter = null) {
    try {
        let query = supabaseClient
            .from('rituais')
            .select('*, categorias(nome, cor)')
            .order('created_at', { ascending: false });
        
        if (categoriaFilter) {
            query = query.eq('categoria_id', categoriaFilter);
        }
        
        const { data: rituais, error } = await query;
        
        if (error) throw error;
        
        const tbody = document.querySelector('#rituaisTable tbody');
        if (!tbody) return;
        
        if (rituais.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-star"></i>
                        <h3>Nenhum ritual encontrado</h3>
                        <p>Clique em "Adicionar Ritual" para começar</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = rituais.map(ritual => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        ${ritual.icon_url ? 
                            `<img src="${ritual.icon_url}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border);">` :
                            `<div style="width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center;"><i class="fas fa-star" style="color: var(--dark); font-size: 1rem;"></i></div>`
                        }
                        <span>${ritual.nome}</span>
                    </div>
                </td>
                <td>
                    ${ritual.categorias ? 
                        `<span class="badge" style="background: ${ritual.categorias.cor || '#8B0000'}; color: white;">${ritual.categorias.nome}</span>` : 
                        '<span style="color: var(--text-secondary);">-</span>'
                    }
                </td>
                <td>R$ ${ritual.valor.toFixed(2)}</td>
                <td>
                    ${ritual.perguntas && ritual.perguntas.length > 0 ? `<span class="badge badge-info" title="${ritual.perguntas.length} pergunta(s)"><i class="fas fa-question-circle"></i> ${ritual.perguntas.length}</span>` : '-'}
                    ${ritual.requer_imagem ? '<span class="badge badge-info" title="Requer imagem"><i class="fas fa-image"></i></span>' : ''}
                </td>
                <td>${ritual.ativo ? 
                    '<span class="badge badge-success">Ativo</span>' : 
                    '<span class="badge badge-warning">Inativo</span>'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editRitual('${ritual.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteRitual('${ritual.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar rituais:', error);
        const tbody = document.querySelector('#rituaisTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao carregar rituais</h3>
                        <p>${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Categorias Section
async function loadCategoriasSection() {
    const content = document.getElementById('content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Gerenciar Categorias</h2>
                <button class="btn btn-primary" onclick="openCategoriaModal()">
                    <i class="fas fa-plus"></i> Adicionar Categoria
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem;">
                <!-- Categorias de Trabalhos -->
                <div>
                    <h3 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.1rem;">
                        <i class="fas fa-briefcase"></i> Categorias de Trabalhos
                    </h3>
                    <div id="categoriasTrabalhosList" class="categorias-list">
                        <div class="loading">
                            <div class="spinner"></div>
                            Carregando...
                        </div>
                    </div>
                </div>
                
                <!-- Categorias de Rituais -->
                <div>
                    <h3 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.1rem;">
                        <i class="fas fa-star"></i> Categorias de Rituais
                    </h3>
                    <div id="categoriasRituaisList" class="categorias-list">
                        <div class="loading">
                            <div class="spinner"></div>
                            Carregando...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await loadCategoriasLists();
}

async function loadCategoriasLists() {
    try {
        console.log('Loading categorias lists...');
        
        // Load trabalhos categories
        const { data: categoriasTrabalhos, error: errorTrabalhos } = await supabaseClient
            .from('categorias')
            .select('*')
            .eq('tipo', 'trabalho')
            .order('ordem', { ascending: true });
        
        console.log('Categorias trabalhos:', categoriasTrabalhos, 'Error:', errorTrabalhos);
        
        if (errorTrabalhos) throw errorTrabalhos;
        
        renderCategoriasList(categoriasTrabalhos || [], 'categoriasTrabalhosList', 'trabalho');
        
        // Load rituais categories
        const { data: categoriasRituais, error: errorRituais } = await supabaseClient
            .from('categorias')
            .select('*')
            .eq('tipo', 'ritual')
            .order('ordem', { ascending: true });
        
        console.log('Categorias rituais:', categoriasRituais, 'Error:', errorRituais);
        
        if (errorRituais) throw errorRituais;
        
        renderCategoriasList(categoriasRituais || [], 'categoriasRituaisList', 'ritual');
        
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showError('Erro ao carregar categorias: ' + error.message);
    }
}

function renderCategoriasList(categorias, containerId, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (categorias.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem; text-align: center;">
                <i class="fas fa-tags" style="font-size: 2rem; color: var(--text-secondary); margin-bottom: 0.5rem;"></i>
                <p style="color: var(--text-secondary);">Nenhuma categoria cadastrada</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = categorias.map((cat, index) => `
        <div class="categoria-item" style="
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background: var(--dark-card);
            border-radius: 8px;
            border-left: 4px solid ${cat.cor || '#8B0000'};
            margin-bottom: 0.5rem;
            transition: all 0.3s ease;
        ">
            <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${cat.cor || '#8B0000'};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 0.85rem;
            ">${cat.nome.charAt(0).toUpperCase()}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">${cat.nome}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${cat.descricao || 'Sem descrição'}</div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary" onclick="editCategoria('${cat.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteCategoria('${cat.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function openCategoriaModal(categoriaId = null) {
    const isEdit = !!categoriaId;
    let categoria = null;
    
    if (isEdit) {
        try {
            const { data, error } = await supabaseClient
                .from('categorias')
                .select('*')
                .eq('id', categoriaId)
                .single();
            
            if (error) throw error;
            categoria = data;
        } catch (error) {
            showError('Erro ao carregar categoria: ' + error.message);
            return;
        }
    }
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = isEdit ? 'Editar Categoria' : 'Nova Categoria';
    modalBody.innerHTML = `
        <form id="categoriaForm">
            <input type="hidden" id="categoriaId" value="${categoriaId || ''}">
            
            <div class="form-group">
                <label for="catNome">Nome da Categoria *</label>
                <input type="text" id="catNome" class="form-control" value="${categoria ? categoria.nome : ''}" required>
            </div>
            
            <div class="form-group">
                <label for="catTipo">Tipo *</label>
                <select id="catTipo" class="form-control" required ${isEdit ? 'disabled' : ''}>
                    <option value="">Selecione o tipo</option>
                    <option value="trabalho" ${categoria && categoria.tipo === 'trabalho' ? 'selected' : ''}>Trabalho</option>
                    <option value="ritual" ${categoria && categoria.tipo === 'ritual' ? 'selected' : ''}>Ritual</option>
                </select>
                ${isEdit ? '<small style="color: var(--text-secondary);">O tipo não pode ser alterado após a criação</small>' : ''}
            </div>
            
            <div class="form-group">
                <label for="catDescricao">Descrição</label>
                <textarea id="catDescricao" class="form-control" rows="2">${categoria ? categoria.descricao || '' : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label for="catCor">Cor da Categoria</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="color" id="catCor" class="form-control" value="${categoria ? categoria.cor || '#8B0000' : '#8B0000'}" style="width: 60px; height: 40px; padding: 0;">
                    <span id="corPreview" style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: ${categoria ? categoria.cor || '#8B0000' : '#8B0000'};
                        display: inline-block;
                    "></span>
                </div>
            </div>
            
            <div class="form-group">
                <label for="catOrdem">Ordem de Exibição</label>
                <input type="number" id="catOrdem" class="form-control" value="${categoria ? categoria.ordem || 0 : 0}" min="0">
                <small style="color: var(--text-secondary);">Número menor = aparece primeiro</small>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="catAtivo" ${!categoria || categoria.ativo ? 'checked' : ''}>
                    Categoria Ativa
                </label>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    Cancelar
                </button>
            </div>
        </form>
    `;
    
    // Add color preview update
    document.getElementById('catCor').addEventListener('input', function() {
        document.getElementById('corPreview').style.background = this.value;
    });
    
    // Add form submit handler
    document.getElementById('categoriaForm').addEventListener('submit', handleCategoriaSubmit);
    
    modal.classList.add('active');
}

async function handleCategoriaSubmit(e) {
    e.preventDefault();
    
    const categoriaId = document.getElementById('categoriaId').value;
    const isEdit = !!categoriaId;
    
    const categoriaData = {
        nome: document.getElementById('catNome').value.trim(),
        tipo: document.getElementById('catTipo').value,
        descricao: document.getElementById('catDescricao').value.trim(),
        cor: document.getElementById('catCor').value,
        ordem: parseInt(document.getElementById('catOrdem').value) || 0,
        ativo: document.getElementById('catAtivo').checked
    };
    
    console.log('Saving categoria:', categoriaData, 'isEdit:', isEdit, 'id:', categoriaId);
    
    if (!categoriaData.nome || !categoriaData.tipo) {
        showError('Nome e tipo são obrigatórios');
        return;
    }
    
    try {
        if (isEdit) {
            // Remove tipo from update if editing (can't change type)
            delete categoriaData.tipo;
            
            console.log('Updating categoria:', categoriaId, categoriaData);
            const { data, error } = await supabaseClient
                .from('categorias')
                .update(categoriaData)
                .eq('id', categoriaId)
                .select();
            
            console.log('Update result:', data, 'Error:', error);
            
            if (error) throw error;
            showSuccess('Categoria atualizada com sucesso!');
        } else {
            console.log('Inserting new categoria:', categoriaData);
            const { data, error } = await supabaseClient
                .from('categorias')
                .insert(categoriaData)
                .select();
            
            console.log('Insert result:', data, 'Error:', error);
            
            if (error) throw error;
            showSuccess('Categoria criada com sucesso!');
        }
        
        closeModal();
        await loadCategoriasLists();
        
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        showError('Erro ao salvar categoria: ' + error.message);
    }
}

async function editCategoria(categoriaId) {
    await openCategoriaModal(categoriaId);
}

async function deleteCategoria(categoriaId) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?\n\nOs trabalhos/rituais associados ficarão sem categoria.')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('categorias')
            .delete()
            .eq('id', categoriaId);
        
        if (error) throw error;
        
        showSuccess('Categoria excluída com sucesso!');
        await loadCategoriasLists();
        
    } catch (error) {
        showError('Erro ao excluir categoria: ' + error.message);
    }
}

// Helper function to get categories for select dropdown
async function getCategoriasForSelect(tipo) {
    try {
        const { data, error } = await supabaseClient
            .from('categorias')
            .select('id, nome, cor')
            .eq('tipo', tipo)
            .eq('ativo', true)
            .order('ordem', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        return [];
    }
}

// Pedidos Section
async function loadPedidosSection() {
    const content = document.getElementById('content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Pedidos</h2>
                <div>
                    <button class="btn btn-secondary" onclick="exportPedidos()">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                </div>
            </div>
            
            <!-- Abas de Status -->
            <div class="status-tabs">
                <button class="tab-btn active" data-status="" onclick="filterByStatus('')">
                    Todos
                </button>
                <button class="tab-btn" data-status="pending" onclick="filterByStatus('pending')">
                    Pendente
                </button>
                <button class="tab-btn" data-status="paid" onclick="filterByStatus('paid')">
                    Pago
                </button>
                <button class="tab-btn" data-status="completed" onclick="filterByStatus('completed')">
                    Concluído
                </button>
                <button class="tab-btn" data-status="delivered" onclick="filterByStatus('delivered')">
                    Entregue
                </button>
                <button class="tab-btn" data-status="cancelled" onclick="filterByStatus('cancelled')">
                    Cancelado
                </button>
            </div>
            <div class="table-container">
                <table id="pedidosTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Serviço</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Formulário</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" class="loading">
                                <div class="spinner"></div>
                                Carregando pedidos...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Adicionar event listener para filtro
    await loadPedidosTable();
}

// Variável global para o filtro de status
let currentStatusFilter = '';

async function loadPedidosTable() {
    try {
        let query = supabaseClient.from('order_with_details').select('*');
        
        if (currentStatusFilter) {
            query = query.eq('status', currentStatusFilter);
        }
        
        const { data: pedidos, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#pedidosTable tbody');
        if (!tbody) return;
        
        if (pedidos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Nenhum pedido encontrado</h3>
                        <p>Não há pedidos${currentStatusFilter ? ` com status "${currentStatusFilter}"` : ''}</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = pedidos.map(pedido => {
            const formStatus = pedido.form_data ? 'Respondido' : 'Pendente';
            const formBadge = pedido.form_data 
                ? '<span class="badge badge-success">Formulário Respondido</span>' 
                : '<span class="badge badge-warning">Formulário Pendente</span>';
            
            return `
            <tr>
                <td>#${pedido.id.toString().substring(0, 8)}</td>
                <td>${pedido.cliente_nome}</td>
                <td>${pedido.service_nome}</td>
                <td>R$ ${pedido.valor_total.toFixed(2)}</td>
                <td>${getStatusBadge(pedido.status)}</td>
                <td>${formBadge}</td>
                <td>${new Date(pedido.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button class="btn btn-secondary" onclick="viewPedido('${pedido.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        const tbody = document.querySelector('#pedidosTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao carregar pedidos</h3>
                        <p>${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Clientes Section
async function loadClientesSection() {
    const content = document.getElementById('content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Clientes</h2>
                <button class="btn btn-secondary" onclick="exportClientes()">
                    <i class="fas fa-download"></i> Exportar
                </button>
            </div>
            <div class="table-container">
                <table id="clientesTable">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Data Cadastro</th>
                            <th>Total Pedidos</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="loading">
                                <div class="spinner"></div>
                                Carregando clientes...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadClientesTable();
}

async function loadClientesTable() {
    try {
        const { data: clientes, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#clientesTable tbody');
        if (!tbody) return;
        
        if (clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>Nenhum cliente encontrado</h3>
                        <p>Nenhum cliente foi cadastrado ainda</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Para cada cliente, buscar total de pedidos
        const clientesComPedidos = await Promise.all(
            clientes.map(async (cliente) => {
                const { data: pedidos } = await supabaseClient
                    .from('orders')
                    .select('id')
                    .eq('cliente_id', cliente.id);
                
                return {
                    ...cliente,
                    total_pedidos: pedidos?.length || 0
                };
            })
        );
        
        tbody.innerHTML = clientesComPedidos.map(cliente => `
            <tr>
                <td>${cliente.nome}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefone || '-'}</td>
                <td>${new Date(cliente.created_at).toLocaleDateString('pt-BR')}</td>
                <td>${cliente.total_pedidos}</td>
                <td>
                    <button class="btn btn-secondary" onclick="viewCliente('${cliente.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        const tbody = document.querySelector('#clientesTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao carregar clientes</h3>
                        <p>${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Financeiro Section
async function loadFinanceiroSection() {
    const content = document.getElementById('content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalRevenue">R$ 0</div>
                <div class="stat-label">Receita Total</div>
                <i class="fas fa-dollar-sign stat-icon"></i>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="avgTicket">R$ 0</div>
                <div class="stat-label">Ticket Médio</div>
                <i class="fas fa-chart-line stat-icon"></i>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="conversionRate">0%</div>
                <div class="stat-label">Taxa de Conversão</div>
                <i class="fas fa-percentage stat-icon"></i>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="growthRate">0%</div>
                <div class="stat-label">Crescimento</div>
                <i class="fas fa-chart-line stat-icon"></i>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Relatório Financeiro</h2>
                <div>
                    <select id="periodFilter" class="form-control" style="display: inline-block; width: auto; margin-right: 1rem;">
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="365">Último ano</option>
                    </select>
                    <button class="btn btn-primary" onclick="generateFinancialReport()">
                        <i class="fas fa-file-alt"></i> Gerar Relatório
                    </button>
                </div>
            </div>
            <div class="charts-grid">
                <div class="chart-card">
                    <canvas id="financialRevenueChart"></canvas>
                </div>
                <div class="chart-card">
                    <canvas id="financialServicesChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar event listener para filtro
    document.getElementById('periodFilter').addEventListener('change', loadFinancialData);
    
    await loadFinancialData();
}

async function loadFinancialData() {
    try {
        // Carregar estatísticas financeiras via RPC
        const { data: statsArray, error } = await supabaseClient
            .rpc('get_dashboard_stats')
            .limit(1);
        
        if (error) throw error;
        
        const stats = statsArray && statsArray[0] ? statsArray[0] : null;
        
        // Atualizar cards
        document.getElementById('totalRevenue').textContent = 'R$ ' + (stats.receita_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        document.getElementById('avgTicket').textContent = 'R$ ' + (stats.ticket_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        
        // Calcular taxa de conversão
        const conversionRate = stats.total_pedidos > 0 ? ((stats.pedidos_pagos / stats.total_pedidos) * 100).toFixed(1) : 0;
        document.getElementById('conversionRate').textContent = conversionRate + '%';
        
        // Carregar dados para gráficos
        await loadFinancialCharts();
        
    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
    }
}

async function loadFinancialCharts() {
    try {
        // Gráfico de receita mensal via RPC
        const { data: monthlyData } = await supabaseClient
            .rpc('get_monthly_revenue')
            .limit(12);
        
        if (monthlyData && monthlyData.length > 0) {
            createFinancialRevenueChart(monthlyData);
        }
        
        // Gráfico de serviços populares
        const { data: popularData } = await supabaseClient
            .rpc('get_popular_services')
            .limit(5);
        
        if (popularData && popularData.length > 0) {
            createFinancialServicesChart(popularData);
        }
        
    } catch (error) {
        console.error('Erro ao carregar gráficos financeiros:', error);
    }
}

function createFinancialRevenueChart(data) {
    const ctx = document.getElementById('financialRevenueChart');
    if (!ctx) return;
    
    if (window.financialRevenueChartInstance) {
        window.financialRevenueChartInstance.destroy();
    }
    
    window.financialRevenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => new Date(item.mes).toLocaleDateString('pt-BR', { month: 'short' })),
            datasets: [{
                label: 'Receita',
                data: data.map(item => item.receita_confirmada),
                backgroundColor: '#d4af37',
                borderColor: '#b8941f',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { 
                        color: '#9ca3af',
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function createFinancialServicesChart(data) {
    const ctx = document.getElementById('financialServicesChart');
    if (!ctx) return;
    
    if (window.financialServicesChartInstance) {
        window.financialServicesChartInstance.destroy();
    }
    
    window.financialServicesChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.service_nome),
            datasets: [{
                data: data.map(item => item.receita_total),
                backgroundColor: [
                    '#ff1a1a',
                    '#8B0000',
                    '#3b82f6',
                    '#22c55e',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff' }
                }
            }
        }
    });
}

// Modal functions
function openModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Helper functions
function showNotificationModal(message, type = 'success') {
    const modalHtml = `
        <div class="notification-modal-overlay" id="notificationModal">
            <div class="notification-modal">
                <div class="notification-icon">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                </div>
                <div class="notification-content">
                    <h3>${type === 'success' ? 'Sucesso!' : 'Erro!'}</h3>
                    <p>${message}</p>
                </div>
                <div class="notification-actions">
                    <button class="btn btn-primary" onclick="closeNotificationModal()">OK</button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Auto-fechar após 3 segundos para mensagens de sucesso
    if (type === 'success') {
        setTimeout(() => {
            closeNotificationModal();
        }, 3000);
    }
}

function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.remove();
    }
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-warning">Pendente</span>',
        'paid': '<span class="badge badge-success">Pago</span>',
        'cancelled': '<span class="badge badge-info">Cancelado</span>',
        'completed': '<span class="badge badge-success">Concluído</span>',
        'delivered': '<span class="badge badge-primary">Entregue</span>'
    };
    return badges[status] || badges['pending'];
}

// Configurações Section
let pendingSettings = {};

async function loadConfiguracoesSection() {
    const content = document.getElementById('content');
    if (!content) return;
    
    // Reset pending settings
    pendingSettings = {};
    
    // Load current settings
    const { data: settings, error } = await supabaseClient
        .from('site_settings')
        .select('*')
        .in('chave', ['trabalhos_enabled', 'rituais_enabled', 'trabalhos_title', 'rituais_title']);
    
    if (error) {
        showError('Erro ao carregar configurações: ' + error.message);
        return;
    }
    
    const settingsMap = {};
    (settings || []).forEach(s => settingsMap[s.chave] = s.valor);
    
    const trabalhosEnabled = settingsMap['trabalhos_enabled'] !== 'false';
    const rituaisEnabled = settingsMap['rituais_enabled'] !== 'false';
    const trabalhosTitle = settingsMap['trabalhos_title'] || 'TRABALHOS';
    const rituaisTitle = settingsMap['rituais_title'] || 'RITUAIS';
    
    // Store original values
    pendingSettings.trabalhos_enabled_original = trabalhosEnabled;
    pendingSettings.rituais_enabled_original = rituaisEnabled;
    pendingSettings.trabalhos_title_original = trabalhosTitle;
    pendingSettings.rituais_title_original = rituaisTitle;
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title"><i class="fas fa-cog"></i> Configurações do Site</h2>
            </div>
            
            <div style="padding: 1.5rem;">
                <!-- Seção Trabalhos -->
                <div style="background: rgba(139, 0, 0, 0.1); border: 1px solid rgba(255, 26, 26, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                        <h3 style="color: #ff1a1a; margin: 0; font-size: 1.2rem;">
                            <i class="fas fa-briefcase"></i> Seção Trabalhos
                        </h3>
                        <label class="toggle-switch" style="position: relative; display: inline-block; width: 60px; height: 34px;" id="trabalhosToggleWrapper">
                            <input type="checkbox" id="trabalhosToggle" ${trabalhosEnabled ? 'checked' : ''} 
                                   onchange="markSettingChanged('trabalhos_enabled', this.checked)" 
                                   style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${trabalhosEnabled ? '#ff1a1a' : '#444'}; transition: .4s; border-radius: 34px;" id="trabalhosToggleSpan">
                                <span style="position: absolute; content: ''; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; transform: ${trabalhosEnabled ? 'translateX(26px)' : 'translateX(0)'}"></span>
                            </span>
                        </label>
                    </div>
                    <p style="color: #888; margin-bottom: 1rem; font-size: 0.9rem;">
                        Quando desativada, a seção de trabalhos não será exibida no site público.
                    </p>
                    <div style="margin-top: 1rem;">
                        <label style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Título da Seção:</label>
                        <input type="text" id="trabalhosTitleInput" value="${trabalhosTitle}" 
                               oninput="markSettingChanged('trabalhos_title', this.value)"
                               style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,26,26,0.3); color: white; padding: 0.5rem 1rem; border-radius: 8px; width: 100%; max-width: 300px;">
                    </div>
                </div>
                
                <!-- Seção Rituais -->
                <div style="background: rgba(139, 0, 0, 0.1); border: 1px solid rgba(255, 26, 26, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                        <h3 style="color: #ff1a1a; margin: 0; font-size: 1.2rem;">
                            <i class="fas fa-star"></i> Seção Rituais
                        </h3>
                        <label class="toggle-switch" style="position: relative; display: inline-block; width: 60px; height: 34px;" id="rituaisToggleWrapper">
                            <input type="checkbox" id="rituaisToggle" ${rituaisEnabled ? 'checked' : ''} 
                                   onchange="markSettingChanged('rituais_enabled', this.checked)" 
                                   style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${rituaisEnabled ? '#ff1a1a' : '#444'}; transition: .4s; border-radius: 34px;" id="rituaisToggleSpan">
                                <span style="position: absolute; content: ''; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; transform: ${rituaisEnabled ? 'translateX(26px)' : 'translateX(0)'}"></span>
                            </span>
                        </label>
                    </div>
                    <p style="color: #888; margin-bottom: 1rem; font-size: 0.9rem;">
                        Quando desativada, a seção de rituais não será exibida no site público.
                    </p>
                    <div style="margin-top: 1rem;">
                        <label style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Título da Seção:</label>
                        <input type="text" id="rituaisTitleInput" value="${rituaisTitle}" 
                               oninput="markSettingChanged('rituais_title', this.value)"
                               style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,26,26,0.3); color: white; padding: 0.5rem 1rem; border-radius: 8px; width: 100%; max-width: 300px;">
                    </div>
                </div>
                
                <!-- Botão Salvar -->
                <div style="text-align: center; margin-top: 2rem; padding: 1.5rem; background: rgba(139,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,26,26,0.3);">
                    <p id="unsavedMessage" style="color: #ff1a1a; font-size: 0.9rem; margin-bottom: 1rem; display: none;">
                        <i class="fas fa-exclamation-circle"></i> Você tem alterações não salvas
                    </p>
                    <button onclick="saveAllSettings()" 
                            style="background: linear-gradient(135deg, #ff1a1a, #8B0000); color: white; border: none; padding: 1rem 2rem; border-radius: 8px; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; margin: 0 auto;"
                            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(255,26,26,0.4)'" 
                            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                    <p style="color: #888; font-size: 0.8rem; margin-top: 0.5rem;">
                        Clique em Salvar para aplicar as alterações no site
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Mark setting as changed (but don't save yet)
function markSettingChanged(chave, valor) {
    pendingSettings[chave] = valor;
    
    // Update toggle visual immediately
    if (chave === 'trabalhos_enabled') {
        const span = document.getElementById('trabalhosToggleSpan');
        if (span) {
            span.style.backgroundColor = valor ? '#ff1a1a' : '#444';
            span.querySelector('span').style.transform = valor ? 'translateX(26px)' : 'translateX(0)';
        }
    } else if (chave === 'rituais_enabled') {
        const span = document.getElementById('rituaisToggleSpan');
        if (span) {
            span.style.backgroundColor = valor ? '#ff1a1a' : '#444';
            span.querySelector('span').style.transform = valor ? 'translateX(26px)' : 'translateX(0)';
        }
    }
    
    // Show unsaved message
    const unsavedMsg = document.getElementById('unsavedMessage');
    if (unsavedMsg) {
        unsavedMsg.style.display = 'block';
    }
}

// Save all pending settings
async function saveAllSettings() {
    try {
        const updates = [];
        
        // Collect all changes
        if ('trabalhos_enabled' in pendingSettings) {
            updates.push({ chave: 'trabalhos_enabled', valor: pendingSettings.trabalhos_enabled ? 'true' : 'false' });
        }
        if ('rituais_enabled' in pendingSettings) {
            updates.push({ chave: 'rituais_enabled', valor: pendingSettings.rituais_enabled ? 'true' : 'false' });
        }
        if ('trabalhos_title' in pendingSettings) {
            updates.push({ chave: 'trabalhos_title', valor: pendingSettings.trabalhos_title });
        }
        if ('rituais_title' in pendingSettings) {
            updates.push({ chave: 'rituais_title', valor: pendingSettings.rituais_title });
        }
        
        if (updates.length === 0) {
            showSuccess('Nenhuma alteração para salvar');
            return;
        }
        
        // Save all changes
        for (const update of updates) {
            const { error } = await supabaseClient
                .from('site_settings')
                .update({ valor: update.valor, updated_at: new Date().toISOString() })
                .eq('chave', update.chave);
            
            if (error) throw error;
        }
        
        showSuccess(`${updates.length} alteração(ões) salva(s) com sucesso!`);
        
        // Clear pending settings
        pendingSettings = {};
        
        // Hide unsaved message
        const unsavedMsg = document.getElementById('unsavedMessage');
        if (unsavedMsg) {
            unsavedMsg.style.display = 'none';
        }
        
        // Reload to show saved state
        await loadConfiguracoesSection();
        
    } catch (error) {
        showError('Erro ao salvar alterações: ' + error.message);
    }
}

// Legacy functions (kept for compatibility)
async function toggleSetting(chave, valor) {
    // Now handled by markSettingChanged + saveAllSettings
}

async function updateSetting(chave, valor) {
    // Now handled by markSettingChanged + saveAllSettings
}

// CRUD Operations
async function editTrabalho(id) {
    try {
        const { data: trabalho, error } = await supabaseClient
            .from('trabalhos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Reset state
        currentIconFile = null;
        currentIconPreview = null;
        perguntasList = trabalho.perguntas || [];
        
        openModal('Editar Trabalho', getServiceFormHTML('trabalho', trabalho));
        setupServiceFormListeners('trabalho');
        
    } catch (error) {
        console.error('Erro ao carregar trabalho:', error);
        showNotificationModal('Erro ao carregar trabalho: ' + error.message, 'error');
    }
}

async function handleTrabalhoSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('trabalhoId')?.value;
    const nome = document.getElementById('trabalhoNome').value;
    const descricao = document.getElementById('trabalhoDescricao').value;
    const valor = parseFloat(document.getElementById('trabalhoValor').value);
    const ativo = document.getElementById('trabalhoAtivo')?.checked ?? true;
    const requerImagem = document.getElementById('trabalhoRequerImagem')?.checked ?? false;
    const categoriaId = document.getElementById('trabalhoCategoria')?.value;
    
    // Validate categoria
    if (!categoriaId) {
        alert('Por favor, selecione uma categoria.');
        return;
    }
    
    // Collect perguntas
    const perguntaInputs = document.querySelectorAll('#trabalhoPerguntasContainer .pergunta-input');
    const perguntas = Array.from(perguntaInputs).map(input => input.value.trim()).filter(p => p);
    
    try {
        // Generate UUID for new trabalho if needed
        const trabalhoId = id || crypto.randomUUID();
        
        // Upload icon if selected
        let iconUrl = null;
        if (currentIconFile) {
            iconUrl = await uploadIcon(currentIconFile, 'trabalho', trabalhoId);
        }
        
        const trabalhoData = {
            nome,
            descricao,
            valor,
            ativo,
            requer_imagem: requerImagem,
            categoria_id: categoriaId,
            perguntas: perguntas,
            updated_at: new Date().toISOString()
        };
        
        // Only update icon_url if a new icon was uploaded
        if (iconUrl) {
            trabalhoData.icon_url = iconUrl;
        }
        
        let result;
        if (id) {
            // Update existing
            result = await supabaseClient
                .from('trabalhos')
                .update(trabalhoData)
                .eq('id', id);
        } else {
            // Create new
            trabalhoData.id = trabalhoId;
            trabalhoData.created_at = new Date().toISOString();
            result = await supabaseClient
                .from('trabalhos')
                .insert(trabalhoData);
        }
        
        if (result.error) throw result.error;
        
        // Reset state
        currentIconFile = null;
        currentIconPreview = null;
        perguntasList = [];
        
        closeModal();
        await loadTrabalhosTable();
        showNotificationModal('Trabalho salvo com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar trabalho:', error);
        showNotificationModal('Erro ao salvar trabalho: ' + error.message, 'error');
    }
}

async function deleteTrabalho(id) {
    if (!confirm('Tem certeza que deseja excluir este trabalho?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('trabalhos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadTrabalhosTable();
        showNotificationModal('Trabalho excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir trabalho:', error);
        showNotificationModal('Erro ao excluir trabalho: ' + error.message, 'error');
    }
}

async function editRitual(id) {
    try {
        const { data: ritual, error } = await supabaseClient
            .from('rituais')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Reset state
        currentIconFile = null;
        currentIconPreview = null;
        perguntasList = ritual.perguntas || [];
        
        openModal('Editar Ritual', getServiceFormHTML('ritual', ritual));
        setupServiceFormListeners('ritual');
        
    } catch (error) {
        console.error('Erro ao carregar ritual:', error);
        showNotificationModal('Erro ao carregar ritual: ' + error.message, 'error');
    }
}

async function handleRitualSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('ritualId')?.value;
    const nome = document.getElementById('ritualNome').value;
    const descricao = document.getElementById('ritualDescricao').value;
    const valor = parseFloat(document.getElementById('ritualValor').value);
    const ativo = document.getElementById('ritualAtivo')?.checked ?? true;
    const requerImagem = document.getElementById('ritualRequerImagem')?.checked ?? false;
    const categoriaId = document.getElementById('ritualCategoria')?.value;
    
    // Validate categoria
    if (!categoriaId) {
        alert('Por favor, selecione uma categoria.');
        return;
    }
    
    // Collect perguntas
    const perguntaInputs = document.querySelectorAll('#ritualPerguntasContainer .pergunta-input');
    const perguntas = Array.from(perguntaInputs).map(input => input.value.trim()).filter(p => p);
    
    try {
        // Generate UUID for new ritual if needed
        const ritualId = id || crypto.randomUUID();
        
        // Upload icon if selected
        let iconUrl = null;
        if (currentIconFile) {
            iconUrl = await uploadIcon(currentIconFile, 'ritual', ritualId);
        }
        
        const ritualData = {
            nome,
            descricao,
            valor,
            ativo,
            requer_imagem: requerImagem,
            categoria_id: categoriaId,
            perguntas: perguntas,
            updated_at: new Date().toISOString()
        };
        
        // Only update icon_url if a new icon was uploaded
        if (iconUrl) {
            ritualData.icon_url = iconUrl;
        }
        
        let result;
        if (id) {
            // Update existing
            result = await supabaseClient
                .from('rituais')
                .update(ritualData)
                .eq('id', id);
        } else {
            // Create new
            ritualData.id = ritualId;
            ritualData.created_at = new Date().toISOString();
            result = await supabaseClient
                .from('rituais')
                .insert(ritualData);
        }
        
        if (result.error) throw result.error;
        
        // Reset state
        currentIconFile = null;
        currentIconPreview = null;
        perguntasList = [];
        
        closeModal();
        await loadRituaisTable();
        showNotificationModal('Ritual salvo com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar ritual:', error);
        showNotificationModal('Erro ao salvar ritual: ' + error.message, 'error');
    }
}

async function deleteRitual(id) {
    if (!confirm('Tem certeza que deseja excluir este ritual?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('rituais')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadRituaisTable();
        showNotificationModal('Ritual excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir ritual:', error);
        showNotificationModal('Erro ao excluir ritual: ' + error.message, 'error');
    }
}

async function viewPedido(id) {
    try {
        const { data: pedido, error } = await supabaseClient
            .from('order_with_details')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        openModal('Detalhes do Pedido', `
            <div class="pedido-details">
                <div class="form-group">
                    <label class="form-label">ID do Pedido</label>
                    <input type="text" class="form-control" value="#${pedido.id.toString().substring(0, 8)}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Cliente</label>
                    <input type="text" class="form-control" value="${pedido.cliente_nome}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="text" class="form-control" value="${pedido.cliente_email}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Serviço</label>
                    <input type="text" class="form-control" value="${pedido.service_nome}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Valor</label>
                    <input type="text" class="form-control" value="R$ ${pedido.valor_total.toFixed(2)}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="pedidoStatus">
                        <option value="pending" ${pedido.status === 'pending' ? 'selected' : ''}>Pendente</option>
                        <option value="paid" ${pedido.status === 'paid' ? 'selected' : ''}>Pago</option>
                        <option value="completed" ${pedido.status === 'completed' ? 'selected' : ''}>Concluído</option>
                        <option value="delivered" ${pedido.status === 'delivered' ? 'selected' : ''}>Entregue</option>
                        <option value="cancelled" ${pedido.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Data</label>
                    <input type="text" class="form-control" value="${new Date(pedido.created_at).toLocaleString('pt-BR')}" readonly>
                </div>
                
                <!-- Dados do Formulário -->
                ${pedido.form_data ? `
                <div class="form-group">
                    <label class="form-label">Respostas do Formulário</label>
                    <div style="background: var(--dark); padding: 1rem; border-radius: 6px; border: 1px solid var(--border);">
                        ${(() => {
                            try {
                                const formData = typeof pedido.form_data === 'string' ? JSON.parse(pedido.form_data) : pedido.form_data;
                                return Object.entries(formData).map(([key, value]) => `
                                    <div style="margin-bottom: 0.75rem;">
                                        <strong style="color: var(--primary); text-transform: capitalize;">${key.replace(/_/g, ' ')}:</strong>
                                        <div style="color: var(--text-secondary); margin-top: 0.25rem;">${value}</div>
                                    </div>
                                `).join('');
                            } catch (e) {
                                return '<div style="color: var(--text-secondary);">Erro ao carregar dados do formulário</div>';
                            }
                        })()}
                    </div>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <button class="btn btn-primary" onclick="updatePedidoStatus('${pedido.id}')">Atualizar Status</button>
                </div>
            </div>
        `);
        
    } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        showNotificationModal('Erro ao carregar pedido: ' + error.message, 'error');
    }
}

async function updatePedidoStatus(id) {
    const status = document.getElementById('pedidoStatus').value;
    
    try {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (error) throw error;
        
        closeModal();
        await loadPedidosTable();
        showNotificationModal('Status atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotificationModal('Erro ao atualizar status: ' + error.message, 'error');
    }
}

// Função para filtrar por status usando abas
async function filterByStatus(status) {
    // Atualizar variável global
    currentStatusFilter = status;
    
    // Atualizar classes das abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-status') === status) {
            btn.classList.add('active');
        }
    });
    
    // Recarregar tabela
    await loadPedidosTable();
}

async function viewCliente(id) {
    try {
        const { data: cliente, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Buscar pedidos do cliente
        const { data: pedidos } = await supabaseClient
            .from('order_with_details')
            .select('*')
            .eq('cliente_id', id)
            .order('created_at', { ascending: false });
        
        openModal('Detalhes do Cliente', `
            <div class="cliente-details">
                <div class="form-group">
                    <label class="form-label">Nome</label>
                    <input type="text" class="form-control" value="${cliente.nome}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="text" class="form-control" value="${cliente.email}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Telefone</label>
                    <input type="text" class="form-control" value="${cliente.telefone || '-'}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Data Cadastro</label>
                    <input type="text" class="form-control" value="${new Date(cliente.created_at).toLocaleString('pt-BR')}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Total Pedidos: ${pedidos?.length || 0}</label>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Serviço</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pedidos && pedidos.length > 0 ? pedidos.map(p => `
                                    <tr>
                                        <td>${p.service_nome}</td>
                                        <td>R$ ${p.valor_total.toFixed(2)}</td>
                                        <td>${getStatusBadge(p.status)}</td>
                                        <td>${new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="4">Nenhum pedido encontrado</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `);
        
    } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        showNotificationModal('Erro ao carregar cliente: ' + error.message, 'error');
    }
}

// Export functions
function exportPedidos() {
    showNotificationModal('Função de exportação de pedidos em desenvolvimento...', 'error');
}

function exportClientes() {
    showNotificationModal('Função de exportação de clientes em desenvolvimento...', 'error');
}

function generateFinancialReport() {
    showNotificationModal('Função de geração de relatório financeiro em desenvolvimento...', 'error');
}

// File upload state
let currentIconFile = null;
let currentIconPreview = null;
let perguntasList = [];

// Modal functions
function openTrabalhoModal() {
    perguntasList = [];
    currentIconFile = null;
    currentIconPreview = null;
    
    openModal('Adicionar Trabalho', getServiceFormHTML('trabalho'));
    setupServiceFormListeners('trabalho');
}

function openRitualModal() {
    perguntasList = [];
    currentIconFile = null;
    currentIconPreview = null;
    
    openModal('Adicionar Ritual', getServiceFormHTML('ritual'));
    setupServiceFormListeners('ritual');
}

// Service Form HTML Generator
function getServiceFormHTML(type, data = null) {
    const isEdit = !!data;
    const perguntas = data?.perguntas || [];
    const iconUrl = data?.icon_url || '';
    
    return `
        <form id="${type}Form" enctype="multipart/form-data">
            ${isEdit ? `<input type="hidden" id="${type}Id" value="${data.id}">` : ''}
            
            <!-- Icon Upload Section -->
            <div class="form-group">
                <label class="form-label">Ícone do Serviço</label>
                <div class="icon-upload-container" style="border: 2px dashed var(--border); border-radius: 12px; padding: 1.5rem; text-align: center; background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.3s ease;" id="${type}IconDropzone">
                    <div id="${type}IconPreview" style="margin-bottom: 1rem;">
                        ${iconUrl ? `<img src="${iconUrl}" style="max-width: 100px; max-height: 100px; border-radius: 12px; object-fit: cover;">` : '<i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: var(--primary); opacity: 0.5;"></i>'}
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">
                        ${iconUrl ? 'Clique para alterar o ícone' : 'Clique ou arraste uma imagem aqui'}
                    </p>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; opacity: 0.7;">
                        PNG, JPG ou SVG (máx. 2MB)
                    </p>
                    <input type="file" id="${type}IconInput" accept="image/png,image/jpeg,image/jpg,image/svg+xml" style="display: none;">
                </div>
            </div>
            
            <!-- Basic Info -->
            <div class="form-group">
                <label class="form-label">Nome *</label>
                <input type="text" class="form-control" id="${type}Nome" value="${data?.nome || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Descrição *</label>
                <textarea class="form-control" id="${type}Descricao" rows="4" required>${data?.descricao || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Valor (R$) *</label>
                <input type="number" class="form-control" id="${type}Valor" step="0.01" min="0" value="${data?.valor || ''}" required>
            </div>
            
            <!-- Categoria -->
            <div class="form-group">
                <label class="form-label">Categoria *</label>
                <select class="form-control" id="${type}Categoria" required>
                    <option value="">Selecione uma categoria</option>
                    <!-- Categorias serão carregadas dinamicamente -->
                </select>
            </div>
            
            <!-- Perguntas Section -->
            <div class="form-group">
                <label class="form-label">Perguntas para o Cliente</label>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
                    Estas perguntas serão exibidas para o cliente após o pagamento.
                </p>
                <div id="${type}PerguntasContainer" style="margin-bottom: 1rem;">
                    ${perguntas.map((p, index) => `
                        <div class="pergunta-item" data-index="${index}" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                            <input type="text" class="form-control pergunta-input" value="${p}" placeholder="Digite a pergunta..." style="flex: 1;">
                            <button type="button" class="btn btn-danger" onclick="removePergunta('${type}', ${index})" style="padding: 0.5rem; min-width: auto;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn btn-secondary" onclick="addPergunta('${type}')" style="width: 100%;">
                    <i class="fas fa-plus"></i> Adicionar Pergunta
                </button>
            </div>
            
            <!-- Anexo de Imagem Option -->
            <div class="form-group" style="background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 1rem;">
                <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0;">
                    <input type="checkbox" id="${type}RequerImagem" ${data?.requer_imagem ? 'checked' : ''}>
                    <span><i class="fas fa-image" style="color: var(--primary);"></i> Requer anexo de imagem do cliente</span>
                </label>
                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.5rem; margin-left: 1.5rem;">
                    Quando ativado, o cliente poderá anexar uma imagem ao preencher o formulário após o pagamento.
                </p>
            </div>
            
            <div class="form-group">
                <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" id="${type}Ativo" ${data?.ativo !== false ? 'checked' : ''}>
                    Serviço Ativo
                </label>
            </div>
            
            <div class="form-group" style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()" style="flex: 1;">Cancelar</button>
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Criar Serviço'}
                </button>
            </div>
        </form>
    `;
}

// Setup form event listeners
function setupServiceFormListeners(type) {
    setTimeout(() => {
        const form = document.getElementById(`${type}Form`);
        const iconInput = document.getElementById(`${type}IconInput`);
        const dropzone = document.getElementById(`${type}IconDropzone`);
        
        if (form) {
            form.addEventListener('submit', type === 'trabalho' ? handleTrabalhoSubmit : handleRitualSubmit);
        }
        
        // Load categories for select
        loadCategoriasForServiceForm(type);
        
        // Icon upload handling
        if (iconInput && dropzone) {
            dropzone.addEventListener('click', () => iconInput.click());
            
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--primary)';
                dropzone.style.background = 'rgba(212, 175, 55, 0.1)';
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.style.borderColor = 'var(--border)';
                dropzone.style.background = 'rgba(255,255,255,0.02)';
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--border)';
                dropzone.style.background = 'rgba(255,255,255,0.02)';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleIconSelect(files[0], type);
                }
            });
            
            iconInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleIconSelect(e.target.files[0], type);
                }
            });
        }
        
        // Load existing perguntas if editing
        const container = document.getElementById(`${type}PerguntasContainer`);
        if (container) {
            perguntasList = [];
            const inputs = container.querySelectorAll('.pergunta-input');
            inputs.forEach(input => perguntasList.push(input.value));
        }
    }, 100);
}

// Load categories for service form
async function loadCategoriasForServiceForm(type) {
    const select = document.getElementById(`${type}Categoria`);
    if (!select) return;
    
    const tipoCategoria = type === 'trabalho' ? 'trabalho' : 'ritual';
    
    try {
        const categorias = await getCategoriasForSelect(tipoCategoria);
        
        // Keep the first option
        select.innerHTML = '<option value="">Selecione uma categoria</option>';
        
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });
        
        // If editing, set the selected value
        const hiddenInput = document.getElementById(`${type}Id`);
        if (hiddenInput && hiddenInput.value) {
            // We're in edit mode - need to fetch the current trabalho/ritual to get its categoria_id
            const { data, error } = await supabaseClient
                .from(type === 'trabalho' ? 'trabalhos' : 'rituais')
                .select('categoria_id')
                .eq('id', hiddenInput.value)
                .single();
            
            if (!error && data && data.categoria_id) {
                select.value = data.categoria_id;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Handle icon file selection
function handleIconSelect(file, type) {
    // Validate file
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!validTypes.includes(file.type)) {
        showNotificationModal('Tipo de arquivo inválido. Use PNG, JPG ou SVG.', 'error');
        return;
    }
    
    if (file.size > maxSize) {
        showNotificationModal('Arquivo muito grande. Tamanho máximo: 2MB', 'error');
        return;
    }
    
    currentIconFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById(`${type}IconPreview`);
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">`;
        }
        currentIconPreview = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Add pergunta field
function addPergunta(type) {
    const container = document.getElementById(`${type}PerguntasContainer`);
    const index = perguntasList.length;
    
    const div = document.createElement('div');
    div.className = 'pergunta-item';
    div.dataset.index = index;
    div.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';
    div.innerHTML = `
        <input type="text" class="form-control pergunta-input" placeholder="Digite a pergunta..." style="flex: 1;">
        <button type="button" class="btn btn-danger" onclick="removePergunta('${type}', ${index})" style="padding: 0.5rem; min-width: auto;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(div);
    perguntasList.push('');
    
    // Focus on new input
    div.querySelector('.pergunta-input').focus();
}

// Remove pergunta field
function removePergunta(type, index) {
    const container = document.getElementById(`${type}PerguntasContainer`);
    const items = container.querySelectorAll('.pergunta-item');
    
    if (items[index]) {
        items[index].remove();
        perguntasList.splice(index, 1);
        
        // Reindex remaining items
        const remaining = container.querySelectorAll('.pergunta-item');
        remaining.forEach((item, i) => {
            item.dataset.index = i;
            const btn = item.querySelector('button');
            btn.setAttribute('onclick', `removePergunta('${type}', ${i})`);
        });
    }
}

// Upload icon to Supabase Storage
async function uploadIcon(file, type, id) {
    if (!file) return null;
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${id}_${Date.now()}.${fileExt}`;
        const filePath = `${type}s/${fileName}`;
        
        const { data, error } = await supabaseClient.storage
            .from('icons')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('icons')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Erro ao fazer upload do ícone:', error);
        throw error;
    }
}

// Export global functions for HTML onclick handlers
window.markSettingChanged = markSettingChanged;
window.saveAllSettings = saveAllSettings;
window.toggleSetting = toggleSetting;
window.updateSetting = updateSetting;
window.loadConfiguracoesSection = loadConfiguracoesSection;

// Export category functions
window.openCategoriaModal = openCategoriaModal;
window.handleCategoriaSubmit = handleCategoriaSubmit;
window.editCategoria = editCategoria;
window.deleteCategoria = deleteCategoria;
window.loadCategoriasLists = loadCategoriasLists;
window.renderCategoriasList = renderCategoriasList;

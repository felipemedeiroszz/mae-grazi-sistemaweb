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
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Modal close
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

// Authentication
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            currentUser = session.user;
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
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showDashboard();
        
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
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
function showSection(section) {
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Dashboard',
        'trabalhos': 'Gerenciar Trabalhos',
        'rituais': 'Gerenciar Rituais',
        'pedidos': 'Pedidos',
        'clientes': 'Clientes',
        'financeiro': 'Financeiro',
        'configuracoes': 'Configurações'
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
    loadSectionContent(section);
}

// Load section content
function loadSectionContent(section) {
    const content = document.getElementById('content');
    if (!content) return;
    
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'trabalhos':
            loadTrabalhosSection();
            break;
        case 'rituais':
            loadRituaisSection();
            break;
        case 'pedidos':
            loadPedidosSection();
            break;
        case 'clientes':
            loadClientesSection();
            break;
        case 'financeiro':
            loadFinanceiroSection();
            break;
        case 'configuracoes':
            loadConfiguracoesSection();
            break;
    }
}

// Dashboard loading
function loadDashboard() {
    // Update stats
    updateDashboardStats();
    
    // Load charts if needed
    // TODO: Implement charts
    console.log('Dashboard loaded');
}

async function updateDashboardStats() {
    try {
        // Load trabalhos count
        const { data: trabalhos, error: trabalhosError } = await supabaseClient
            .from('trabalhos')
            .select('id', { count: 'exact' })
            .eq('ativo', true);
        
        if (!trabalhosError && trabalhos) {
            const totalTrabalhos = document.getElementById('totalTrabalhos');
            if (totalTrabalhos) totalTrabalhos.textContent = trabalhos.length || 0;
        }
        
        // Load rituais count
        const { data: rituais, error: rituaisError } = await supabaseClient
            .from('rituais')
            .select('id', { count: 'exact' })
            .eq('ativo', true);
        
        if (!rituaisError && rituais) {
            const totalRituais = document.getElementById('totalRituais');
            if (totalRituais) totalRituais.textContent = rituais.length || 0;
        }
        
        // Load pedidos count
        const { data: pedidos, error: pedidosError } = await supabaseClient
            .from('pedidos')
            .select('id', { count: 'exact' });
        
        if (!pedidosError && pedidos) {
            const totalPedidos = document.getElementById('totalPedidos');
            if (totalPedidos) totalPedidos.textContent = pedidos.length || 0;
        }
        
        // Load clientes count
        const { data: clientes, error: clientesError } = await supabaseClient
            .from('clientes')
            .select('id', { count: 'exact' });
        
        if (!clientesError && clientes) {
            const totalClientes = document.getElementById('totalClientes');
            if (totalClientes) totalClientes.textContent = clientes.length || 0;
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Placeholder functions for other sections
function loadTrabalhosSection() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Gerenciar Trabalhos</h2>
                    <button class="btn btn-primary" onclick="openTrabalhoModal()">
                        <i class="fas fa-plus"></i> Adicionar Trabalho
                    </button>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando trabalhos...
                </div>
            </div>
        `;
    }
    // TODO: Implement trabalhos section
}

function loadRituaisSection() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Gerenciar Rituais</h2>
                    <button class="btn btn-primary" onclick="openRitualModal()">
                        <i class="fas fa-plus"></i> Adicionar Ritual
                    </button>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando rituais...
                </div>
            </div>
        `;
    }
    // TODO: Implement rituais section
}

function loadPedidosSection() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Pedidos</h2>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando pedidos...
                </div>
            </div>
        `;
    }
    // TODO: Implement pedidos section
}

function loadClientesSection() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Clientes</h2>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando clientes...
                </div>
            </div>
        `;
    }
    // TODO: Implement clientes section
}

function loadFinanceiroSection() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Financeiro</h2>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando dados financeiros...
                </div>
            </div>
        `;
    }
    // TODO: Implement financeiro section
}

function loadConfiguracoesSection() {
    const content = document.getElementById('content');
    if (content) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Configurações</h2>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    Carregando configurações...
                </div>
            </div>
        `;
    }
    // TODO: Implement configurações section
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

// Placeholder modal functions
function openTrabalhoModal() {
    openModal('Adicionar Trabalho', `
        <form id="trabalhoForm">
            <div class="form-group">
                <label class="form-label">Nome</label>
                <input type="text" class="form-control" id="trabalhoNome" required>
            </div>
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" id="trabalhoDescricao" required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Valor</label>
                <input type="number" class="form-control" id="trabalhoValor" step="0.01" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>
    `);
}

function openRitualModal() {
    openModal('Adicionar Ritual', `
        <form id="ritualForm">
            <div class="form-group">
                <label class="form-label">Nome</label>
                <input type="text" class="form-control" id="ritualNome" required>
            </div>
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" id="ritualDescricao" required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Valor</label>
                <input type="number" class="form-control" id="ritualValor" step="0.01" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>
    `);
}

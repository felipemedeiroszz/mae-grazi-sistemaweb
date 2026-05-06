// Supabase Configuration
const SUPABASE_URL = 'https://neemeubleifwmryowqzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentUser = null;
let orders = [];
let allOrders = [];
let currentOrderFilter = 'all';
let currentTrackOrderId = null;
let uploadedFiles = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
    checkPaymentCallback();
});

// Setup Event Listeners
function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }

    // Close modals on outside click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.querySelector('.mobile-menu-toggle');
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// Check Authentication Status
async function checkAuthStatus() {
    try {
        // Get user from localStorage (simulated session)
        const userData = localStorage.getItem('currentUser');
        
        if (!userData) {
            // Redirect to login if not authenticated
            window.location.href = 'cliente.html';
            return;
        }
        
        currentUser = JSON.parse(userData);
        updateUserInterface();
        await loadDashboardData();
        
        // Check if user came from service selection
        checkServiceRedirect();
        
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'cliente.html';
    }
}

// Check for service redirect from index.html
function checkServiceRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    const price = urlParams.get('price');
    
    if (service && price) {
        // Show notification about selected service
        showNotification(`Você selecionou: ${service} - ${price}. Faça um novo pedido para solicitar!`, 'info');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check for payment callback (webhook redirect)
function checkPaymentCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const orderId = urlParams.get('order');
    
    if (payment === 'success' && orderId) {
        // Show success notification
        showNotification('Pagamento confirmado com sucesso!', 'success');
        
        // Update form badge count
        updateFormBadgeCount();
        
        // Redirect to formularios section after payment
        setTimeout(() => {
            // Activate formularios nav item
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            const formNavItem = document.querySelector('[data-section="formularios"]');
            if (formNavItem) formNavItem.classList.add('active');
            
            // Show formularios section
            document.querySelectorAll('#mainContent > .card, #mainContent > .stats-grid, #mainContent > .progress-stats, #mainContent > .dashboard-grid').forEach(el => {
                el.style.display = 'none';
            });
            const formulariosSection = document.getElementById('formulariosSection');
            if (formulariosSection) {
                formulariosSection.style.display = 'block';
                loadPendingForms();
            }
            
            // Show message about the specific order
            showNotification('Você tem um novo formulário para responder!', 'info');
        }, 1500);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Update User Interface
function updateUserInterface() {
    if (!currentUser) return;
    
    // Update user info in header
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const welcomeName = document.getElementById('welcomeName');
    
    if (userName) userName.textContent = currentUser.nome;
    if (userEmail) userEmail.textContent = currentUser.email;
    if (userAvatar) {
        userAvatar.textContent = currentUser.nome.charAt(0).toUpperCase();
    }
    if (welcomeName) welcomeName.textContent = currentUser.nome?.split(' ')[0] || 'Cliente';
    
    // Update sidebar user info
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    
    if (sidebarName) sidebarName.textContent = currentUser.nome;
    if (sidebarEmail) sidebarEmail.textContent = currentUser.email;
    if (sidebarAvatar) {
        sidebarAvatar.textContent = currentUser.nome.charAt(0).toUpperCase();
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    await Promise.all([
        loadOrders(),
        updateStats(),
        updateFormBadgeCount()
    ]);
}

// Update Form Badge Count (for initial load)
async function updateFormBadgeCount() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('pedidos')
            .select(`
                id,
                form_data,
                trabalhos(perguntas),
                rituais(perguntas)
            `)
            .eq('cliente_id', currentUser.id)
            .eq('status', 'paid');
        
        if (error) throw error;
        
        const pendingCount = orders.filter(order => {
            const service = order.trabalhos || order.rituais;
            const perguntas = service?.perguntas || [];
            const hasQuestions = perguntas.length > 0;
            const formNotSubmitted = !order.form_data || Object.keys(order.form_data).length === 0;
            return hasQuestions && formNotSubmitted;
        }).length;
        
        updateFormBadge(pendingCount);
        
    } catch (error) {
        console.error('Error updating form badge:', error);
    }
}

// Load Orders
async function loadOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('order_with_details')
            .select('*')
            .eq('cliente_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(5); // Recent orders only
        
        if (error) throw error;
        
        orders = data || [];
        renderRecentOrders();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        renderOrdersError();
    }
}

// Render Recent Orders
function renderRecentOrders() {
    const container = document.getElementById('recentOrders');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum pedido encontrado</h3>
                <p>Faça seu primeiro pedido para começar!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>${order.service_nome}</h4>
                <p>Pedido #${order.id.toString().substring(0, 8)}</p>
                <p>${new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; color: var(--primary-gold); margin-bottom: 0.5rem;">
                    R$ ${order.valor.toFixed(2)}
                </div>
                <span class="order-status status-${order.status}">
                    ${getStatusText(order.status)}
                </span>
            </div>
        </div>
    `).join('');
}

// Render Orders Error
function renderOrdersError() {
    const container = document.getElementById('recentOrders');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro ao carregar pedidos</h3>
            <p>Tente novamente mais tarde.</p>
        </div>
    `;
}

// Update Statistics
async function updateStats() {
    try {
        // Get all orders for this client
        const { data: allOrders, error } = await supabaseClient
            .from('order_with_details')
            .select('*')
            .eq('cliente_id', currentUser.id);
        
        if (error) throw error;
        
        const orders = allOrders || [];
        
        // Calculate stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const paidOrders = orders.filter(o => o.status === 'paid').length;
        const completedOrders = orders.filter(o => o.status === 'completed').length;
        const totalSpent = orders
            .filter(o => o.status === 'paid' || o.status === 'completed')
            .reduce((sum, o) => sum + o.valor, 0);
        
        // Update UI
        updateStat('totalOrders', totalOrders);
        updateStat('pendingOrders', pendingOrders);
        updateStat('completedOrders', completedOrders);
        updateStat('totalSpent', `R$ ${totalSpent.toFixed(2)}`);
        
        // Update progress bars
        if (totalOrders > 0) {
            const pendingPercent = Math.round((pendingOrders / totalOrders) * 100);
            const paidPercent = Math.round((paidOrders / totalOrders) * 100);
            const completedPercent = Math.round((completedOrders / totalOrders) * 100);
            
            updateProgressBar('pending', pendingPercent);
            updateProgressBar('paid', paidPercent);
            updateProgressBar('completed', completedPercent);
        } else {
            updateProgressBar('pending', 0);
            updateProgressBar('paid', 0);
            updateProgressBar('completed', 0);
        }
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update Progress Bar
function updateProgressBar(type, percent) {
    const bar = document.getElementById(`${type}Bar`);
    const label = document.getElementById(`${type}Percent`);
    
    if (bar) {
        bar.style.width = `${percent}%`;
    }
    if (label) {
        label.textContent = `${percent}%`;
    }
}

// Update Single Stat
function updateStat(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Get Status Text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'paid': 'Pago',
        'completed': 'Concluído',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

// Logout Function
function logout() {
    // Clear session
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    // Redirect to login page (will show login modal automatically)
    window.location.href = 'cliente.html';
}

// Toggle Sidebar (Mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Show Section
function showSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find the clicked nav item and activate it
    const clickedItem = event.target.closest('.nav-item');
    if (clickedItem) clickedItem.classList.add('active');
    
    // Show/hide sections
    const dashboardSection = document.getElementById('mainContent');
    const formulariosSection = document.getElementById('formulariosSection');
    
    if (section === 'dashboard') {
        // Show dashboard content
        document.querySelectorAll('#mainContent > .card, #mainContent > .stats-grid, #mainContent > .progress-stats, #mainContent > .dashboard-grid').forEach(el => {
            el.style.display = '';
        });
        if (formulariosSection) formulariosSection.style.display = 'none';
    } else if (section === 'formularios') {
        // Hide dashboard content, show formularios
        document.querySelectorAll('#mainContent > .card, #mainContent > .stats-grid, #mainContent > .progress-stats, #mainContent > .dashboard-grid').forEach(el => {
            el.style.display = 'none';
        });
        if (formulariosSection) {
            formulariosSection.style.display = 'block';
            loadPendingForms();
        }
    }
    
    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

// Load Pending Forms
async function loadPendingForms() {
    const container = document.getElementById('pendingFormsList');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
    
    try {
        // Get paid orders that need form submission
        const { data: orders, error } = await supabaseClient
            .from('pedidos')
            .select(`
                *,
                trabalhos(id, nome, descricao, icon_url, perguntas, requer_imagem),
                rituais(id, nome, descricao, icon_url, perguntas, requer_imagem)
            `)
            .eq('cliente_id', currentUser.id)
            .eq('status', 'paid')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Filter orders that have questions but no form data submitted
        const pendingForms = orders.filter(order => {
            const service = order.trabalhos || order.rituais;
            const perguntas = service?.perguntas || [];
            const hasQuestions = perguntas.length > 0;
            const formNotSubmitted = !order.form_data || Object.keys(order.form_data).length === 0;
            return hasQuestions && formNotSubmitted;
        });
        
        // Update badge count
        updateFormBadge(pendingForms.length);
        
        if (pendingForms.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle" style="color: #22c55e;"></i>
                    <h3>Nenhum formulário pendente!</h3>
                    <p>Você respondeu todos os formulários dos seus pedidos pagos.</p>
                    <button class="btn btn-primary" onclick="showSection('dashboard')" style="margin-top: 1rem;">
                        <i class="fas fa-arrow-left"></i> Voltar ao Dashboard
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = pendingForms.map(order => {
            const service = order.trabalhos || order.rituais;
            return `
                <div class="order-item" style="margin-bottom: 1rem; cursor: pointer;" onclick="trackOrder('${order.id}')">
                    <div class="order-info">
                        <h4 style="color: var(--primary-gold);">${service?.nome || 'Serviço'}</h4>
                        <p>Pedido #${order.id.toString().substring(0, 8)}</p>
                        <p style="color: #fbbf24;"><i class="fas fa-exclamation-circle"></i> Formulário pendente</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: var(--primary-gold); margin-bottom: 0.5rem;">
                            R$ ${order.valor.toFixed(2)}
                        </div>
                        <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            <i class="fas fa-edit"></i> Responder
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading pending forms:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar formulários</h3>
                <p>Tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// Update Form Badge
function updateFormBadge(count) {
    const badge = document.getElementById('formBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// View All Orders
async function viewAllOrders() {
    openModal('allOrdersModal');
    await loadAllOrders();
}

// Load All Orders
async function loadAllOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('order_with_details')
            .select('*')
            .eq('cliente_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allOrders = data || [];
        renderAllOrders();
        
    } catch (error) {
        console.error('Error loading all orders:', error);
        const container = document.getElementById('allOrdersList');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar pedidos</h3>
                    <p>Tente novamente mais tarde.</p>
                </div>
            `;
        }
    }
}

// Filter Orders
function filterOrders(status) {
    currentOrderFilter = status;
    
    // Update active tab
    document.querySelectorAll('#allOrdersModal .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderAllOrders();
}

// Render All Orders
function renderAllOrders() {
    const container = document.getElementById('allOrdersList');
    if (!container) return;
    
    let filteredOrders = allOrders;
    if (currentOrderFilter !== 'all') {
        filteredOrders = allOrders.filter(o => o.status === currentOrderFilter);
    }
    
    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum pedido encontrado</h3>
                <p>Não há pedidos ${currentOrderFilter !== 'all' ? 'com este status' : ''}.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredOrders.map(order => `
        <div class="order-item" style="cursor: pointer;" onclick="showOrderDetail('${order.id}')">
            <div class="order-info">
                <h4>${order.service_nome}</h4>
                <p>Pedido #${order.id.toString().substring(0, 8)} • ${new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; color: var(--primary-gold); margin-bottom: 0.5rem;">
                    R$ ${order.valor.toFixed(2)}
                </div>
                <span class="order-status status-${order.status}">
                    ${getStatusText(order.status)}
                </span>
                ${order.status === 'paid' ? `
                    <button class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem;" 
                            onclick="event.stopPropagation(); trackOrder('${order.id}')">
                        <i class="fas fa-tasks"></i> Acompanhar
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Show Order Detail
async function showOrderDetail(orderId) {
    try {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;
        
        const content = document.getElementById('orderDetailContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="order-detail-header">
                <img src="${order.service_icon || 'https://via.placeholder.com/100'}" alt="${order.service_nome}" class="order-detail-image">
                <div class="order-detail-info">
                    <h3>${order.service_nome}</h3>
                    <p>Pedido #${order.id.toString().substring(0, 8)}</p>
                    <p>Data: ${new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    <p>Status: <span class="order-status status-${order.status}">${getStatusText(order.status)}</span></p>
                </div>
                <div class="order-detail-price">
                    R$ ${order.valor.toFixed(2)}
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h4 style="color: var(--primary-gold); margin-bottom: 0.75rem;">Descrição do Serviço</h4>
                <p style="color: #9ca3af;">${order.service_descricao || 'Sem descrição disponível.'}</p>
            </div>
            
            ${order.status === 'pending' && order.asaas_payment_url ? `
                <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <p style="color: #fbbf24; margin-bottom: 0.75rem;">
                        <i class="fas fa-clock"></i> Aguardando pagamento
                    </p>
                    <a href="${order.asaas_payment_url}" target="_blank" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-credit-card"></i> Pagar Agora
                    </a>
                </div>
            ` : ''}
            
            ${order.status === 'paid' ? `
                <button class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;" onclick="closeModal('orderDetailModal'); trackOrder('${order.id}')">
                    <i class="fas fa-tasks"></i> Acompanhar Pedido / Enviar Informações
                </button>
            ` : ''}
            
            <div class="form-actions" style="justify-content: center;">
                <button class="btn btn-secondary" onclick="closeModal('orderDetailModal')">Fechar</button>
            </div>
        `;
        
        openModal('orderDetailModal');
        
    } catch (error) {
        console.error('Error showing order detail:', error);
        showNotification('Erro ao carregar detalhes do pedido', 'error');
    }
}

// Track Order (Acompanhar Pedido - Formulário + Upload)
async function trackOrder(orderId) {
    currentTrackOrderId = orderId;
    openModal('trackOrderModal');
    
    const content = document.getElementById('trackOrderContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
    
    try {
        // Get order details with service info
        const { data: order, error } = await supabaseClient
            .from('pedidos')
            .select(`
                *,
                trabalhos(id, nome, descricao, icon_url, perguntas, requer_imagem),
                rituais(id, nome, descricao, icon_url, perguntas, requer_imagem)
            `)
            .eq('id', orderId)
            .eq('cliente_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        const service = order.trabalhos || order.rituais;
        const perguntas = service?.perguntas || [];
        const requerImagem = service?.requer_imagem || false;
        
        // Check if form already submitted
        const formSubmitted = order.form_data && Object.keys(order.form_data).length > 0;
        
        let html = `
            <div class="order-detail-header">
                <div class="order-detail-info" style="flex: 1;">
                    <h3>${service?.nome || 'Serviço'}</h3>
                    <p>Pedido #${order.id.toString().substring(0, 8)}</p>
                    <p>Status: <span class="order-status status-${order.status}">${getStatusText(order.status)}</span></p>
                </div>
                <div class="order-detail-price">
                    R$ ${order.valor.toFixed(2)}
                </div>
            </div>
        `;
        
        // Form Section
        if (perguntas.length > 0) {
            html += `
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: var(--primary-gold); margin-bottom: 1rem;">
                        <i class="fas fa-clipboard-list"></i> Informações Necessárias
                    </h4>
                    ${formSubmitted ? `
                        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 1rem; border-radius: 8px;">
                            <p style="color: #22c55e;"><i class="fas fa-check-circle"></i> Formulário já enviado em ${new Date(order.form_submitted_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div style="margin-top: 1rem;">
                            ${Object.entries(order.form_data).map(([key, value], index) => `
                                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
                                    <p style="color: var(--primary-gold); font-weight: 500; margin-bottom: 0.5rem;">${index + 1}. ${perguntas[parseInt(key.split('_')[1])] || key}</p>
                                    <p style="color: #d1d5db;">${value}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <form id="trackOrderForm">
                            ${perguntas.map((pergunta, index) => `
                                <div class="form-group">
                                    <label>${index + 1}. ${pergunta}</label>
                                    <textarea name="pergunta_${index}" rows="3" required
                                              placeholder="Digite sua resposta..."
                                              style="width: 100%; padding: 0.875rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: #fff; resize: vertical;">${order.form_data?.[`pergunta_${index}`] || ''}</textarea>
                                </div>
                            `).join('')}
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                <i class="fas fa-save"></i> Salvar Respostas
                            </button>
                        </form>
                    `}
                </div>
            `;
        }
        
        // Upload Section
        if (requerImagem || perguntas.length > 0) {
            html += `
                <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem;">
                    <h4 style="color: var(--primary-gold); margin-bottom: 1rem;">
                        <i class="fas fa-camera"></i> Fotos / Imagens
                    </h4>
                    <p style="color: #9ca3af; margin-bottom: 1rem;">Anexe fotos relacionadas ao seu pedido. Você pode enviar várias imagens.</p>
                    
                    <div class="file-upload-area" onclick="document.getElementById('orderFileInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Clique para selecionar fotos</p>
                        <small>ou arraste e solte aqui</small>
                        <input type="file" id="orderFileInput" multiple accept="image/*" style="display: none;" onchange="handleFileSelect(event)">
                    </div>
                    
                    <div id="uploadPreview" class="uploaded-files"></div>
                    
                    <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="uploadOrderFiles('${orderId}')">
                        <i class="fas fa-upload"></i> Enviar Fotos
                    </button>
                    
                    <div id="existingFiles" style="margin-top: 1.5rem;"></div>
                </div>
            `;
        }
        
        content.innerHTML = html;
        
        // Setup form submission if not submitted yet
        if (!formSubmitted && perguntas.length > 0) {
            const form = document.getElementById('trackOrderForm');
            if (form) {
                form.addEventListener('submit', handleTrackOrderSubmit);
            }
        }
        
        // Load existing files
        loadOrderFiles(orderId);
        
    } catch (error) {
        console.error('Error loading order track:', error);
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar pedido</h3>
                <p>Tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// Handle Track Order Form Submit
async function handleTrackOrderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const answers = {};
    
    for (let [key, value] of formData.entries()) {
        answers[key] = value;
    }
    
    try {
        const { error } = await supabaseClient
            .from('pedidos')
            .update({
                form_data: answers,
                form_submitted_at: new Date().toISOString()
            })
            .eq('id', currentTrackOrderId)
            .eq('cliente_id', currentUser.id);
        
        if (error) throw error;
        
        showNotification('Informações salvas com sucesso!', 'success');
        
        // Update form badge
        updateFormBadgeCount();
        
        // Reload to show submitted state
        trackOrder(currentTrackOrderId);
        
    } catch (error) {
        console.error('Error saving form:', error);
        showNotification('Erro ao salvar informações', 'error');
    }
}

// Handle File Select
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    uploadedFiles = [...uploadedFiles, ...files];
    renderUploadPreview();
}

// Render Upload Preview
function renderUploadPreview() {
    const preview = document.getElementById('uploadPreview');
    if (!preview) return;
    
    preview.innerHTML = uploadedFiles.map((file, index) => `
        <div class="uploaded-file">
            <img src="${URL.createObjectURL(file)}" alt="${file.name}">
            <button class="remove-file" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Remove File
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderUploadPreview();
}

// Upload Order Files
async function uploadOrderFiles(orderId) {
    if (uploadedFiles.length === 0) {
        showNotification('Selecione pelo menos uma foto', 'error');
        return;
    }
    
    try {
        const uploadPromises = uploadedFiles.map(async (file) => {
            const fileName = `order_${orderId}_${Date.now()}_${file.name}`;
            
            const { data, error } = await supabaseClient.storage
                .from('order_files')
                .upload(fileName, file);
            
            if (error) throw error;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('order_files')
                .getPublicUrl(fileName);
            
            // Save to pedido_files table
            await supabaseClient
                .from('pedido_files')
                .insert({
                    pedido_id: orderId,
                    cliente_id: currentUser.id,
                    file_name: file.name,
                    file_url: publicUrl,
                    file_size: file.size,
                    uploaded_at: new Date().toISOString()
                });
            
            return publicUrl;
        });
        
        await Promise.all(uploadPromises);
        
        showNotification('Fotos enviadas com sucesso!', 'success');
        uploadedFiles = [];
        renderUploadPreview();
        loadOrderFiles(orderId);
        
    } catch (error) {
        console.error('Error uploading files:', error);
        showNotification('Erro ao enviar fotos', 'error');
    }
}

// Load Order Files
async function loadOrderFiles(orderId) {
    try {
        const { data, error } = await supabaseClient
            .from('pedido_files')
            .select('*')
            .eq('pedido_id', orderId)
            .order('uploaded_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('existingFiles');
        if (!container) return;
        
        if (data && data.length > 0) {
            container.innerHTML = `
                <h5 style="color: var(--primary-gold); margin-bottom: 1rem;">Fotos Enviadas</h5>
                <div class="uploaded-files">
                    ${data.map(file => `
                        <div class="uploaded-file" style="cursor: pointer;" onclick="window.open('${file.file_url}', '_blank')">
                            <img src="${file.file_url}" alt="${file.file_name}">
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p style="color: #6b7280; text-align: center;">Nenhuma foto enviada ainda.</p>';
        }
        
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// Update Profile
async function updateProfile() {
    if (!currentUser) return;
    
    // Fill form with current data
    document.getElementById('profileNome').value = currentUser.nome || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileTelefone').value = currentUser.telefone || '';
    document.getElementById('profileSenha').value = '';
    
    openModal('profileModal');
}

// Handle Profile Submit
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const nome = document.getElementById('profileNome').value;
    const telefone = document.getElementById('profileTelefone').value;
    const senha = document.getElementById('profileSenha').value;
    
    try {
        const updateData = {
            nome,
            telefone,
            updated_at: new Date().toISOString()
        };
        
        // If password provided, hash and update
        if (senha) {
            updateData.password_hash = await hashPassword(senha);
        }
        
        const { error } = await supabaseClient
            .from('clientes')
            .update(updateData)
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Update local user data
        currentUser.nome = nome;
        currentUser.telefone = telefone;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI
        updateUserInterface();
        
        closeModal('profileModal');
        showNotification('Perfil atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Erro ao atualizar perfil', 'error');
    }
}

// Password hashing function
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'maegrazi-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Show Notification (reused from services-complete.js)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : 'linear-gradient(45deg, var(--primary-gold), var(--secondary-orange))'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions for global access
window.logout = logout;
window.viewAllOrders = viewAllOrders;
window.updateProfile = updateProfile;

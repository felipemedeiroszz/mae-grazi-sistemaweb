// Supabase Configuration
const SUPABASE_URL = 'https://neemeubleifwmryowqzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentUser = null;
let trabalhos = [];
let rituais = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkExistingSession();
    
    setupEventListeners();
    // Don't load services - this is login only page
});

// Check for existing session
function checkExistingSession() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        // User already logged in, redirect to dashboard
        window.location.href = 'cliente-dashboard.html';
        return;
    }
    
    // Auto-open login modal after a short delay
    setTimeout(() => {
        openLoginModal();
    }, 500);
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Load Services
async function loadServices() {
    await Promise.all([
        loadTrabalhos(),
        loadRituais()
    ]);
}

async function loadTrabalhos() {
    try {
        const { data, error } = await supabaseClient
            .from('trabalhos')
            .select('*')
            .eq('ativo', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        trabalhos = data || [];
        renderTrabalhos();
    } catch (error) {
        console.error('Erro ao carregar trabalhos:', error);
        renderError('.trabalhos-grid', 'Erro ao carregar trabalhos.');
    }
}

async function loadRituais() {
    try {
        const { data, error } = await supabaseClient
            .from('rituais')
            .select('*')
            .eq('ativo', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        rituais = data || [];
        renderRituais();
    } catch (error) {
        console.error('Erro ao carregar rituais:', error);
        renderError('.rituais-grid', 'Erro ao carregar rituais.');
    }
}

// Render Functions
function renderTrabalhos() {
    const container = document.querySelector('.trabalhos-grid');
    
    if (trabalhos.length === 0) {
        renderEmpty(container, 'Nenhum trabalho disponível no momento.');
        return;
    }
    
    container.innerHTML = trabalhos.map(trabalho => `
        <div class="service-card electric-border">
            <div class="service-icon">
                ${trabalho.icon_url ? 
                    `<img src="${trabalho.icon_url}" alt="${trabalho.nome}">` : 
                    '<i class="fas fa-briefcase"></i>'
                }
            </div>
            <div class="service-content">
                <h3>${trabalho.nome}</h3>
                <p>${trabalho.descricao}</p>
                <div class="service-price">R$ ${trabalho.valor.toFixed(2)}</div>
                <button class="btn btn-primary" onclick="openOrderModal('trabalho', '${trabalho.id}')">
                    <i class="fas fa-shopping-cart"></i> Solicitar
                </button>
            </div>
        </div>
    `).join('');
}

function renderRituais() {
    const container = document.querySelector('.rituais-grid');
    
    if (rituais.length === 0) {
        renderEmpty(container, 'Nenhum ritual disponível no momento.');
        return;
    }
    
    container.innerHTML = rituais.map(ritual => `
        <div class="service-card electric-border">
            <div class="service-icon">
                ${ritual.icon_url ? 
                    `<img src="${ritual.icon_url}" alt="${ritual.nome}">` : 
                    '<i class="fas fa-star"></i>'
                }
            </div>
            <div class="service-content">
                <h3>${ritual.nome}</h3>
                <p>${ritual.descricao}</p>
                <div class="service-price">R$ ${ritual.valor.toFixed(2)}</div>
                <button class="btn btn-primary" onclick="openOrderModal('ritual', '${ritual.id}')">
                    <i class="fas fa-shopping-cart"></i> Solicitar
                </button>
            </div>
        </div>
    `).join('');
}

function renderEmpty(container, message) {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>${message}</h3>
        </div>
    `;
}

function renderError(selector, message) {
    const container = document.querySelector(selector);
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
            </div>
        `;
    }
}

// Modal Functions
function openLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function openRegisterModal() {
    closeModal('loginModal');
    document.getElementById('registerModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (!email || !password) {
        showNotification('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        // Find client by email
        const { data: client, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !client) {
            throw new Error('Cliente não encontrado. Verifique seu email ou cadastre-se.');
        }
        
        // Verify password hash
        const inputPasswordHash = await hashPassword(password);
        if (client.password_hash !== inputPasswordHash) {
            throw new Error('Senha incorreta. Tente novamente.');
        }
        
        currentUser = client;
        
        // Save user session to localStorage
        localStorage.setItem('currentUser', JSON.stringify(client));
        
        updateUserInterface();
        closeModal('loginModal');
        
        showNotification('Login realizado com sucesso!', 'success');
        
        // Redirect to client dashboard
        setTimeout(() => {
            window.location.href = 'cliente-dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message, 'error');
    }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const nome = formData.get('nome');
    const email = formData.get('email');
    const telefone = formData.get('telefone');
    const password = formData.get('password');
    
    if (!nome || !email || !password) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    try {
        // Check if email already exists
        const { data: existingClient } = await supabaseClient
            .from('clientes')
            .select('email')
            .eq('email', email)
            .single();
        
        if (existingClient) {
            throw new Error('Este email já está cadastrado. Faça login.');
        }
        
        // Create new client
        const { data: newClient, error } = await supabaseClient
            .from('clientes')
            .insert({
                nome,
                email,
                telefone,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        showNotification('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
        closeModal('registerModal');
        openLoginModal();
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message, 'error');
    }
}

// Update User Interface
function updateUserInterface() {
    if (!currentUser) return;
    
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) {
        userInfo.style.display = 'block';
        userInfo.querySelector('span').textContent = `Olá, ${currentUser.nome}`;
    }
}

// Order Modal
function openOrderModal(type, serviceId) {
    if (!currentUser) {
        showNotification('Faça login para solicitar um serviço', 'info');
        openLoginModal();
        return;
    }
    
    const service = type === 'trabalho' ? 
        trabalhos.find(t => t.id === serviceId) : 
        rituais.find(r => r.id === serviceId);
    
    if (!service) return;
    
    const modal = document.getElementById('orderModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Solicitar ${type === 'trabalho' ? 'Trabalho' : 'Ritual'}</h3>
                <button class="modal-close" onclick="closeModal('orderModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="service-summary">
                    <h4>${service.nome}</h4>
                    <p>${service.descricao}</p>
                    <div class="price">R$ ${service.valor.toFixed(2)}</div>
                </div>
                
                <form id="orderForm">
                    <div class="form-group">
                        <label>Observações Adicionais</label>
                        <textarea name="observacoes" placeholder="Descreva detalhes adicionais sobre sua solicitação..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('orderModal')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-check"></i> Confirmar Solicitação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Setup order form
    document.getElementById('orderForm').addEventListener('submit', (e) => {
        handleOrderSubmit(e, type, serviceId);
    });
}

async function handleOrderSubmit(e, type, serviceId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const observacoes = formData.get('observacoes') || '';
    
    try {
        const orderData = {
            cliente_id: currentUser.id,
            status: 'pending',
            valor: type === 'trabalho' ? 
                trabalhos.find(t => t.id === serviceId).valor : 
                rituais.find(r => r.id === serviceId).valor,
            form_data: { observacoes },
            created_at: new Date().toISOString()
        };
        
        if (type === 'trabalho') {
            orderData.trabalho_id = serviceId;
        } else {
            orderData.ritual_id = serviceId;
        }
        
        const { data, error } = await supabaseClient
            .from('pedidos')
            .insert(orderData)
            .select()
            .single();
        
        if (error) throw error;
        
        showNotification('Solicitação realizada com sucesso!', 'success');
        closeModal('orderModal');
        
        // In production, you'd redirect to payment page
        // For now, just show success
        
    } catch (error) {
        console.error('Order error:', error);
        showNotification('Erro ao realizar solicitação. Tente novamente.', 'error');
    }
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Password hashing function
async function hashPassword(password) {
    // Simple hash function for demo (in production, use bcrypt or similar)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'maegrazi-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Export functions for global access
window.openLoginModal = openLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeModal = closeModal;
window.openOrderModal = openOrderModal;

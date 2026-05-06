// Supabase Configuration - using shared instance from services.js
// const supabase is already defined in services.js

// Global State - currentUser is shared from services.js
let isAuthenticated = false;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize App
async function initializeApp() {
    await checkAuthStatus();
    setupAuthListeners();
    updateUIForAuthStatus();
    setupSmoothScrolling();
}

// Setup Smooth Scrolling for Navigation
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// Check Authentication Status
async function checkAuthStatus() {
    try {
        // Using localStorage session instead of Supabase Auth
        const userData = localStorage.getItem('clienteSession');
        
        if (userData) {
            currentUser = JSON.parse(userData);
            isAuthenticated = true;
            console.log('User authenticated:', currentUser.email);
        } else {
            currentUser = null;
            isAuthenticated = false;
            console.log('No active session');
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        currentUser = null;
        isAuthenticated = false;
    }
}

// Setup Auth Listeners
function setupAuthListeners() {
    // Using localStorage session instead of Supabase Auth
    // No auth state listeners needed for localStorage sessions

    // Setup login form if exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Setup register form if exists
    const registerForm = document.getElementById('registrationForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
}

// Update UI based on auth status
function updateUIForAuthStatus() {
    // Update navigation
    updateNavigation();
    
    // Update service cards
    updateServiceCards();
    
    // Update user info displays
    updateUserInfoDisplays();
}

// Update Navigation
function updateNavigation() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;

    if (isAuthenticated) {
        // User is logged in - show user menu
        navContainer.innerHTML = `
            <ul class="nav-menu">
                <li><a href="#inicio" class="nav-link">INICIO</a></li>
                <li><a href="#trabalhos" class="nav-link">TRABALHOS</a></li>
                <li><a href="#rituais" class="nav-link">RITUAIS</a></li>
                <li><a href="#funciona" class="nav-link">FUNCIONA</a></li>
                <li class="nav-user-menu">
                    <a href="cliente.html" class="nav-link user-link">
                        <i class="fas fa-user mr-2"></i>
                        <span class="user-email">${currentUser?.email || 'Cliente'}</span>
                    </a>
                </li>
                <li><a href="#" onclick="logout()" class="nav-link logout-link">
                    <i class="fas fa-sign-out-alt mr-2"></i>Sair
                </a></li>
            </ul>
        `;
    } else {
        // User is not logged in - show login/register
        navContainer.innerHTML = `
            <ul class="nav-menu">
                <li><a href="#inicio" class="nav-link">INICIO</a></li>
                <li><a href="#trabalhos" class="nav-link">TRABALHOS</a></li>
                <li><a href="#rituais" class="nav-link">RITUAIS</a></li>
                <li><a href="#funciona" class="nav-link">FUNCIONA</a></li>
                <li><a href="cadastro.html" class="nav-link">
                    <i class="fas fa-user-plus mr-2"></i>Cadastrar
                </a></li>
                <li><a href="cliente.html" class="nav-link">
                    <i class="fas fa-sign-in-alt mr-2"></i>Entrar
                </a></li>
            </ul>
        `;
    }
}

// Update Service Cards
function updateServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card, .main-card');
    
    serviceCards.forEach(card => {
        const button = card.querySelector('button, .btn-primary, .btn-secondary');
        
        if (button) {
            if (isAuthenticated) {
                // User is logged in - enable purchase
                button.onclick = () => handleServicePurchase(card);
                button.classList.remove('disabled');
                button.disabled = false;
                
                if (button.textContent.includes('Cadastre-se')) {
                    button.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Solicitar Agora';
                }
            } else {
                // User is not logged in - redirect to registration
                button.onclick = () => {
                    if (confirm('Você precisa estar cadastrado para solicitar um serviço. Deseja cadastrar-se agora?')) {
                        window.location.href = 'cadastro.html';
                    }
                };
                button.classList.add('disabled');
                button.disabled = false;
                
                if (!button.textContent.includes('Cadastre-se')) {
                    button.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Cadastre-se para Comprar';
                }
            }
        }
    });
}

// Update User Info Displays
function updateUserInfoDisplays() {
    const userDisplays = document.querySelectorAll('#clientName, #userName, .user-email');
    
    userDisplays.forEach(display => {
        if (isAuthenticated && currentUser) {
            display.textContent = currentUser.user_metadata?.name || currentUser.email;
        } else {
            display.textContent = 'Visitante';
        }
    });
}

// Handle Service Purchase
function handleServicePurchase(card) {
    if (!isAuthenticated) {
        if (confirm('Você precisa estar cadastrado e logado para solicitar um serviço. Deseja fazer login agora?')) {
            window.location.href = 'cliente.html';
        }
        return;
    }

    // Get service details from card
    const serviceName = card.querySelector('h3, .service-name')?.textContent || 'Serviço';
    const servicePrice = card.querySelector('.price, .service-price')?.textContent || 'R$ 0,00';
    
    // Redirect to client dashboard for purchase (user is logged in)
    window.location.href = `cliente-dashboard.html?service=${encodeURIComponent(serviceName)}&price=${encodeURIComponent(servicePrice)}`;
}

// Login Handler - redirect to cliente.html for actual login
function handleLogin(e) {
    e.preventDefault();
    // Redirect to cliente.html for login functionality
    window.location.href = 'cliente.html';
}

// Registration Handler - redirect to cadastro.html for actual registration
function handleRegistration(e) {
    e.preventDefault();
    // Redirect to cadastro.html for registration functionality
    window.location.href = 'cadastro.html';
}

// Logout Handler
function logout() {
    try {
        // Clear localStorage session
        localStorage.removeItem('clienteSession');
        currentUser = null;
        isAuthenticated = false;
        
        showMessage('Logout realizado com sucesso!', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Erro ao fazer logout.', 'error');
    }
}

// Show Message
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style the message
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    if (type === 'success') {
        messageDiv.style.background = 'rgba(34, 197, 94, 0.1)';
        messageDiv.style.border = '1px solid rgba(34, 197, 94, 0.3)';
        messageDiv.style.color = '#22c55e';
    } else if (type === 'error') {
        messageDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        messageDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        messageDiv.style.color = '#ef4444';
    } else {
        messageDiv.style.background = 'rgba(59, 130, 246, 0.1)';
        messageDiv.style.border = '1px solid rgba(59, 130, 246, 0.3)';
        messageDiv.style.color = '#3b82f6';
    }
    
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Check URL parameters for service redirect
function checkServiceRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    const price = urlParams.get('price');
    
    if (service && price && isAuthenticated) {
        // Show service details modal or redirect to purchase
        console.log('Service redirect:', service, price);
        // You can implement service modal here
    }
}

// Check service redirect on load
checkServiceRedirect();

// Export functions for global access
window.appAuth = {
    login: handleLogin,
    register: handleRegistration,
    logout: logout,
    isAuthenticated: () => isAuthenticated,
    currentUser: () => currentUser
};

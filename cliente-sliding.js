// Supabase Configuration
const SUPABASE_URL = 'https://neemeubleifwmryowqzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkExistingSession();
    
    // Setup sliding panel controls
    setupSlidingPanel();
    
    // Setup form handlers
    setupFormHandlers();
});

// Check for existing session
function checkExistingSession() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        // User already logged in, redirect to dashboard
        window.location.href = 'cliente-dashboard.html';
        return;
    }
}

// Setup sliding panel controls
function setupSlidingPanel() {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');

    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
        });
    }
}

// Setup form handlers
function setupFormHandlers() {
    const signUpForm = document.getElementById('signUpForm');
    const signInForm = document.getElementById('signInForm');

    if (signUpForm) {
        signUpForm.addEventListener('submit', handleSignUp);
    }

    if (signInForm) {
        signInForm.addEventListener('submit', handleSignIn);
    }
}

// Handle Sign Up
async function handleSignUp(e) {
    e.preventDefault();
    
    hideAllMessages();
    
    const formData = new FormData(e.target);
    const nome = formData.get('nome');
    const email = formData.get('email');
    const whatsapp = formData.get('whatsapp');
    const cpf = formData.get('cpf');
    const password = formData.get('password');
    
    if (!nome || !email || !password || !cpf) {
        showMessage('signUpError', 'Preencha todos os campos obrigatórios');
        return;
    }
    
    // Validate CPF
    if (!isValidCPF(cpf)) {
        showMessage('signUpError', 'CPF inválido. Verifique os dígitos.');
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
            showMessage('signUpError', 'Este email já está cadastrado. Faça login.');
            return;
        }
        
        // Hash password
        const passwordHash = await hashPassword(password);
        
        // Create new client
        const { data: newClient, error } = await supabaseClient
            .from('clientes')
            .insert({
                nome,
                email,
                whatsapp,
                cpf: cpf.replace(/\D/g, ''), // Remove non-digits
                password_hash: passwordHash,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        showMessage('signUpSuccess', 'Cadastro realizado com sucesso!');
        
        // Clear form
        e.target.reset();
        
        // Switch to login panel after 2 seconds
        setTimeout(() => {
            document.getElementById('container').classList.remove("right-panel-active");
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('signUpError', error.message || 'Erro ao fazer cadastro. Tente novamente.');
    }
}

// Handle Sign In
async function handleSignIn(e) {
    e.preventDefault();
    
    hideAllMessages();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (!email || !password) {
        showMessage('signInError', 'Preencha todos os campos');
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
            showMessage('signInError', 'Cliente não encontrado. Verifique seu email ou cadastre-se.');
            return;
        }
        
        // Verify password hash
        const inputPasswordHash = await hashPassword(password);
        if (client.password_hash !== inputPasswordHash) {
            showMessage('signInError', 'Senha incorreta. Tente novamente.');
            return;
        }
        
        // Save user session
        currentUser = client;
        localStorage.setItem('currentUser', JSON.stringify(client));
        
        showMessage('signInSuccess', 'Login realizado com sucesso!');
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
            window.location.href = 'cliente-dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('signInError', error.message || 'Erro ao fazer login. Tente novamente.');
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

// Show message
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Hide all messages
function hideAllMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => {
        msg.style.display = 'none';
    });
}

// Export functions for global access
window.showMessage = showMessage;
window.hideAllMessages = hideAllMessages;

// CPF formatting
document.querySelector('input[name="cpf"]')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
    }
    
    e.target.value = value;
});

// CPF validation function
function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

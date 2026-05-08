// Supabase Configuration
const SUPABASE_URL = 'https://neemeubleifwmryowqzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Management
let isSubmitting = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    
    // Real-time validation
    document.getElementById('password').addEventListener('input', validatePassword);
    document.getElementById('confirmPassword').addEventListener('input', validatePasswordMatch);
    document.getElementById('email').addEventListener('blur', validateEmail);
}

// Registration Handler
async function handleRegistration(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    // Validation
    if (!validateForm(fullName, email, phone, cpf, password, confirmPassword, termsAccepted)) {
        return;
    }
    
    isSubmitting = true;
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Cadastrando...';
    submitBtn.disabled = true;
    
    try {
        // Check if user already exists
        const { data: existingUser } = await supabaseClient
            .from('clientes')
            .select('email')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            throw new Error('Este email já está cadastrado. Faça login para continuar.');
        }
        
        // Create user directly in database (without Supabase Auth)
        const passwordHash = await hashPassword(password);
        
        const { data: dbData, error: dbError } = await supabaseClient
            .from('clientes')
            .insert({
                nome: fullName,
                email: email,
                telefone: phone,
                cpf: cpf.replace(/\D/g, ''), // Remove non-digits
                password_hash: passwordHash,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (dbError) throw dbError;
        
        showSuccess('Cadastro realizado com sucesso! Você pode fazer login agora.');
        setTimeout(() => {
            window.location.href = 'cliente.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Ocorreu um erro ao fazer o cadastro. Tente novamente.');
    } finally {
        isSubmitting = false;
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Validation Functions
function validateForm(fullName, email, phone, cpf, password, confirmPassword, termsAccepted) {
    hideMessages();
    
    // Name validation
    if (!fullName || fullName.length < 3) {
        showError('Por favor, digite seu nome completo (mínimo 3 caracteres).');
        return false;
    }
    
    // Email validation
    if (!isValidEmail(email)) {
        showError('Por favor, digite um email válido.');
        return false;
    }
    
    // Phone validation
    if (!phone || phone.length < 10) {
        showError('Por favor, digite um telefone válido.');
        return false;
    }
    
    // CPF validation
    if (!cpf || cpf.length < 11) {
        showError('Por favor, digite um CPF válido.');
        return false;
    }
    
    if (!isValidCPF(cpf)) {
        showError('O CPF informado é inválido.');
        return false;
    }
    
    // Password validation
    if (password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres.');
        return false;
    }
    
    // Password match validation
    if (password !== confirmPassword) {
        showError('As senhas não coincidem.');
        return false;
    }
    
    // Terms validation
    if (!termsAccepted) {
        showError('Você precisa aceitar os termos de serviço para continuar.');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword() {
    const password = document.getElementById('password').value;
    const minLength = 6;
    
    if (password.length > 0 && password.length < minLength) {
        showError(`A senha deve ter pelo menos ${minLength} caracteres.`);
        return false;
    }
    
    hideMessages();
    return true;
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword.length > 0 && password !== confirmPassword) {
        showError('As senhas não coincidem.');
        return false;
    }
    
    hideMessages();
    return true;
}

async function validateEmail() {
    const email = document.getElementById('email').value.trim();
    
    if (email && !isValidEmail(email)) {
        showError('Por favor, digite um email válido.');
        return false;
    }
    
    // Check if email already exists
    if (email && isValidEmail(email)) {
        try {
            const { data: existingUser } = await supabaseClient
                .from('clientes')
                .select('email')
                .eq('email', email)
                .single();
            
            if (existingUser) {
                showError('Este email já está cadastrado. <a href="cliente.html" class="text-yellow-400 hover:text-yellow-300">Faça login aqui</a>.');
                return false;
            }
        } catch (error) {
            // User doesn't exist, which is good
        }
    }
    
    hideMessages();
    return true;
}

// Message Functions
function showSuccess(message) {
    hideMessages();
    const successDiv = document.getElementById('successMessage');
    successDiv.querySelector('span').textContent = message;
    successDiv.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        successDiv.classList.add('hidden');
    }, 5000);
}

function showError(message) {
    hideMessages();
    const errorDiv = document.getElementById('errorMessage');
    document.getElementById('errorText').innerHTML = message;
    errorDiv.classList.remove('hidden');
    
    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideMessages() {
    document.getElementById('successMessage').classList.add('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
}

// Phone formatting
document.getElementById('phone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        if (value.length <= 2) {
            value = `(${value}`;
        } else if (value.length <= 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length <= 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        }
    }
    
    e.target.value = value;
});

// Password strength indicator
document.getElementById('password')?.addEventListener('input', function(e) {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);
    
    // You can add visual feedback here if needed
    console.log('Password strength:', strength);
});

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return strength;
}

// Check if user is already logged in (simplified - no auth check needed)
async function checkAuthStatus() {
    // No auth check needed for direct database registration
    console.log('Cadastro page loaded');
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

// CPF formatting
document.getElementById('cpf')?.addEventListener('input', function(e) {
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
    // Remove non-digits
    cpf = cpf.replace(/\D/g, '');
    
    // Check length
    if (cpf.length !== 11) return false;
    
    // Check for known invalid CPFs (all same digit)
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    
    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Check auth status on load
checkAuthStatus();

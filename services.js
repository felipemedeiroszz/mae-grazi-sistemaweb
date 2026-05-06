// Supabase Configuration
const SUPABASE_URL = 'https://neemeubleifwmryowqzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TA2pFokj1WQJyIjTT_yyKw_tfuuS8k7';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Asaas Configuration
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = '$aact_YTU5YTE0M2N2NjIwNDMxYjAwNTU3NjU3ZDk1MzQ0MmQ0';

// Global State
let currentUser = null;
let currentService = null;
let cart = [];
let siteSettings = {};

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    checkAuth();
    await loadSiteSettings();
    await loadCart();
    setupEventListeners();
    setupRealtimeUpdates();
});

// Load Site Settings
async function loadSiteSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('site_settings')
            .select('*');
        
        if (error) {
            console.warn('Erro ao carregar configurações:', error);
            // Default: show both sections
            siteSettings = {
                trabalhos_enabled: 'true',
                rituais_enabled: 'true',
                trabalhos_title: 'TRABALHOS',
                rituais_title: 'RITUAIS'
            };
        } else {
            data.forEach(setting => {
                siteSettings[setting.chave] = setting.valor;
            });
        }
        
        // Update titles
        const trabalhosTitleEl = document.querySelector('.trabalhos-title');
        const rituaisTitleEl = document.querySelector('.rituais-title');
        
        if (trabalhosTitleEl && siteSettings.trabalhos_title) {
            trabalhosTitleEl.textContent = siteSettings.trabalhos_title;
        }
        if (rituaisTitleEl && siteSettings.rituais_title) {
            rituaisTitleEl.textContent = siteSettings.rituais_title;
        }
        
        // Load sections based on settings
        if (siteSettings.trabalhos_enabled !== 'false') {
            loadTrabalhos();
        } else {
            hideSection('trabalhos');
        }
        
        if (siteSettings.rituais_enabled !== 'false') {
            loadRituais();
        } else {
            hideSection('rituais');
        }
        
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        // Load all sections by default
        loadTrabalhos();
        loadRituais();
    }
}

function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
    }
}

// Authentication
async function checkAuth() {
    try {
        // Check for stored session
        const storedUser = localStorage.getItem('clienteSession');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    
    if (currentUser && loginBtn && userInfo) {
        loginBtn.style.display = 'none';
        userInfo.innerHTML = `
            <span>Bem-vindo, ${currentUser.nome}</span>
            <button onclick="logout()" class="btn btn-secondary">Sair</button>
        `;
        userInfo.style.display = 'flex';
    }
}

async function login(email, password) {
    try {
        // Buscar cliente no banco
        const { data: cliente, error } = await supabaseClient
            .from('clientes')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !cliente) {
            throw new Error('Cliente não encontrado');
        }
        
        // Verificar senha (implementar verificação adequada)
        // Por enquanto, vamos aceitar qualquer senha para testes
        currentUser = cliente;
        localStorage.setItem('clienteSession', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        closeModal('loginModal');
        
        return true;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login: ' + error.message);
        return false;
    }
}

async function register(nome, email, password, telefone) {
    try {
        // Verificar se email já existe
        const { data: existing } = await supabaseClient
            .from('clientes')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existing) {
            throw new Error('Email já cadastrado');
        }
        
        // Criar novo cliente
        const { data: cliente, error } = await supabaseClient
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
        
        currentUser = cliente;
        localStorage.setItem('clienteSession', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        closeModal('registerModal');
        
        return true;
    } catch (error) {
        console.error('Erro ao registrar:', error);
        alert('Erro ao registrar: ' + error.message);
        return false;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('clienteSession');
    location.reload();
}

// Global state for categories
let trabalhosCategorias = [];
let rituaisCategorias = [];
let currentTrabalhosFilter = 'all';
let currentRituaisFilter = 'all';

// Load Services with Categories
async function loadTrabalhos() {
    try {
        // Load trabalhos
        const { data: trabalhos, error: trabalhosError } = await supabaseClient
            .from('trabalhos')
            .select('*')
            .eq('ativo', true)
            .order('created_at', { ascending: false });
        
        if (trabalhosError) throw trabalhosError;
        
        // Load categorias for trabalhos
        const { data: categorias, error: catError } = await supabaseClient
            .from('categorias')
            .select('*')
            .eq('tipo', 'trabalho')
            .eq('ativo', true)
            .order('ordem', { ascending: true });
        
        if (catError) {
            console.warn('Categorias não carregadas:', catError);
            trabalhosCategorias = [];
        } else {
            trabalhosCategorias = categorias || [];
        }
        
        const container = document.querySelector('.trabalhos-container');
        if (!container) return;
        
        // Update container structure
        renderServicesSection(container, trabalhos || [], trabalhosCategorias, 'trabalho');
        
    } catch (error) {
        console.error('Erro ao carregar trabalhos:', error);
        showErrorGrid('cards-grid', 'Não foi possível carregar os trabalhos.');
    }
}

async function loadRituais() {
    try {
        // Load rituais
        const { data: rituais, error: rituaisError } = await supabaseClient
            .from('rituais')
            .select('*')
            .eq('ativo', true)
            .order('created_at', { ascending: false });
        
        if (rituaisError) throw rituaisError;
        
        // Load categorias for rituais
        const { data: categorias, error: catError } = await supabaseClient
            .from('categorias')
            .select('*')
            .eq('tipo', 'ritual')
            .eq('ativo', true)
            .order('ordem', { ascending: true });
        
        if (catError) {
            console.warn('Categorias não carregadas:', catError);
            rituaisCategorias = [];
        } else {
            rituaisCategorias = categorias || [];
        }
        
        const container = document.querySelector('.rituais-container');
        if (!container) return;
        
        // Update container structure
        renderServicesSection(container, rituais || [], rituaisCategorias, 'ritual');
        
    } catch (error) {
        console.error('Erro ao carregar rituais:', error);
        showErrorGrid('cards-grid-rituais', 'Não foi possível carregar os rituais.');
    }
}

// Render services section with category filters and grouping
function renderServicesSection(container, services, categorias, type) {
    const typeTitle = type === 'trabalho'
        ? (siteSettings.trabalhos_title || 'TRABALHOS')
        : (siteSettings.rituais_title || 'RITUAIS');
    const filterId = type === 'trabalho' ? 'trabalhosFilter' : 'rituaisFilter';
    const gridId = type === 'trabalho' ? 'cards-grid' : 'cards-grid-rituais';
    const mobileFilterId = type === 'trabalho' ? 'mobileTrabalhosFilter' : 'mobileRituaisFilter';

    // Build category filter buttons for desktop
    const filterButtons = categorias.map(cat => `
        <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}"
                data-category="${cat.id}"
                onclick="filterServices('${type}', '${cat.id}')"
                style="
                    background: ${cat.cor || '#8B0000'};
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
            ${cat.nome}
        </button>
    `).join('');

    // Add "All" button
    const allButton = `
        <button class="filter-btn active"
                data-category="all"
                onclick="filterServices('${type}', 'all')"
                style="
                    background: linear-gradient(135deg, #ff1a1a, #8B0000);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
            <i class="fas fa-th"></i> Todos
        </button>
    `;

    // Build mobile filter options
    const mobileFilterOptions = categorias.map(cat => `
        <button class="mobile-filter-option"
                data-category="${cat.id}"
                onclick="filterServicesMobile('${type}', '${cat.id}', '${mobileFilterId}')"
                style="
                    background: ${cat.cor || '#8B0000'};
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    width: 100%;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
            <span style="width: 12px; height: 12px; border-radius: 50%; background: white; opacity: 0.7;"></span>
            ${cat.nome}
        </button>
    `).join('');

    container.innerHTML = `
        <h2 class="${type === 'trabalho' ? 'trabalhos-title' : 'rituais-title'}">${typeTitle}</h2>

        <!-- Desktop Category Filter -->
        <div id="${filterId}" class="desktop-filter" style="
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
            margin-bottom: 2rem;
            padding: 0 1rem;
        ">
            ${allButton}
            ${filterButtons}
        </div>

        <!-- Filter Button & Dropdown (Mobile & Desktop) -->
        <div class="mobile-filter-container" style="
            display: block;
            position: relative;
            margin-bottom: 1rem;
            padding: 0 15px;
            max-width: 300px;
            margin-left: auto;
            margin-right: auto;
        ">
            <button class="mobile-filter-toggle"
                    onclick="toggleMobileFilter('${mobileFilterId}')"
                    style="
                        width: 100%;
                        padding: 8px 16px;
                        background: linear-gradient(135deg, #ff1a1a, #8B0000);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                <span><i class="fas fa-filter"></i> Filtrar Categorias</span>
                <i class="fas fa-chevron-down" id="${mobileFilterId}Icon"></i>
            </button>
            <div id="${mobileFilterId}"
                 class="mobile-filter-dropdown"
                 style="
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 15px;
                    right: 15px;
                    background: rgba(10, 10, 10, 0.98);
                    border: 1px solid rgba(139, 0, 0, 0.5);
                    border-radius: 12px;
                    padding: 10px;
                    margin-top: 8px;
                    z-index: 100;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    max-height: 300px;
                    overflow-y: auto;
                ">
                <button class="mobile-filter-option active"
                        data-category="all"
                        onclick="filterServicesMobile('${type}', 'all', '${mobileFilterId}')"
                        style="
                            background: linear-gradient(135deg, #ff1a1a, #8B0000);
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 0.9rem;
                            font-weight: 500;
                            width: 100%;
                            text-align: left;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            margin-bottom: 5px;
                        ">
                    <i class="fas fa-th"></i> Todos
                </button>
                ${mobileFilterOptions}
            </div>
        </div>

        <!-- Services by Category -->
        <div id="${gridId}" class="${gridId}" style="
            display: flex;
            flex-direction: column;
            gap: 3rem;
        ">
            <!-- Services will be grouped here -->
        </div>
    `;

    // Render grouped services
    renderGroupedServices(services, categorias, type, 'all');
}

// Toggle mobile filter dropdown
function toggleMobileFilter(filterId) {
    const dropdown = document.getElementById(filterId);
    const icon = document.getElementById(filterId + 'Icon');

    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        dropdown.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

// Filter services from mobile dropdown
async function filterServicesMobile(type, categoryId, mobileFilterId) {
    // Close dropdown
    const dropdown = document.getElementById(mobileFilterId);
    const icon = document.getElementById(mobileFilterId + 'Icon');
    if (dropdown) dropdown.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';

    // Update button text
    const toggleBtn = dropdown?.previousElementSibling;
    if (toggleBtn) {
        const selectedText = categoryId === 'all' ? 'Todos' :
            (type === 'trabalho' ? trabalhosCategorias : rituaisCategorias).find(c => c.id === categoryId)?.nome || 'Filtrar';
        toggleBtn.querySelector('span').innerHTML = `<i class="fas fa-filter"></i> ${selectedText}`;
    }

    // Call main filter function
    await filterServices(type, categoryId);
}

// Filter services by category
async function filterServices(type, categoryId) {
    // Update active button
    const filterId = type === 'trabalho' ? 'trabalhosFilter' : 'rituaisFilter';
    const buttons = document.querySelectorAll(`#${filterId} .filter-btn`);
    buttons.forEach(btn => {
        if (btn.dataset.category === categoryId) {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 4px 15px rgba(255, 26, 26, 0.5)';
        } else {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }
    });
    
    // Update current filter
    if (type === 'trabalho') {
        currentTrabalhosFilter = categoryId;
    } else {
        currentRituaisFilter = categoryId;
    }
    
    // Reload services with filter
    try {
        let query = supabaseClient
            .from(type === 'trabalho' ? 'trabalhos' : 'rituais')
            .select('*')
            .eq('ativo', true);
        
        if (categoryId !== 'all') {
            query = query.eq('categoria_id', categoryId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const categorias = type === 'trabalho' ? trabalhosCategorias : rituaisCategorias;
        renderGroupedServices(data || [], categorias, type, categoryId);
        
    } catch (error) {
        console.error('Erro ao filtrar serviços:', error);
    }
}

// Render services grouped by category
function renderGroupedServices(services, categorias, type, filter) {
    const gridId = type === 'trabalho' ? 'cards-grid' : 'cards-grid-rituais';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    if (services.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem; color: #888;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Nenhum ${type === 'trabalho' ? 'trabalho' : 'ritual'} disponível nesta categoria.</p>
            </div>
        `;
        return;
    }
    
    if (filter !== 'all') {
        // Show single category without grouping
        const cat = categorias.find(c => c.id === filter);
        grid.innerHTML = `
            <div class="category-group">
                <div class="category-cards">
                    ${services.map(s => createServiceCardHTML(s, type)).join('')}
                </div>
            </div>
        `;
    } else {
        // Group by category
        const servicesByCategory = {};
        
        // Initialize with empty arrays for all categories
        categorias.forEach(cat => {
            servicesByCategory[cat.id] = { categoria: cat, servicos: [] };
        });
        
        // Add an "Sem Categoria" group
        servicesByCategory['sem_categoria'] = { 
            categoria: { id: 'sem_categoria', nome: 'Sem Categoria', cor: '#666' }, 
            servicos: [] 
        };
        
        // Distribute services
        services.forEach(s => {
            if (s.categoria_id && servicesByCategory[s.categoria_id]) {
                servicesByCategory[s.categoria_id].servicos.push(s);
            } else {
                servicesByCategory['sem_categoria'].servicos.push(s);
            }
        });
        
        // Render groups
        grid.innerHTML = Object.values(servicesByCategory)
            .filter(group => group.servicos.length > 0)
            .map(group => `
                <div class="category-group" style="
                    background: rgba(0,0,0,0.2);
                    border-radius: 16px;
                    padding: 1.5rem;
                    border-left: 4px solid ${group.categoria.cor || '#8B0000'};
                ">
                    <h3 style="
                        color: ${group.categoria.cor || '#ff1a1a'};
                        margin-bottom: 1.5rem;
                        font-size: 1.3rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    ">
                        <span style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            background: ${group.categoria.cor || '#8B0000'};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 0.9rem;
                        ">${group.categoria.nome.charAt(0).toUpperCase()}</span>
                        ${group.categoria.nome}
                        <span style="
                            font-size: 0.8rem;
                            color: #888;
                            margin-left: auto;
                        ">(${group.servicos.length})</span>
                    </h3>
                    <div class="category-cards">
                        ${group.servicos.map(s => createServiceCardHTML(s, type)).join('')}
                    </div>
                </div>
            `).join('');
    }
    
    // Animate cards
    animateCards(grid.querySelectorAll('.main-card'));
}

// Create service card HTML string
function createServiceCardHTML(service, type) {
    const priceFormatted = service.valor.toFixed(2).replace('.', ',');
    const integerPart = Math.floor(service.valor);
    const decimalPart = (service.valor % 1).toFixed(2).substring(2);
    
    return `
        <div class="card-container service-card-style" data-service-id="${service.id}">
            <div class="imgBox">
                ${service.icon_url ? `<img src="${service.icon_url}" alt="${service.nome}">` : '<div style="height: 80px; display: flex; align-items: center; justify-content: center; color: #8B0000; font-size: 2rem;"><i class="fas fa-fire"></i></div>'}
            </div>
            <div class="contentBox">
                <h3>${service.nome}</h3>
                <p class="card-description">${service.descricao.substring(0, 120)}${service.descricao.length > 120 ? '...' : ''}</p>
                <h2 class="price"><span>R$</span>${integerPart}<small>,${decimalPart}</small></h2>
                <button type="button" onclick="openOrderModal('${type}', '${service.id}')" class="buy">Adicionar</button>
            </div>
        </div>
    `;
}

function createServiceCard(service, type) {
    const card = document.createElement('div');
    card.className = 'card-container service-card-style';

    const integerPart = Math.floor(service.valor);
    const decimalPart = (service.valor % 1).toFixed(2).substring(2);

    card.innerHTML = `
        <div class="imgBox">
            ${service.icon_url ? `<img src="${service.icon_url}" alt="${service.nome}">` : '<div style="height: 80px; display: flex; align-items: center; justify-content: center; color: #8B0000; font-size: 2rem;"><i class="fas fa-fire"></i></div>'}
        </div>
        <div class="contentBox">
            <h3>${service.nome}</h3>
            <p class="card-description">${service.descricao.substring(0, 120)}${service.descricao.length > 120 ? '...' : ''}</p>
            <h2 class="price"><span>R$</span>${integerPart}<small>,${decimalPart}</small></h2>
            <button type="button" onclick="openOrderModal('${type}', '${service.id}')" class="buy">Adicionar</button>
        </div>
    `;

    return card;
}

function showErrorGrid(gridClass, message) {
    const grid = document.querySelector('.' + gridClass);
    if (grid) {
        grid.innerHTML = `<div class="error-state">${message}</div>`;
    }
}

function animateCards(cards) {
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Order Management
async function openOrderModal(type, serviceId) {
    if (!currentUser) {
        openLoginModal();
        return;
    }
    
    try {
        // Buscar dados do serviço
        const table = type === 'trabalho' ? 'trabalhos' : 'rituais';
        const { data: service, error } = await supabaseClient
            .from(table)
            .select('*')
            .eq('id', serviceId)
            .single();
        
        if (error) throw error;
        
        currentService = { ...service, type };
        
        // Abrir modal com formulário
        const modal = document.getElementById('orderModal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Solicitar ${service.nome}</h3>
                    <button class="modal-close" onclick="closeOrderModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="service-summary">
                        <h4>${service.nome}</h4>
                        <p>${service.descricao}</p>
                        <div class="price">R$ ${service.valor.toFixed(2)}</div>
                    </div>
                    
                    <form id="orderForm">
                        <div class="form-group">
                            <label>Informações Adicionais</label>
                            <textarea id="additionalInfo" placeholder="Descreva sua necessidade..."></textarea>
                        </div>
                        
                        ${service.perguntas && service.perguntas.length > 0 ? generateQuestions(service.perguntas) : ''}
                        
                        <div class="form-group">
                            <label>Arquivos (opcional)</label>
                            <input type="file" id="orderFiles" multiple accept="image/*,.pdf,.doc,.docx">
                            <small>Envie fotos ou documentos que possam ajudar</small>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeOrderModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Continuar para Pagamento</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Adicionar event listener
        document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
        
    } catch (error) {
        console.error('Erro ao abrir modal de pedido:', error);
        alert('Erro ao carregar serviço. Tente novamente.');
    }
}

function generateQuestions(perguntas) {
    if (!perguntas || !Array.isArray(perguntas)) return '';
    
    return perguntas.map((pergunta, index) => `
        <div class="form-group">
            <label>${pergunta}</label>
            <input type="text" name="pergunta_${index}" placeholder="Responda aqui..." required>
        </div>
    `).join('');
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    if (!currentUser || !currentService) {
        alert('Erro: usuário ou serviço não identificado');
        return;
    }
    
    try {
        const formData = new FormData(e.target);
        const additionalInfo = formData.get('additionalInfo') || '';
        const files = document.getElementById('orderFiles').files;
        
        // Coletar respostas das perguntas
        const perguntas = {};
        const inputs = e.target.querySelectorAll('input[name^="pergunta_"]');
        inputs.forEach(input => {
            perguntas[input.name] = input.value;
        });
        
        // Criar pedido no banco
        const pedidoData = {
            cliente_id: currentUser.id,
            [currentService.type === 'trabalho' ? 'trabalho_id' : 'ritual_id']: currentService.id,
            valor: currentService.valor,
            status: 'pending',
            form_data: {
                additionalInfo,
                perguntas
            },
            form_submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        const { data: pedido, error } = await supabaseClient
            .from('pedidos')
            .insert(pedidoData)
            .select()
            .single();
        
        if (error) throw error;
        
        // Fazer upload dos arquivos se houver
        if (files.length > 0) {
            await uploadOrderFiles(pedido.id, files);
        }
        
        // Criar pagamento no Asaas
        const paymentData = await createAsaasPayment(pedido);
        
        // Redirecionar para pagamento
        if (paymentData && paymentData.paymentUrl) {
            window.open(paymentData.paymentUrl, '_blank');
        }
        
        closeOrderModal();
        alert('Pedido criado com sucesso! Você será redirecionado para o pagamento.');
        
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        alert('Erro ao criar pedido: ' + error.message);
    }
}

async function uploadOrderFiles(pedidoId, files) {
    const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileName = `pedido_${pedidoId}_${index}_${file.name}`;
        
        const { data, error } = await supabaseClient.storage
            .from('order_files')
            .upload(fileName, file);
        
        if (error) throw error;
        
        // Salvar referência do arquivo no banco
        await supabaseClient
            .from('pedido_files')
            .insert({
                pedido_id: pedidoId,
                file_name: fileName,
                original_name: file.name,
                file_size: file.size,
                content_type: file.type,
                created_at: new Date().toISOString()
            });
        
        return data;
    });
    
    await Promise.all(uploadPromises);
}

// Asaas Integration
async function createAsaasPayment(pedido) {
    try {
        const customerData = await createAsaasCustomer();
        if (!customerData) return null;
        
        const paymentPayload = {
            customer: customerData.id,
            billingType: 'UNDEFINED',
            value: pedido.valor,
            dueDate: new Date().toISOString().split('T')[0],
            description: `${currentService.type === 'trabalho' ? 'Trabalho' : 'Ritual'}: ${currentService.nome}`,
            externalReference: pedido.id,
            callbackUrl: `${window.location.origin}/payment-callback`,
            successUrl: `${window.location.origin}/payment-success`,
            pendingPaymentUrl: `${window.location.origin}/payment-pending`
        };
        
        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify(paymentPayload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro ao criar pagamento');
        }
        
        // Atualizar pedido com dados do Asaas
        await supabaseClient
            .from('pedidos')
            .update({
                asaas_payment_id: data.id,
                asaas_payment_url: data.invoiceUrl || data.paymentUrl
            })
            .eq('id', pedido.id);
        
        return data;
        
    } catch (error) {
        console.error('Erro ao criar pagamento Asaas:', error);
        return null;
    }
}

async function createAsaasCustomer() {
    try {
        // Verificar se cliente já existe no Asaas
        const existingCustomer = await findAsaasCustomer();
        if (existingCustomer) return existingCustomer;
        
        // Criar novo cliente no Asaas
        const customerPayload = {
            name: currentUser.nome,
            email: currentUser.email,
            phone: currentUser.telefone || '',
            cpfCnpj: '', // Opcional
            notificationDisabled: false,
            observations: 'Cliente gerado automaticamente',
            address: null // Opcional
        };
        
        const response = await fetch(`${ASAAS_API_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify(customerPayload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro ao criar cliente');
        }
        
        return data;
        
    } catch (error) {
        console.error('Erro ao criar cliente Asaas:', error);
        return null;
    }
}

async function findAsaasCustomer() {
    try {
        const response = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(currentUser.email)}`, {
            headers: {
                'access_token': ASAAS_API_KEY
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.data && data.data.length > 0) {
            return data.data[0];
        }
        
        return null;
        
    } catch (error) {
        console.error('Erro ao buscar cliente Asaas:', error);
        return null;
    }
}

// UI Functions
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.add('active');
}

function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
    currentService = null;
}

// Event Listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            await login(email, password);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = e.target.nome.value;
            const email = e.target.email.value;
            const password = e.target.password.value;
            const telefone = e.target.telefone.value;
            await register(nome, email, password, telefone);
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Realtime Updates
function setupRealtimeUpdates() {
    try {
        // Subscribe to site_settings changes
        const subscription = supabaseClient
            .channel('site_settings_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'site_settings' }, 
                (payload) => {
                    console.log('Site settings updated:', payload);
                    
                    // Update the changed setting
                    if (payload.new && payload.new.chave) {
                        siteSettings[payload.new.chave] = payload.new.valor;
                        
                        // Handle specific settings
                        if (payload.new.chave === 'trabalhos_title') {
                            const el = document.querySelector('.trabalhos-title');
                            if (el) el.textContent = payload.new.valor;
                        }
                        if (payload.new.chave === 'rituais_title') {
                            const el = document.querySelector('.rituais-title');
                            if (el) el.textContent = payload.new.valor;
                        }
                        if (payload.new.chave === 'trabalhos_enabled') {
                            const section = document.getElementById('trabalhos');
                            if (section) {
                                section.style.display = payload.new.valor === 'false' ? 'none' : 'block';
                                if (payload.new.valor !== 'false') loadTrabalhos();
                            }
                        }
                        if (payload.new.chave === 'rituais_enabled') {
                            const section = document.getElementById('rituais');
                            if (section) {
                                section.style.display = payload.new.valor === 'false' ? 'none' : 'block';
                                if (payload.new.valor !== 'false') loadRituais();
                            }
                        }
                        
                        // Show notification
                        showNotification('Configuração do site atualizada!', 'info');
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });
            
        console.log('Realtime updates enabled for site_settings');
    } catch (error) {
        console.warn('Realtime subscription failed:', error);
    }
}

// Utility Functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ==================== CART & CHECKOUT SYSTEM ====================

// Global cart state (cart já declarado na linha 13)
let currentCheckoutItems = [];

// Load cart from server or localStorage
async function loadCart() {
    if (!currentUser) {
        cart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        updateCartUI();
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('cart_items')
            .select('*')
            .eq('cliente_id', currentUser.id);
        
        if (error) throw error;
        
        cart = data || [];
        updateCartUI();
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
    }
}

// Add item to cart
async function addToCart(type, serviceId, nome, valor) {
    if (!currentUser) {
        // Guest cart in localStorage
        const existingIndex = cart.findIndex(item => item.tipo === type && item.servico_id === serviceId);
        
        if (existingIndex >= 0) {
            cart[existingIndex].quantidade += 1;
        } else {
            cart.push({
                tipo: type,
                servico_id: serviceId,
                nome: nome,
                valor: valor,
                quantidade: 1
            });
        }
        
        localStorage.setItem('guestCart', JSON.stringify(cart));
        updateCartUI();
        showNotification('Item adicionado ao carrinho!', 'success');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('cart_items')
            .upsert({
                cliente_id: currentUser.id,
                tipo: type,
                servico_id: serviceId,
                nome: nome,
                valor: valor,
                quantidade: 1
            }, { onConflict: ['cliente_id', 'tipo', 'servico_id'] });
        
        if (error) throw error;
        
        await loadCart();
        showNotification('Item adicionado ao carrinho!', 'success');
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        showNotification('Erro ao adicionar ao carrinho', 'error');
    }
}

// Remove item from cart
async function removeFromCart(cartItemId) {
    if (!currentUser) {
        cart = cart.filter(item => item.servico_id !== cartItemId);
        localStorage.setItem('guestCart', JSON.stringify(cart));
        updateCartUI();
        openCartModal(); // Refresh modal
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);
        
        if (error) throw error;
        
        await loadCart();
        openCartModal(); // Refresh modal
    } catch (error) {
        console.error('Erro ao remover do carrinho:', error);
    }
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantidade, 0);
    const totalValue = cart.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);
    
    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = `R$ ${totalValue.toFixed(2)}`;
}

// Open cart modal
function openCartModal() {
    const modal = document.getElementById('cartModal');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalValue = document.getElementById('cartTotalValue');
    
    if (!cart.length) {
        cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #888;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Seu carrinho está vazio</p>
                <button onclick="closeCartModal()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #8B0000; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Continuar Comprando
                </button>
            </div>
        `;
        if (cartTotalValue) cartTotalValue.textContent = 'R$ 0,00';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 12px; margin-bottom: 0.75rem; border: 1px solid rgba(139, 0, 0, 0.3);">
                <div style="flex: 1;">
                    <div style="color: #fff; font-weight: 600;">${item.nome}</div>
                    <div style="color: #888; font-size: 0.85rem;">${item.tipo === 'trabalho' ? 'Trabalho' : 'Ritual'} • Qtd: ${item.quantidade}</div>
                </div>
                <div style="color: #ff1a1a; font-weight: 700;">
                    R$ ${(item.valor * item.quantidade).toFixed(2)}
                </div>
                <button onclick="removeFromCart('${item.id || item.servico_id}')" style="background: transparent; border: none; color: #ff4444; cursor: pointer; padding: 0.5rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        const totalValue = cart.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);
        if (cartTotalValue) cartTotalValue.textContent = `R$ ${totalValue.toFixed(2)}`;
    }
    
    modal.style.display = 'flex';
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'none';
}

// Open checkout modal
function openCheckoutModal() {
    if (!cart.length) {
        showNotification('Seu carrinho está vazio!', 'warning');
        return;
    }
    
    closeCartModal();
    
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    currentCheckoutItems = [...cart];
    
    checkoutItems.innerHTML = cart.map((item, index) => `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 0.5rem;">
            <span>${item.nome} x${item.quantidade}</span>
            <span style="color: #ff1a1a; font-weight: 600;">R$ ${(item.valor * item.quantidade).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);
    checkoutTotal.textContent = `R$ ${total.toFixed(2)}`;
    
    modal.style.display = 'flex';
    document.getElementById('paymentMethods').style.display = 'block';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'none';
    
    // Hide payment forms
    document.getElementById('pixPaymentSection').style.display = 'none';
    document.getElementById('cardPaymentSection').style.display = 'none';
}

// Backend API URL
const BACKEND_URL = 'http://localhost:3001';

// Generate PIX payment via Backend API
async function generatePixPayment() {
    console.log('=================================');
    console.log('generatePixPayment called!');
    console.log('=================================');
    console.log('currentUser:', currentUser);
    console.log('cart:', cart);
    console.log('cart length:', cart ? cart.length : 0);
    
    // Alert for debugging (remove in production)
    // alert('PIX button clicked! Check console (F12) for details');

    if (!currentUser) {
        console.log('No user logged in');
        showNotification('Faça login para continuar', 'warning');
        openLoginModal();
        return;
    }

    if (!cart || cart.length === 0) {
        console.log('Cart is empty');
        showNotification('Seu carrinho está vazio!', 'warning');
        return;
    }

    const btn = document.getElementById('generatePixBtn');
    if (!btn) {
        console.error('Button generatePixBtn not found');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

    try {
        const totalValue = cart.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);
        console.log('Total value:', totalValue);

        // Create order first
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                cliente_id: currentUser.id,
                valor_total: totalValue,
                status: 'pending',
                metodo_pagamento: 'pix'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Add order items
        const orderItems = cart.map(item => ({
            order_id: order.id,
            tipo: item.tipo,
            servico_id: item.servico_id,
            nome: item.nome,
            valor_unitario: item.valor,
            quantidade: item.quantidade,
            valor_total: item.valor * item.quantidade
        }));

        const { error: itemsError } = await supabaseClient
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // Create PIX payment via backend
        console.log('Calling backend API:', `${BACKEND_URL}/api/payments/pix`);

        let response;
        try {
            response = await fetch(`${BACKEND_URL}/api/payments/pix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerData: {
                        name: currentUser.nome || currentUser.email.split('@')[0],
                        email: currentUser.email,
                        cpfCnpj: currentUser.cpf || '00000000000',
                        phone: currentUser.telefone || currentUser.whatsapp || ''
                    },
                    value: totalValue,
                    description: `Pedido ${order.id.slice(0, 8)} - Mae Grazi`,
                    externalReference: order.id
                })
            });
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            throw new Error('Não foi possível conectar ao servidor de pagamentos. Verifique se o backend está rodando em http://localhost:3001');
        }

        console.log('Backend response status:', response.status);
        const data = await response.json();
        console.log('Backend response data:', data);

        if (!data.success) {
            throw new Error(data.error || 'Erro ao gerar PIX');
        }

        // Update order with ASAAS payment ID
        await supabaseClient
            .from('orders')
            .update({
                asaas_payment_id: data.payment.id,
                asaas_pix_qr_code: data.pix.invoiceUrl,
                asaas_pix_payload: data.pix.payload
            })
            .eq('id', order.id);

        // Show PIX QR code with enhanced modal
        showPixSection(data.pix, data.payment.id, order.id);

        // Clear cart
        await clearCart();

        // Start payment status check via backend
        startPaymentStatusCheck(order.id, data.payment.id);

    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        console.error('Error stack:', error.stack);
        showNotification(error.message || 'Erro ao gerar PIX. Verifique o console (F12) para mais detalhes.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-qrcode"></i> Pagar com PIX';
        }
    }
}

// Show PIX payment section with enhanced modal
function showPixSection(pixData, paymentId, orderId) {
    document.getElementById('paymentMethods').style.display = 'none';
    const pixSection = document.getElementById('pixPaymentSection');
    pixSection.style.display = 'block';

    // Store payment ID for status checking
    pixSection.dataset.paymentId = paymentId;
    pixSection.dataset.orderId = orderId;

    const qrCodeImg = document.getElementById('pixQrCode');
    const pixPayload = document.getElementById('pixPayload');
    const pixExpiry = document.getElementById('pixExpiry');

    // Use QR code from ASAAS
    if (pixData.encodedImage) {
        qrCodeImg.src = `data:image/png;base64,${pixData.encodedImage}`;
    } else if (pixData.payload) {
        qrCodeImg.src = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(pixData.payload)}`;
    }

    // Set payload for copy
    pixPayload.value = pixData.payload || pixData.qrCode || '';

    // Set expiry time (24 hours from now)
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    pixExpiry.textContent = `Expira em: ${expiry.toLocaleString('pt-BR')}`;
}

// Copy PIX payload
function copyPixPayload() {
    const payload = document.getElementById('pixPayload');
    payload.select();
    document.execCommand('copy');
    showNotification('Código PIX copiado!', 'success');
}

// Process card payment via Backend API
async function processCardPayment() {
    if (!currentUser) {
        showNotification('Faça login para continuar', 'warning');
        openLoginModal();
        return;
    }

    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardHolder = document.getElementById('cardHolder').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    const cardCpf = document.getElementById('cardCpf').value.replace(/\D/g, '');
    const installments = parseInt(document.getElementById('installments').value) || 1;

    if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv || !cardCpf) {
        showNotification('Preencha todos os dados do cartão', 'warning');
        return;
    }

    const btn = document.getElementById('processCardBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
        const totalValue = cart.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);

        // Create order
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                cliente_id: currentUser.id,
                valor_total: totalValue,
                status: 'pending',
                metodo_pagamento: installments > 1 ? 'credit_card' : 'debit_card'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Add order items
        const orderItems = cart.map(item => ({
            order_id: order.id,
            tipo: item.tipo,
            servico_id: item.servico_id,
            nome: item.nome,
            valor_unitario: item.valor,
            quantidade: item.quantidade,
            valor_total: item.valor * item.quantidade
        }));

        await supabaseClient.from('order_items').insert(orderItems);

        // Parse expiry
        const [expMonth, expYear] = cardExpiry.split('/');

        // Create card payment via backend
        const response = await fetch(`${BACKEND_URL}/api/payments/card`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerData: {
                    name: cardHolder,
                    email: currentUser.email,
                    cpfCnpj: cardCpf,
                    phone: currentUser.telefone || currentUser.whatsapp || ''
                },
                value: totalValue,
                description: `Pedido ${order.id.slice(0, 8)} - Mae Grazi`,
                externalReference: order.id,
                installmentCount: installments,
                creditCard: {
                    holderName: cardHolder,
                    number: cardNumber,
                    expiryMonth: expMonth,
                    expiryYear: expYear,
                    ccv: cardCvv
                },
                creditCardHolderInfo: {
                    name: cardHolder,
                    email: currentUser.email,
                    cpfCnpj: cardCpf,
                    mobilePhone: currentUser.telefone || currentUser.whatsapp || ''
                }
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erro ao processar pagamento');
        }

        // Update order
        await supabaseClient
            .from('orders')
            .update({
                asaas_payment_id: data.payment.id,
                status: data.payment.status === 'CONFIRMED' ? 'paid' : 'pending'
            })
            .eq('id', order.id);

        if (data.payment.status === 'CONFIRMED') {
            showNotification('Pagamento aprovado!', 'success');
            showPaymentSuccess(order.id);
        } else {
            showNotification('Pagamento em processamento. Você receberá uma notificação.', 'info');
            startPaymentStatusCheck(order.id, data.payment.id);
        }

        // Clear cart
        await clearCart();

    } catch (error) {
        console.error('Erro no pagamento:', error);
        showNotification(error.message || 'Erro ao processar pagamento', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> Pagar com Cartão';
    }
}

// Detect card brand
function detectCardBrand(number) {
    const patterns = {
        'visa': /^4/,
        'mastercard': /^5[1-5]/,
        'amex': /^3[47]/,
        'elo': /^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|6504|6505|6506|6507|6508|6509|6516|6550)/,
        'hipercard': /^606282/
    };
    
    for (const [brand, pattern] of Object.entries(patterns)) {
        if (pattern.test(number)) return brand;
    }
    return 'unknown';
}

// Clear cart
async function clearCart() {
    cart = [];
    updateCartUI();
    
    if (currentUser) {
        await supabaseClient
            .from('cart_items')
            .delete()
            .eq('cliente_id', currentUser.id);
    } else {
        localStorage.removeItem('guestCart');
    }
}

// Start payment status check via backend
function startPaymentStatusCheck(orderId, asaasPaymentId) {
    const checkInterval = setInterval(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/payments/${asaasPaymentId}/status`);
            const data = await response.json();

            if (!data.success) {
                console.error('Status check failed:', data.error);
                return;
            }

            const status = data.status;

            if (status === 'CONFIRMED' || status === 'RECEIVED') {
                clearInterval(checkInterval);

                // Update order status
                await supabaseClient
                    .from('orders')
                    .update({
                        status: 'paid',
                        paid_at: new Date().toISOString()
                    })
                    .eq('id', orderId);

                showNotification('Pagamento confirmado!', 'success');

                // Show success modal or redirect
                showPaymentSuccess(orderId);
            } else if (status === 'OVERDUE' || status === 'CANCELLED') {
                clearInterval(checkInterval);
                showNotification('Pagamento expirado ou cancelado', 'error');
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
        }
    }, 5000); // Check every 5 seconds

    // Stop checking after 30 minutes
    setTimeout(() => clearInterval(checkInterval), 30 * 60 * 1000);
}

// Show payment success
function showPaymentSuccess(orderId) {
    const modal = document.getElementById('checkoutModal');
    modal.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-check-circle" style="font-size: 4rem; color: #00ff7f; margin-bottom: 1rem;"></i>
            <h2 style="color: #fff; margin-bottom: 1rem;">Pagamento Confirmado!</h2>
            <p style="color: #888; margin-bottom: 1.5rem;">Seu pedido foi processado com sucesso.</p>
            <p style="color: #ff1a1a; font-weight: 600; margin-bottom: 1.5rem;">Pedido: #${orderId.slice(0, 8).toUpperCase()}</p>
            <button onclick="closeCheckoutModal(); location.reload();" style="padding: 1rem 2rem; background: linear-gradient(135deg, #ff1a1a, #8B0000); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">
                Continuar
            </button>
        </div>
    `;
}

// Fly to cart animation
function flyToCart(element) {
    const cartButton = document.getElementById('cartButton');
    if (!cartButton) return;
    
    const rect = element.getBoundingClientRect();
    const cartRect = cartButton.getBoundingClientRect();
    
    // Create flying element
    const flyer = document.createElement('div');
    flyer.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #ff1a1a, #8B0000);
        border-radius: 50%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
        pointer-events: none;
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    flyer.innerHTML = '<i class="fas fa-shopping-cart"></i>';
    
    document.body.appendChild(flyer);
    
    // Set initial position
    flyer.style.left = rect.left + rect.width / 2 - 25 + 'px';
    flyer.style.top = rect.top + rect.height / 2 - 25 + 'px';
    
    // Trigger animation
    requestAnimationFrame(() => {
        flyer.style.left = cartRect.left + cartRect.width / 2 - 25 + 'px';
        flyer.style.top = cartRect.top + cartRect.height / 2 - 25 + 'px';
        flyer.style.transform = 'scale(0.3)';
        flyer.style.opacity = '0.5';
    });
    
    // Remove and pulse cart
    setTimeout(() => {
        flyer.remove();
        
        // Pulse animation on cart button
        cartButton.style.transform = 'scale(1.15)';

        setTimeout(() => {
            cartButton.style.transform = 'scale(1)';
        }, 300);
    }, 800);
}

// Update button to add to cart instead of direct order
function openOrderModal(type, serviceId) {
    // Find service in loaded data
    const cardElement = document.querySelector(`[data-service-id="${serviceId}"]`);

    if (!cardElement) {
        console.error('Card not found:', serviceId);
        return;
    }

    const titleEl = cardElement.querySelector('h3');
    const priceEl = cardElement.querySelector('.price');

    if (!titleEl || !priceEl) {
        console.error('Title or price element not found');
        return;
    }

    // Extract price value from price element
    // Price format: "R$499,90" or similar
    const priceText = priceEl.textContent.replace('R$', '').replace(',', '.');
    const priceValue = parseFloat(priceText);

    const service = {
        id: serviceId,
        nome: titleEl.textContent,
        valor: priceValue
    };

    // Animate button
    const button = cardElement.querySelector('button.buy');
    if (button) {
        button.style.transform = 'scale(0.95)';
        button.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
        button.style.background = '#00b894';

        // Fly to cart animation
        flyToCart(cardElement);

        // Add to cart
        addToCart(type, serviceId, service.nome, service.valor);

        // Reset button after animation
        setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.innerHTML = 'Adicionar';
            button.style.background = '#ff1a1a';
        }, 1500);
    }
}

// Export functions for global access
window.login = login;
window.register = register;
window.logout = logout;
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openLoginModal = openLoginModal;
window.openRegisterModal = openRegisterModal;
window.closeModal = closeModal;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.generatePixPayment = generatePixPayment;
window.copyPixPayload = copyPixPayload;
window.processCardPayment = processCardPayment;
window.loadCart = loadCart;
window.flyToCart = flyToCart;

// Supabase Configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Asaas Configuration
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3'; // Use sandbox for testing
const ASAAS_API_KEY = 'your-asaas-api-key';

// State Management
let currentUser = null;
let selectedService = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Login form will be handled by checkAuth
}

// Authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        showClientArea();
        loadOrders();
    } else {
        // Redirect to main site or show login
        window.location.href = 'index.html';
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    window.location.href = 'index.html';
}

function showClientArea() {
    document.getElementById('clientName').textContent = currentUser?.user_metadata?.name || currentUser?.email || 'Cliente';
}



function createServiceCard(service, type) {
    const div = document.createElement('div');
    div.className = 'electric-border rounded-lg p-6 glass-effect service-card cursor-pointer';
    div.onclick = () => showServiceDetails(service, type);
    
    div.innerHTML = `
        <div class="mb-4 -mx-6 -mt-6">
            ${service.icon_url ? `<div class="w-full h-24 bg-black flex items-center justify-center"><img src="${service.icon_url}" alt="${service.nome}" class="max-w-full max-h-full object-contain"></div>` : 
              '<div class="w-full h-24 bg-gray-700 flex items-center justify-center"><i class="fas fa-image text-4xl text-gray-500"></i></div>'}
        </div>
        <h3 class="text-lg font-bold text-red-500 mb-2">${service.nome}</h3>
        <p class="text-gray-300 mb-4 line-clamp-3">${service.descricao}</p>
        <p class="text-red-400 font-bold text-xl mb-4">R$ ${service.valor}</p>
        <button onclick="event.stopPropagation(); orderService(${service.id}, '${type}')" 
                class="w-full px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors">
            <i class="fas fa-shopping-cart mr-2"></i> Solicitar
        </button>
    `;
    return div;
}

// Service Details
function showServiceDetails(service, type) {
    selectedService = { ...service, type };
    
    document.getElementById('serviceTitle').textContent = service.nome;
    
    const content = document.getElementById('serviceContent');
    content.innerHTML = `
        <div class="mb-4 -mx-6 -mt-6">
            ${service.icon_url ? `<div class="w-full h-36 bg-black flex items-center justify-center"><img src="${service.icon_url}" alt="${service.nome}" class="max-w-full max-h-full object-contain"></div>` : 
              '<div class="w-full h-36 bg-gray-700 flex items-center justify-center"><i class="fas fa-image text-6xl text-gray-500"></i></div>'}
        </div>
        
        <div class="mb-6">
            <h4 class="text-lg font-bold text-red-500 mb-2">Descrição</h4>
            <p class="text-gray-300">${service.descricao}</p>
        </div>
        
        <div class="mb-6">
            <h4 class="text-lg font-bold text-red-500 mb-2">Informações Adicionais</h4>
            <p class="text-red-400 font-bold text-2xl">R$ ${service.valor}</p>
            ${service.perguntas && service.perguntas.length > 0 ? `
                <div class="mt-4">
                    <p class="text-sm text-gray-400 mb-2">Após o pagamento, você precisará responder às seguintes perguntas:</p>
                    <ul class="list-disc list-inside text-gray-300">
                        ${service.perguntas.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
        
        <button onclick="orderService(${service.id}, '${type}')" 
                class="w-full px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors">
            <i class="fas fa-shopping-cart mr-2"></i> Solicitar Serviço
        </button>
    `;
    
    document.getElementById('serviceModal').classList.remove('hidden');
}

function closeServiceModal() {
    document.getElementById('serviceModal').classList.add('hidden');
    selectedService = null;
}

// Order Service
async function orderService(serviceId, type) {
    if (!currentUser) {
        // Redirect to login instead of alert
        if (confirm('Você precisa estar cadastrado e logado para solicitar um serviço. Deseja fazer login ou cadastrar-se agora?')) {
            window.location.href = 'cliente.html';
        }
        return;
    }
    
    closeServiceModal();
    
    try {
        // Get service details
        const table = type === 'trabalho' ? 'trabalhos' : 'rituais';
        const { data: service, error: serviceError } = await supabase
            .from(table)
            .select('*')
            .eq('id', serviceId)
            .single();
        
        if (serviceError) throw serviceError;
        
        // Create order
        const orderData = {
            cliente_id: currentUser.id,
            [type + '_id']: serviceId,
            valor: service.valor,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        const { data: order, error: orderError } = await supabase
            .from('pedidos')
            .insert(orderData)
            .select()
            .single();
        
        if (orderError) throw orderError;
        
        // Show payment modal with installment options (payment will be created after selection)
        showPaymentModal(null, order, { ...service, type });
        
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        alert('Erro ao solicitar serviço: ' + error.message);
    }
}

// Asaas Payment Integration
async function createAsaasPayment(order, service, installmentCount = 1) {
    try {
        const customerData = await getOrCreateAsaasCustomer();
        
        // Calculate installment value with interest
        // Asaas interest rates: 1x = 0%, 2x = 2.5%, 3x = 3.5%, 4x = 4.5%, 5x = 5.5%, 6x = 6.5%, 7x = 7.5%, 8x = 8.5%, 9x = 9.5%, 10x = 10.5%, 11x = 11.5%, 12x = 12.5%
        const interestRates = {
            1: 0, 2: 0.025, 3: 0.035, 4: 0.045, 5: 0.055, 
            6: 0.065, 7: 0.075, 8: 0.085, 9: 0.095, 10: 0.105, 11: 0.115, 12: 0.125
        };
        
        const interestRate = interestRates[installmentCount] || 0;
        const totalValueWithInterest = service.valor * (1 + interestRate);
        const installmentValue = totalValueWithInterest / installmentCount;
        
        const paymentData = {
            customer: customerData.id,
            billingType: 'CREDIT_CARD', // For installments, must be credit card
            value: totalValueWithInterest,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
            description: `${service.type === 'trabalho' ? 'Trabalho' : 'Ritual'}: ${service.nome}`,
            externalReference: order.id.toString(),
            installmentCount: installmentCount,
            installmentValue: parseFloat(installmentValue.toFixed(2)),
            callback: {
                successUrl: `${window.location.origin}/cliente-dashboard.html?payment=success&order=${order.id}`,
                autoUrl: `${window.location.origin}/cliente-dashboard.html?payment=auto&order=${order.id}`
            }
        };
        
        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro ao criar pagamento');
        }
        
        // Store installment info in order
        await supabase
            .from('pedidos')
            .update({
                installment_count: installmentCount,
                installment_value: parseFloat(installmentValue.toFixed(2)),
                interest_rate: interestRate,
                total_with_interest: parseFloat(totalValueWithInterest.toFixed(2))
            })
            .eq('id', order.id);
        
        return data;
        
    } catch (error) {
        console.error('Erro ao criar pagamento Asaas:', error);
        throw error;
    }
}

async function getOrCreateAsaasCustomer() {
    try {
        // Check if customer already exists
        const response = await fetch(`${ASAAS_API_URL}/customers?email=${currentUser.email}`, {
            headers: {
                'access_token': ASAAS_API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            return data.data[0]; // Return existing customer
        }
        
        // Create new customer
        const customerData = {
            name: currentUser.user_metadata?.name || currentUser.email.split('@')[0],
            email: currentUser.email,
            phone: currentUser.user_metadata?.phone || '',
            mobilePhone: currentUser.user_metadata?.phone || ''
        };
        
        const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY
            },
            body: JSON.stringify(customerData)
        });
        
        const newCustomer = await createResponse.json();
        
        if (!createResponse.ok) {
            throw new Error(newCustomer.errors?.[0]?.description || 'Erro ao criar cliente');
        }
        
        return newCustomer;
        
    } catch (error) {
        console.error('Erro ao gerenciar cliente Asaas:', error);
        throw error;
    }
}

function showPaymentModal(paymentData, order, service) {
    const content = document.getElementById('paymentContent');
    
    // Interest rates for display
    const interestRates = {
        1: { rate: 0, label: '1x sem juros' },
        2: { rate: 2.5, label: '2x com 2.5% juros' },
        3: { rate: 3.5, label: '3x com 3.5% juros' },
        4: { rate: 4.5, label: '4x com 4.5% juros' },
        5: { rate: 5.5, label: '5x com 5.5% juros' },
        6: { rate: 6.5, label: '6x com 6.5% juros' },
        7: { rate: 7.5, label: '7x com 7.5% juros' },
        8: { rate: 8.5, label: '8x com 8.5% juros' },
        9: { rate: 9.5, label: '9x com 9.5% juros' },
        10: { rate: 10.5, label: '10x com 10.5% juros' },
        11: { rate: 11.5, label: '11x com 11.5% juros' },
        12: { rate: 12.5, label: '12x com 12.5% juros' }
    };
    
    const baseValue = parseFloat(service.valor);
    
    content.innerHTML = `
        <div class="text-center">
            <i class="fas fa-check-circle text-5xl text-green-400 mb-4"></i>
            <h4 class="text-lg font-bold text-red-500 mb-2">Pedido Criado!</h4>
            <p class="text-gray-300 mb-4">Seu pedido #${order.id} foi criado com sucesso.</p>
            
            <div class="bg-gray-800 rounded p-4 mb-4">
                <p class="text-sm text-gray-400 mb-2">Valor original:</p>
                <p class="text-xl font-bold text-gray-400">R$ ${baseValue.toFixed(2)}</p>
            </div>
            
            <!-- Installment Options -->
            <div class="mb-4">
                <p class="text-sm text-gray-400 mb-3">Escolha a forma de pagamento:</p>
                <div id="installmentOptions" class="space-y-2 max-h-48 overflow-y-auto">
                    ${Object.entries(interestRates).map(([count, info]) => {
                        const total = baseValue * (1 + info.rate / 100);
                        const parcel = total / parseInt(count);
                        return `
                            <label class="flex items-center justify-between p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors ${count === '1' ? 'border-2 border-red-500' : ''}" onclick="selectInstallment(${count}, ${total.toFixed(2)}, ${parcel.toFixed(2)})">
                                <div class="flex items-center">
                                    <input type="radio" name="installment" value="${count}" ${count === '1' ? 'checked' : ''} class="mr-3 text-red-500 focus:ring-red-500">
                                    <div class="text-left">
                                        <p class="font-semibold text-white">${count}x de R$ ${parcel.toFixed(2)}</p>
                                        <p class="text-xs text-gray-400">${info.label}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-bold ${info.rate > 0 ? 'text-yellow-400' : 'text-green-400'}">Total: R$ ${total.toFixed(2)}</p>
                                    ${info.rate > 0 ? `<p class="text-xs text-gray-500">+R$ ${(total - baseValue).toFixed(2)} juros</p>` : ''}
                                </div>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="bg-red-900/30 border border-red-500/50 rounded p-4 mb-4">
                <p class="text-sm text-gray-400 mb-1">Valor total a pagar:</p>
                <p id="totalDisplay" class="text-3xl font-bold text-red-400">R$ ${baseValue.toFixed(2)}</p>
                <p id="installmentDisplay" class="text-sm text-gray-400 mt-1">1x sem juros</p>
            </div>
            
            <div class="space-y-3">
                <button id="payButton" onclick="processPayment('${order.id}', '${service.type}', '${service.id}', 1)" 
                        class="w-full px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors">
                    <i class="fas fa-credit-card mr-2"></i> Pagar com Cartão
                </button>
                
                <button onclick="closePaymentModal()" 
                        class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">
                    Pagar Depois
                </button>
            </div>
            
            <p class="text-xs text-gray-400 mt-4">
                Após o pagamento, você receberá acesso ao formulário para preencher as informações necessárias.
            </p>
        </div>
    `;
    
    document.getElementById('paymentModal').classList.remove('hidden');
}

// Select installment option
let selectedInstallment = 1;
function selectInstallment(count, total, parcel) {
    selectedInstallment = parseInt(count);
    
    // Update UI
    document.querySelectorAll('#installmentOptions label').forEach(label => {
        label.classList.remove('border-2', 'border-red-500');
    });
    event.currentTarget.classList.add('border-2', 'border-red-500');
    event.currentTarget.querySelector('input').checked = true;
    
    // Update total display
    document.getElementById('totalDisplay').textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById('installmentDisplay').textContent = 
        count === '1' ? '1x sem juros' : `${count}x de R$ ${parcel.toFixed(2)}`;
    
    // Update pay button
    const orderId = document.getElementById('payButton').getAttribute('onclick').match(/'([^']+)'/)[1];
    const serviceType = document.getElementById('payButton').getAttribute('onclick').match(/'([^']+)'/g)[1].replace(/'/g, '');
    const serviceId = document.getElementById('payButton').getAttribute('onclick').match(/'([^']+)'/g)[2].replace(/'/g, '');
}

// Process payment with selected installment
async function processPayment(orderId, serviceType, serviceId, defaultInstallment) {
    const installmentCount = selectedInstallment || defaultInstallment;
    
    try {
        // Get service details
        const table = serviceType === 'trabalho' ? 'trabalhos' : 'rituais';
        const { data: service, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', serviceId)
            .single();
        
        if (error) throw error;
        
        // Create payment with installments
        const paymentData = await createAsaasPayment(
            { id: orderId, valor: service.valor }, 
            { ...service, type: serviceType }, 
            installmentCount
        );
        
        // Open Asaas checkout
        window.open(paymentData.invoiceUrl, '_blank');
        
        closePaymentModal();
        showNotification('Redirecionando para o pagamento...', 'success');
        
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        alert('Erro ao processar pagamento: ' + error.message);
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    loadOrders(); // Refresh orders list
}

// Load Orders
async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                trabalhos(nome, descricao, icon_url, perguntas),
                rituais(nome, descricao, icon_url, perguntas)
            `)
            .eq('cliente_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">Você ainda não tem pedidos.</td></tr>';
            return;
        }
        
        data.forEach(order => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-red-800';
            
            const service = order.trabalhos || order.rituais;
            const statusBadge = getStatusBadge(order.status);
            
            tr.innerHTML = `
                <td class="px-6 py-4">#${order.id}</td>
                <td class="px-6 py-4">${service?.nome || 'N/A'}</td>
                <td class="px-6 py-4">R$ ${order.valor}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4">${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        ${order.asaas_payment_url && order.status !== 'paid' ? 
                            `<a href="${order.asaas_payment_url}" target="_blank" 
                               class="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded transition-colors">
                                <i class="fas fa-credit-card"></i> Pagar
                            </a>` : ''
                        }
                        ${order.status === 'paid' ? 
                            `<button onclick="showForm(${order.id})" 
                                    class="px-3 py-1 bg-green-600 hover:bg-green-500 rounded transition-colors">
                                <i class="fas fa-file-alt"></i> Formulário
                            </button>` : ''
                        }
                        ${order.status === 'paid' && service?.perguntas?.length > 0 ? 
                            `<button onclick="showUploadArea(${order.id})" 
                                    class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded transition-colors">
                                <i class="fas fa-upload"></i> Anexar
                            </button>` : ''
                        }
                    </div>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
    }
}

// Form Management
async function showForm(orderId) {
    try {
        const { data: order, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                trabalhos(nome, perguntas),
                rituais(nome, perguntas)
            `)
            .eq('id', orderId)
            .eq('cliente_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        const service = order.trabalhos || order.rituais;
        const perguntas = service?.perguntas || [];
        
        if (perguntas.length === 0) {
            alert('Este serviço não requer formulário.');
            return;
        }
        
        // Check if form already submitted
        if (order.form_data) {
            showSubmittedForm(order);
            return;
        }
        
        const content = document.getElementById('formContent');
        content.innerHTML = `
            <div class="mb-4">
                <h4 class="text-lg font-bold text-red-500 mb-2">Formulário - ${service.nome}</h4>
                <p class="text-gray-300 text-sm">Por favor, responda às perguntas abaixo:</p>
            </div>
            
            <form id="serviceForm" class="space-y-4">
                <input type="hidden" id="formOrderId" value="${orderId}">
                
                ${perguntas.map((pergunta, index) => `
                    <div>
                        <label class="block text-sm font-medium mb-2">${index + 1}. ${pergunta}</label>
                        <textarea name="pergunta_${index}" rows="3" required
                                  class="w-full px-4 py-3 rounded-lg bg-gray-800 border border-red-700 focus:outline-none focus:border-red-500"
                                  placeholder="Digite sua resposta..."></textarea>
                    </div>
                `).join('')}
                
                <div class="flex space-x-4">
                    <button type="submit" 
                            class="flex-1 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors">
                        <i class="fas fa-save mr-2"></i> Salvar Respostas
                    </button>
                    <button type="button" onclick="closeFormModal()" 
                            class="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">
                        Cancelar
                    </button>
                </div>
            </form>
        `;
        
        document.getElementById('formModal').classList.remove('hidden');
        
        // Setup form submission
        document.getElementById('serviceForm').addEventListener('submit', handleFormSubmit);
        
    } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        alert('Erro ao carregar formulário: ' + error.message);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('formOrderId').value;
    const formData = new FormData(e.target);
    const answers = {};
    
    // Collect all answers
    for (let [key, value] of formData.entries()) {
        answers[key] = value;
    }
    
    try {
        const { error } = await supabase
            .from('pedidos')
            .update({
                form_data: answers,
                form_submitted_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .eq('cliente_id', currentUser.id);
        
        if (error) throw error;
        
        closeFormModal();
        loadOrders();
        alert('Formulário enviado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar formulário:', error);
        alert('Erro ao salvar formulário: ' + error.message);
    }
}

function showSubmittedForm(order) {
    const service = order.trabalhos || order.rituais;
    const content = document.getElementById('formContent');
    
    content.innerHTML = `
        <div class="mb-4">
            <h4 class="text-lg font-bold text-red-500 mb-2">Formulário Enviado - ${service.nome}</h4>
            <p class="text-gray-300 text-sm">Seu formulário foi enviado em ${new Date(order.form_submitted_at).toLocaleDateString()}</p>
        </div>
        
        <div class="space-y-4">
            ${Object.entries(order.form_data).map(([key, value]) => {
                const questionNumber = key.split('_')[1];
                const question = service.perguntas[questionNumber];
                return `
                    <div class="bg-gray-800 rounded p-4">
                        <p class="text-red-400 font-medium mb-2">${parseInt(questionNumber) + 1}. ${question}</p>
                        <p class="text-gray-300">${value}</p>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="mt-6">
            <button onclick="showUploadArea(${order.id})" 
                    class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                <i class="fas fa-upload mr-2"></i> Anexar Imagens
            </button>
        </div>
        
        <div class="mt-4">
            <button onclick="closeFormModal()" 
                    class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">
                Fechar
            </button>
        </div>
    `;
    
    document.getElementById('formModal').classList.remove('hidden');
}

// File Upload
async function showUploadArea(orderId) {
    try {
        const { data: order, error } = await supabase
            .from('pedidos')
            .select('id, status')
            .eq('id', orderId)
            .eq('cliente_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        if (order.status !== 'paid') {
            alert('Você só pode anexar imagens após o pagamento ser confirmado.');
            return;
        }
        
        const content = document.getElementById('formContent');
        content.innerHTML = `
            <div class="mb-4">
                <h4 class="text-lg font-bold text-red-500 mb-2">Anexar Imagens</h4>
                <p class="text-gray-300 text-sm">Envie imagens relacionadas ao seu pedido #${orderId}</p>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Selecione as imagens</label>
                    <input type="file" id="fileInput" multiple accept="image/*" 
                           class="w-full px-4 py-3 rounded-lg bg-gray-800 border border-red-700 focus:outline-none focus:border-red-500">
                </div>
                
                <div id="uploadPreview" class="grid grid-cols-2 gap-4"></div>
                
                <button onclick="uploadFiles(${orderId})" 
                        class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                    <i class="fas fa-upload mr-2"></i> Enviar Imagens
                </button>
                
                <div id="uploadedFiles" class="space-y-2">
                    <!-- Uploaded files will be shown here -->
                </div>
            </div>
            
            <div class="mt-4">
                <button onclick="closeFormModal()" 
                        class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">
                    Fechar
                </button>
            </div>
        `;
        
        document.getElementById('formModal').classList.remove('hidden');
        
        // Setup file preview
        document.getElementById('fileInput').addEventListener('change', previewFiles);
        
        // Load existing files
        loadUploadedFiles(orderId);
        
    } catch (error) {
        console.error('Erro ao abrir área de upload:', error);
        alert('Erro ao abrir área de upload: ' + error.message);
    }
}

function previewFiles(event) {
    const files = event.target.files;
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'relative';
            div.innerHTML = `
                <img src="${e.target.result}" class="w-full h-32 object-cover rounded">
                <button onclick="this.parentElement.remove()" 
                        class="absolute top-2 right-2 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

async function uploadFiles(orderId) {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);
    
    if (files.length === 0) {
        alert('Selecione pelo menos uma imagem.');
        return;
    }
    
    try {
        const uploadPromises = files.map(async (file) => {
            const fileName = `pedido_${orderId}_${Date.now()}_${file.name}`;
            
            const { data, error } = await supabase.storage
                .from('order_files')
                .upload(fileName, file);
            
            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage
                .from('order_files')
                .getPublicUrl(fileName);
            
            // Save file info to database
            await supabase
                .from('pedido_files')
                .insert({
                    pedido_id: orderId,
                    file_name: file.name,
                    file_url: publicUrl,
                    file_size: file.size,
                    uploaded_at: new Date().toISOString()
                });
            
            return publicUrl;
        });
        
        await Promise.all(uploadPromises);
        
        alert('Imagens enviadas com sucesso!');
        fileInput.value = '';
        document.getElementById('uploadPreview').innerHTML = '';
        loadUploadedFiles(orderId);
        
    } catch (error) {
        console.error('Erro ao enviar imagens:', error);
        alert('Erro ao enviar imagens: ' + error.message);
    }
}

async function loadUploadedFiles(orderId) {
    try {
        const { data, error } = await supabase
            .from('pedido_files')
            .select('*')
            .eq('pedido_id', orderId)
            .order('uploaded_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('uploadedFiles');
        
        if (data.length > 0) {
            container.innerHTML = `
                <h5 class="text-red-400 font-medium mb-2">Imagens já enviadas:</h5>
                <div class="grid grid-cols-2 gap-2">
                    ${data.map(file => `
                        <div class="relative group">
                            <img src="${file.file_url}" alt="${file.file_name}" 
                                 class="w-full h-24 object-cover rounded cursor-pointer"
                                 onclick="window.open('${file.file_url}', '_blank')">
                            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                <span class="text-xs text-white">${file.file_name}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-gray-400 text-sm">Nenhuma imagem enviada ainda.</p>';
        }
        
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
    }
}

function closeFormModal() {
    document.getElementById('formModal').classList.add('hidden');
}

// Helper Functions
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-2 py-1 bg-red-700 text-white rounded-full text-xs">Pendente</span>',
        'paid': '<span class="px-2 py-1 bg-green-600 text-white rounded-full text-xs">Pago</span>',
        'cancelled': '<span class="px-2 py-1 bg-red-600 text-white rounded-full text-xs">Cancelado</span>',
        'completed': '<span class="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">Concluído</span>'
    };
    return badges[status] || badges['pending'];
}

// Check for payment callback
function checkPaymentCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderId = urlParams.get('order');
    
    if (paymentStatus && orderId) {
        // Handle payment callback
        if (paymentStatus === 'success') {
            // Update order status
            updateOrderStatus(orderId, 'paid');
            alert('Pagamento confirmado! Você agora pode acessar o formulário.');
        }
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await supabase
            .from('pedidos')
            .update({ status })
            .eq('id', orderId)
            .eq('cliente_id', currentUser.id);
        
        loadOrders();
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
    }
}

// Check payment callback on load
checkPaymentCallback();

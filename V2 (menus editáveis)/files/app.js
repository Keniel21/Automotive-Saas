// ==========================================================================
// AUTO DRIVE CRM - CONTROLLER COM SUPABASE & LOCAL FALLBACK (JS)
// VERSÃO 2.0 - Com edição e exclusão em todas as telas
// ==========================================================================

const SUPABASE_URL = "https://xjmyijeblktwncpivywh.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbXlpamVibGt0d25jcGl2eXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTkxMzAsImV4cCI6MjA5NTAzNTEzMH0.AAn5z138QpB1VbcoZjDNMTflmcy97IIvhxK_b1de-eQ";

let supabaseClient = null;
let isCloudActive = false;
let sessionUser = null;

// --------------------------------------------------------------------------
// B. BANCO DE DADOS LOCAL (FALLBACK)
// --------------------------------------------------------------------------
let estoque = [
    { id: 1, model: "Jeep Compass Longitude 2.0 Flex", year: "2021/2021", km: 42000, buyPrice: 110000, sellPrice: 125900, daysInStock: 45, status: "disponivel", type: "convencional" },
    { id: 2, model: "Toyota Corolla XEi 2.0 Flex", year: "2020/2020", km: 58000, buyPrice: 95000, sellPrice: 108500, daysInStock: 12, status: "reservado", type: "convencional" },
    { id: 3, model: "Honda Civic EXL 2.0", year: "2019/2019", km: 64000, buyPrice: 88000, sellPrice: 99900, daysInStock: 35, status: "disponivel", type: "convencional" },
    { id: 4, model: "VW Polo Comfortline 1.0 TSI", year: "2022/2023", km: 28000, buyPrice: 72000, sellPrice: 81900, daysInStock: 8, status: "preparacao", type: "convencional" },
    { id: 5, model: "Chevrolet Onix Plus LTZ Turbo", year: "2021/2021", km: 38000, buyPrice: 65000, sellPrice: 71000, daysInStock: 52, status: "disponivel", type: "repasse" },
    { id: 6, model: "Hyundai HB20 Evolution 1.0", year: "2020/2021", km: 49000, buyPrice: 53000, sellPrice: 58500, daysInStock: 22, status: "disponivel", type: "repasse" },
    { id: 7, model: "Ford Ka SE 1.0", year: "2019/2019", km: 75000, buyPrice: 38000, sellPrice: 42000, daysInStock: 4, status: "vendido", type: "repasse" }
];

let leads = [
    { id: 1, name: "Carlos Alberto Santos", phone: "(11) 98765-4321", interestCarId: 1, origin: "Instagram", status: "negociação", lastContactDays: 2, nextAction: "Enviar simulação de financiamento hoje à tarde", interactions: [{ date: "20/05/2026", text: "Cliente entrou em contato via direct perguntando sobre Jeep Compass." }, { date: "21/05/2026", text: "Fizemos contato via WhatsApp. Enviou proposta de veículo na troca." }] },
    { id: 2, name: "Mariana Costa", phone: "(21) 99123-4567", interestCarId: 2, origin: "WhatsApp", status: "novo lead", lastContactDays: 0, nextAction: "Fazer primeiro contato de apresentação", interactions: [{ date: "22/05/2026", text: "Lead gerado automaticamente via botão flutuante do site." }] },
    { id: 3, name: "Ricardo Mendes", phone: "(11) 97321-8901", interestCarId: 3, origin: "OLX/Webmotors", status: "sem resposta", lastContactDays: 14, nextAction: "Fazer última tentativa de contato antes de arquivar", interactions: [{ date: "08/05/2026", text: "Cliente demonstrou interesse no Civic através da OLX." }, { date: "10/05/2026", text: "Enviei fotos adicionais do Civic. Não respondeu." }, { date: "15/05/2026", text: "Fiz cobrança de retorno. Sem resposta." }] },
    { id: 4, name: "Ana Beatriz Ramos", phone: "(31) 98456-1122", interestCarId: 4, origin: "Indicação", status: "contato realizado", lastContactDays: 4, nextAction: "Agendar vistoria cautelar na oficina", interactions: [{ date: "18/05/2026", text: "Indicada pelo primo. Gostou do Polo." }, { date: "20/05/2026", text: "Pediu para levar o carro para avaliação." }] },
    { id: 5, name: "Felipe Andrade Lins", phone: "(11) 99345-6789", interestCarId: 5, origin: "OLX/Webmotors", status: "sem resposta", lastContactDays: 32, nextAction: "Mudar status para perdido se não responder", interactions: [{ date: "20/04/2026", text: "Perguntou sobre condições de repasse no Onix." }, { date: "22/04/2026", text: "Enviado valor à vista de repasse. Sumiu." }] }
];

let vendas = [
    { id: 1, carId: 7, client: "Antônio da Silva Lojista", sellPrice: 41000, date: "2026-05-18", profit: 3000, margin: 7.3, type: "repasse" },
    { id: 2, carId: null, client: "Juliana Medeiros", sellPrice: 89000, date: "2026-05-10", profit: 12000, margin: 13.5, type: "convencional" },
    { id: 3, carId: null, client: "Gustavo Franco", sellPrice: 52000, date: "2026-05-02", profit: 6000, margin: 11.5, type: "convencional" }
];

let despesas = [
    { id: 1, desc: "Polimento Jeep Compass", carId: 1, date: "2026-05-12", val: 450, category: "Preparação" },
    { id: 2, desc: "Higienização interna Honda Civic", carId: 3, date: "2026-05-15", val: 250, category: "Preparação" },
    { id: 3, desc: "Martelinho de Ouro Polo", carId: 4, date: "2026-05-20", val: 350, category: "Preparação" },
    { id: 4, desc: "Impulsionamento Instagram - Compass", carId: 1, date: "2026-05-05", val: 200, category: "Marketing" },
    { id: 5, desc: "Assinatura Planos Portais (Webmotors/OLX)", carId: null, date: "2026-05-01", val: 600, category: "Marketing" }
];

let agenda = [
    { id: 1, title: "Apresentação Jeep Compass", date: "2026-05-22", time: "14:30", carId: 1, category: "visitas", desc: "Levar veículo ao Condomínio Quinta da Boa Vista" },
    { id: 2, title: "Entrega do Toyota Corolla", date: "2026-05-23", time: "10:00", carId: 2, category: "entregas", desc: "Encontro no Cartório do 3º Ofício para assinaturas" },
    { id: 3, title: "Levar Polo para Martelinho/Estética", date: "2026-05-22", time: "16:00", carId: 4, category: "revisao", desc: "Oficina do Marquinhos Polimentos" },
    { id: 4, title: "Vistoria Cautelar Civic", date: "2026-05-24", time: "09:00", carId: 3, category: "documentos", desc: "Posto Super Visão Cautelares" }
];

let chartSalesProfitInstance = null;
let chartLeadsOriginInstance = null;
let chartGiroEstoqueInstance = null;
let chartFinanceInstance = null;
let leadViewMode = 'kanban';

// --------------------------------------------------------------------------
// C. INICIALIZAÇÃO
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    setupHeaderDate();
    if (SUPABASE_URL !== "SUA_SUPABASE_URL_AQUI" && SUPABASE_ANON_KEY !== "SUA_SUPABASE_KEY_AQUI") {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isCloudActive = true;
            document.getElementById("login-demo-notice").style.display = "none";
            await checkActiveSession();
        } catch (e) {
            console.error("Erro ao inicializar Supabase: ", e);
            switchToDemoMode();
        }
    } else {
        switchToDemoMode();
    }
    lucide.createIcons();
});

function setupHeaderDate() {
    const d = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const display = document.getElementById("date-display");
    if (display) display.innerText = d.toLocaleDateString('pt-BR', options);
}

function switchToDemoMode() {
    isCloudActive = false;
    if (localStorage.getItem("autodrive_estoque")) {
        estoque = JSON.parse(localStorage.getItem("autodrive_estoque"));
        leads = JSON.parse(localStorage.getItem("autodrive_leads"));
        vendas = JSON.parse(localStorage.getItem("autodrive_vendas"));
        despesas = JSON.parse(localStorage.getItem("autodrive_despesas"));
        agenda = JSON.parse(localStorage.getItem("autodrive_agenda"));
    }
    document.getElementById("footer-username").innerText = "Marcelo (Demo)";
    document.getElementById("footer-avatar").innerText = "DM";
}

function bypassLoginForDemo() {
    document.getElementById("login-overlay").classList.remove("active");
    updateApplicationState();
    initCharts();
}

function persistLocalData() {
    if (!isCloudActive) {
        localStorage.setItem("autodrive_estoque", JSON.stringify(estoque));
        localStorage.setItem("autodrive_leads", JSON.stringify(leads));
        localStorage.setItem("autodrive_vendas", JSON.stringify(vendas));
        localStorage.setItem("autodrive_despesas", JSON.stringify(despesas));
        localStorage.setItem("autodrive_agenda", JSON.stringify(agenda));
    }
}

// --------------------------------------------------------------------------
// D. SUPABASE AUTH & DATA
// --------------------------------------------------------------------------
async function checkActiveSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (data.session) {
        sessionUser = data.session.user;
        document.getElementById("login-overlay").classList.remove("active");
        document.getElementById("footer-username").innerText = sessionUser.email.split("@")[0].toUpperCase();
        document.getElementById("footer-avatar").innerText = sessionUser.email.substring(0,2).toUpperCase();
        await fetchCloudData();
        updateApplicationState();
        initCharts();
    } else {
        document.getElementById("login-overlay").classList.add("active");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error-message");
    errorDiv.style.display = "none";
    if (isCloudActive) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            errorDiv.innerText = `Erro de Autenticação: ${error.message}`;
            errorDiv.style.display = "block";
        } else {
            sessionUser = data.user;
            document.getElementById("login-overlay").classList.remove("active");
            document.getElementById("footer-username").innerText = sessionUser.email.split("@")[0].toUpperCase();
            document.getElementById("footer-avatar").innerText = sessionUser.email.substring(0,2).toUpperCase();
            await fetchCloudData();
            updateApplicationState();
            initCharts();
        }
    } else {
        bypassLoginForDemo();
    }
}

async function handleLogout() {
    if (isCloudActive) {
        await supabaseClient.auth.signOut();
        sessionUser = null;
        document.getElementById("login-overlay").classList.add("active");
        document.getElementById("form-login").reset();
    } else {
        window.location.reload();
    }
}

async function fetchCloudData() {
    if (!isCloudActive) return;
    try {
        const { data: est, error: errEst } = await supabaseClient.from('estoque').select('*').order('id', { ascending: false });
        if (!errEst) estoque = est.map(c => ({ id: c.id, model: c.model, year: c.year, km: c.km, buyPrice: parseFloat(c.buy_price), sellPrice: parseFloat(c.sell_price), daysInStock: c.days_in_stock, status: c.status, type: c.type }));

        const { data: ven } = await supabaseClient.from('vendas').select('*').order('date', { ascending: false });
        if (ven) vendas = ven.map(v => ({ id: v.id, carId: v.car_id, client: v.client, sellPrice: parseFloat(v.sell_price), date: v.date, profit: parseFloat(v.profit), margin: parseFloat(v.margin), type: v.type }));

        const { data: des } = await supabaseClient.from('despesas').select('*').order('date', { ascending: false });
        if (des) despesas = des.map(d => ({ id: d.id, desc: d.description, carId: d.car_id, date: d.date, val: parseFloat(d.val), category: d.category }));

        const { data: age } = await supabaseClient.from('agenda').select('*').order('date', { ascending: true });
        if (age) agenda = age.map(a => ({ id: a.id, title: a.title, date: a.date, time: a.time, carId: a.car_id, category: a.category, desc: a.description }));

        const { data: lds } = await supabaseClient.from('leads').select('*').order('id', { ascending: false });
        if (lds) {
            leads = [];
            for (let l of lds) {
                const { data: ints } = await supabaseClient.from('interactions').select('date, text').eq('lead_id', l.id).order('id', { ascending: true });
                leads.push({ id: l.id, name: l.name, phone: l.phone, interestCarId: l.interest_car_id, origin: l.origin, status: l.status, lastContactDays: l.last_contact_days, nextAction: l.next_action, interactions: ints || [] });
            }
        }
    } catch (e) {
        console.error("Falha ao sincronizar dados da nuvem: ", e);
    }
}

// --------------------------------------------------------------------------
// E. NAVEGAÇÃO
// --------------------------------------------------------------------------
function switchTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    document.querySelectorAll(".sidebar-menu .menu-item").forEach(item => item.classList.remove("active"));
    document.getElementById(`${tabId}-tab`).classList.add("active");
    const activeMenuItem = document.querySelector(`.sidebar-menu .menu-item[data-tab="${tabId}"]`);
    if (activeMenuItem) activeMenuItem.classList.add("active");
    const titleObj = {
        'dashboard': { t: "Dashboard Operacional", s: "Visão unificada das vendas, estoque e lucratividade" },
        'estoque': { t: "Gestão de Estoque", s: "Controle de margens, tempo de pátio e preparação de veículos" },
        'leads': { t: "Funil Comercial (CRM)", s: "Pipeline ativo de negociações e acompanhamento de contatos" },
        'vendas': { t: "Histórico de Fechamentos", s: "Registro financeiro de todos os veículos vendidos" },
        'financeiro': { t: "Fluxo de Caixa Operacional", s: "Demonstrativo financeiro simples de receitas e despesas" },
        'agenda': { t: "Agenda Operacional", s: "Planejamento logístico de visitas, cartório e oficinas" },
        'excel': { t: "Guia Visual do Excel", s: "Configurações de cores, fontes e fórmulas para replicar este visual" }
    };
    document.getElementById("current-tab-title").innerText = titleObj[tabId].t;
    document.getElementById("current-tab-subtitle").innerText = titleObj[tabId].s;
    if (tabId === 'dashboard') setTimeout(() => initCharts(), 50);
    else if (tabId === 'financeiro') setTimeout(() => initFinanceChart(), 50);
    lucide.createIcons();
}

function updateApplicationState() {
    calculateKPIs();
    renderEstoqueTable();
    populateCarSelects();
    renderKanban();
    renderLeadsList();
    renderVendasTable();
    renderFinanceiro();
    renderAgendaTimeline();
}

// --------------------------------------------------------------------------
// F. KPIs
// --------------------------------------------------------------------------
function calculateKPIs() {
    const totalEstoque = estoque.filter(car => car.status !== 'vendido').length;
    document.getElementById("kpi-estoque").innerText = totalEstoque;
    const totalVendasMes = vendas.length;
    document.getElementById("kpi-vendas").innerText = totalVendasMes;
    document.getElementById("sales-kpi-entregues").innerText = totalVendasMes;
    const lucroAcumulado = vendas.reduce((sum, v) => sum + v.profit, 0);
    document.getElementById("kpi-lucro").innerText = formatCurrency(lucroAcumulado);
    document.getElementById("sales-kpi-lucro").innerText = formatCurrency(lucroAcumulado);
    const activeLeads = leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length;
    document.getElementById("kpi-leads").innerText = activeLeads;
    document.getElementById("badge-leads-active").innerText = activeLeads;
    const parados = estoque.filter(car => car.status !== 'vendido' && car.daysInStock > 30).length;
    document.getElementById("kpi-parados").innerText = parados;
    document.getElementById("badge-estoque-alert").innerText = parados;
    document.getElementById("badge-estoque-alert").style.display = parados === 0 ? 'none' : 'inline-flex';
    const faturamentoTotal = vendas.reduce((sum, v) => sum + v.sellPrice, 0);
    const ticketMedio = totalVendasMes > 0 ? faturamentoTotal / totalVendasMes : 0;
    document.getElementById("kpi-ticket").innerText = formatCurrency(ticketMedio);
    document.getElementById("sales-kpi-faturamento").innerText = formatCurrency(faturamentoTotal);
    const margemMedia = totalVendasMes > 0 ? (vendas.reduce((sum, v) => sum + v.margin, 0) / totalVendasMes) : 0;
    document.getElementById("sales-kpi-margem").innerText = `${margemMedia.toFixed(1)}%`;
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// --------------------------------------------------------------------------
// G. GRÁFICOS
// --------------------------------------------------------------------------
function initCharts() {
    Chart.defaults.color = '#9CA3AF';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
    Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
    const ctxSales = document.getElementById('chart-sales-profit');
    if (ctxSales) {
        if (chartSalesProfitInstance) chartSalesProfitInstance.destroy();
        chartSalesProfitInstance = new Chart(ctxSales, { type: 'bar', data: { labels: ['Fev 26', 'Mar 26', 'Abr 26', 'Maio 26'], datasets: [{ label: 'Faturamento Bruto (x1000 R$)', data: [120, 195, 140, 182], backgroundColor: 'rgba(37, 99, 235, 0.75)', borderColor: '#2563EB', borderWidth: 1, borderRadius: 6 }, { label: 'Lucro Líquido Real (x1000 R$)', data: [14, 23, 16, 21], backgroundColor: 'rgba(16, 185, 129, 0.75)', borderColor: '#10B981', borderWidth: 1, borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12 } } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } } });
    }
    const ctxLeads = document.getElementById('chart-leads-origin');
    if (ctxLeads) {
        const originCounts = {};
        leads.forEach(l => { originCounts[l.origin] = (originCounts[l.origin] || 0) + 1; });
        if (chartLeadsOriginInstance) chartLeadsOriginInstance.destroy();
        chartLeadsOriginInstance = new Chart(ctxLeads, { type: 'doughnut', data: { labels: Object.keys(originCounts).length > 0 ? Object.keys(originCounts) : ["Nenhum"], datasets: [{ data: Object.values(originCounts).length > 0 ? Object.values(originCounts) : [1], backgroundColor: ['#2563EB', '#8B5CF6', '#F59E0B', '#10B981', '#6B7280'], borderWidth: 2, borderColor: '#1F2937' }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 10, font: { size: 11 } } } } } });
    }
    const ctxGiro = document.getElementById('chart-giro-estoque');
    if (ctxGiro) {
        if (chartGiroEstoqueInstance) chartGiroEstoqueInstance.destroy();
        const convCars = estoque.filter(c => c.type === 'convencional' && c.status !== 'vendido');
        const repCars = estoque.filter(c => c.type === 'repasse' && c.status !== 'vendido');
        const avgConv = convCars.length > 0 ? (convCars.reduce((sum, c) => sum + c.daysInStock, 0) / convCars.length) : 0;
        const avgRep = repCars.length > 0 ? (repCars.reduce((sum, c) => sum + c.daysInStock, 0) / repCars.length) : 0;
        chartGiroEstoqueInstance = new Chart(ctxGiro, { type: 'bar', data: { labels: ['Venda Convencional', 'Repasse Rápido'], datasets: [{ label: 'Dias Médios em Estoque', data: [avgConv.toFixed(0), avgRep.toFixed(0)], backgroundColor: ['rgba(37, 99, 235, 0.8)', 'rgba(139, 92, 246, 0.8)'], borderWidth: 1, borderRadius: 6, barThickness: 40 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { display: false } } } } });
    }
}

// --------------------------------------------------------------------------
// H. ESTOQUE - RENDERIZAÇÃO + EDIÇÃO + EXCLUSÃO
// --------------------------------------------------------------------------
function renderEstoqueTable(filterStatus = 'todos', searchQuery = '') {
    const tableBody = document.getElementById("estoque-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    let filteredCars = estoque.filter(car => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = car.model.toLowerCase().includes(query) || car.year.toLowerCase().includes(query);
        const matchesStatus = filterStatus === 'todos' || car.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    filteredCars.forEach(car => {
        const lucroEst = car.sellPrice - car.buyPrice;
        const margemEst = car.sellPrice > 0 ? (lucroEst / car.sellPrice) * 100 : 0;
        const isParado = car.daysInStock > 30 && car.status !== 'vendido';
        const daysClass = isParado ? "stock-days alert" : "stock-days";
        const daysContent = isParado ? `<i data-lucide="alert-triangle"></i> ${car.daysInStock} dias` : `${car.daysInStock} d`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><div class="car-cell"><div class="car-thumb"><i data-lucide="car"></i></div><div class="car-info"><h4>${car.model}</h4><span>ID: #${car.id}</span></div></div></td>
            <td>${car.year}</td>
            <td style="font-family:monospace">${car.km.toLocaleString('pt-BR')} km</td>
            <td style="font-family:monospace">${formatCurrency(car.buyPrice)}</td>
            <td style="font-family:monospace; font-weight:600">${formatCurrency(car.sellPrice)}</td>
            <td><div style="font-weight:600; color: var(--green-profit)">${formatCurrency(lucroEst)}</div><div style="font-size:11px; color: var(--text-muted)">${margemEst.toFixed(1)}% margem</div></td>
            <td><span class="${daysClass}">${daysContent}</span></td>
            <td><span class="badge ${car.type}">${car.type === 'repasse' ? 'repasse' : 'varejo'}</span></td>
            <td><span class="badge ${car.status}">${car.status}</span></td>
            <td style="text-align: center;">
                <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
                    <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px" onclick="openEditCarModal(${car.id})" title="Editar"><i data-lucide="pencil" style="width:12px;height:12px;"></i></button>
                    ${car.status !== 'vendido' ? `<button class="btn btn-success" style="padding:4px 8px; font-size:11px" onclick="openSellCarModal(${car.id})" title="Vender"><i data-lucide="badge-dollar-sign" style="width:12px;height:12px;"></i></button>` : ''}
                    <button class="btn" style="padding:4px 8px; font-size:11px; background-color:rgba(239,68,68,0.15); color:var(--red-alert); border:1px solid rgba(239,68,68,0.2)" onclick="deleteCarConfirm(${car.id})" title="Excluir"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
            </td>`;
        tableBody.appendChild(tr);
    });
    lucide.createIcons();
}

function filterEstoqueTable() {
    const q = document.getElementById("search-estoque").value;
    const activeFilter = document.querySelector("#filter-estoque-group .filter-btn.active").innerText.toLowerCase();
    let mappedFilter = 'todos';
    if (activeFilter.includes('dispon')) mappedFilter = 'disponivel';
    else if (activeFilter.includes('prepara')) mappedFilter = 'preparacao';
    else if (activeFilter.includes('reserva')) mappedFilter = 'reservado';
    else if (activeFilter.includes('vendido')) mappedFilter = 'vendido';
    renderEstoqueTable(mappedFilter, q);
}

function filterEstoqueStatus(status) {
    document.querySelectorAll("#filter-estoque-group .filter-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");
    const q = document.getElementById("search-estoque").value;
    renderEstoqueTable(status, q);
}

// Editar Veículo
function openEditCarModal(carId) {
    const car = estoque.find(c => c.id === carId);
    if (!car) return;
    document.getElementById("edit-car-id").value = car.id;
    document.getElementById("edit-car-brand-model").value = car.model;
    document.getElementById("edit-car-year").value = car.year;
    document.getElementById("edit-car-km").value = car.km;
    document.getElementById("edit-car-buy-val").value = car.buyPrice;
    document.getElementById("edit-car-sell-val").value = car.sellPrice;
    document.getElementById("edit-car-type").value = car.type;
    document.getElementById("edit-car-status").value = car.status;
    document.getElementById("edit-car-days").value = car.daysInStock;
    document.getElementById("modal-edit-car").classList.add("active");
}

function closeEditCarModal() {
    document.getElementById("modal-edit-car").classList.remove("active");
}

async function saveEditCar(event) {
    event.preventDefault();
    const carId = parseInt(document.getElementById("edit-car-id").value);
    const model = document.getElementById("edit-car-brand-model").value;
    const year = document.getElementById("edit-car-year").value;
    const km = parseInt(document.getElementById("edit-car-km").value);
    const buyPrice = parseFloat(document.getElementById("edit-car-buy-val").value);
    const sellPrice = parseFloat(document.getElementById("edit-car-sell-val").value);
    const type = document.getElementById("edit-car-type").value;
    const status = document.getElementById("edit-car-status").value;
    const daysInStock = parseInt(document.getElementById("edit-car-days").value) || 0;

    if (isCloudActive) {
        try {
            await supabaseClient.from('estoque').update({ model, year, km, buy_price: buyPrice, sell_price: sellPrice, type, status, days_in_stock: daysInStock }).eq('id', carId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        const car = estoque.find(c => c.id === carId);
        if (car) Object.assign(car, { model, year, km, buyPrice, sellPrice, type, status, daysInStock });
        persistLocalData();
    }
    updateApplicationState();
    closeEditCarModal();
}

// Excluir Veículo
async function deleteCarConfirm(carId) {
    const car = estoque.find(c => c.id === carId);
    if (!car) return;
    if (!confirm(`Tem certeza que deseja excluir "${car.model}"? Esta ação não pode ser desfeita.`)) return;
    if (isCloudActive) {
        try {
            await supabaseClient.from('estoque').delete().eq('id', carId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        estoque = estoque.filter(c => c.id !== carId);
        persistLocalData();
    }
    updateApplicationState();
}

// --------------------------------------------------------------------------
// I. LEADS / KANBAN
// --------------------------------------------------------------------------
function renderKanban(searchQuery = '') {
    const columns = ['novo lead', 'contato realizado', 'negociação', 'sem resposta', 'fechado', 'perdido'];
    columns.forEach(col => {
        const container = document.getElementById(`cards-${col.replace(' ', '-')}`);
        if (container) container.innerHTML = "";
    });
    let filteredLeads = leads.filter(l => {
        const q = searchQuery.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.phone.includes(q);
    });
    const colCounts = { 'novo lead': 0, 'contato realizado': 0, 'negociação': 0, 'sem resposta': 0, 'fechado': 0, 'perdido': 0 };
    filteredLeads.forEach(lead => {
        colCounts[lead.status]++;
        const car = estoque.find(c => c.id === lead.interestCarId);
        const carModel = car ? car.model : "Geral / Sem Carro";
        const card = document.createElement("div");
        card.className = "lead-card";
        card.draggable = true;
        card.setAttribute("ondragstart", `dragLead(event, ${lead.id})`);
        const isNegligenciado = lead.lastContactDays > 10 && lead.status !== 'fechado' && lead.status !== 'perdido';
        const contactClass = isNegligenciado ? "lead-last-contact forgotten" : "lead-last-contact";
        const contactIcon = isNegligenciado ? "alert-triangle" : "clock";
        const contactLabel = isNegligenciado ? `Esquecido há ${lead.lastContactDays}d` : `Contato há ${lead.lastContactDays}d`;
        card.innerHTML = `
            <div class="lead-top">
                <span class="lead-name">${lead.name}</span>
                <span class="lead-origin">${lead.origin}</span>
            </div>
            <div class="lead-interest"><i data-lucide="car"></i><span>${carModel}</span></div>
            <div class="lead-divider"></div>
            <div class="lead-footer">
                <span class="${contactClass}"><i data-lucide="${contactIcon}"></i>${contactLabel}</span>
                <div style="display:flex;gap:4px;">
                    <button class="lead-actions-btn" onclick="openEditLeadModal(${lead.id})" title="Editar"><i data-lucide="pencil"></i></button>
                    <button class="lead-actions-btn" onclick="openTimelineModal(${lead.id})" title="Histórico"><i data-lucide="message-square-plus"></i></button>
                    <button class="lead-actions-btn" style="color:var(--red-alert)" onclick="deleteLeadConfirm(${lead.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
            </div>`;
        const colId = `cards-${lead.status.replace(' ', '-')}`;
        const container = document.getElementById(colId);
        if (container) container.appendChild(card);
    });
    columns.forEach(col => {
        const label = document.getElementById(`count-${col.replace(' ', '-')}`);
        if (label) label.innerText = colCounts[col];
    });
    lucide.createIcons();
}

let draggedLeadId = null;
function dragLead(event, id) { draggedLeadId = id; event.dataTransfer.setData("text", id); }
function allowDrop(event) { event.preventDefault(); }

async function dropLead(event, newStatus) {
    event.preventDefault();
    const id = draggedLeadId || parseInt(event.dataTransfer.getData("text"));
    const lead = leads.find(l => l.id === id);
    if (lead && lead.status !== newStatus) {
        if (isCloudActive) {
            try {
                await supabaseClient.from('leads').update({ status: newStatus, last_contact_days: 0 }).eq('id', id);
                await supabaseClient.from('interactions').insert({ lead_id: id, date: 'Hoje', text: `Lead movido para: ${newStatus.toUpperCase()}` });
                await fetchCloudData();
            } catch (e) { console.error(e); }
        } else {
            lead.status = newStatus;
            lead.lastContactDays = 0;
            lead.interactions.push({ date: "Hoje", text: `Lead movido para: ${newStatus.toUpperCase()}` });
            persistLocalData();
        }
        if (newStatus === 'fechado') openSellCarModal(lead.interestCarId, lead.name);
        else updateApplicationState();
    }
}

function renderLeadsList(searchQuery = '') {
    const listBody = document.getElementById("leads-list-body");
    if (!listBody) return;
    listBody.innerHTML = "";
    let filteredLeads = leads.filter(l => {
        const q = searchQuery.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.phone.includes(q);
    });
    filteredLeads.forEach(lead => {
        const car = estoque.find(c => c.id === lead.interestCarId);
        const carModel = car ? car.model : "Sem Carro";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${lead.name}</strong></td>
            <td>${lead.phone}</td>
            <td><i data-lucide="car" style="width:14px;vertical-align:middle;margin-right:4px;"></i>${carModel}</td>
            <td><span class="badge convencional" style="font-size:10px">${lead.origin}</span></td>
            <td><span class="badge ${lead.status}">${lead.status}</span></td>
            <td>${lead.lastContactDays} dias atrás</td>
            <td style="color: var(--text-muted); font-style:italic">${lead.nextAction}</td>
            <td style="text-align: center;">
                <div style="display:flex;gap:6px;justify-content:center;">
                    <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="openEditLeadModal(${lead.id})"><i data-lucide="pencil" style="width:12px;height:12px;"></i></button>
                    <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="openTimelineModal(${lead.id})"><i data-lucide="clock" style="width:12px;height:12px;"></i></button>
                    <button class="btn" style="padding:4px 8px;font-size:11px;background-color:rgba(239,68,68,0.15);color:var(--red-alert);border:1px solid rgba(239,68,68,0.2)" onclick="deleteLeadConfirm(${lead.id})"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
            </td>`;
        listBody.appendChild(tr);
    });
    lucide.createIcons();
}

function filterKanban() {
    const q = document.getElementById("search-leads").value;
    if (leadViewMode === 'kanban') renderKanban(q);
    else renderLeadsList(q);
}

// Editar Lead
function openEditLeadModal(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    populateCarSelects('edit-lead-interest');
    document.getElementById("edit-lead-id").value = lead.id;
    document.getElementById("edit-lead-name").value = lead.name;
    document.getElementById("edit-lead-phone").value = lead.phone;
    document.getElementById("edit-lead-interest").value = lead.interestCarId;
    document.getElementById("edit-lead-origin").value = lead.origin;
    document.getElementById("edit-lead-status").value = lead.status;
    document.getElementById("modal-edit-lead").classList.add("active");
}

function closeEditLeadModal() {
    document.getElementById("modal-edit-lead").classList.remove("active");
}

async function saveEditLead(event) {
    event.preventDefault();
    const leadId = parseInt(document.getElementById("edit-lead-id").value);
    const name = document.getElementById("edit-lead-name").value;
    const phone = document.getElementById("edit-lead-phone").value;
    const interestCarId = parseInt(document.getElementById("edit-lead-interest").value);
    const origin = document.getElementById("edit-lead-origin").value;
    const status = document.getElementById("edit-lead-status").value;

    if (isCloudActive) {
        try {
            await supabaseClient.from('leads').update({ name, phone, interest_car_id: interestCarId, origin, status }).eq('id', leadId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        const lead = leads.find(l => l.id === leadId);
        if (lead) Object.assign(lead, { name, phone, interestCarId, origin, status });
        persistLocalData();
    }
    updateApplicationState();
    closeEditLeadModal();
}

// Excluir Lead
async function deleteLeadConfirm(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    if (!confirm(`Excluir o lead "${lead.name}"? Esta ação não pode ser desfeita.`)) return;
    if (isCloudActive) {
        try {
            await supabaseClient.from('interactions').delete().eq('lead_id', leadId);
            await supabaseClient.from('leads').delete().eq('id', leadId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        leads = leads.filter(l => l.id !== leadId);
        persistLocalData();
    }
    updateApplicationState();
}

// --------------------------------------------------------------------------
// J. VENDAS - RENDERIZAÇÃO + EDIÇÃO + EXCLUSÃO
// --------------------------------------------------------------------------
function renderVendasTable() {
    const body = document.getElementById("vendas-table-body");
    if (!body) return;
    body.innerHTML = "";
    [...vendas].reverse().forEach(v => {
        const car = estoque.find(c => c.id === v.carId) || { model: "Veículo de Giro", buyPrice: 0 };
        const dateObj = new Date(v.date);
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${v.client}</strong></td>
            <td><span style="font-weight:600">${car.model}</span></td>
            <td style="font-family:monospace; font-weight:600">${formatCurrency(v.sellPrice)}</td>
            <td style="font-family:monospace; color: var(--green-profit); font-weight:600">${formatCurrency(v.profit)}</td>
            <td style="font-family:monospace">${v.margin.toFixed(1)}%</td>
            <td><span class="badge ${v.type}">${v.type === 'repasse' ? 'repasse' : 'varejo'}</span></td>
            <td style="text-align: center;">
                <div style="display:flex;gap:6px;justify-content:center;">
                    <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="openEditVendaModal(${v.id})" title="Editar"><i data-lucide="pencil" style="width:12px;height:12px;"></i></button>
                    <button class="btn" style="padding:4px 8px;font-size:11px;background-color:rgba(239,68,68,0.15);color:var(--red-alert);border:1px solid rgba(239,68,68,0.2)" onclick="deleteVendaConfirm(${v.id})" title="Excluir"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
            </td>`;
        body.appendChild(tr);
    });
    lucide.createIcons();
}

function openEditVendaModal(vendaId) {
    const v = vendas.find(v => v.id === vendaId);
    if (!v) return;
    document.getElementById("edit-venda-id").value = v.id;
    document.getElementById("edit-venda-client").value = v.client;
    document.getElementById("edit-venda-price").value = v.sellPrice;
    document.getElementById("edit-venda-profit").value = v.profit;
    document.getElementById("edit-venda-margin").value = v.margin;
    document.getElementById("edit-venda-date").value = v.date;
    document.getElementById("edit-venda-type").value = v.type;
    document.getElementById("modal-edit-venda").classList.add("active");
}

function closeEditVendaModal() {
    document.getElementById("modal-edit-venda").classList.remove("active");
}

async function saveEditVenda(event) {
    event.preventDefault();
    const vendaId = parseInt(document.getElementById("edit-venda-id").value);
    const client = document.getElementById("edit-venda-client").value;
    const sellPrice = parseFloat(document.getElementById("edit-venda-price").value);
    const profit = parseFloat(document.getElementById("edit-venda-profit").value);
    const margin = parseFloat(document.getElementById("edit-venda-margin").value);
    const date = document.getElementById("edit-venda-date").value;
    const type = document.getElementById("edit-venda-type").value;

    if (isCloudActive) {
        try {
            await supabaseClient.from('vendas').update({ client, sell_price: sellPrice, profit, margin, date, type }).eq('id', vendaId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        const v = vendas.find(v => v.id === vendaId);
        if (v) Object.assign(v, { client, sellPrice, profit, margin, date, type });
        persistLocalData();
    }
    updateApplicationState();
    closeEditVendaModal();
}

async function deleteVendaConfirm(vendaId) {
    if (!confirm("Excluir esta venda do histórico? Esta ação não pode ser desfeita.")) return;
    if (isCloudActive) {
        try {
            await supabaseClient.from('vendas').delete().eq('id', vendaId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        vendas = vendas.filter(v => v.id !== vendaId);
        persistLocalData();
    }
    updateApplicationState();
}

// --------------------------------------------------------------------------
// K. FINANCEIRO
// --------------------------------------------------------------------------
function renderFinanceiro() {
    const finTableBody = document.getElementById("financeiro-table-body");
    if (!finTableBody) return;
    finTableBody.innerHTML = "";
    const entradas = vendas.reduce((sum, v) => sum + v.sellPrice, 0);
    document.getElementById("fin-entradas").innerText = formatCurrency(entradas);
    const saidasCompraEstoque = estoque.reduce((sum, car) => sum + car.buyPrice, 0);
    document.getElementById("fin-saidas").innerText = formatCurrency(saidasCompraEstoque);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.val, 0);
    document.getElementById("fin-despesas").innerText = formatCurrency(totalDespesas);
    const custoVendas = vendas.reduce((sum, v) => { const car = estoque.find(c => c.id === v.carId); return sum + (car ? car.buyPrice : 0); }, 0);
    const liquidoReal = entradas - custoVendas - totalDespesas;
    document.getElementById("fin-liquido").innerText = formatCurrency(liquidoReal);
    [...despesas].reverse().forEach(d => {
        const car = estoque.find(c => c.id === d.carId);
        const carName = car ? car.model : "Geral (Sem Carro)";
        const dateObj = new Date(d.date);
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${d.desc}</td>
            <td style="color:var(--text-muted)">${carName}</td>
            <td><span class="badge convencional" style="font-size:10px">${d.category}</span></td>
            <td style="font-family:monospace; color:var(--red-alert); font-weight:600">-${formatCurrency(d.val)}</td>
            <td style="text-align:center;">
                <div style="display:flex;gap:6px;justify-content:center;">
                    <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="openEditDespesaModal(${d.id})"><i data-lucide="pencil" style="width:12px;height:12px;"></i></button>
                    <button class="btn" style="padding:4px 8px;font-size:11px;background-color:rgba(239,68,68,0.15);color:var(--red-alert);border:1px solid rgba(239,68,68,0.2)" onclick="deleteDespesaConfirm(${d.id})"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
            </td>`;
        finTableBody.appendChild(tr);
    });
    populateDespesaCarSelect();
    initFinanceChart();
    lucide.createIcons();
}

function openEditDespesaModal(despesaId) {
    const d = despesas.find(d => d.id === despesaId);
    if (!d) return;
    populateDespesaCarSelect('edit-exp-car');
    document.getElementById("edit-exp-id").value = d.id;
    document.getElementById("edit-exp-desc").value = d.desc;
    document.getElementById("edit-exp-val").value = d.val;
    document.getElementById("edit-exp-date").value = d.date;
    document.getElementById("edit-exp-car").value = d.carId || '';
    document.getElementById("edit-exp-cat").value = d.category;
    document.getElementById("modal-edit-despesa").classList.add("active");
}

function closeEditDespesaModal() {
    document.getElementById("modal-edit-despesa").classList.remove("active");
}

async function saveEditDespesa(event) {
    event.preventDefault();
    const despesaId = parseInt(document.getElementById("edit-exp-id").value);
    const desc = document.getElementById("edit-exp-desc").value;
    const val = parseFloat(document.getElementById("edit-exp-val").value);
    const date = document.getElementById("edit-exp-date").value;
    const carIdVal = document.getElementById("edit-exp-car").value;
    const carId = carIdVal ? parseInt(carIdVal) : null;
    const category = document.getElementById("edit-exp-cat").value;

    if (isCloudActive) {
        try {
            await supabaseClient.from('despesas').update({ description: desc, val, date, car_id: carId, category }).eq('id', despesaId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        const d = despesas.find(d => d.id === despesaId);
        if (d) Object.assign(d, { desc, val, date, carId, category });
        persistLocalData();
    }
    updateApplicationState();
    closeEditDespesaModal();
}

async function deleteDespesaConfirm(despesaId) {
    if (!confirm("Excluir esta despesa? Esta ação não pode ser desfeita.")) return;
    if (isCloudActive) {
        try {
            await supabaseClient.from('despesas').delete().eq('id', despesaId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        despesas = despesas.filter(d => d.id !== despesaId);
        persistLocalData();
    }
    updateApplicationState();
}

function initFinanceChart() {
    const ctx = document.getElementById('chart-finance-distribution');
    if (!ctx) return;
    const categoriesSum = {};
    despesas.forEach(d => { categoriesSum[d.category] = (categoriesSum[d.category] || 0) + d.val; });
    if (chartFinanceInstance) chartFinanceInstance.destroy();
    chartFinanceInstance = new Chart(ctx, { type: 'pie', data: { labels: Object.keys(categoriesSum).length > 0 ? Object.keys(categoriesSum) : ["Nenhum Gasto"], datasets: [{ data: Object.values(categoriesSum).length > 0 ? Object.values(categoriesSum) : [1], backgroundColor: ['#EF4444', '#F59E0B', '#2563EB', '#8B5CF6'], borderWidth: 1, borderColor: '#1F2937' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } } } } });
}

// --------------------------------------------------------------------------
// L. AGENDA - RENDERIZAÇÃO + EDIÇÃO + EXCLUSÃO
// --------------------------------------------------------------------------
function renderAgendaTimeline() {
    const timeline = document.getElementById("agenda-timeline-body");
    if (!timeline) return;
    timeline.innerHTML = "";
    const sortedAgenda = [...agenda].sort((a, b) => a.time.localeCompare(b.time));
    sortedAgenda.forEach(evt => {
        const car = estoque.find(c => c.id === evt.carId);
        const carText = car ? `<div class="event-car"><i data-lucide="car"></i> ${car.model}</div>` : '';
        const item = document.createElement("div");
        item.className = `timeline-event ${evt.category}`;
        item.innerHTML = `
            <div class="event-time">${evt.time}</div>
            <div class="event-badge-line"><span class="event-circle"></span></div>
            <div class="event-content">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <h4>${evt.title}</h4>
                        <p>${evt.desc}</p>
                        ${carText}
                    </div>
                    <div style="display:flex;gap:6px;flex-shrink:0;margin-left:12px;">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="openEditAgendaModal(${evt.id})" title="Editar"><i data-lucide="pencil" style="width:12px;height:12px;"></i></button>
                        <button class="btn" style="padding:4px 8px;font-size:11px;background-color:rgba(239,68,68,0.15);color:var(--red-alert);border:1px solid rgba(239,68,68,0.2)" onclick="deleteAgendaConfirm(${evt.id})" title="Excluir"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                    </div>
                </div>
            </div>`;
        timeline.appendChild(item);
    });
    populateAgendaCarSelect();
    lucide.createIcons();
}

function openEditAgendaModal(agendaId) {
    const evt = agenda.find(a => a.id === agendaId);
    if (!evt) return;
    populateAgendaCarSelect('edit-age-car');
    document.getElementById("edit-age-id").value = evt.id;
    document.getElementById("edit-age-title").value = evt.title;
    document.getElementById("edit-age-date").value = evt.date;
    document.getElementById("edit-age-time").value = evt.time;
    document.getElementById("edit-age-car").value = evt.carId || '';
    document.getElementById("edit-age-cat").value = evt.category;
    document.getElementById("edit-age-desc").value = evt.desc;
    document.getElementById("modal-edit-agenda").classList.add("active");
}

function closeEditAgendaModal() {
    document.getElementById("modal-edit-agenda").classList.remove("active");
}

async function saveEditAgenda(event) {
    event.preventDefault();
    const agendaId = parseInt(document.getElementById("edit-age-id").value);
    const title = document.getElementById("edit-age-title").value;
    const date = document.getElementById("edit-age-date").value;
    const time = document.getElementById("edit-age-time").value;
    const carIdVal = document.getElementById("edit-age-car").value;
    const carId = carIdVal ? parseInt(carIdVal) : null;
    const category = document.getElementById("edit-age-cat").value;
    const desc = document.getElementById("edit-age-desc").value;

    if (isCloudActive) {
        try {
            await supabaseClient.from('agenda').update({ title, date, time, car_id: carId, category, description: desc }).eq('id', agendaId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        const evt = agenda.find(a => a.id === agendaId);
        if (evt) Object.assign(evt, { title, date, time, carId, category, desc });
        persistLocalData();
    }
    updateApplicationState();
    closeEditAgendaModal();
}

async function deleteAgendaConfirm(agendaId) {
    if (!confirm("Excluir este compromisso da agenda? Esta ação não pode ser desfeita.")) return;
    if (isCloudActive) {
        try {
            await supabaseClient.from('agenda').delete().eq('id', agendaId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        agenda = agenda.filter(a => a.id !== agendaId);
        persistLocalData();
    }
    updateApplicationState();
}

// --------------------------------------------------------------------------
// M. SELECTS E FORMULÁRIOS
// --------------------------------------------------------------------------
function populateCarSelects(selectId = 'lead-interest') {
    const selectInterest = document.getElementById(selectId);
    if (!selectInterest) return;
    selectInterest.innerHTML = "";
    estoque.forEach(car => {
        if (car.status !== 'vendido') {
            const opt = document.createElement("option");
            opt.value = car.id;
            opt.innerText = `${car.model} (${car.year})`;
            selectInterest.appendChild(opt);
        }
    });
}

function populateDespesaCarSelect(selectId = 'exp-car') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Nenhum (Custo Operacional Geral)</option>';
    estoque.forEach(car => {
        if (car.status !== 'vendido') {
            const opt = document.createElement("option");
            opt.value = car.id;
            opt.innerText = car.model;
            select.appendChild(opt);
        }
    });
}

function populateAgendaCarSelect(selectId = 'age-car') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Sem carro associado</option>';
    estoque.forEach(car => {
        if (car.status !== 'vendido') {
            const opt = document.createElement("option");
            opt.value = car.id;
            opt.innerText = car.model;
            select.appendChild(opt);
        }
    });
}

// --------------------------------------------------------------------------
// N. MODAIS DE CRIAÇÃO (iguais ao original)
// --------------------------------------------------------------------------
function openAddLeadModal() { populateCarSelects('lead-interest'); document.getElementById("modal-add-lead").classList.add("active"); }
function closeAddLeadModal() { document.getElementById("modal-add-lead").classList.remove("active"); document.getElementById("form-add-lead").reset(); }

async function saveNewLead(event) {
    event.preventDefault();
    const name = document.getElementById("lead-name").value;
    const phone = document.getElementById("lead-phone").value;
    const interestCarId = parseInt(document.getElementById("lead-interest").value);
    const origin = document.getElementById("lead-origin").value;
    const status = document.getElementById("lead-status").value;
    if (isCloudActive) {
        try {
            const { data, error } = await supabaseClient.from('leads').insert({ name, phone, interest_car_id: interestCarId, origin, status, last_contact_days: 0, next_action: "Mapear primeira proposta" }).select();
            if (!error && data && data.length > 0) await supabaseClient.from('interactions').insert({ lead_id: data[0].id, date: 'Hoje', text: 'Lead criado no sistema.' });
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        leads.unshift({ id: leads.length + 1, name, phone, interestCarId, origin, status, lastContactDays: 0, nextAction: "Mapear primeira proposta", interactions: [{ date: "Hoje", text: "Lead criado no sistema." }] });
        persistLocalData();
    }
    updateApplicationState();
    closeAddLeadModal();
}

function openAddCarModal() { document.getElementById("modal-add-car").classList.add("active"); }
function closeAddCarModal() { document.getElementById("modal-add-car").classList.remove("active"); document.getElementById("form-add-car").reset(); }

async function saveNewCar(event) {
    event.preventDefault();
    const model = document.getElementById("car-brand-model").value;
    const year = document.getElementById("car-year").value;
    const km = parseInt(document.getElementById("car-km").value);
    const buyPrice = parseFloat(document.getElementById("car-buy-val").value);
    const sellPrice = parseFloat(document.getElementById("car-sell-val").value);
    const type = document.getElementById("car-type").value;
    const status = document.getElementById("car-status").value;
    const daysInStock = parseInt(document.getElementById("car-days").value) || 0;
    if (isCloudActive) {
        try {
            await supabaseClient.from('estoque').insert({ model, year, km, buy_price: buyPrice, sell_price: sellPrice, type, status, days_in_stock: daysInStock });
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        estoque.unshift({ id: estoque.length + 1, model, year, km, buyPrice, sellPrice, daysInStock, status, type });
        persistLocalData();
    }
    updateApplicationState();
    closeAddCarModal();
}

let activeTimelineLeadId = null;
function openTimelineModal(leadId) {
    activeTimelineLeadId = leadId;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    document.getElementById("timeline-client-name").innerText = `Histórico & Ações: ${lead.name}`;
    document.getElementById("interaction-lead-id").value = leadId;
    const container = document.getElementById("timeline-events-container");
    container.innerHTML = "";
    lead.interactions.forEach(item => {
        const div = document.createElement("div");
        div.className = "timeline-modal-item";
        div.innerHTML = `<div class="timeline-item-meta"><span>Registrado em:</span><strong>${item.date}</strong></div><p class="timeline-item-desc">${item.text}</p>`;
        container.appendChild(div);
    });
    document.getElementById("modal-lead-timeline").classList.add("active");
}

function closeTimelineModal() { document.getElementById("modal-lead-timeline").classList.remove("active"); document.getElementById("form-add-interaction").reset(); }

async function addLeadInteraction(event) {
    event.preventDefault();
    const text = document.getElementById("interaction-text").value;
    const nextAction = document.getElementById("interaction-next").value;
    const newStatus = document.getElementById("interaction-status").value;
    const lead = leads.find(l => l.id === activeTimelineLeadId);
    if (lead) {
        if (isCloudActive) {
            try {
                await supabaseClient.from('interactions').insert({ lead_id: activeTimelineLeadId, date: 'Hoje', text });
                const updatePayload = { next_action: nextAction, last_contact_days: 0 };
                if (newStatus !== 'no-change') updatePayload.status = newStatus;
                await supabaseClient.from('leads').update(updatePayload).eq('id', activeTimelineLeadId);
                await fetchCloudData();
            } catch (e) { console.error(e); }
        } else {
            lead.interactions.push({ date: "Hoje", text });
            lead.nextAction = nextAction;
            lead.lastContactDays = 0;
            if (newStatus !== 'no-change') lead.status = newStatus;
            persistLocalData();
        }
        updateApplicationState();
        closeTimelineModal();
    }
}

function openSellCarModal(carId, clientName = '') {
    const car = estoque.find(c => c.id === carId);
    if (!car) return;
    document.getElementById("sell-car-id").value = carId;
    document.getElementById("sell-car-name").value = `${car.model} (${car.year})`;
    document.getElementById("sell-client-name").value = clientName;
    document.getElementById("sell-price").value = car.sellPrice;
    document.getElementById("sell-date").value = new Date().toISOString().split('T')[0];
    document.getElementById("modal-sell-car").classList.add("active");
}

function closeSellModal() { document.getElementById("modal-sell-car").classList.remove("active"); document.getElementById("form-sell-car").reset(); }

async function saveSale(event) {
    event.preventDefault();
    const carId = parseInt(document.getElementById("sell-car-id").value);
    const client = document.getElementById("sell-client-name").value;
    const sellPrice = parseFloat(document.getElementById("sell-price").value);
    const date = document.getElementById("sell-date").value;
    const type = document.getElementById("sell-type").value;
    const car = estoque.find(c => c.id === carId);
    if (car) {
        const despesasCarro = despesas.filter(d => d.carId === carId).reduce((sum, d) => sum + d.val, 0);
        const profit = sellPrice - car.buyPrice - despesasCarro;
        const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
        if (isCloudActive) {
            try {
                await supabaseClient.from('estoque').update({ status: 'vendido', sell_price: sellPrice }).eq('id', carId);
                await supabaseClient.from('vendas').insert({ car_id: carId, client, sell_price: sellPrice, date, profit, margin, type });
                const lead = leads.find(l => l.interestCarId === carId && l.status !== 'fechado');
                if (lead) { await supabaseClient.from('leads').update({ status: 'fechado' }).eq('id', lead.id); await supabaseClient.from('interactions').insert({ lead_id: lead.id, date: 'Hoje', text: `Venda formalizada! Valor de R$ ${sellPrice.toLocaleString('pt-BR')}` }); }
                await fetchCloudData();
            } catch (e) { console.error(e); }
        } else {
            car.status = 'vendido'; car.sellPrice = sellPrice;
            vendas.push({ id: vendas.length + 1, carId, client, sellPrice, date, profit, margin, type });
            const lead = leads.find(l => l.interestCarId === carId && l.status !== 'fechado');
            if (lead) { lead.status = 'fechado'; lead.interactions.push({ date: "Hoje", text: `Venda formalizada! Valor de R$ ${sellPrice.toLocaleString('pt-BR')}` }); }
            persistLocalData();
        }
        updateApplicationState();
        closeSellModal();
        switchTab('vendas');
    }
}

function openAddDespesaModal() { populateDespesaCarSelect('exp-car'); document.getElementById("modal-add-despesa").classList.add("active"); }
function closeAddDespesaModal() { document.getElementById("modal-add-despesa").classList.remove("active"); document.getElementById("form-add-despesa").reset(); }

async function saveNewDespesa(event) {
    event.preventDefault();
    const desc = document.getElementById("exp-desc").value;
    const val = parseFloat(document.getElementById("exp-val").value);
    const date = document.getElementById("exp-date").value;
    const carIdVal = document.getElementById("exp-car").value;
    const carId = carIdVal ? parseInt(carIdVal) : null;
    const category = document.getElementById("exp-cat").value;
    if (isCloudActive) {
        try { await supabaseClient.from('despesas').insert({ description: desc, car_id: carId, date, val, category }); await fetchCloudData(); }
        catch (e) { console.error(e); }
    } else {
        despesas.push({ id: despesas.length + 1, desc, carId, date, val, category });
        persistLocalData();
    }
    updateApplicationState();
    closeAddDespesaModal();
}

function openAddAgendaModal() { populateAgendaCarSelect('age-car'); document.getElementById("modal-add-agenda").classList.add("active"); }
function closeAddAgendaModal() { document.getElementById("modal-add-agenda").classList.remove("active"); document.getElementById("form-add-agenda").reset(); }

async function saveNewAgenda(event) {
    event.preventDefault();
    const title = document.getElementById("age-title").value;
    const date = document.getElementById("age-date").value;
    const time = document.getElementById("age-time").value;
    const carIdVal = document.getElementById("age-car").value;
    const carId = carIdVal ? parseInt(carIdVal) : null;
    const category = document.getElementById("age-cat").value;
    const desc = document.getElementById("age-desc").value;
    if (isCloudActive) {
        try { await supabaseClient.from('agenda').insert({ title, date, time, car_id: carId, category, description: desc }); await fetchCloudData(); }
        catch (e) { console.error(e); }
    } else {
        agenda.push({ id: agenda.length + 1, title, date, time, carId, category, desc });
        persistLocalData();
    }
    updateApplicationState();
    closeAddAgendaModal();
}

function setLeadView(mode) {
    leadViewMode = mode;
    document.getElementById('leads-kanban-view').style.display = mode === 'kanban' ? 'grid' : 'none';
    document.getElementById('leads-list-view').style.display = mode === 'lista' ? 'block' : 'none';
    document.getElementById('toggle-kanban').classList.toggle('active', mode === 'kanban');
    document.getElementById('toggle-lista').classList.toggle('active', mode === 'lista');
}

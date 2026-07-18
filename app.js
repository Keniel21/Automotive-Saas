// ==========================================================================
// AUTO DRIVE CRM - CONTROLLER COM SUPABASE & LOCAL FALLBACK (JS)
// VERSÃƒÆ’O 2.0 - COM EXPORTAÃƒâ€¡ÃƒÆ’O EXCEL, RECIBO PDF, UPLOADS E EDICÃƒÆ’O COMPLETA
// ==========================================================================

const SUPABASE_URL = "https://xjmyijeblktwncpivywh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbXlpamVibGt0d25jcGl2eXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTkxMzAsImV4cCI6MjA5NTAzNTEzMH0.AAn5z138QpB1VbcoZjDNMTflmcy97IIvhxK_b1de-eQ";

let supabaseClient = null;
let isCloudActive = false;
let sessionUser = null;

// --------------------------------------------------------------------------
// FILTRO DE PERÃƒÂODO GLOBAL
// --------------------------------------------------------------------------
let activePeriodFilter = '30d';  // padrÃƒÂ£o: ÃƒÂºltimos 30 dias
let customDateStart = null;
let customDateEnd = null;


// --------------------------------------------------------------------------
// B. BANCO DE DADOS LOCAL (FALLBACK)
// --------------------------------------------------------------------------

// Calcula quantos dias se passaram desde a data de compra
function calcDaysInStock(purchaseDate) {
    if (!purchaseDate) return 0;
    const bought = new Date(purchaseDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = today - bought;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

let estoque = [
    { id: 1, model: "Jeep Compass Longitude 2.0 Flex", year: "2021/2021", km: 42000, buyPrice: 110000, sellPrice: 125900, purchaseDate: "2026-05-20", status: "disponivel", type: "convencional", plate: "BRA2E26", color: "Cinza MetÃƒÂ¡lico", chassis: "9BWZZZ99Z99999123", image_url: null },
    { id: 2, model: "Toyota Corolla XEi 2.0 Flex", year: "2020/2020", km: 58000, buyPrice: 95000, sellPrice: 108500, purchaseDate: "2026-06-22", status: "reservado", type: "convencional", plate: "PLQ7D90", color: "Preto Cristal", chassis: "9BWZZZ99Z99999456", image_url: null },
    { id: 3, model: "Honda Civic EXL 2.0", year: "2019/2019", km: 64000, buyPrice: 88000, sellPrice: 99900, purchaseDate: "2026-05-30", status: "disponivel", type: "convencional", plate: "OGK3F88", color: "Branco PÃƒÂ©rola", chassis: "9BWZZZ99Z99999789", image_url: null },
    { id: 4, model: "VW Polo Comfortline 1.0 TSI", year: "2022/2023", km: 28000, buyPrice: 72000, sellPrice: 81900, purchaseDate: "2026-06-26", status: "preparacao", type: "convencional", plate: "RTS4G10", color: "Prata", chassis: "9BWZZZ99Z99999321", image_url: null },
    { id: 5, model: "Chevrolet Onix Plus LTZ Turbo", year: "2021/2021", km: 38000, buyPrice: 65000, sellPrice: 71000, purchaseDate: "2026-05-13", status: "disponivel", type: "repasse", plate: "HNS9F22", color: "Azul", chassis: "9BWZZZ99Z99999654", image_url: null },
    { id: 6, model: "Hyundai HB20 Evolution 1.0", year: "2020/2021", km: 49000, buyPrice: 53000, sellPrice: 58500, purchaseDate: "2026-06-12", status: "disponivel", type: "repasse", plate: "FTU4B44", color: "Vermelho", chassis: "9BWZZZ99Z99999987", image_url: null },
    { id: 7, model: "Ford Ka SE 1.0", year: "2019/2019", km: 75000, buyPrice: 38000, sellPrice: 42000, purchaseDate: "2026-06-30", status: "vendido", type: "repasse", plate: "KAS5H77", color: "Branco", chassis: "9BWZZZ99Z99999555", image_url: null }
];

let leads = [
    { id: 1, name: "Carlos Alberto Santos", phone: "(11) 98765-4321", interestCarId: 1, origin: "Instagram", status: "negociaÃƒÂ§ÃƒÂ£o", lastContactDays: 2, nextAction: "Enviar simulaÃƒÂ§ÃƒÂ£o de financiamento hoje ÃƒÂ  tarde", interactions: [{ date: "20/05/2026", text: "Cliente entrou em contato via direct perguntando sobre Jeep Compass." }, { date: "21/05/2026", text: "Fizemos contato via WhatsApp. Enviou proposta de veÃƒÂ­culo na troca." }] },
    { id: 2, name: "Mariana Costa", phone: "(21) 99123-4567", interestCarId: 2, origin: "WhatsApp", status: "novo lead", lastContactDays: 0, nextAction: "Fazer primeiro contato de apresentaÃƒÂ§ÃƒÂ£o", interactions: [{ date: "22/05/2026", text: "Lead gerado automaticamente via botÃƒÂ£o flutuante do site." }] },
    { id: 3, name: "Ricardo Mendes", phone: "(11) 97321-8901", interestCarId: 3, origin: "OLX/Webmotors", status: "sem resposta", lastContactDays: 14, nextAction: "Fazer ÃƒÂºltima tentativa de contato antes de arquivar", interactions: [{ date: "08/05/2026", text: "Cliente demonstrou interesse no Civic atravÃƒÂ©s da OLX." }, { date: "10/05/2026", text: "Enviei fotos adicionais do Civic. NÃƒÂ£o respondeu." }, { date: "15/05/2026", text: "Fiz cobranÃƒÂ§a de retorno. Sem resposta." }] },
    { id: 4, name: "Ana Beatriz Ramos", phone: "(31) 98456-1122", interestCarId: 4, origin: "IndicaÃƒÂ§ÃƒÂ£o", status: "contato realizado", lastContactDays: 4, nextAction: "Agendar vistoria cautelar na oficina", interactions: [{ date: "18/05/2026", text: "Indicada pelo primo. Gostou do Polo." }, { date: "20/05/2026", text: "Pediu para levar o carro para avaliaÃƒÂ§ÃƒÂ£o." }] },
    { id: 5, name: "Felipe Andrade Lins", phone: "(11) 99345-6789", interestCarId: 5, origin: "OLX/Webmotors", status: "sem resposta", lastContactDays: 32, nextAction: "Mudar status para perdido se nÃƒÂ£o responder", interactions: [{ date: "20/04/2026", text: "Perguntou sobre condiÃƒÂ§ÃƒÂµes de repasse no Onix." }, { date: "22/04/2026", text: "Enviado valor ÃƒÂ  vista de repasse. Sumiu." }] }
];

let clientes = [];
let vendas = [
    { id: 1, carId: 7, client: "AntÃƒÂ´nio da Silva Lojista", sellPrice: 41000, date: "2026-05-18", profit: 3000, margin: 7.3, type: "repasse" },
    { id: 2, carId: null, client: "Juliana Medeiros", sellPrice: 89000, date: "2026-05-10", profit: 12000, margin: 13.5, type: "convencional" },
    { id: 3, carId: null, client: "Gustavo Franco", sellPrice: 52000, date: "2026-05-02", profit: 6000, margin: 11.5, type: "convencional" }
];

// CalendÃƒÂ¡rio State
let currentCalendarDate = new Date();
let selectedAgendaDate = new Date();

let despesas = [
    { id: 1, desc: "Polimento Jeep Compass", carId: 1, date: "2026-05-12", val: 450, category: "PreparaÃƒÂ§ÃƒÂ£o" },
    { id: 2, desc: "HigienizaÃƒÂ§ÃƒÂ£o interna Honda Civic", carId: 3, date: "2026-05-15", val: 250, category: "PreparaÃƒÂ§ÃƒÂ£o" },
    { id: 3, desc: "Martelinho de Ouro Polo", carId: 4, date: "2026-05-20", val: 350, category: "PreparaÃƒÂ§ÃƒÂ£o" },
    { id: 4, desc: "Impulsionamento Instagram - Compass", carId: 1, date: "2026-05-05", val: 200, category: "Marketing" },
    { id: 5, desc: "Assinatura Planos Portais (Webmotors/OLX)", carId: null, date: "2026-05-01", val: 600, category: "Marketing" }
];

let agenda = [
    { id: 1, title: "ApresentaÃƒÂ§ÃƒÂ£o Jeep Compass", date: "2026-05-22", time: "14:30", carId: 1, category: "visitas", desc: "Levar veÃƒÂ­culo ao CondomÃƒÂ­nio Quinta da Boa Vista" },
    { id: 2, title: "Entrega do Toyota Corolla", date: "2026-05-23", time: "10:00", carId: 2, category: "entregas", desc: "Encontro no CartÃƒÂ³rio do 3Ã‚Âº OfÃƒÂ­cio para assinaturas" },
    { id: 3, title: "Levar Polo para Martelinho/EstÃƒÂ©tica", date: "2026-05-22", time: "16:00", carId: 4, category: "revisao", desc: "Oficina do Marquinhos Polimentos" },
    { id: 4, title: "Vistoria Cautelar Civic", date: "2026-05-24", time: "09:00", carId: 3, category: "documentos", desc: "Posto Super VisÃƒÂ£o Cautelares" }
];

let chartSalesProfitInstance = null;
let chartLeadsOriginInstance = null;
let chartGiroEstoqueInstance = null;
let chartFinanceInstance = null;
let leadViewMode = 'kanban';
let documentosVeiculo = [];
let pendingDocFiles = [];

// --------------------------------------------------------------------------
// C. INICIALIZAÃƒâ€¡ÃƒÆ’O
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    setupHeaderDate();

    // Registrar Service Worker para suporte PWA offline
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('./service-worker.js');
            console.log('Service Worker registrado com sucesso:', reg.scope);
        } catch (err) {
            console.error('Erro ao registrar Service Worker:', err);
        }
    }

    // Inicializa estado da sidebar
    let isSidebarCollapsed = localStorage.getItem("sidebar-collapsed") === "true";
    if (window.innerWidth <= 768) {
        isSidebarCollapsed = true; // ForÃƒÂ§a colapsado no celular por padrÃƒÂ£o
    }
    if (isSidebarCollapsed) {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar) sidebar.classList.add("collapsed");
        const toggleBtn = document.getElementById("sidebar-toggle-btn");
        if (toggleBtn) {
            toggleBtn.innerHTML = `<i data-lucide="chevron-right"></i>`;
        }
    }

    // Inicializa listeners do formulÃƒÂ¡rio de cadastro
    initializeSignupUI();

    // Global functions handle calendar navigation via onclick attributes in HTML

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
        if (localStorage.getItem("autodrive_clientes")) {
            clientes = JSON.parse(localStorage.getItem("autodrive_clientes"));
        }
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
        localStorage.setItem("autodrive_clientes", JSON.stringify(clientes));
    }
}

// --------------------------------------------------------------------------
// D. SUPABASE AUTH & DATA
// --------------------------------------------------------------------------
async function checkActiveSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (data.session) {
        sessionUser = data.session.user;

        try {
            const { data: profile, error: pError } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (pError || !profile || !profile.is_approved) {
                await supabaseClient.auth.signOut();
                sessionUser = null;
                const errorDiv = document.getElementById("login-error-message");
                if (errorDiv) {
                    errorDiv.innerText = "Acesso pendente: Sua conta estÃƒÂ¡ aguardando aprovaÃƒÂ§ÃƒÂ£o de um administrador.";
                    errorDiv.style.display = "block";
                    errorDiv.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
                    errorDiv.style.color = "var(--red-alert)";
                }
                document.getElementById("login-overlay").classList.add("active");
                return;
            }

            document.getElementById("login-overlay").classList.remove("active");
            document.getElementById("footer-username").innerText = sessionUser.email.split("@")[0].toUpperCase();
            document.getElementById("footer-avatar").innerText = sessionUser.email.substring(0, 2).toUpperCase();

            const menuUser = document.getElementById("menu-item-usuarios");
            if (menuUser) {
                menuUser.style.display = profile.is_admin ? "block" : "none";
            }

            await fetchCloudData();
            updateApplicationState();
            initCharts();
        } catch (e) {
            console.error("Erro ao validar sessÃƒÂ£o:", e);
            switchToDemoMode();
        }
    } else {
        document.getElementById("login-overlay").classList.add("active");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error-message");
    if (errorDiv) {
        errorDiv.style.display = "none";
        errorDiv.style.backgroundColor = "";
        errorDiv.style.color = "";
    }
    if (isCloudActive) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            if (errorDiv) {
                errorDiv.innerText = `Erro de AutenticaÃƒÂ§ÃƒÂ£o: ${error.message}`;
                errorDiv.style.display = "block";
                errorDiv.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
                errorDiv.style.color = "var(--red-alert)";
            }
        } else {
            sessionUser = data.user;

            try {
                const { data: profile, error: pError } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .single();

                if (pError || !profile || !profile.is_approved) {
                    await supabaseClient.auth.signOut();
                    sessionUser = null;
                    if (errorDiv) {
                        errorDiv.innerText = "Acesso pendente: Sua conta estÃƒÂ¡ aguardando aprovaÃƒÂ§ÃƒÂ£o de um administrador.";
                        errorDiv.style.display = "block";
                        errorDiv.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
                        errorDiv.style.color = "var(--red-alert)";
                    }
                    document.getElementById("login-overlay").classList.add("active");
                    return;
                }

                document.getElementById("login-overlay").classList.remove("active");
                document.getElementById("footer-username").innerText = sessionUser.email.split("@")[0].toUpperCase();
                document.getElementById("footer-avatar").innerText = sessionUser.email.substring(0, 2).toUpperCase();

                const menuUser = document.getElementById("menu-item-usuarios");
                if (menuUser) {
                    menuUser.style.display = profile.is_admin ? "block" : "none";
                }

                await fetchCloudData();
                updateApplicationState();
                initCharts();
            } catch (e) {
                console.error("Erro ao validar login:", e);
            }
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

        const menuUser = document.getElementById("menu-item-usuarios");
        if (menuUser) {
            menuUser.style.display = "none";
        }
    } else {
        window.location.reload();
    }
}

async function fetchCloudData() {
    if (!isCloudActive) return;
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.classList.add('skeleton-loading');
    try {
        const { data: est, error: errEst } = await supabaseClient.from('estoque').select('*').order('id', { ascending: false });
        if (!errEst) estoque = est.map(c => ({
            id: c.id,
            model: c.model,
            year: c.year,
            km: c.km,
            buyPrice: parseFloat(c.buy_price),
            sellPrice: parseFloat(c.sell_price),
            purchaseDate: c.purchase_date || null,
            status: c.status,
            type: c.type,
            plate: c.plate || "",
            color: c.color || "",
            chassis: c.chassis || "",
            renavam: c.renavam || "",
            documentStatus: c.document_status || "pendente",
            image_url: c.image_url || null,
            fipeCode: c.fipe_code || "",
            fipePrice: c.fipe_price || 0,
            notes: c.notes || ""
        }));

        const { data: ven } = await supabaseClient.from('vendas').select('*').order('date', { ascending: false });
        if (ven) vendas = ven.map(v => ({ id: v.id, carId: v.car_id, client: v.client, clientDocument: v.client_document, sellPrice: parseFloat(v.sell_price), date: v.date, profit: parseFloat(v.profit), margin: parseFloat(v.margin), type: v.type }));

        const { data: cli } = await supabaseClient.from('clientes').select('*').order('name', { ascending: true });
        if (cli) clientes = cli.map(c => ({ id: c.id, name: c.name, document: c.document, phone: c.phone, email: c.email, createdAt: c.created_at }));

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

        const { data: docs } = await supabaseClient.from('documentos_veiculo').select('*').order('created_at', { ascending: false });
        if (docs) documentosVeiculo = docs.map(d => ({ id: d.id, carId: d.car_id, fileName: d.file_name, fileUrl: d.file_url, fileType: d.file_type, description: d.description, createdAt: d.created_at }));
    } catch (e) {
        console.error("Falha ao sincronizar dados da nuvem: ", e);
    } finally {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.classList.remove('skeleton-loading');
    }
}

// --------------------------------------------------------------------------
// E. NAVEGAÃƒâ€¡ÃƒÆ’O
// --------------------------------------------------------------------------
function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebar-toggle-btn");
    if (!sidebar) return;
    sidebar.classList.toggle("collapsed");

    const isCollapsed = sidebar.classList.contains("collapsed");
    localStorage.setItem("sidebar-collapsed", isCollapsed);

    if (toggleBtn) {
        toggleBtn.innerHTML = isCollapsed
            ? `<i data-lucide="chevron-right"></i>`
            : `<i data-lucide="chevron-left"></i>`;
    }
    lucide.createIcons();
}

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
        'excel': { t: "Guia Visual do Excel", s: "Configurações de cores, fontes e fórmulas para replicar este visual" },
        'usuarios': { t: "Aprovações de Usuários", s: "Gerencie o acesso de novos operadores ao CRM" },
        'clientes': { t: "Gestão de Clientes", s: "Base de parceiros, lojas e compradores frequentes" }
    };
    document.getElementById("current-tab-title").innerText = titleObj[tabId] ? titleObj[tabId].t : "Aba";
    document.getElementById("current-tab-subtitle").innerText = titleObj[tabId] ? titleObj[tabId].s : "";
    if (tabId === 'dashboard') setTimeout(() => initCharts(), 50);
    else if (tabId === 'financeiro') setTimeout(() => initFinanceChart(), 50);
    else if (tabId === 'usuarios') loadProfiles();
    lucide.createIcons();
}

function updateApplicationState() {
    calculateKPIs();
    calculateCRMStats();
    renderEstoqueTable();
    populateCarSelects();
    renderKanban();
    renderLeadsList();
    renderVendasTable();
    renderFinanceiro();
    renderCalendar();
    renderAgendaTimeline();
    calculateClientesKPIs();
    renderClientesTable();

    // Atualiza a ficha técnica do carro se estiver aberta
    const carTab = document.getElementById('car-details-tab');
    if (carTab && carTab.classList.contains('active') && typeof currentCdCarId !== 'undefined' && currentCdCarId) {
        renderCarExpenses(currentCdCarId);
    }
}



// --------------------------------------------------------------------------
// F. KPIs
// --------------------------------------------------------------------------
function getFilteredDates() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let start = new Date(0);
    const end = today;

    if (activePeriodFilter === 'today') {
        start = new Date(); start.setHours(0, 0, 0, 0);
    } else if (activePeriodFilter === '7d') {
        start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    } else if (activePeriodFilter === '30d') {
        start = new Date(); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
    } else if (activePeriodFilter === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (activePeriodFilter === 'year') {
        start = new Date(today.getFullYear(), 0, 1);
    } else if (activePeriodFilter === 'custom') {
        start = customDateStart ? new Date(customDateStart + 'T00:00:00') : new Date(0);
        return { start, end: customDateEnd ? new Date(customDateEnd + 'T23:59:59') : today };
    } else {
        // 'all'
        start = new Date(0);
    }
    return { start, end };
}

function getPeriodLabel() {
    const labels = {
        'today': 'Hoje',
        '7d': 'ÃƒÅ¡ltimos 7 dias',
        '30d': 'ÃƒÅ¡ltimos 30 dias',
        'month': 'Este mÃƒÂªs',
        'year': 'Este ano',
        'all': 'Todo o perÃƒÂ­odo',
        'custom': customDateStart && customDateEnd
            ? `${customDateStart.split('-').reverse().join('/')} Ã¢â€ â€™ ${customDateEnd.split('-').reverse().join('/')}`
            : 'Personalizado'
    };
    return labels[activePeriodFilter] || '';
}

function applyPeriodFilter(preset) {
    activePeriodFilter = preset;
    updatePeriodUI();
    updateApplicationState();
    if (document.getElementById('dashboard-tab').classList.contains('active')) {
        setTimeout(() => initCharts(), 50);
    } else if (document.getElementById('financeiro-tab').classList.contains('active')) {
        setTimeout(() => initFinanceChart(), 50);
    }
}

function applyCustomPeriod() {
    // LÃƒÂª do campo do dashboard (fonte original)
    const s = document.getElementById('period-date-start');
    const e = document.getElementById('period-date-end');
    if (s && e && s.value && e.value) {
        customDateStart = s.value;
        customDateEnd = e.value;
        activePeriodFilter = 'custom';
        updatePeriodUI();
        updateApplicationState();
        if (document.getElementById('dashboard-tab').classList.contains('active')) {
            setTimeout(() => initCharts(), 50);
        } else if (document.getElementById('financeiro-tab').classList.contains('active')) {
            setTimeout(() => initFinanceChart(), 50);
        }
    }
}

// Chamado pelos inputs de data das abas Vendas e Financeiro
function syncAndApplyCustomPeriod(source) {
    const suffix = source === 'vendas' ? '-vendas' : '-financeiro';
    const s = document.getElementById('period-date-start' + suffix);
    const e = document.getElementById('period-date-end' + suffix);
    if (s && e && s.value && e.value) {
        customDateStart = s.value;
        customDateEnd = e.value;
        activePeriodFilter = 'custom';
        updatePeriodUI();
        updateApplicationState();
        if (document.getElementById('financeiro-tab').classList.contains('active')) {
            setTimeout(() => initFinanceChart(), 50);
        } else if (document.getElementById('dashboard-tab').classList.contains('active')) {
            setTimeout(() => initCharts(), 50);
        }
    }
}

function updatePeriodUI() {
    const label = getPeriodLabel();
    const isCustom = activePeriodFilter === 'custom';

    // Atualiza botÃƒÂµes ativos nas trÃƒÂªs barras
    const allGroups = ['period-btns-dashboard', 'period-btns-vendas', 'period-btns-financeiro'];
    const presetToText = {
        'today': 'Hoje', '7d': '7 dias', '30d': '30 dias',
        'month': 'Este mÃƒÂªs', 'year': 'Este ano', 'all': 'Tudo', 'custom': 'Personalizado'
    };
    allGroups.forEach(groupId => {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText.trim() === (presetToText[activePeriodFilter] || ''));
        });
    });

    // Exibe/esconde os inputs de data nas trÃƒÂªs barras e sincroniza os valores
    const customRangeIds = [
        'period-custom-range',
        'period-custom-range-vendas',
        'period-custom-range-financeiro'
    ];
    customRangeIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isCustom ? 'flex' : 'none';
    });

    // Sincroniza os valores das datas entre as trÃƒÂªs barras
    if (isCustom && customDateStart && customDateEnd) {
        const startIds = ['period-date-start', 'period-date-start-vendas', 'period-date-start-financeiro'];
        const endIds = ['period-date-end', 'period-date-end-vendas', 'period-date-end-financeiro'];
        startIds.forEach(id => { const el = document.getElementById(id); if (el) el.value = customDateStart; });
        endIds.forEach(id => { const el = document.getElementById(id); if (el) el.value = customDateEnd; });
    }

    // Atualiza os labels de texto nas trÃƒÂªs barras
    ['period-filter-info', 'period-filter-info-vendas', 'period-filter-info-financeiro'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = label;
    });
}


function calculateKPIs() {
    const { start, end } = getFilteredDates();

    // Vendas filtradas por data
    const vendasFiltradas = vendas.filter(v => {
        const d = new Date(v.date + 'T12:00:00');
        return d >= start && d <= end;
    });

    const totalEstoque = estoque.filter(car => car.status !== 'vendido').length;
    document.getElementById("kpi-estoque").innerText = totalEstoque;

    const totalVendasMes = vendasFiltradas.length;
    document.getElementById("kpi-vendas").innerText = totalVendasMes;
    document.getElementById("sales-kpi-entregues").innerText = totalVendasMes;

    const lucroAcumulado = vendasFiltradas.reduce((sum, v) => sum + v.profit, 0);
    document.getElementById("kpi-lucro").innerText = formatCurrency(lucroAcumulado);
    document.getElementById("sales-kpi-lucro").innerText = formatCurrency(lucroAcumulado);

    const activeLeads = leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length;
    document.getElementById("kpi-leads").innerText = activeLeads;
    document.getElementById("badge-leads-active").innerText = activeLeads;

    const parados = estoque.filter(car => car.status !== 'vendido' && calcDaysInStock(car.purchaseDate) > 30).length;
    document.getElementById("kpi-parados").innerText = parados;
    document.getElementById("badge-estoque-alert").innerText = parados;
    document.getElementById("badge-estoque-alert").style.display = parados === 0 ? 'none' : 'inline-flex';

    const faturamentoTotal = vendasFiltradas.reduce((sum, v) => sum + v.sellPrice, 0);
    const ticketMedio = totalVendasMes > 0 ? faturamentoTotal / totalVendasMes : 0;
    document.getElementById("kpi-ticket").innerText = formatCurrency(ticketMedio);
    document.getElementById("sales-kpi-faturamento").innerText = formatCurrency(faturamentoTotal);

    const margemMedia = totalVendasMes > 0 ? (vendasFiltradas.reduce((sum, v) => sum + v.margin, 0) / totalVendasMes) : 0;
    document.getElementById("sales-kpi-margem").innerText = `${margemMedia.toFixed(1)}%`;

    // Update period label titles in kpi cards
    const lucroTitle = document.querySelector('#kpi-lucro')?.closest('.kpi-card')?.querySelector('.kpi-title');
    if (lucroTitle) lucroTitle.innerText = `Lucro LÃƒÂ­quido (${getPeriodLabel()})`;
    const vendasTitle = document.querySelector('#kpi-vendas')?.closest('.kpi-card')?.querySelector('.kpi-title');
    if (vendasTitle) vendasTitle.innerText = `Vendas (${getPeriodLabel()})`;
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function calculateCRMStats() {
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length;
    const semResposta = leads.filter(l => l.status === 'sem resposta').length;
    const fechados = leads.filter(l => l.status === 'fechado').length;

    const conversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) + '%' : '0%';

    const elTotal = document.getElementById("crm-total-leads");
    const elAtivos = document.getElementById("crm-ativos-leads");
    const elSemResp = document.getElementById("crm-sem-resposta-leads");
    const elConv = document.getElementById("crm-conversao-leads");

    if (elTotal) elTotal.innerText = totalLeads;
    if (elAtivos) elAtivos.innerText = activeLeads;
    if (elSemResp) elSemResp.innerText = semResposta;
    if (elConv) elConv.innerText = conversao;
}

// --------------------------------------------------------------------------
// G. GRÃƒÂ FICOS
// --------------------------------------------------------------------------
function initCharts() {
    Chart.defaults.color = '#9CA3AF';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
    Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";

    // --- GrÃƒÂ¡fico 1: Vendas e Lucro por mÃƒÂªs (dados reais filtrados) ---
    const ctxSales = document.getElementById('chart-sales-profit');
    if (ctxSales) {
        if (chartSalesProfitInstance) chartSalesProfitInstance.destroy();

        const { start, end } = getFilteredDates();
        const vendasFiltradas = vendas.filter(v => {
            const d = new Date(v.date + 'T12:00:00');
            return d >= start && d <= end;
        });

        // Group by month label
        const monthMap = {};
        vendasFiltradas.forEach(v => {
            const d = new Date(v.date + 'T12:00:00');
            const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            if (!monthMap[key]) monthMap[key] = { fat: 0, lucro: 0 };
            monthMap[key].fat += v.sellPrice / 1000;
            monthMap[key].lucro += v.profit / 1000;
        });

        const labels = Object.keys(monthMap).length > 0 ? Object.keys(monthMap) : ['Sem dados'];
        const fatData = Object.values(monthMap).map(m => parseFloat(m.fat.toFixed(1)));
        const lucroData = Object.values(monthMap).map(m => parseFloat(m.lucro.toFixed(1)));

        chartSalesProfitInstance = new Chart(ctxSales, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Faturamento Bruto (x1000 R$)', data: fatData, backgroundColor: 'rgba(37, 99, 235, 0.75)', borderColor: '#2563EB', borderWidth: 1, borderRadius: 6 },
                    { label: 'Lucro LÃƒÂ­quido Real (x1000 R$)', data: lucroData, backgroundColor: 'rgba(16, 185, 129, 0.75)', borderColor: '#10B981', borderWidth: 1, borderRadius: 6 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12 } } },
                scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
            }
        });
    }

    // --- GrÃƒÂ¡fico 2: Origem dos Leads ---
    const ctxLeads = document.getElementById('chart-leads-origin');
    if (ctxLeads) {
        const originCounts = {};
        leads.forEach(l => { originCounts[l.origin] = (originCounts[l.origin] || 0) + 1; });
        if (chartLeadsOriginInstance) chartLeadsOriginInstance.destroy();
        chartLeadsOriginInstance = new Chart(ctxLeads, { type: 'doughnut', data: { labels: Object.keys(originCounts).length > 0 ? Object.keys(originCounts) : ["Nenhum"], datasets: [{ data: Object.values(originCounts).length > 0 ? Object.values(originCounts) : [1], backgroundColor: ['#2563EB', '#8B5CF6', '#F59E0B', '#10B981', '#6B7280'], borderWidth: 2, borderColor: '#1F2937' }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 10, font: { size: 11 } } } } } });
    }

    // --- GrÃƒÂ¡fico 3: Giro de Estoque ---
    const ctxGiro = document.getElementById('chart-giro-estoque');
    if (ctxGiro) {
        if (chartGiroEstoqueInstance) chartGiroEstoqueInstance.destroy();
        const convCars = estoque.filter(c => c.type === 'convencional' && c.status !== 'vendido');
        const repCars = estoque.filter(c => c.type === 'repasse' && c.status !== 'vendido');
        const avgConv = convCars.length > 0 ? (convCars.reduce((sum, c) => sum + calcDaysInStock(c.purchaseDate), 0) / convCars.length) : 0;
        const avgRep = repCars.length > 0 ? (repCars.reduce((sum, c) => sum + calcDaysInStock(c.purchaseDate), 0) / repCars.length) : 0;
        chartGiroEstoqueInstance = new Chart(ctxGiro, { type: 'bar', data: { labels: ['Venda Convencional', 'Repasse RÃƒÂ¡pido'], datasets: [{ label: 'Dias MÃƒÂ©dios em Estoque', data: [avgConv.toFixed(0), avgRep.toFixed(0)], backgroundColor: ['rgba(37, 99, 235, 0.8)', 'rgba(139, 92, 246, 0.8)'], borderWidth: 1, borderRadius: 6, barThickness: 40 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { display: false } } } } });
    }
}

// --------------------------------------------------------------------------
// H. ESTOQUE - RENDERIZAÃƒâ€¡ÃƒÆ’O + EDIÃƒâ€¡ÃƒÆ’O + EXCLUSÃƒÆ’O
// --------------------------------------------------------------------------
let estoqueViewMode = 'lista';
function setEstoqueView(mode) {
    estoqueViewMode = mode;
    document.getElementById('estoque-list-view').style.display = mode === 'lista' ? 'block' : 'none';
    document.getElementById('estoque-grid-view').style.display = mode === 'grade' ? 'grid' : 'none';
    document.getElementById('toggle-estoque-lista').classList.toggle('active', mode === 'lista');
    document.getElementById('toggle-estoque-grade').classList.toggle('active', mode === 'grade');
}

let estoqueSortColumn = 'id'; // PadrÃƒÂ£o: mais recentes (ordem de cadastro)
let estoqueSortDirection = 'desc';

function sortEstoque(column) {
    if (estoqueSortColumn === column) {
        estoqueSortDirection = estoqueSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        estoqueSortColumn = column;
        estoqueSortDirection = 'asc'; // Inicia crescendo quando troca a coluna
    }

    // Atualiza ÃƒÂ­cones
    document.querySelectorAll('.sortable-header').forEach(th => {
        th.classList.remove('active-sort');
        const icon = th.querySelector('.sort-icon');
        if (icon) {
            icon.setAttribute('data-lucide', 'chevrons-up-down');
        }
    });

    const activeIcon = document.getElementById(`sort-icon-${column}`);
    if (activeIcon) {
        activeIcon.parentElement.classList.add('active-sort');
        activeIcon.setAttribute('data-lucide', estoqueSortDirection === 'asc' ? 'chevron-up' : 'chevron-down');
    }

    lucide.createIcons();

    // Pega os filtros atuais (estÃƒÂ£o soltos, normalmente renderEstoqueTable ÃƒÂ© chamada sem args do oninput, mas temos globais ou re-pegamos do DOM)
    const currentStatus = document.querySelector('#filter-estoque-group .filter-btn.active')?.innerText.toLowerCase().replace('ÃƒÂ­', 'i').replace('ÃƒÂ§', 'c') || 'todos';
    const currentQuery = document.getElementById('search-estoque')?.value || '';

    // Mapeia texto para chaves
    let statusMap = { 'todos': 'todos', 'disponiveis': 'disponivel', 'preparacao': 'preparacao', 'reservados': 'reservado', 'vendidos': 'vendido' };
    renderEstoqueTable(statusMap[currentStatus] || 'todos', currentQuery);
}

function renderEstoqueTable(filterStatus = 'todos', searchQuery = '') {
    const tableBody = document.getElementById("estoque-table-body");
    const gridView = document.getElementById("estoque-grid-view");
    if (!tableBody || !gridView) return;

    tableBody.innerHTML = "";
    gridView.innerHTML = "";

    let filteredCars = estoque.filter(car => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = car.model.toLowerCase().includes(query) ||
            car.year.toLowerCase().includes(query) ||
            (car.plate && car.plate.toLowerCase().includes(query)) ||
            (car.color && car.color.toLowerCase().includes(query)) ||
            (car.chassis && car.chassis.toLowerCase().includes(query));
        const matchesStatus = filterStatus === 'todos' || car.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // OrdenaÃƒÂ§ÃƒÂ£o
    filteredCars.sort((a, b) => {
        let valA, valB;

        switch (estoqueSortColumn) {
            case 'model': valA = a.model.toLowerCase(); valB = b.model.toLowerCase(); break;
            case 'year': valA = a.year; valB = b.year; break;
            case 'km': valA = a.km; valB = b.km; break;
            case 'buyPrice': valA = a.buyPrice; valB = b.buyPrice; break;
            case 'sellPrice': valA = a.sellPrice; valB = b.sellPrice; break;
            case 'margin':
                valA = (a.sellPrice - a.buyPrice);
                valB = (b.sellPrice - b.buyPrice);
                break;
            case 'days':
                valA = a.purchaseDate ? calcDaysInStock(a.purchaseDate) : 0;
                valB = b.purchaseDate ? calcDaysInStock(b.purchaseDate) : 0;
                break;
            case 'type': valA = a.type; valB = b.type; break;
            case 'status': valA = a.status; valB = b.status; break;
            case 'document_status': valA = a.documentStatus; valB = b.documentStatus; break;
            default: valA = a.id; valB = b.id; break;
        }

        if (valA < valB) return estoqueSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return estoqueSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    if (filteredCars.length === 0) {
        const emptyState = document.createElement("tr");
        emptyState.innerHTML = `<td colspan="11">
            <div class="empty-state-container">
                <i data-lucide="package-search"></i>
                <h4>Nenhum veículo encontrado</h4>
                <p>Tente ajustar os filtros ou cadastre um novo carro no estoque.</p>
            </div>
        </td>`;
        tableBody.appendChild(emptyState);
        gridView.innerHTML = `<div class="empty-state-container" style="grid-column: 1 / -1;">
            <i data-lucide="package-search"></i>
            <h4>Nenhum veículo encontrado</h4>
            <p>Tente ajustar os filtros ou cadastre um novo carro no estoque.</p>
        </div>`;
        lucide.createIcons();
        return;
    }

    filteredCars.forEach(car => {
        const lucroEst = car.sellPrice - car.buyPrice;
        const margemEst = car.sellPrice > 0 ? (lucroEst / car.sellPrice) * 100 : 0;
        const days = calcDaysInStock(car.purchaseDate);
        const isParado = days > 30 && car.status !== 'vendido';
        const daysClass = isParado ? "stock-days alert" : "stock-days";
        const daysContent = isParado ? `<i data-lucide="alert-triangle"></i> ${days} dias` : `${days} d`;

        // Mapeamento da foto real ou ÃƒÂ­cone default
        const firstImageUrl = car.image_url ? car.image_url.split(',')[0].trim() : null;
        const thumbContent = firstImageUrl
            ? `<img src="${firstImageUrl}" alt="${car.model}" style="width:100%; height:100%; object-fit:cover;">`
            : `<i data-lucide="car"></i>`;

        let docColor = 'var(--yellow-warning)';
        let docTitle = 'Pendente';
        let docIcon = 'file-clock';
        if (car.documentStatus === 'sim') {
            docColor = 'var(--green-profit)';
            docTitle = 'Documento OK';
            docIcon = 'file-check';
        } else if (car.documentStatus === 'nao') {
            docColor = 'var(--red-alert)';
            docTitle = 'Sem Documento';
            docIcon = 'file-x';
        }

        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.onclick = (e) => {
            if (e.target.closest('button')) return;
            openCarDetails(car.id);
        };
        tr.innerHTML = `
            <td>
                <div class="car-cell">
                    <div class="car-thumb">${thumbContent}</div>
                    <div class="car-info">
                        <h4>${car.model}</h4>
                        <div class="car-info-sub">
                            <span>ID: #${car.id}</span>
                            ${car.plate ? `<span class="car-sub-item">Placa: ${car.plate}</span>` : ''}
                            ${car.color ? `<span class="car-sub-item">Cor: ${car.color}</span>` : ''}
                            ${car.chassis ? `<span class="car-sub-item">Chassi: ${car.chassis}</span>` : ''}
                        </div>
                    </div>
                </div>
            </td>
            <td><div style="display:flex; justify-content:flex-start; align-items:center; color:${docColor};" title="${docTitle}"><i data-lucide="${docIcon}" style="width:20px;height:20px;"></i></div></td>
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
                    <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px" onclick="openCarDetails(${car.id})" title="Editar"><i data-lucide="pencil" style="width:12px;height:12px;"></i></button>
                    ${car.status !== 'vendido' ? `<button class="btn btn-success" style="padding:4px 8px; font-size:11px" onclick="openCarDetailsForSale(${car.id})" title="Vender"><i data-lucide="badge-dollar-sign" style="width:12px;height:12px;"></i></button>` : ''}
                    <button class="btn" style="padding:4px 8px; font-size:11px; background-color:rgba(239,68,68,0.15); color:var(--red-alert); border:1px solid rgba(239,68,68,0.2)" onclick="deleteCarConfirm(${car.id})" title="Excluir"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
            </td>`;
        tableBody.appendChild(tr);

        // CriaÃƒÂ§ÃƒÂ£o do Card da Grade
        const gridThumbContent = firstImageUrl
            ? `<img src="${firstImageUrl}" alt="${car.model}">`
            : `<i data-lucide="car"></i>`;

        const badgeClass = isParado ? "estoque-card-badge" : "estoque-card-badge green";
        const badgeIcon = isParado ? `<i data-lucide="clock"></i>` : `<i data-lucide="check-circle-2"></i>`;

        let sellBtn = car.status !== 'vendido' ? `<button class="btn btn-success" style="padding:4px;" onclick="openCarDetailsForSale(${car.id})" title="Vender"><i data-lucide="badge-dollar-sign" style="width:14px;height:14px;"></i></button>` : '';

        const card = document.createElement("div");
        card.className = "estoque-card";
        card.style.cursor = "pointer";
        card.onclick = (e) => {
            if (e.target.closest('.estoque-card-actions')) return;
            openCarDetails(car.id);
        };
        card.innerHTML = `
            <div class="estoque-card-img-wrapper">
                ${gridThumbContent}
                <div class="${badgeClass}">${badgeIcon} ${calcDaysInStock(car.purchaseDate)}d</div>
                <div class="estoque-card-actions">
                    <button class="btn btn-secondary" style="padding:4px;" onclick="openCarDetails(${car.id})" title="Editar"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                    ${sellBtn}
                </div>
            </div>
            <div class="estoque-card-body">
                <div class="estoque-card-title">${car.model}</div>
                <div class="estoque-card-subtitle">${car.year} Ã¢â‚¬Â¢ ${car.km.toLocaleString('pt-BR')} km Ã¢â‚¬Â¢ ${car.plate || 'S/P'}</div>
                
                <div class="estoque-card-prices">
                    <div class="estoque-card-price-col">
                        <div class="estoque-card-price-label">Anunciado</div>
                        <div class="estoque-card-price-val">${formatCurrency(car.sellPrice)}</div>
                    </div>
                    <div class="estoque-card-price-col right">
                        <div class="estoque-card-price-label">Custo</div>
                        <div class="estoque-card-price-val dimmed">${formatCurrency(car.buyPrice)}</div>
                    </div>
                </div>
                
                <div class="estoque-card-footer">
                    <span class="badge ${car.status}">${car.status}</span>
                    <div class="estoque-card-footer-val">$ ${formatCurrency(lucroEst)}</div>
                </div>
            </div>
        `;
        gridView.appendChild(card);
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

// --------------------------------------------------------------------------
// INTEGRACÃƒÆ’O PARA PREVIEW E UPLOAD DE FOTOS (SUPABASE STORAGE)
// --------------------------------------------------------------------------
function previewVehiclePhoto(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;

    if (input.files && input.files.length > 0) {
        preview.innerHTML = "";
        preview.style.display = "flex";
        preview.style.flexWrap = "wrap";
        preview.style.gap = "4px";
        preview.style.overflowY = "auto";
        preview.style.padding = "4px";
        preview.style.justifyContent = "center";
        preview.style.alignItems = "center";

        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.style.width = "40px";
                img.style.height = "40px";
                img.style.objectFit = "cover";
                img.style.borderRadius = "4px";
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    } else {
        preview.innerHTML = `<i data-lucide="image"></i>`;
        preview.style.display = "";
        preview.style.flexWrap = "";
        preview.style.gap = "";
        preview.style.overflowY = "";
        preview.style.padding = "";
        lucide.createIcons();
    }
}

async function uploadVehiclePhoto(file) {
    if (!isCloudActive) return null;
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `carro-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = fileName;

        const { data, error } = await supabaseClient.storage
            .from('veiculos')
            .upload(filePath, file);

        if (error) {
            console.error("Erro no upload do storage: ", error);
            return null;
        }

        const { data: publicUrlData } = supabaseClient.storage
            .from('veiculos')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (e) {
        console.error("Erro no upload de foto: ", e);
        return null;
    }
}

async function uploadMultipleVehiclePhotos(files) {
    if (!isCloudActive || !files || files.length === 0) return null;
    let urls = [];
    for (let file of files) {
        const url = await uploadVehiclePhoto(file);
        if (url) urls.push(url);
    }
}

let currentCdCarId = null;
let currentCdImages = "";

// VisualizaÃƒÂ§ÃƒÂ£o de Detalhes do VeÃƒÂ­culo (EdiÃƒÂ§ÃƒÂ£o Inline)
function openCarDetails(carId) {
    const car = estoque.find(c => c.id === carId);
    if (!car) return;

    currentCdCarId = car.id;
    currentCdImages = car.image_url || "";

    // Popula cabeÃƒÂ§alho
    document.getElementById('cd-title').innerText = car.model;
    const statusEl = document.getElementById('cd-status');
    statusEl.innerText = car.status;
    statusEl.className = `badge ${car.status}`;

    // Popula Ficha TÃƒÂ©cnica (Inputs)
    document.getElementById('cd-year').value = car.year;
    document.getElementById('cd-km').value = car.km;
    document.getElementById('cd-color').value = car.color || '';
    document.getElementById('cd-plate').value = car.plate || '';
    document.getElementById('cd-chassis').value = car.chassis || '';
    document.getElementById('cd-renavam').value = car.renavam || '';
    document.getElementById('cd-document').value = car.documentStatus || 'pendente';
    document.getElementById('cd-type').value = car.type || 'convencional';
    document.getElementById('cd-status-select').value = car.status;
    document.getElementById('cd-fipe-code').value = car.fipeCode || '';

    // Format fipePrice if it exists
    if (car.fipePrice) {
        document.getElementById('cd-fipe-price').value = 'R$ ' + parseFloat(car.fipePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    } else {
        document.getElementById('cd-fipe-price').value = '';
    }

    // Popula Anotações / Comentários
    document.getElementById('cd-notes').value = car.notes || '';

    // Popula Financeiro (Inputs) com formatação R$
    document.getElementById('cd-buy').value = car.buyPrice ? formatNumberBR(car.buyPrice) : '';
    document.getElementById('cd-sell').value = car.sellPrice ? formatNumberBR(car.sellPrice) : '';

    // LogÃƒÂ­stica (Inputs)
    if (car.purchaseDate) {
        document.getElementById('cd-purchase-date').value = car.purchaseDate;
    } else {
        document.getElementById('cd-purchase-date').value = '';
    }

    // Recalcula cÃƒÂ¡lculos read-only (Lucro, Margem, Dias)
    calculateDetailsFinancials();

    // Renderiza gastos do veículo
    renderCarExpenses(carId);

    // Renderiza documentos do veículo
    renderCarDocuments(carId);

    // Movimentação e Venda Card
    const saleCard = document.getElementById('cd-sale-card');
    const sellBtnHeader = document.getElementById('cd-btn-sell');
    if (car.status === 'vendido') {
        sellBtnHeader.style.display = 'none';
        saleCard.style.display = 'block';
        document.getElementById('cd-sale-action-row').style.display = 'none';

        const sale = vendas.find(v => v.carId === carId);
        if (sale) {
            document.getElementById('cd-sell-client').value = sale.client || '';
            document.getElementById('cd-sell-doc').value = sale.clientDocument || '';
            document.getElementById('cd-sell-date').value = sale.date || '';
            document.getElementById('cd-sell-type').value = sale.type || 'convencional';
        }
        document.getElementById('cd-sell-client').disabled = true;
        document.getElementById('cd-sell-doc').disabled = true;
        document.getElementById('cd-sell-date').disabled = true;
        document.getElementById('cd-sell-type').disabled = true;
    } else {
        sellBtnHeader.style.display = 'flex';
        saleCard.style.display = 'block';
        document.getElementById('cd-sale-action-row').style.display = 'flex';

        document.getElementById('cd-sell-client').value = '';
        document.getElementById('cd-sell-doc').value = '';
        document.getElementById('cd-sell-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('cd-sell-type').value = 'convencional';

        document.getElementById('cd-sell-client').disabled = false;
        document.getElementById('cd-sell-doc').disabled = false;
        document.getElementById('cd-sell-date').disabled = false;
        document.getElementById('cd-sell-type').disabled = false;
    }

    // Galeria
    const mainImg = document.getElementById('cd-main-img');
    const noImg = document.getElementById('cd-no-img');
    const thumbsContainer = document.getElementById('cd-thumbs');
    thumbsContainer.innerHTML = '';

    if (car.image_url && car.image_url.trim() !== '') {
        const urls = car.image_url.split(',').filter(u => u.trim() !== '');
        if (urls.length > 0) {
            mainImg.src = urls[0].trim();
            mainImg.style.display = 'block';
            noImg.style.display = 'none';

            urls.forEach((url, idx) => {
                const thumb = document.createElement('img');
                thumb.src = url.trim();
                thumb.className = idx === 0 ? 'car-details-thumb active' : 'car-details-thumb';
                thumb.onclick = () => {
                    mainImg.src = url.trim();
                    document.querySelectorAll('.car-details-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                };
                thumbsContainer.appendChild(thumb);
            });
        } else {
            mainImg.style.display = 'none';
            noImg.style.display = 'flex';
        }
    } else {
        mainImg.style.display = 'none';
        noImg.style.display = 'flex';
    }

    // Limpa o input de foto
    document.getElementById('cd-photo-input').value = "";

    // Troca de Aba simulada
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    document.querySelectorAll(".sidebar-menu .menu-item").forEach(item => item.classList.remove("active"));

    document.getElementById('car-details-tab').classList.add("active");

    document.getElementById("current-tab-title").innerText = "Detalhes do Veículo";
    document.getElementById("current-tab-subtitle").innerText = "Ficha técnica, financeiro e imagens";

    switchCarDetailsTab('geral');
    updateSummaryFields();
    lucide.createIcons();

    // Tenta atualizar a Fipe silenciosamente
    if (car.fipeCode) {
        autoUpdateFipePrice(car.id, car.fipeCode);
    }
}

function closeCarDetails() {
    document.getElementById('car-details-tab').classList.remove('active');
    document.getElementById('estoque-tab').classList.add('active');
}

function renderCarExpenses(carId) {
    const listContainer = document.getElementById('cd-expenses-list');
    const totalContainer = document.getElementById('cd-expenses-total');
    if (!listContainer || !totalContainer) return;

    const carExpenses = despesas.filter(d => d.carId === carId);

    if (carExpenses.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" style="padding: 32px 0; text-align: center; color: var(--text-muted); font-size:13px;">Nenhum gasto registrado.</div>`;
        totalContainer.innerText = 'R$ 0,00';
        return;
    }

    let html = '';
    let total = 0;

    carExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
        total += exp.val;
        const formattedDate = exp.date.split('-').reverse().join('/');
        html += `
            <div class="car-info-item">
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <span style="font-size:13px; font-weight:500;">${exp.desc}</span>
                    <span class="car-info-label" style="font-size:11px;">${formattedDate} &bull; ${exp.category}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:13px; font-weight:600; color:var(--red-alert);">R$ ${exp.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <button class="btn" style="padding:4px; font-size:11px; background-color:rgba(239,68,68,0.15); color:var(--red-alert); border:1px solid rgba(239,68,68,0.2); border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="deleteDespesaConfirm(${exp.id})">
                        <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                    </button>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
    totalContainer.innerText = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    lucide.createIcons();

    // Update financials card if this is the currently open car
    if (carId === currentCdCarId) {
        calculateDetailsFinancials();
    }
}

function openAddDespesaModalFromCar() {
    if (!currentCdCarId) return;
    openAddDespesaModal();
    const select = document.getElementById("exp-car");
    if (select) {
        select.value = currentCdCarId;
    }
}

function updateSummaryFields() {
    document.getElementById('cd-summary-year').innerText = document.getElementById('cd-year').value || '-';

    const kmValue = document.getElementById('cd-km').value;
    document.getElementById('cd-summary-km').innerText = kmValue ? parseInt(kmValue).toLocaleString('pt-BR') : '-';

    document.getElementById('cd-summary-type').innerText = document.getElementById('cd-type').value || '-';
}

function updateDetailsStatusBadge() {
    const val = document.getElementById('cd-status-select').value;
    const statusEl = document.getElementById('cd-status');
    statusEl.innerText = val;
    statusEl.className = `badge ${val}`;
}

// Converte string monetária BR (ex: "111.220,00") para número float
function parseCurrencyBR(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let cleaned = val.toString().replace(/[^\d,.-]/g, '');
    if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(cleaned) || 0;
}

// Formata número para string BR (ex: 111220 -> "111.220,00")
function formatNumberBR(val) {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
}

// Máscara de moeda em tempo real ao digitar
function formatCurrencyInput(el) {
    let digits = el.value.replace(/\D/g, '');
    if (!digits) { el.value = ''; return; }
    const num = (parseInt(digits) / 100).toFixed(2);
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    el.value = parts.join(',');
}

function calculateDetailsFinancials() {
    const buyPrice = parseCurrencyBR(document.getElementById('cd-buy').value);
    const sellPrice = parseCurrencyBR(document.getElementById('cd-sell').value);
    const purchaseDate = document.getElementById('cd-purchase-date').value;

    let totalExpenses = 0;
    if (typeof currentCdCarId !== 'undefined' && currentCdCarId) {
        const carExpenses = despesas.filter(d => d.carId === currentCdCarId);
        totalExpenses = carExpenses.reduce((sum, exp) => sum + exp.val, 0);
    }

    const finExpensesEl = document.getElementById('cd-fin-expenses');
    if (finExpensesEl) finExpensesEl.innerText = formatCurrency(totalExpenses);

    const lucroEst = sellPrice - buyPrice - totalExpenses;
    const margemEst = sellPrice > 0 ? (lucroEst / sellPrice) * 100 : 0;
    const days = purchaseDate ? calcDaysInStock(purchaseDate) : 0;

    document.getElementById('cd-profit').innerText = formatCurrency(lucroEst);
    document.getElementById('cd-margin').innerText = `${margemEst.toFixed(1)}%`;
    document.getElementById('cd-days').innerText = days;
    document.getElementById('cd-summary-price').innerText = formatCurrency(sellPrice);
}

function previewDetailsPhotos(input) {
    const thumbnailsContainer = document.getElementById("cd-thumbs");
    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const thumb = document.createElement("img");
                thumb.src = e.target.result;
                thumb.className = "car-details-thumb";
                thumb.style.border = "2px dashed var(--yellow-warning)";
                thumb.title = "Pendente para salvar";
                thumb.onclick = () => { document.getElementById('cd-main-img').src = e.target.result; };

                thumbnailsContainer.appendChild(thumb);

                const mainImg = document.getElementById('cd-main-img');
                const noImg = document.getElementById('cd-no-img');
                if (mainImg.style.display === 'none') {
                    mainImg.src = e.target.result;
                    mainImg.style.display = 'block';
                    noImg.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

async function saveCarDetails() {
    if (!currentCdCarId) return;

    const btn = document.getElementById('cd-btn-save');
    btn.innerHTML = `<i data-lucide="loader" class="spin" style="width:14px;height:14px;margin-right:6px;"></i>Salvando...`;
    lucide.createIcons();

    const model = document.getElementById("cd-title").innerText; // Readonly, or could be input if we want
    const year = document.getElementById("cd-year").value;
    const km = parseInt(document.getElementById("cd-km").value) || 0;
    const buyPrice = parseCurrencyBR(document.getElementById("cd-buy").value);
    const sellPrice = parseCurrencyBR(document.getElementById("cd-sell").value);
    const type = document.getElementById("cd-type").value;
    const status = document.getElementById("cd-status-select").value;
    const existingCar = estoque.find(c => c.id === currentCdCarId);
    if (status === 'vendido' && (!existingCar || existingCar.status !== 'vendido')) {
        alert("Para marcar o carro como vendido e registrá-lo no fechamento e fluxo de caixa, utilize a seção 'Movimentação e Venda' na lateral direita.");
        document.getElementById("cd-status-select").value = existingCar ? existingCar.status : 'disponivel';
        updateDetailsStatusBadge();
        btn.innerHTML = `<i data-lucide="save" style="width:14px;height:14px;margin-right:6px;"></i>Salvar Alterações`;
        lucide.createIcons();
        return;
    }
    const purchaseDate = document.getElementById("cd-purchase-date").value || null;
    const plate = document.getElementById("cd-plate").value.toUpperCase();
    const color = document.getElementById("cd-color").value;
    const chassis = document.getElementById("cd-chassis").value.toUpperCase();
    const renavam = document.getElementById("cd-renavam").value;
    const documentStatus = document.getElementById("cd-document").value;
    const notes = document.getElementById("cd-notes").value.trim();
    const fipeCode = document.getElementById("cd-fipe-code").value;

    // Parse fipePrice stripping R$ and dots
    let fipePriceStr = document.getElementById("cd-fipe-price").value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const fipePrice = parseFloat(fipePriceStr) || 0;

    let imageUrl = currentCdImages;

    const photoInput = document.getElementById("cd-photo-input");
    if (photoInput && photoInput.files.length > 0) {
        const newUrls = await uploadMultipleVehiclePhotos(photoInput.files);
        if (newUrls) {
            imageUrl = imageUrl && imageUrl.trim() !== "" ? imageUrl + ',' + newUrls : newUrls;
        }
    }

    if (isCloudActive) {
        try {
            await supabaseClient.from('estoque').update({
                model, year, km, buy_price: buyPrice, sell_price: sellPrice, type, status,
                purchase_date: purchaseDate, plate, color, chassis, renavam, document_status: documentStatus, image_url: imageUrl,
                fipe_code: fipeCode, fipe_price: fipePrice, notes: notes
            }).eq('id', currentCdCarId);
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        const car = estoque.find(c => c.id === currentCdCarId);
        if (car) Object.assign(car, { model, year, km, buyPrice, sellPrice, type, status, purchaseDate, plate, color, chassis, renavam, documentStatus, image_url: imageUrl, fipeCode, fipePrice, notes });
        persistLocalData();
    }

    updateApplicationState();

    btn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;margin-right:6px;"></i>Salvo com Sucesso`;
    lucide.createIcons();
    setTimeout(() => {
        btn.innerHTML = `<i data-lucide="save" style="width:14px;height:14px;margin-right:6px;"></i>Salvar AlteraÃƒÂ§ÃƒÂµes`;
        lucide.createIcons();
        openCarDetails(currentCdCarId); // Recarrega para limpar avisos e inputs de fotos
    }, 1500);
}


// Excluir VeÃƒÂ­culo
async function deleteCarConfirm(carId) {
    const car = estoque.find(c => c.id === carId);
    if (!car) return;
    if (!confirm(`Tem certeza que deseja excluir "${car.model}"? Esta aÃƒÂ§ÃƒÂ£o nÃƒÂ£o pode ser desfeita.`)) return;
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
    const statusToIdMap = {
        'novo lead': 'novo',
        'contato realizado': 'contato',
        'negociaÃƒÂ§ÃƒÂ£o': 'negociacao',
        'sem resposta': 'sem-resposta',
        'fechado': 'fechado',
        'perdido': 'perdido'
    };

    const columns = ['novo lead', 'contato realizado', 'negociaÃƒÂ§ÃƒÂ£o', 'sem resposta', 'fechado', 'perdido'];
    columns.forEach(col => {
        const idSuffix = statusToIdMap[col] || col;
        const container = document.getElementById(`cards-${idSuffix}`);
        if (container) container.innerHTML = "";
    });
    let filteredLeads = leads.filter(l => {
        const q = searchQuery.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.phone.includes(q);
    });
    const colCounts = { 'novo lead': 0, 'contato realizado': 0, 'negociaÃƒÂ§ÃƒÂ£o': 0, 'sem resposta': 0, 'fechado': 0, 'perdido': 0 };
    filteredLeads.forEach(lead => {
        colCounts[lead.status]++;
        const car = estoque.find(c => c.id === lead.interestCarId);
        const carModel = car ? car.model : "Geral / Sem Carro";
        const carPriceHtml = car ? `<span class="lead-price" style="color: var(--green-profit); font-weight:700; font-size:12px; margin-left:auto;">${formatCurrency(car.sellPrice)}</span>` : '';
        const phoneClean = lead.phone.replace(/\D/g, '');

        const card = document.createElement("div");
        card.className = "lead-card";
        card.draggable = true;
        card.setAttribute("ondragstart", `dragLead(event, ${lead.id})`);

        // Add left color border depending on status
        let leftBorderColor = 'var(--blue-primary)';
        if (lead.status === 'contato realizado') leftBorderColor = 'var(--purple-meta)';
        else if (lead.status === 'negociaÃƒÂ§ÃƒÂ£o') leftBorderColor = 'var(--yellow-warning)';
        else if (lead.status === 'sem resposta') leftBorderColor = 'var(--red-alert)';
        else if (lead.status === 'fechado') leftBorderColor = 'var(--green-profit)';
        else if (lead.status === 'perdido') leftBorderColor = 'var(--text-muted)';

        card.style.borderLeft = `4px solid ${leftBorderColor}`;
        card.style.paddingLeft = '10px';

        const isNegligenciado = lead.lastContactDays > 10 && lead.status !== 'fechado' && lead.status !== 'perdido';
        const contactClass = isNegligenciado ? "lead-last-contact forgotten" : "lead-last-contact";
        const contactIcon = isNegligenciado ? "alert-triangle" : "clock";
        const contactLabel = isNegligenciado ? `Esquecido hÃƒÂ¡ ${lead.lastContactDays}d` : `Contato hÃƒÂ¡ ${lead.lastContactDays}d`;

        card.innerHTML = `
            <div class="lead-top" style="display:flex; justify-content:space-between; align-items:center;">
                <span class="lead-name" style="font-weight:700; font-size:13px; color:var(--text-light);">${lead.name}</span>
                <span class="lead-origin">${lead.origin}</span>
            </div>
            
            <div style="display:flex; align-items:center; gap:6px; font-size:11px; margin-top:2px;">
                <a href="https://wa.me/55${phoneClean}" target="_blank" style="color: var(--text-muted); text-decoration:none; display:flex; align-items:center; gap:4px;" title="Conversar no WhatsApp">
                    <i data-lucide="phone" style="width:12px; height:12px; color:var(--blue-primary);"></i>
                    <span>${lead.phone}</span>
                </a>
            </div>

            <div style="display:flex; align-items:center; margin-top:4px;">
                <span class="badge convencional" style="display:inline-flex; align-items:center; gap:4px; font-size:10px; padding: 1px 6px;">
                    <i data-lucide="car" style="width:10px; height:10px;"></i>
                    ${carModel}
                </span>
                ${carPriceHtml}
            </div>

            <div class="lead-next-action" style="font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:6px 8px; margin-top:6px; display:flex; align-items:start; gap:6px;">
                <i data-lucide="calendar" style="width:12px; height:12px; color:var(--yellow-warning); margin-top:2px; flex-shrink:0;"></i>
                <span style="line-height:1.3;">${lead.nextAction || 'Sem aÃƒÂ§ÃƒÂ£o definida'}</span>
            </div>

            <div class="lead-divider" style="margin-top:8px;"></div>
            
            <div class="lead-footer" style="margin-top:2px;">
                <span class="${contactClass}"><i data-lucide="${contactIcon}"></i>${contactLabel}</span>
                <div style="display:flex; gap:4px;">
                    <button class="lead-actions-btn" onclick="openEditLeadModal(${lead.id})" title="Editar"><i data-lucide="pencil"></i></button>
                    <button class="lead-actions-btn" onclick="openTimelineModal(${lead.id})" title="HistÃƒÂ³rico / Timeline"><i data-lucide="message-square-plus"></i></button>
                    <button class="lead-actions-btn" style="color:var(--red-alert)" onclick="deleteLeadConfirm(${lead.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
            </div>`;
        const idSuffix = statusToIdMap[lead.status] || lead.status;
        const colId = `cards-${idSuffix}`;
        const container = document.getElementById(colId);
        if (container) container.appendChild(card);
    });
    columns.forEach(col => {
        const idSuffix = statusToIdMap[col] || col;
        const container = document.getElementById(`cards-${idSuffix}`);
        if (container && container.children.length === 0) {
            container.innerHTML = `<div class="empty-state-container" style="padding: 20px 10px;">
                <i data-lucide="inbox" style="width:24px;height:24px;"></i>
                <p style="font-size:11px; margin-top:8px;">Vazio</p>
            </div>`;
        }
        const label = document.getElementById(`count-${idSuffix}`);
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
            <td>${lead.lastContactDays} dias atrÃƒÂ¡s</td>
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
    if (!confirm(`Excluir o lead "${lead.name}"? Esta aÃƒÂ§ÃƒÂ£o nÃƒÂ£o pode ser desfeita.`)) return;
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
// J. VENDAS - RENDERIZAÃƒâ€¡ÃƒÆ’O + EDIÃƒâ€¡ÃƒÆ’O + EXCLUSÃƒÆ’O
// --------------------------------------------------------------------------
function renderVendasTable() {
    const body = document.getElementById("vendas-table-body");
    if (!body) return;
    body.innerHTML = "";

    const { start, end } = getFilteredDates();
    const vendasFiltradas = [...vendas]
        .filter(v => {
            const d = new Date(v.date + 'T12:00:00');
            return d >= start && d <= end;
        })
        .reverse();

    if (vendasFiltradas.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted); font-style:italic;"><i data-lucide="search-x" style="width:20px;height:20px;margin-right:8px;vertical-align:middle;"></i>Nenhuma venda encontrada para "${getPeriodLabel()}"</td>`;
        body.appendChild(tr);
        lucide.createIcons();
        return;
    }

    vendasFiltradas.forEach(v => {
        const car = estoque.find(c => c.id === v.carId) || { model: "VeÃƒÂ­culo de Giro", buyPrice: 0 };
        const dateObj = new Date(v.date + 'T12:00:00');
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
                <div style="display:flex;gap:6px;justify-content:center;align-items:center;">
                    <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="generatePDFReceipt(${v.id})" title="Emitir Recibo em PDF"><i data-lucide="file-check" style="width:12px;height:12px;"></i> Recibo</button>
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
    if (!confirm("Excluir esta venda e reverter o veículo para disponível no estoque? Esta ação não pode ser desfeita.")) return;

    // Identifica o carro vinculado à venda antes de excluí-la
    const venda = vendas.find(v => v.id === vendaId);
    const carId = venda ? venda.carId : null;

    if (isCloudActive) {
        try {
            await supabaseClient.from('vendas').delete().eq('id', vendaId);
            if (carId) {
                await supabaseClient.from('estoque').update({ status: 'disponivel' }).eq('id', carId);
            }
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        vendas = vendas.filter(v => v.id !== vendaId);
        if (carId) {
            const car = estoque.find(c => c.id === carId);
            if (car) car.status = 'disponivel';
        }
        persistLocalData();
    }
    updateApplicationState();
}

// --------------------------------------------------------------------------
// EMISSÃƒÆ’O E VISUALIZAÃƒâ€¡ÃƒÆ’O DO RECIBO DE VENDA PDF (PRODUÃƒâ€¡ÃƒÆ’O IMPRESSÃƒÆ’O)
// --------------------------------------------------------------------------
function generatePDFReceipt(saleId) {
    const v = vendas.find(sale => sale.id === saleId);
    if (!v) return;
    const car = estoque.find(c => c.id === v.carId) || { model: "VeÃƒÂ­culo de Giro", year: "N/A", km: 0, plate: "N/A", color: "N/A", chassis: "N/A" };

    const formattedDate = new Date(v.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedPrice = formatCurrency(v.sellPrice);

    const contentDiv = document.getElementById("receipt-print-content");
    if (contentDiv) {
        contentDiv.innerHTML = `
            <div class="receipt-container">
                <div class="receipt-header-print">
                    <div>
                        <h2>AutoDrive CRM</h2>
                        <p>GestÃƒÂ£o Automotiva Inteligente</p>
                        <p style="font-size:11px; color:#6b7280; margin-top:4px;">OperaÃƒÂ§ÃƒÂ£o de Vendas - Revendedora Sem Loja FÃƒÂ­sica</p>
                    </div>
                    <div style="text-align:right;">
                        <div class="receipt-number">COMPROVANTE NÃ‚Âº #${v.id}</div>
                        <p style="font-size:12px; color:#4b5563; margin-top:8px;">Data de EmissÃƒÂ£o: ${formattedDate}</p>
                    </div>
                </div>

                <div class="receipt-grid-print">
                    <div class="receipt-section-print">
                        <div class="receipt-section-title-print">Vendedor / Emitente</div>
                        <p><strong>AutoDrive CRM & Marcelo Motors</strong></p>
                        <p>Canal de Venda: ${v.type.toUpperCase()}</p>
                        <p>Status da TransaÃƒÂ§ÃƒÂ£o: CONCLUÃƒÂ DA</p>
                    </div>
                    <div class="receipt-section-print">
                        <div class="receipt-section-title-print">Comprador / DestinatÃƒÂ¡rio</div>
                        <p>Nome: <strong>${v.client}</strong></p>
                        <p>Tipo de TransaÃƒÂ§ÃƒÂ£o: Recebimento de Venda</p>
                    </div>
                </div>

                <div class="receipt-section-title-print">EspecificaÃƒÂ§ÃƒÂµes do VeÃƒÂ­culo Vendido</div>
                <table class="receipt-table-print">
                    <thead>
                        <tr>
                            <th>VeÃƒÂ­culo / Modelo</th>
                            <th>Ano</th>
                            <th>Quilometragem</th>
                            <th>Placa</th>
                            <th>Cor</th>
                            <th>Chassi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${car.model}</strong></td>
                            <td>${car.year}</td>
                            <td>${car.km.toLocaleString('pt-BR')} km</td>
                            <td>${car.plate || 'N/A'}</td>
                            <td>${car.color || 'N/A'}</td>
                            <td style="font-family:monospace; font-size:11px;">${car.chassis || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="receipt-total-print">
                    <span>Valor Total Pago: </span>
                    <strong style="color: var(--green-profit); font-size:22px;">${formattedPrice}</strong>
                </div>

                <div style="margin-top: 40px; font-size: 11px; color:#6b7280; line-height:1.4; border-top: 1px dashed #e5e7eb; padding-top:16px;">
                    Declaro para os devidos fins que recebi a importÃƒÂ¢ncia de <strong>${formattedPrice}</strong> referente ÃƒÂ  venda do veÃƒÂ­culo acima descrito, livre de quaisquer ÃƒÂ´nus fiscais ou multas atÃƒÂ© a presente data, outorgando plena, geral e irrevogÃƒÂ¡vel quitaÃƒÂ§ÃƒÂ£o.
                </div>

                <div class="receipt-signatures-print">
                    <div class="sig-box">
                        <div class="sig-line">Assinatura do Vendedor / Emitente</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line">Assinatura do Comprador</div>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById("modal-receipt-print").classList.add("active");
    lucide.createIcons();
}

function closeReceiptPrintModal() {
    document.getElementById("modal-receipt-print").classList.remove("active");
}

// --------------------------------------------------------------------------
// K. FINANCEIRO
// --------------------------------------------------------------------------
function renderFinanceiro() {
    const finTableBody = document.getElementById("financeiro-table-body");
    if (!finTableBody) return;
    finTableBody.innerHTML = "";

    const { start, end } = getFilteredDates();

    // Filtrar vendas e despesas pelo perÃƒÂ­odo
    const vendasFiltradas = vendas.filter(v => {
        const d = new Date(v.date + 'T12:00:00');
        return d >= start && d <= end;
    });
    const despesasFiltradas = despesas.filter(d => {
        const dt = new Date(d.date + 'T12:00:00');
        return dt >= start && dt <= end;
    });

    const entradas = vendasFiltradas.reduce((sum, v) => sum + v.sellPrice, 0);
    document.getElementById("fin-entradas").innerText = formatCurrency(entradas);

    // SaÃƒÂ­das = soma de buyPrice dos carros vendidos no perÃƒÂ­odo
    const saidasCompraEstoque = vendasFiltradas.reduce((sum, v) => {
        const car = estoque.find(c => c.id === v.carId);
        return sum + (car ? car.buyPrice : 0);
    }, 0);
    document.getElementById("fin-saidas").innerText = formatCurrency(saidasCompraEstoque);

    const totalDespesas = despesasFiltradas.reduce((sum, d) => sum + d.val, 0);
    document.getElementById("fin-despesas").innerText = formatCurrency(totalDespesas);

    const liquidoReal = entradas - saidasCompraEstoque - totalDespesas;
    document.getElementById("fin-liquido").innerText = formatCurrency(liquidoReal);

    // Renderizar tabela de despesas filtrada
    if (despesasFiltradas.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted); font-style:italic;"><i data-lucide="search-x" style="width:16px;height:16px;margin-right:6px;vertical-align:middle;"></i>Nenhuma despesa em "${getPeriodLabel()}"</td>`;
        finTableBody.appendChild(tr);
    } else {
        [...despesasFiltradas].reverse().forEach(d => {
            const car = estoque.find(c => c.id === d.carId);
            const carName = car ? car.model : "Geral (Sem Carro)";
            const dateObj = new Date(d.date + 'T12:00:00');
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
    }

    populateDespesaCarSelect();
    initFinanceChart(despesasFiltradas);
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
    if (!confirm("Excluir esta despesa? Esta aÃƒÂ§ÃƒÂ£o nÃƒÂ£o pode ser desfeita.")) return;
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

function initFinanceChart(despesasFiltradas) {
    const ctx = document.getElementById('chart-finance-distribution');
    if (!ctx) return;
    // Se nÃƒÂ£o recebeu lista filtrada, calcula agora com o filtro ativo
    if (!despesasFiltradas) {
        const { start, end } = getFilteredDates();
        despesasFiltradas = despesas.filter(d => {
            const dt = new Date(d.date + 'T12:00:00');
            return dt >= start && dt <= end;
        });
    }
    const categoriesSum = {};
    despesasFiltradas.forEach(d => { categoriesSum[d.category] = (categoriesSum[d.category] || 0) + d.val; });
    if (chartFinanceInstance) chartFinanceInstance.destroy();
    chartFinanceInstance = new Chart(ctx, { type: 'pie', data: { labels: Object.keys(categoriesSum).length > 0 ? Object.keys(categoriesSum) : ["Nenhum Gasto"], datasets: [{ data: Object.values(categoriesSum).length > 0 ? Object.values(categoriesSum) : [1], backgroundColor: ['#EF4444', '#F59E0B', '#2563EB', '#8B5CF6'], borderWidth: 1, borderColor: '#1F2937' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } } } } });
}

// --------------------------------------------------------------------------
// L. AGENDA
// --------------------------------------------------------------------------
function calendarPrevMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function calendarNextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Set Header
    const monthNames = ["Janeiro", "Fevereiro", "MarÃƒÂ§o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const headerSpan = document.getElementById("agenda-cal-month-year");
    if (headerSpan) headerSpan.innerText = `${monthNames[month]} de ${year}`;

    const daysContainer = document.getElementById("agenda-cal-days");
    if (!daysContainer) return;
    daysContainer.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // Get all dates in agenda that have events to highlight them
    const eventDates = new Set(agenda.map(a => a.date));

    // Previous month mock days
    for (let x = firstDayIndex; x > 0; x--) {
        const d = prevLastDay - x + 1;
        const span = document.createElement("span");
        span.className = "cal-day-num text-muted";
        span.innerText = d;
        daysContainer.appendChild(span);
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        const span = document.createElement("span");
        span.className = "cal-day-num";
        span.innerText = i;
        span.style.cursor = "pointer";

        if (eventDates.has(dStr)) {
            span.classList.add("has-event");
        }

        const selY = selectedAgendaDate.getFullYear();
        const selM = selectedAgendaDate.getMonth();
        const selD = selectedAgendaDate.getDate();
        if (selY === year && selM === month && selD === i) {
            span.classList.add("active");
        }

        span.onclick = () => {
            selectedAgendaDate = new Date(year, month, i);
            renderCalendar();
            renderAgendaTimeline();
        };

        daysContainer.appendChild(span);
    }
}

function renderAgendaTimeline() {
    const timeline = document.getElementById("agenda-timeline-body");
    if (!timeline) return;
    timeline.innerHTML = "";

    const y = selectedAgendaDate.getFullYear();
    const m = String(selectedAgendaDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedAgendaDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const title = document.getElementById("agenda-timeline-title");
    if (title) {
        const today = new Date();
        if (today.getFullYear() === y && today.getMonth() === selectedAgendaDate.getMonth() && today.getDate() === selectedAgendaDate.getDate()) {
            title.innerText = `Compromissos Agendados (Hoje)`;
        } else {
            title.innerText = `Compromissos Agendados (${d}/${m}/${y})`;
        }
    }

    const filteredAgenda = agenda.filter(a => a.date === dateStr);
    const sortedAgenda = [...filteredAgenda].sort((a, b) => a.time.localeCompare(b.time));

    if (sortedAgenda.length === 0) {
        timeline.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">Nenhum compromisso agendado para esta data.</div>`;
        return;
    }

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
    if (!confirm("Excluir este compromisso da agenda? Esta aÃƒÂ§ÃƒÂ£o nÃƒÂ£o pode ser desfeita.")) return;
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
// M. SELECTS E FORMULÃƒÂ RIOS
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
// N. MODAIS DE CRIAÃƒâ€¡ÃƒÆ’O (ATUALIZADOS COM NOVOS CAMPOS E UPLOADS)
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
function closeAddCarModal() {
    document.getElementById("modal-add-car").classList.remove("active");
    document.getElementById("form-add-car").reset();
    const preview = document.getElementById("car-photo-preview");
    if (preview) {
        preview.innerHTML = `<i data-lucide="image"></i>`;
        preview.style.display = "";
        preview.style.flexWrap = "";
        preview.style.gap = "";
        preview.style.overflowY = "";
        preview.style.padding = "";
    }
    lucide.createIcons();
}

async function saveNewCar(event) {
    event.preventDefault();
    const model = document.getElementById("car-brand-model").value;
    const year = document.getElementById("car-year").value;
    const km = parseInt(document.getElementById("car-km").value);
    const buyPrice = parseFloat(document.getElementById("car-buy-val").value);
    const sellPrice = parseFloat(document.getElementById("car-sell-val").value);
    const type = document.getElementById("car-type").value;
    const status = document.getElementById("car-status").value;
    const purchaseDate = document.getElementById("car-purchase-date").value || null;
    const plate = document.getElementById("car-plate").value.toUpperCase().trim();
    const color = document.getElementById("car-color").value;
    const chassis = document.getElementById("car-chassis").value.toUpperCase().trim();
    const renavam = document.getElementById("car-renavam").value.trim();
    const documentStatus = document.getElementById("car-document").value;

    // --- Verificação de duplicatas ---
    if (plate) {
        const duplicatePlate = estoque.find(c => c.plate && c.plate.toUpperCase().replace(/[^A-Z0-9]/g, '') === plate.replace(/[^A-Z0-9]/g, ''));
        if (duplicatePlate) {
            const statusLabel = duplicatePlate.status === 'vendido' ? ' (vendido)' : '';
            alert(`Veículo com placa "${plate}" já está cadastrado:\n\n${duplicatePlate.model}${statusLabel}\n\nCadastro cancelado para evitar duplicidade.`);
            return;
        }
    }
    if (chassis) {
        const duplicateChassis = estoque.find(c => c.chassis && c.chassis.toUpperCase().replace(/[^A-Z0-9]/g, '') === chassis.replace(/[^A-Z0-9]/g, ''));
        if (duplicateChassis) {
            const statusLabel = duplicateChassis.status === 'vendido' ? ' (vendido)' : '';
            alert(`Veículo com chassi "${chassis}" já está cadastrado:\n\n${duplicateChassis.model}${statusLabel}\n\nCadastro cancelado para evitar duplicidade.`);
            return;
        }
    }

    // Foto Upload
    const photoInput = document.getElementById("car-photo-input");
    let imageUrl = null;
    if (photoInput && photoInput.files.length > 0) {
        imageUrl = await uploadMultipleVehiclePhotos(photoInput.files);
    }

    if (isCloudActive) {
        try {
            const { error } = await supabaseClient.from('estoque').insert({
                model, year, km, buy_price: buyPrice, sell_price: sellPrice, type, status,
                purchase_date: purchaseDate, plate, color, chassis, renavam, document_status: documentStatus, image_url: imageUrl
            });
            if (error) {
                alert("Erro ao cadastrar veículo: " + error.message);
                return;
            }
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        estoque.unshift({ id: estoque.length + 1, model, year, km, buyPrice, sellPrice, purchaseDate, status, type, plate, color, chassis, renavam, documentStatus, image_url: imageUrl });
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
    document.getElementById("timeline-client-name").innerText = `HistÃƒÂ³rico & AÃƒÂ§ÃƒÂµes: ${lead.name}`;
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

function openCarDetailsForSale(carId) {
    openCarDetails(carId);
    setTimeout(() => {
        document.getElementById('cd-sale-card').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('cd-sell-client').focus();
    }, 100);
}

async function confirmCarSale(event) {
    event.preventDefault();
    const carId = currentCdCarId;
    const client = document.getElementById("cd-sell-client").value;
    const documentStr = document.getElementById("cd-sell-doc").value;
    const date = document.getElementById("cd-sell-date").value;
    const type = document.getElementById("cd-sell-type").value;

    if (!client) {
        alert("Por favor, preencha o nome do comprador.");
        return;
    }

    // Verifica se o cliente jÃ¡ existe
    const clientExists = clientes.find(c => c.name.toLowerCase() === client.toLowerCase());
    if (!clientExists) {
        if (confirm("Este cliente nÃ£o existe na base. Deseja cadastrÃ¡-lo automaticamente?")) {
            if (isCloudActive) {
                try {
                    await supabaseClient.from('clientes').insert({ name: client, document: documentStr });
                    await fetchCloudData();
                } catch (e) { }
            } else {
                clientes.push({ id: Date.now(), name: client, document: documentStr, createdAt: new Date().toISOString() });
                persistLocalData();
                renderClientesTable();
            }
        }
    }

    const car = estoque.find(c => c.id === carId);
    if (!car) return;

    const sellPrice = parseCurrencyBR(document.getElementById("cd-sell").value) || car.sellPrice;

    const despesasCarro = despesas.filter(d => d.carId === carId).reduce((sum, d) => sum + d.val, 0);
    const profit = sellPrice - car.buyPrice - despesasCarro;
    const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

    if (isCloudActive) {
        try {
            // 1. Marca o carro como vendido
            const { error: errUpdate } = await supabaseClient.from('estoque').update({ status: 'vendido', sell_price: sellPrice }).eq('id', carId);
            if (errUpdate) {
                alert("Erro ao atualizar o estoque: " + errUpdate.message);
                return;
            }

            // 2. Insere a transação de venda
            const { error: errInsert } = await supabaseClient.from('vendas').insert({ car_id: carId, client, client_document: documentStr, sell_price: sellPrice, date, profit, margin, type });
            if (errInsert) {
                // Rollback: reverte o status do carro se a venda falhar
                await supabaseClient.from('estoque').update({ status: 'disponivel' }).eq('id', carId);
                alert("Erro ao registrar a venda: " + errInsert.message + "\nO veículo foi mantido como disponível.");
                await fetchCloudData();
                updateApplicationState();
                return;
            }

            // 3. Fecha lead vinculado (se existir)
            const lead = leads.find(l => l.interestCarId === carId && l.status !== 'fechado');
            if (lead) {
                await supabaseClient.from('leads').update({ status: 'fechado' }).eq('id', lead.id);
                await supabaseClient.from('interactions').insert({ lead_id: lead.id, date: 'Hoje', text: `Venda formalizada! Valor de R$ ${sellPrice.toLocaleString('pt-BR')}` });
            }
            await fetchCloudData();
        } catch (e) {
            console.error(e);
            alert("Erro inesperado ao processar a venda. Verifique os dados e tente novamente.");
        }
    } else {
        car.status = 'vendido';
        car.sellPrice = sellPrice;
        vendas.push({ id: vendas.length + 1, carId, client, clientDocument: documentStr, sellPrice, date, profit, margin, type });
        const lead = leads.find(l => l.interestCarId === carId && l.status !== 'fechado');
        if (lead) {
            lead.status = 'fechado';
            lead.interactions.push({ date: "Hoje", text: `Venda formalizada! Valor de R$ ${sellPrice.toLocaleString('pt-BR')}` });
        }
        persistLocalData();
    }

    updateApplicationState();
    openCarDetails(carId);
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

// --------------------------------------------------------------------------
// SISTEMA DE EXPORTAÃƒâ€¡ÃƒÆ’O COMPATÃƒÂVEL COM EXCEL (CSV SEMICOLON + UTF-8 BOM)
// --------------------------------------------------------------------------
function downloadCSV(data, headers, fileName) {
    let csvContent = "\uFEFF"; // UTF-8 BOM para garantir acentos e compatibilidade total com Excel em PT-BR
    csvContent += headers.join(";") + "\n";

    data.forEach(row => {
        csvContent += row.map(val => {
            if (val === null || val === undefined) return "";
            let formattedVal = String(val).replace(/;/g, ",").replace(/\n/g, " ");
            return `"${formattedVal}"`;
        }).join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function exportEstoqueToExcel() {
    const headers = ["ID", "Modelo", "Ano", "KM", "Valor Compra", "Valor Venda", "Dias Estoque", "Tipo", "Status", "Placa", "Cor", "Chassi"];
    const rows = estoque.map(c => [
        c.id, c.model, c.year, c.km, c.buyPrice, c.sellPrice, c.daysInStock, c.type, c.status, c.plate || "", c.color || "", c.chassis || ""
    ]);
    downloadCSV(rows, headers, `autodrive_estoque_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportLeadsToExcel() {
    const headers = ["ID", "Nome Cliente", "Telefone", "ID Veiculo Interesse", "Origem", "Fase CRM", "Dias sem Contato", "Proxima Acao"];
    const rows = leads.map(l => [
        l.id, l.name, l.phone, l.interestCarId || "", l.origin, l.status, l.lastContactDays, l.nextAction || ""
    ]);
    downloadCSV(rows, headers, `autodrive_leads_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportVendasToExcel() {
    const headers = [
        "ID Venda", "Data", "Comprador", "CPF/CNPJ Comprador",
        "Veículo", "Placa", "Chassi", "Renavam",
        "Valor Compra", "Valor Venda", "Lucro Real", "Margem (%)", "Canal"
    ];
    const rows = vendas.map(v => {
        const car = estoque.find(c => c.id === v.carId) || {
            model: "Veículo de Giro", plate: "", chassis: "", renavam: "", buyPrice: 0
        };
        return [
            v.id,
            v.date,
            v.client || "",
            v.clientDocument || "",
            car.model || "Veículo de Giro",
            car.plate || "",
            car.chassis || "",
            car.renavam || "",
            car.buyPrice || 0,
            v.sellPrice || 0,
            v.profit || 0,
            (v.margin || 0).toFixed(1),
            v.type || ""
        ];
    });
    downloadCSV(rows, headers, `autodrive_vendas_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportDespesasToExcel() {
    const headers = ["ID", "Data", "Descricao", "ID Veiculo", "Categoria", "Valor (R$)"];
    const rows = despesas.map(d => [
        d.id, d.date, d.desc, d.carId || "Geral", d.category, d.val
    ]);
    downloadCSV(rows, headers, `autodrive_despesas_${new Date().toISOString().split('T')[0]}.csv`);
}

// --------------------------------------------------------------------------
// P. CADASTRO & APROVAÃƒâ€¡Ãƒâ€¢ES (ADMIN)
// --------------------------------------------------------------------------
function initializeSignupUI() {
    const toggleSignupLink = document.getElementById("toggle-signup-link");
    const toggleLoginLink = document.getElementById("toggle-login-link");
    const formLogin = document.getElementById("form-login");
    const formSignup = document.getElementById("form-signup");
    const loginTitle = document.querySelector("#login-overlay h2");

    if (toggleSignupLink && toggleLoginLink && formLogin && formSignup) {
        toggleSignupLink.addEventListener("click", (e) => {
            e.preventDefault();
            formLogin.style.display = "none";
            formSignup.style.display = "block";
            if (loginTitle) loginTitle.innerText = "Solicitar Acesso";
            const errorDiv = document.getElementById("login-error-message");
            if (errorDiv) {
                errorDiv.style.display = "none";
            }
        });
        toggleLoginLink.addEventListener("click", (e) => {
            e.preventDefault();
            formSignup.style.display = "none";
            formLogin.style.display = "block";
            if (loginTitle) loginTitle.innerText = "Acessar AutoDrive CRM";
            const errorDiv = document.getElementById("login-error-message");
            if (errorDiv) {
                errorDiv.style.display = "none";
            }
        });
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;
    const errorDiv = document.getElementById("login-error-message");

    if (errorDiv) {
        errorDiv.style.display = "none";
        errorDiv.style.backgroundColor = "";
        errorDiv.style.color = "";
    }

    if (password.length < 6) {
        if (errorDiv) {
            errorDiv.innerText = "A senha deve ter no mÃƒÂ­nimo 6 caracteres.";
            errorDiv.style.display = "block";
            errorDiv.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
            errorDiv.style.color = "var(--red-alert)";
        }
        return;
    }

    if (password !== confirmPassword) {
        if (errorDiv) {
            errorDiv.innerText = "As senhas nÃƒÂ£o coincidem.";
            errorDiv.style.display = "block";
            errorDiv.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
            errorDiv.style.color = "var(--red-alert)";
        }
        return;
    }

    if (isCloudActive) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password
            });

            if (error) {
                if (errorDiv) {
                    errorDiv.innerText = `Erro ao cadastrar: ${error.message}`;
                    errorDiv.style.display = "block";
                    errorDiv.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
                    errorDiv.style.color = "var(--red-alert)";
                }
            } else {
                await supabaseClient.auth.signOut();
                document.getElementById("form-signup").reset();
                if (errorDiv) {
                    errorDiv.innerText = "Cadastro enviado com sucesso! Aguarde a aprovaÃƒÂ§ÃƒÂ£o de um administrador para fazer login.";
                    errorDiv.style.display = "block";
                    errorDiv.style.backgroundColor = "rgba(16, 185, 129, 0.12)";
                    errorDiv.style.color = "var(--green-profit)";
                    errorDiv.style.borderColor = "rgba(16, 185, 129, 0.2)";
                }
                setTimeout(() => {
                    const formLogin = document.getElementById("form-login");
                    const formSignup = document.getElementById("form-signup");
                    const loginTitle = document.querySelector("#login-overlay h2");
                    if (formLogin && formSignup) {
                        formSignup.style.display = "none";
                        formLogin.style.display = "block";
                        if (loginTitle) loginTitle.innerText = "Acessar AutoDrive CRM";
                    }
                }, 3000);
            }
        } catch (err) {
            console.error(err);
            if (errorDiv) {
                errorDiv.innerText = "Ocorreu um erro no servidor. Tente novamente.";
                errorDiv.style.display = "block";
            }
        }
    } else {
        if (errorDiv) {
            errorDiv.innerText = "O cadastro de usuÃƒÂ¡rios nÃƒÂ£o estÃƒÂ¡ disponÃƒÂ­vel no modo de demonstraÃƒÂ§ÃƒÂ£o.";
            errorDiv.style.display = "block";
        }
    }
}

let cachedProfiles = [];

async function loadProfiles() {
    if (!isCloudActive) return;
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        cachedProfiles = data;
        renderProfilesTable(data);
    } catch (err) {
        console.error('Erro ao carregar perfis:', err);
    }
}

function renderProfilesTable(profilesList) {
    const tbody = document.getElementById("usuarios-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    profilesList.forEach(profile => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--border-color)";

        const dateStr = profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '-';

        const statusText = profile.is_approved ? 'Aprovado' : 'Pendente';
        const statusClass = profile.is_approved ? 'disponivel' : 'preparacao';

        const roleText = profile.is_admin ? 'Administrador' : 'Operador';
        const roleClass = profile.is_admin ? 'repasse' : 'convencional';

        const btnApproveText = profile.is_approved ? 'Revogar' : 'Aprovar';
        const btnAdminText = profile.is_admin ? 'Remover Admin' : 'Tornar Admin';

        let actionsHtml = '';
        if (sessionUser && sessionUser.id !== profile.id) {
            actionsHtml = `
                <div style="display:flex; justify-content:center; gap:8px;">
                    <button class="btn ${profile.is_approved ? 'btn-secondary' : 'btn-primary'}" style="padding:6px 12px; font-size:11px;" onclick="toggleUserApproval('${profile.id}', ${profile.is_approved})">
                        ${btnApproveText}
                    </button>
                    <button class="btn btn-secondary" style="padding:6px 12px; font-size:11px;" onclick="toggleUserAdmin('${profile.id}', ${profile.is_admin})">
                        ${btnAdminText}
                    </button>
                    <button class="btn btn-secondary" style="padding:6px 12px; font-size:11px; color:var(--red-alert); border-color:rgba(239, 68, 68, 0.2);" onclick="deleteUserAccount('${profile.id}')">
                        Excluir
                    </button>
                </div>
            `;
        } else {
            actionsHtml = `<div style="text-align:center; color:var(--text-muted); font-size:11px; font-style:italic;">VocÃƒÂª (Atual)</div>`;
        }

        tr.innerHTML = `
            <td style="padding:12px; color:var(--text-light); font-weight:500;">${profile.email}</td>
            <td style="padding:12px; color:var(--text-muted);">${dateStr}</td>
            <td style="padding:12px;"><span class="badge ${roleClass}">${roleText}</span></td>
            <td style="padding:12px;"><span class="badge ${statusClass}">${statusText}</span></td>
            <td style="padding:12px;">${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function toggleUserApproval(profileId, currentStatus) {
    if (!isCloudActive) return;
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ is_approved: !currentStatus })
            .eq('id', profileId);
        if (error) throw error;
        await loadProfiles();
    } catch (err) {
        alert('Erro ao atualizar status do usuÃƒÂ¡rio: ' + err.message);
    }
}

async function toggleUserAdmin(profileId, currentStatus) {
    if (!isCloudActive) return;
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ is_admin: !currentStatus })
            .eq('id', profileId);
        if (error) throw error;
        await loadProfiles();
    } catch (err) {
        alert('Erro ao atualizar nÃƒÂ­vel de acesso: ' + err.message);
    }
}

async function deleteUserAccount(profileId) {
    if (!confirm("Excluir esta conta permanentemente? Esta aÃƒÂ§ÃƒÂ£o nÃƒÂ£o pode ser desfeita.")) return;
    if (!isCloudActive) return;
    try {
        const { error } = await supabaseClient
            .rpc('delete_user', { user_id: profileId });
        if (error) throw error;
        await loadProfiles();
    } catch (err) {
        alert('Erro ao excluir usuÃƒÂ¡rio: ' + err.message);
    }
}

function filterUsuariosTable() {
    const searchVal = document.getElementById("search-usuarios").value.toLowerCase();
    const filtered = cachedProfiles.filter(p => p.email.toLowerCase().includes(searchVal));
    renderProfilesTable(filtered);
}


// ========================================== 
// ========================================== 
// MÃ“DULO DE CLIENTES 
// ========================================== 

let clientesSortCol = '';
let clientesSortDirection = 1;

function sortClientesTable(col) {
    if (clientesSortCol === col) {
        clientesSortDirection *= -1;
    } else {
        clientesSortCol = col;
        clientesSortDirection = 1;
    }
    renderClientesTable();
}

function calculateClientesKPIs() {
    const elTotal = document.getElementById('kpi-total-clientes');
    const elVol = document.getElementById('kpi-maior-comprador-vol');
    const elVolVal = document.getElementById('kpi-maior-comprador-vol-val');
    const elQtd = document.getElementById('kpi-maior-comprador-qtd');
    const elQtdVal = document.getElementById('kpi-maior-comprador-qtd-val');

    if (!elTotal) return;

    elTotal.innerText = clientes.length;

    const stats = {};
    vendas.forEach(v => {
        if (!v.client) return;
        const c = v.client.trim();
        if (!stats[c]) stats[c] = { count: 0, total: 0 };
        stats[c].count += 1;
        stats[c].total += v.sellPrice || 0;
    });

    let topVolName = '-';
    let topVolVal = 0;
    let topQtdName = '-';
    let topQtdVal = 0;

    for (const [c, s] of Object.entries(stats)) {
        if (s.total > topVolVal) { topVolVal = s.total; topVolName = c; }
        if (s.count > topQtdVal) { topQtdVal = s.count; topQtdName = c; }
    }

    elVol.innerText = topVolName;
    elVolVal.innerText = topVolVal > 0 ? "R$ " + topVolVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "R$ 0,00";

    elQtd.innerText = topQtdName;
    elQtdVal.innerText = topQtdVal + (topQtdVal === 1 ? " carro" : " carros");
}

function renderClientesTable() {
    const tbody = document.getElementById('clientes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const searchVal = (document.getElementById('search-client')?.value || '').toLowerCase();
    let filtered = clientes.filter(c => c.name.toLowerCase().includes(searchVal) || (c.document && c.document.toLowerCase().includes(searchVal)));

    if (clientesSortCol === 'name') {
        filtered.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1 * clientesSortDirection;
            if (nameA > nameB) return 1 * clientesSortDirection;
            return 0;
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan='6' style='text-align:center;'>Nenhum cliente encontrado.</td></tr>`;
        return;
    }
    filtered.forEach(c => {
        const tr = document.createElement('tr');
        const dataCad = c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : 'Local';
        tr.innerHTML = `
            <td>${c.name}</td>
            <td>${c.document || '-'}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${dataCad}</td>
            <td style='text-align: center;'>
                <button class='btn btn-secondary' style='padding:4px 8px; font-size:11px' onclick='openEditClientModal(${c.id})'><i data-lucide='pencil' style='width:12px;height:12px;'></i></button>
                <button class='btn btn-secondary' style='padding:4px 8px; font-size:11px; color:var(--red-alert); border-color:rgba(239,68,68,0.2);' onclick='deleteClient(${c.id})'><i data-lucide='trash' style='width:12px;height:12px;'></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function openAddClientModal() {
    document.getElementById('modal-client-title').innerText = 'Novo Cliente / Loja';
    document.getElementById('form-add-client').reset();
    document.getElementById('client-id').value = '';
    document.getElementById('modal-add-client').classList.add('active');
}

function closeClientModal() {
    document.getElementById('modal-add-client').classList.remove('active');
}

function openEditClientModal(id) {
    const c = clientes.find(x => x.id === id);
    if (!c) return;
    document.getElementById('modal-client-title').innerText = 'Editar Cliente / Loja';
    document.getElementById('client-id').value = c.id;
    document.getElementById('client-name').value = c.name;
    document.getElementById('client-doc').value = c.document || '';
    document.getElementById('client-phone').value = c.phone || '';
    document.getElementById('client-email').value = c.email || '';
    document.getElementById('modal-add-client').classList.add('active');
}

async function saveClient(event) {
    event.preventDefault();
    const idVal = document.getElementById('client-id').value;
    const id = idVal ? parseInt(idVal) : null;
    const name = document.getElementById('client-name').value;
    const doc = document.getElementById('client-doc').value;
    const phone = document.getElementById('client-phone').value;
    const email = document.getElementById('client-email').value;

    if (isCloudActive) {
        try {
            if (id) {
                await supabaseClient.from('clientes').update({ name, document: doc, phone, email }).eq('id', id);
            } else {
                await supabaseClient.from('clientes').insert({ name, document: doc, phone, email });
            }
            await fetchCloudData();
        } catch (e) { console.error(e); }
    } else {
        if (id) {
            const c = clientes.find(x => x.id === id);
            if (c) { c.name = name; c.document = doc; c.phone = phone; c.email = email; }
        } else {
            clientes.push({ id: Date.now(), name, document: doc, phone, email, createdAt: new Date().toISOString() });
        }
        persistLocalData();
    }
    closeClientModal();
    renderClientesTable();
}

async function deleteClient(id) {
    if (!confirm('Deseja excluir este cliente?')) return;
    if (isCloudActive) {
        await supabaseClient.from('clientes').delete().eq('id', id);
        await fetchCloudData();
    } else {
        clientes = clientes.filter(c => c.id !== id);
        persistLocalData();
    }
    renderClientesTable();
}

// Busca Inteligente no Card de Vendas
function handleClientSearch() {
    const input = document.getElementById('cd-sell-client');
    const dropdown = document.getElementById('cd-client-dropdown');
    const val = input.value.toLowerCase().trim();

    if (!val) {
        dropdown.style.display = 'none';
        return;
    }

    const matches = clientes.filter(c => c.name.toLowerCase().includes(val) || (c.document && c.document.includes(val)));

    if (matches.length > 0) {
        dropdown.innerHTML = matches.map(c => `
            <div class='custom-dropdown-item' onclick='selectClientFromDropdown(this)' data-name='${c.name}' data-doc='${c.document || ''}'>
                ${c.name} <span class='doc'>${c.document || 'Sem CPF/CNPJ'}</span>
            </div>
        `).join('');
        dropdown.style.display = 'block';
    } else {
        dropdown.innerHTML = `<div class='custom-dropdown-item' style='color:var(--text-muted); cursor:default;'>Novo Cliente: ${input.value}</div>`;
        dropdown.style.display = 'block';
    }
}

function selectClientFromDropdown(el) {
    document.getElementById('cd-sell-client').value = el.getAttribute('data-name');
    document.getElementById('cd-sell-doc').value = el.getAttribute('data-doc');
    document.getElementById('cd-client-dropdown').style.display = 'none';
}

document.addEventListener('click', function (e) {
    const dropdown = document.getElementById('cd-client-dropdown');
    if (dropdown && e.target.id !== 'cd-sell-client') {
        dropdown.style.display = 'none';
    }
});

// ==========================================
// INTEGRAÇÃO TABELA FIPE (BrasilAPI & Parallelum)
// ==========================================

async function autoUpdateFipePrice(carId, code) {
    try {
        const res = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${code}`);
        if (!res.ok) return; // Silent fail if API is down
        const data = await res.json();

        const car = estoque.find(c => c.id === carId);
        if (!car) return;

        const carYear = car.year.split('/')[0] || "0";

        let selectedFipe = data[0];
        if (data.length > 1) {
            const match = data.find(item => item.modeloAno.toString() === carYear || item.anoModelo.toString() === carYear);
            if (match) selectedFipe = match;
        }

        // Parse the returned price
        let newPriceStr = selectedFipe.valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        const newPrice = parseFloat(newPriceStr) || 0;

        if (car.fipePrice !== newPrice && newPrice > 0) {
            car.fipePrice = newPrice;

            // If the car details modal is currently open for THIS car, update UI
            if (currentCdCarId === carId) {
                document.getElementById('cd-fipe-price').value = 'R$ ' + newPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                calculateDetailsFinancials(); // Recalculate margins
            }

            // Background save to Supabase
            if (isCloudActive && supabaseClient) {
                try {
                    await supabaseClient.from('estoque').update({
                        fipe_price: newPrice
                    }).eq('id', carId);
                } catch (e) { }
            }
            persistLocalData();
        }
    } catch (e) {
        // Silent fail
    }
}

async function quickFipeSearch() {
    const codeInput = document.getElementById('cd-fipe-code');
    const priceInput = document.getElementById('cd-fipe-price');
    const code = codeInput.value.trim();
    if (!code) return;

    priceInput.value = "Buscando...";
    try {
        const res = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${code}`);
        if (!res.ok) throw new Error('Fipe não encontrada');
        const data = await res.json();

        // Data is an array of prices for different years.
        // We will try to match the car year if possible, or just pick the first one (Zero KM / most recent).
        const carYear = document.getElementById('cd-year').value.split('/')[0] || "0";

        let selectedFipe = data[0];
        if (data.length > 1) {
            // Tenta achar o ano correspondente
            const match = data.find(item => item.modeloAno.toString() === carYear || item.anoModelo.toString() === carYear);
            if (match) selectedFipe = match;
        }

        priceInput.value = selectedFipe.valor;
        saveCarDetails(); // Salva automaticamente ao encontrar
    } catch (e) {
        priceInput.value = "";
        alert("Não foi possível encontrar a Fipe para este código. Verifique se é válido.");
    }
}

function openFipeSearchModal() {
    document.getElementById('modal-fipe').style.display = 'flex';
    document.getElementById('fipe-type').value = 'carros';
    document.getElementById('fipe-brand').innerHTML = '<option value="">Selecione...</option>';
    document.getElementById('fipe-brand').disabled = true;
    document.getElementById('fipe-model').innerHTML = '<option value="">Selecione...</option>';
    document.getElementById('fipe-model').disabled = true;
    document.getElementById('fipe-year').innerHTML = '<option value="">Selecione...</option>';
    document.getElementById('fipe-year').disabled = true;
    document.getElementById('fipe-result').style.display = 'none';
    document.getElementById('btn-apply-fipe').disabled = true;

    fetchFipeBrands();
}

function closeFipeSearchModal() {
    document.getElementById('modal-fipe').style.display = 'none';
}

async function fetchFipeBrands() {
    const type = document.getElementById('fipe-type').value;
    const brandSelect = document.getElementById('fipe-brand');
    brandSelect.innerHTML = '<option value="">Carregando...</option>';
    brandSelect.disabled = true;

    try {
        const baseUrl = type === 'carros' ? 'carros' : (type === 'motos' ? 'motos' : 'caminhoes');
        const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${baseUrl}/marcas`);
        const brands = await res.json();

        brandSelect.innerHTML = '<option value="">Selecione a Marca...</option>';
        brands.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(b => {
            brandSelect.innerHTML += `<option value="${b.codigo}">${b.nome}</option>`;
        });
        brandSelect.disabled = false;

        // Auto-selecionar marca baseada no nome do carro (opcional)
        const carModelName = document.getElementById('cd-title').innerText.toUpperCase();
        for (let i = 0; i < brandSelect.options.length; i++) {
            if (carModelName.includes(brandSelect.options[i].text.toUpperCase())) {
                brandSelect.selectedIndex = i;
                fetchFipeModels();
                break;
            }
        }
    } catch (e) {
        brandSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function fetchFipeModels() {
    const type = document.getElementById('fipe-type').value;
    const brandCode = document.getElementById('fipe-brand').value;
    const modelSelect = document.getElementById('fipe-model');

    if (!brandCode) return;

    modelSelect.innerHTML = '<option value="">Carregando...</option>';
    modelSelect.disabled = true;
    document.getElementById('fipe-year').innerHTML = '<option value="">Selecione...</option>';
    document.getElementById('fipe-year').disabled = true;
    document.getElementById('fipe-result').style.display = 'none';

    try {
        // BrasilAPI uses parallelum under the hood for this route if not directly exposed,
        // Wait, BrasilAPI doesn't have an endpoint for models by brand natively in v1 documentation in a single step easily without fipe table id,
        // Let's use the parallelum API for the cascading search as it's the standard for this:
        const baseUrl = type === 'carros' ? 'carros' : (type === 'motos' ? 'motos' : 'caminhoes');
        const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${baseUrl}/marcas/${brandCode}/modelos`);
        const data = await res.json();

        modelSelect.innerHTML = '<option value="">Selecione o Modelo...</option>';
        data.modelos.forEach(m => {
            modelSelect.innerHTML += `<option value="${m.codigo}">${m.nome}</option>`;
        });
        modelSelect.disabled = false;
    } catch (e) {
        modelSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function fetchFipeYears() {
    const type = document.getElementById('fipe-type').value;
    const brandCode = document.getElementById('fipe-brand').value;
    const modelCode = document.getElementById('fipe-model').value;
    const yearSelect = document.getElementById('fipe-year');

    if (!modelCode) return;

    yearSelect.innerHTML = '<option value="">Carregando...</option>';
    yearSelect.disabled = true;
    document.getElementById('fipe-result').style.display = 'none';

    try {
        const baseUrl = type === 'carros' ? 'carros' : (type === 'motos' ? 'motos' : 'caminhoes');
        const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${baseUrl}/marcas/${brandCode}/modelos/${modelCode}/anos`);
        const years = await res.json();

        yearSelect.innerHTML = '<option value="">Selecione o Ano...</option>';
        years.forEach(y => {
            yearSelect.innerHTML += `<option value="${y.codigo}">${y.nome}</option>`;
        });
        yearSelect.disabled = false;

        const carYear = document.getElementById('cd-year').value.split('/')[0];
        for (let i = 0; i < yearSelect.options.length; i++) {
            if (yearSelect.options[i].text.includes(carYear)) {
                yearSelect.selectedIndex = i;
                fetchFipePrice();
                break;
            }
        }
    } catch (e) {
        yearSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function fetchFipePrice() {
    const type = document.getElementById('fipe-type').value;
    const brandCode = document.getElementById('fipe-brand').value;
    const modelCode = document.getElementById('fipe-model').value;
    const yearCode = document.getElementById('fipe-year').value;

    if (!yearCode) return;

    document.getElementById('fipe-res-price').innerText = "Buscando...";
    document.getElementById('fipe-result').style.display = 'block';
    document.getElementById('btn-apply-fipe').disabled = true;

    try {
        const baseUrl = type === 'carros' ? 'carros' : (type === 'motos' ? 'motos' : 'caminhoes');
        const res = await fetch(`https://parallelum.com.br/fipe/api/v1/${baseUrl}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`);
        const data = await res.json();

        document.getElementById('fipe-res-month').innerText = data.MesReferencia;
        document.getElementById('fipe-res-code').innerText = data.CodigoFipe;
        document.getElementById('fipe-res-price').innerText = data.Valor;
        document.getElementById('btn-apply-fipe').disabled = false;

        // Armazena temporariamente no botão para uso posterior
        document.getElementById('btn-apply-fipe').dataset.fipeCode = data.CodigoFipe;
        document.getElementById('btn-apply-fipe').dataset.fipePrice = data.Valor;
    } catch (e) {
        document.getElementById('fipe-res-price').innerText = "Erro ao buscar valor";
    }
}

function applyFipeResult() {
    const btn = document.getElementById('btn-apply-fipe');
    document.getElementById('cd-fipe-code').value = btn.dataset.fipeCode;
    document.getElementById('cd-fipe-price').value = btn.dataset.fipePrice;
    saveCarDetails();
    closeFipeSearchModal();
}

// --------------------------------------------------------------------------
// DOCUMENTOS DO VEÍCULO (UPLOAD, RENDER, DELETE)
// --------------------------------------------------------------------------

function handleDocFileSelected(input) {
    if (!input.files || input.files.length === 0) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    pendingDocFiles = [];

    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        // Validação de tipo
        if (!allowedTypes.includes(file.type)) {
            alert(`O arquivo "${file.name}" não é permitido. Apenas PDF e JPG são aceitos.`);
            input.value = '';
            pendingDocFiles = [];
            return;
        }

        // Validação de tamanho (5 MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`O arquivo "${file.name}" é muito grande. O limite é de 5 MB por arquivo.`);
            input.value = '';
            pendingDocFiles = [];
            return;
        }
        
        pendingDocFiles.push(file);
    }

    if (pendingDocFiles.length === 1) {
        document.getElementById('cd-doc-file-name').innerText = pendingDocFiles[0].name;
    } else {
        document.getElementById('cd-doc-file-name').innerText = `${pendingDocFiles.length} arquivos selecionados`;
    }
    
    document.getElementById('cd-doc-description').value = '';
    document.getElementById('cd-doc-upload-form').style.display = 'block';
    lucide.createIcons();
}

function cancelDocUpload() {
    pendingDocFiles = [];
    document.getElementById('cd-doc-upload-form').style.display = 'none';
    document.getElementById('cd-doc-file-input').value = '';
}

async function confirmDocUpload() {
    if (!pendingDocFiles || pendingDocFiles.length === 0 || !currentCdCarId) return;
    if (!isCloudActive) {
        alert("O upload de documentos requer conexão com a nuvem (Supabase).");
        return;
    }

    const description = document.getElementById('cd-doc-description').value.trim();

    // Mostra loading
    const btn = document.querySelector('#cd-doc-upload-form .btn-success');
    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" class="spin" style="width:14px;height:14px;margin-right:4px;"></i>Enviando...';
    btn.disabled = true;
    lucide.createIcons();

    try {
        for (let i = 0; i < pendingDocFiles.length; i++) {
            const file = pendingDocFiles[i];
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileName = `doc-${currentCdCarId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('documentos')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Erro no upload do arquivo " + file.name + ":", uploadError.message);
                continue; // Pula para o próximo em caso de erro
            }

            const { data: publicUrlData } = supabaseClient.storage
                .from('documentos')
                .getPublicUrl(fileName);

            const fileUrl = publicUrlData.publicUrl;

            // Se for múltiplos arquivos e tiver descrição, anexa o nome original para diferenciar
            let finalDesc = description;
            if (pendingDocFiles.length > 1 && description) {
                finalDesc = `${description} (${file.name})`;
            }

            await supabaseClient.from('documentos_veiculo').insert({
                car_id: currentCdCarId,
                file_name: file.name,
                file_url: fileUrl,
                file_type: file.type,
                description: finalDesc
            });
        }

        // Atualiza estado após todos os uploads
        await fetchCloudData();
        renderCarDocuments(currentCdCarId);
        cancelDocUpload();

    } catch (e) {
        console.error("Erro no upload de documento:", e);
        alert("Erro inesperado ao enviar documentos.");
    }

    btn.innerHTML = originalBtnHTML;
    btn.disabled = false;
    lucide.createIcons();
}

function renderCarDocuments(carId) {
    const container = document.getElementById('cd-documents-list');
    if (!container) return;
    container.innerHTML = '';

    const docs = documentosVeiculo.filter(d => d.carId === carId);

    if (docs.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px;">
            <i data-lucide="file-x" style="width:24px;height:24px;margin-bottom:8px;opacity:0.5;"></i>
            <p style="margin:0;">Nenhum documento anexado</p>
        </div>`;
        lucide.createIcons();
        return;
    }

    docs.forEach(doc => {
        const isPdf = doc.fileType === 'application/pdf';
        const iconName = isPdf ? 'file-text' : 'image';
        const typeLabel = isPdf ? 'PDF' : 'JPG';
        const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('pt-BR') : '';

        const row = document.createElement('div');
        row.className = 'cd-doc-row';
        row.innerHTML = `
            <div class="cd-doc-icon ${isPdf ? 'pdf' : 'img'}">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="cd-doc-info" style="flex:1; min-width:0;">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener" class="cd-doc-name" title="${doc.fileName}">${doc.description || doc.fileName}</a>
                <span class="cd-doc-meta">${typeLabel} · ${dateStr}${doc.description && doc.fileName !== doc.description ? ' · ' + doc.fileName : ''}</span>
            </div>
            <button class="btn" style="padding:4px;background:transparent;border:none;color:var(--red-alert);cursor:pointer;" onclick="deleteCarDocument(${doc.id}, '${doc.fileUrl.split('/').pop()}')" title="Excluir documento">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
        `;
        container.appendChild(row);
    });
    lucide.createIcons();
}

async function deleteCarDocument(docId, storagePath) {
    if (!confirm("Excluir este documento? Esta ação não pode ser desfeita.")) return;
    if (!isCloudActive) return;

    try {
        // Remove do storage
        await supabaseClient.storage.from('documentos').remove([storagePath]);

        // Remove da tabela
        const { error } = await supabaseClient.from('documentos_veiculo').delete().eq('id', docId);
        if (error) {
            alert("Erro ao excluir documento: " + error.message);
            return;
        }

        await fetchCloudData();
        renderCarDocuments(currentCdCarId);
    } catch (e) {
        console.error("Erro ao excluir documento:", e);
    }
}

// Função para alternar abas dentro da Ficha do Veículo
function switchCarDetailsTab(tabId) {
    // Esconde todos os painéis
    document.querySelectorAll('.mobile-tab-section').forEach(pane => {
        pane.classList.remove('active');
    });
    // Remove classe active dos botões
    document.querySelectorAll('.cd-mobile-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostra o painel correto
    document.querySelectorAll(`.mobile-tab-section.tab-${tabId}`).forEach(pane => {
        pane.classList.add('active');
    });

    // Ativa o botão correto
    document.querySelectorAll(`.cd-mobile-tab-btn`).forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
}


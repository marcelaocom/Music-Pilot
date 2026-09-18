// =========================================================================
// MEDIUS CORE SDK - OPERAÇÃO MUSIC PILOT (PONTO ZERO)
// Arquitetura: Supabase Relacional + UI Modular (Cache-First)
// =========================================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// =========================================================================
// BLOCO 1: O MOTOR SUPABASE E CREDENCIAIS
// =========================================================================
// ATENÇÃO: Insira suas chaves oficiais do Supabase aqui
const SUPABASE_URL = 'https://SUA_SUPABASE_URL_AQUI.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_SUPABASE_ANON_KEY_AQUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase; // Exposto para a malha global

// =========================================================================
// BLOCO 2: AUTENTICAÇÃO E SESSÃO GLOBAL
// =========================================================================

const authForm = document.getElementById('authForm');
if (authForm) {
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const btn = document.getElementById('btnLogar');
        const em = document.getElementById('loginEmail').value;
        const pw = document.getElementById('loginPassword').value;
        
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Conectando...';
        btn.disabled = true;
        
        const { data, error } = await supabase.auth.signInWithPassword({ email: em, password: pw });

        if (error) {
            window.showCustomAlert ? window.showCustomAlert("Acesso Negado", error.message, "fa-shield-halved", "#FF4D4F") : alert("Acesso negado: " + error.message);
            btn.innerHTML = origText; btn.disabled = false;
        } else {
            btn.innerHTML = origText; btn.disabled = false;
            // Destravado pelo listener abaixo
        }
    });
}

window.cadastrarUsuario = async function(e, s) { 
    const { data, error } = await supabase.auth.signUp({ email: e, password: s });
    if (error) alert("Erro ao recrutar: " + error.message); else alert("Conta criada! Verifique a caixa de entrada.");
};

window.recuperarSenha = async function(e) { 
    if (!e) { alert("Informe o e-mail na malha primeiro."); return; }
    const { data, error } = await supabase.auth.resetPasswordForEmail(e);
    if (error) alert("Erro: " + error.message); else alert("Link de recuperação disparado!");
};

window.sairDoSistema = async function() { 
    await supabase.auth.signOut();
    location.reload();
};

window.unlockSystem = async function() { 
    const pass = document.getElementById('unlockPassword').value; 
    if(!pass || !window.currentUser) return; 
    const { error } = await supabase.auth.signInWithPassword({ email: window.currentUser.email, password: pass });
    if(!error) {
        document.getElementById('securityLockScreen').classList.add('hidden'); 
        document.getElementById('unlockPassword').value = ''; 
    } else {
        alert("Senha incorreta!");
    }
};

// Radar de Sessão em Tempo Real
supabase.auth.onAuthStateChange((event, session) => {
    const loginScreen = document.getElementById('loginScreen'); 
    const appContainer = document.getElementById('appContainer');
    const mainSidebar = document.getElementById('mainSidebar');
    
    if (session && session.user) {
        if(loginScreen) loginScreen.classList.add('hidden'); 
        if(appContainer) appContainer.classList.remove('hidden');
        if(mainSidebar) mainSidebar.classList.remove('hidden');
        
        window.currentUser = session.user;
        
        if (window.aplicarPermissoes) window.aplicarPermissoes(session.user.email);
        window.carregarTudoDaNuvem();
    } else {
        if(loginScreen) loginScreen.classList.remove('hidden'); 
        if(appContainer) appContainer.classList.add('hidden');
        if(mainSidebar) mainSidebar.classList.add('hidden');
        window.currentUser = null;
    }
});

// =========================================================================
// BLOCO 3: ESTADO GLOBAL E NOVO CRUD SUPABASE (Telemetria)
// =========================================================================

window.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
window.appointments = JSON.parse(localStorage.getItem('appointments')) || [];
window.crmEfetivados = JSON.parse(localStorage.getItem('crmEfetivados')) || [];
window.crmProvaveis = JSON.parse(localStorage.getItem('crmProvaveis')) || [];
window.crewMembers = JSON.parse(localStorage.getItem('crewMembers')) || [];
window.crmCampaigns = JSON.parse(localStorage.getItem('crmCampaigns')) || [];

window.carregarTudoDaNuvem = async function() {
    if (!window.currentUser) return;
    try {
        const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', window.currentUser.id);
        if (txData) {
            // Mapeia colunas do Supabase (snake_case) para a UI (camelCase)
            window.transactions = txData.map(t => ({ id: t.id, desc: t.desc_text, amount: parseFloat(t.amount), type: t.type, paymentMethod: t.payment_method, category: t.category, date: t.date, eventId: t.event_id, updatedAt: t.updated_at }));
            localStorage.setItem('transactions', JSON.stringify(window.transactions));
        }

        const { data: apptData } = await supabase.from('appointments').select('*').eq('user_id', window.currentUser.id);
        if (apptData) {
            window.appointments = apptData.map(a => ({ id: a.id, osNumber: a.os_number, client: a.client, date: a.date, time: a.time, location: a.location, zona: a.zona, value: parseFloat(a.value), advanceValue: parseFloat(a.advance_value), condition: a.condition, paymentMethod: a.payment_method, status: a.status, technicalNotes: a.technical_notes, contractualNotes: a.contractual_notes, logisticaItems: a.logistica_items, logisticaDocs: a.logistica_docs, updatedAt: a.updated_at }));
            localStorage.setItem('appointments', JSON.stringify(window.appointments));
        }

        const { data: crmData } = await supabase.from('crm_clients').select('*').eq('user_id', window.currentUser.id);
        if (crmData) {
            window.crmEfetivados = []; window.crmProvaveis = [];
            crmData.forEach(d => {
                const mapCrm = { id: d.id, clientCode: d.client_code, name: d.name, clientName: d.name, phone: d.phone, contact: d.phone, social: d.social, zona: d.zona, eventType: d.event_type, stage: d.stage, campaignId: d.campaign_id, servicesHistory: d.services_history, updatedAt: d.updated_at };
                if (['Fechado', 'Pós-venda'].includes(d.stage)) window.crmEfetivados.push(mapCrm);
                else window.crmProvaveis.push(mapCrm);
            });
            localStorage.setItem('crmEfetivados', JSON.stringify(window.crmEfetivados)); localStorage.setItem('crmProvaveis', JSON.stringify(window.crmProvaveis));
            if(window.updateEfetivadosDatalist) window.updateEfetivadosDatalist();
        }

        const { data: crewData } = await supabase.from('crew_members').select('*').eq('user_id', window.currentUser.id);
        if (crewData) {
            window.crewMembers = crewData.map(c => ({ id: c.id, name: c.name, phone: c.phone, role: c.role, pix: c.pix, notes: c.notes, updatedAt: c.updated_at }));
            localStorage.setItem('crewMembers', JSON.stringify(window.crewMembers));
        }

        if (typeof window.renderApp === "function") window.renderApp();
        if (typeof window.atualizarDashboard === "function") window.atualizarDashboard();

    } catch (error) { console.error("Falha na telemetria:", error); }
};

window.factoryResetApp = async function() {
    if(confirm("🚨 ATENÇÃO MÁXIMA: Você está prestes a APAGAR TODOS os dados. Deseja continuar?")) {
        let check = prompt("Para confirmar a exclusão, digite a palavra: ZERAR");
        if (check === "ZERAR") {
            localStorage.removeItem('transactions'); localStorage.removeItem('appointments');
            localStorage.removeItem('crmProvaveis'); localStorage.removeItem('crmEfetivados');
            window.transactions = []; window.appointments = []; window.crmProvaveis = []; window.crmEfetivados = [];
            
            if (window.currentUser) {
                await supabase.from('transactions').delete().eq('user_id', window.currentUser.id);
                await supabase.from('appointments').delete().eq('user_id', window.currentUser.id);
                await supabase.from('crm_clients').delete().eq('user_id', window.currentUser.id);
            }
            alert("Sistema formatado."); location.reload();
        } else { alert("Operação abortada."); }
    }
};

// =========================================================================
// BLOCO 4: FUNÇÕES DE UI E REGRAS DE NEGÓCIO (Carroceria e DOM)
// =========================================================================

// Helpers
const getVal = id => { const e = document.getElementById(id); return e ? e.value : ''; };
function parseSafeFloat(valStr) { if(!valStr) return 0; return parseFloat(valStr.toString().replace(',', '.')) || 0; }
function generateId() { return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9); }
function maskBRPhone(input) { let v = input.value.replace(/\D/g, ''); if(v.startsWith('55')) v = v.substr(2); if(v.length>11) v = v.substr(0, 11); let out = '+55 '; if(v.length>0) out += '(' + v.substring(0, 2); if(v.length>2) out += ') ' + v.substring(2, 7); if(v.length>7) out += '-' + v.substring(7, 11); input.value = v.length>0 ? out : ''; }
function isValidBRPhone(phoneStr) { return /^\+55\s\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phoneStr.trim()); }
function applyContactPrefixes() { const ag = document.getElementById('agendaContact'); const crm = document.getElementById('crmDirectPhone'); if(ag && (!ag.value || ag.value === "+55" || ag.value.trim()==="")) ag.value = "+55 "; if(crm && (!crm.value || crm.value === "+55" || crm.value.trim()==="")) crm.value = "+55 "; }
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDateBR = (dateStr) => { if(!dateStr) return ''; const [year, month, day] = dateStr.split('-'); return `${day}/${month}/${year}`; };
function getNowDateTimeString() { const t = new Date(); return new Date(t.getTime() - (t.getTimezoneOffset() * 60000)).toISOString().slice(0, 16); }

const today = new Date(); const localDateString = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
let globalStartDate = ''; let globalEndDate = '';
function syncDates(start, end) { if(start) globalStartDate = start; if(end) globalEndDate = end; ['finStartFilter', 'agendaStartFilter'].forEach(id => { const el = document.getElementById(id); if(el) el.value = globalStartDate; }); ['finEndFilter', 'agendaEndFilter'].forEach(id => { const el = document.getElementById(id); if(el) el.value = globalEndDate; }); }

let isAutoLock = localStorage.getItem('autoLock') !== 'false';
function updateAutoLockUI() { const s = document.getElementById('autoLockStatus'); if(s) { s.innerText = isAutoLock ? "LIGADO" : "DESLIGADO"; s.className = isAutoLock ? "text-[#27D980]" : "text-[#FF4D4F]"; } }
window.toggleAutoLock = function() { isAutoLock = !isAutoLock; localStorage.setItem('autoLock', isAutoLock); updateAutoLockUI(); }
document.addEventListener('visibilitychange', () => { if (isAutoLock && document.hidden && window.currentUser) { document.getElementById('securityLockScreen').classList.remove('hidden'); } });

window.updateEfetivadosDatalist = function() {
    let dl = document.getElementById('efetivadosDatalist');
    if (!dl) { dl = document.createElement('datalist'); dl.id = 'efetivadosDatalist'; document.body.appendChild(dl); }
    dl.innerHTML = '';
    window.crmEfetivados.forEach(c => { const option = document.createElement('option'); option.value = c.clientName || c.name; dl.appendChild(option); });
};

window.enviarLinkTrocaSenha = async function() {
    if(!window.currentUser) return;
    if(confirm(`Deseja enviar um e-mail de redefinição para ${window.currentUser.email}?`)) {
        const { error } = await supabase.auth.resetPasswordForEmail(window.currentUser.email);
        if (error) alert("Erro: " + error.message); else alert("Enviado com sucesso! Verifique SPAM.");
    }
};

const WPP_TEMPLATES = { crm: "Olá, {{nome}}! Tudo bem? Sou do atendimento do Marcelão.com. Passando para conversar sobre o seu evento. Podemos fechar os detalhes?", agenda: "Fala, {{nome}}! Seu evento no dia {{data}} está confirmadíssimo na nossa agenda. O valor acordado foi R$ {{valor}}. Qualquer dúvida, estou à disposição!" };
window.dispararWhatsApp = function(btnElement, contexto) {
    const nome = btnElement.getAttribute('data-nome') || 'Cliente'; const telefone = btnElement.getAttribute('data-telefone') || ''; const dataEvento = btnElement.getAttribute('data-data') || ''; const valor = btnElement.getAttribute('data-valor') || '';
    if (!telefone || telefone.trim() === '+55' || telefone === 'N/A') { alert("Número não encontrado."); return; }
    const numeroLimpo = telefone.replace(/\D/g, '');
    let mensagem = WPP_TEMPLATES[contexto] || WPP_TEMPLATES.crm;
    mensagem = mensagem.replace('{{nome}}', nome).replace('{{data}}', dataEvento).replace('{{valor}}', valor);
    
    const dataAcao = formatDateBR(localDateString); const notaWpp = `[WPP] Mensagem enviada em ${dataAcao}.`;
    let lead = window.crmProvaveis.find(p => p.phone === telefone || p.name === nome);
    if(lead) { lead.notes = lead.notes ? `${lead.notes} \n ${notaWpp}` : notaWpp; localStorage.setItem('crmProvaveis', JSON.stringify(window.crmProvaveis)); }
    else { let ef = window.crmEfetivados.find(c => c.contact === telefone || c.clientName === nome); if(ef) { ef.notes = ef.notes ? `${ef.notes} \n ${notaWpp}` : notaWpp; localStorage.setItem('crmEfetivados', JSON.stringify(window.crmEfetivados)); } }
    if (typeof window.renderApp === "function") window.renderApp();
    const iconeOriginal = btnElement.innerHTML; btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-sm"></i>';
    setTimeout(() => { window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank'); btnElement.innerHTML = iconeOriginal; }, 600);
};

window.abrirInstagram = function(socialHandle) {
    if (!socialHandle || socialHandle.includes('não_informado') || socialHandle.trim() === '') { alert("Instagram não registrado."); return; }
    window.open(`https://instagram.com/${socialHandle.trim().replace('@', '')}`, '_blank');
};

// UI Toggles & Brand
window.toggleSidebar = function() {
    const sidebar = document.getElementById('mainSidebar'); const icon = document.getElementById('sidebarIcon'); const texts = sidebar.querySelectorAll('span, h2, p:not(.smart-tip p)');
    if (sidebar.classList.contains('w-[300px]')) { sidebar.classList.replace('w-[300px]', 'w-[100px]'); icon.classList.replace('fa-chevron-left', 'fa-chevron-right'); texts.forEach(t => t.classList.add('hidden')); } 
    else { sidebar.classList.replace('w-[100px]', 'w-[300px]'); icon.classList.replace('fa-chevron-right', 'fa-chevron-left'); texts.forEach(t => t.classList.remove('hidden')); }
};

window.toggleProfileModal = function() {
    const modal = document.getElementById('profileModal'); modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        const profile = JSON.parse(localStorage.getItem('companyProfile')) || {};
        document.getElementById('profName').value = localStorage.getItem('companyTitle') || 'MARCELÃO.COM';
        document.getElementById('profDoc').value = profile.doc || ''; document.getElementById('profPhone').value = profile.phone || ''; document.getElementById('profAddress').value = profile.address || '';
        const dtCrew = document.getElementById('crewDatalist');
        if (dtCrew) {
            dtCrew.innerHTML = ''; let nomes = new Set();
            window.crewMembers.forEach(c => { if(c.name) nomes.add(c.name.toUpperCase()); });
            nomes.forEach(n => { dtCrew.innerHTML += `<option value="${n}">`; });
        }
    }
};

window.handleProfileSubmit = function(e) {
    e.preventDefault();
    const phone = document.getElementById('profPhone').value; const address = document.getElementById('profAddress').value;
    const oldProfile = JSON.parse(localStorage.getItem('companyProfile')) || {};
    localStorage.setItem('companyProfile', JSON.stringify({ doc: oldProfile.doc, phone, address }));
    window.loadSavedBrandData(); window.toggleProfileModal(); alert('Identidade salva!');
};

window.loadSavedBrandData = function() {
    const title = localStorage.getItem('companyTitle') || 'MARCELÃO.COM'; const logo = localStorage.getItem('companyLogo'); const bg = localStorage.getItem('appBackground');
    document.querySelectorAll('#companyTitle').forEach(n => n.innerText = title);
    const logoCont = document.getElementById('logoContainer'); if (logoCont) logoCont.innerHTML = logo ? `<img src="${logo}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-image text-[#D9111F]"></i>`;
    const dynBg = document.getElementById('dynamic-bg'); if (dynBg) dynBg.style.backgroundImage = bg ? `url('${bg}')` : 'none';
};
window.triggerLogoUpload = () => document.getElementById('logoUpload').click();
window.handleLogoUpload = (e) => { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = (evt) => { localStorage.setItem('companyLogo', evt.target.result); window.loadSavedBrandData(); }; r.readAsDataURL(f); };
window.handleBgAppUpload = (e) => { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = (evt) => { localStorage.setItem('appBackground', evt.target.result); window.loadSavedBrandData(); alert('Wallpaper atualizado!'); }; r.readAsDataURL(f); };

window.generateClientCode = function() {
    const year = new Date().getFullYear().toString().slice(-2);
    const all = [...window.crmProvaveis, ...window.crmEfetivados].filter(c => c.clientCode && c.clientCode.endsWith(`/${year}`));
    let max = 0; all.forEach(c => { const num = parseInt(c.clientCode.split('/')[0]); if(!isNaN(num) && num > max) max = num; });
    return String(max + 1).padStart(4, '0') + '/' + year;
};

// =========================================================================
// CRUD: FINANCEIRO
// =========================================================================
let editingId = null;
window.handleTransaction = async function(e) {
    e.preventDefault(); 
    const tDesc = getVal('desc'); const tAmount = parseSafeFloat(getVal('amount')); const tType = getVal('type'); const tPay = getVal('paymentMethod'); const tCat = getVal('category'); const tDate = getVal('date');
    const transactionData = { id: editingId || generateId(), desc_text: tDesc, amount: tAmount, type: tType, payment_method: tPay, category: tCat, date: tDate, user_id: window.currentUser ? window.currentUser.id : null };

    if (editingId) { let idx = window.transactions.findIndex(t => t.id === editingId); if (idx !== -1) window.transactions[idx] = { id: transactionData.id, desc: tDesc, amount: tAmount, type: tType, paymentMethod: tPay, category: tCat, date: tDate }; window.cancelEdit(); }
    else { window.transactions.push({ id: transactionData.id, desc: tDesc, amount: tAmount, type: tType, paymentMethod: tPay, category: tCat, date: tDate }); document.getElementById('transactionForm').reset(); document.getElementById('date').value = localDateString; }
    
    localStorage.setItem('transactions', JSON.stringify(window.transactions)); window.financeMode = 'periodo'; window.renderApp(); window.closeFinanceiroModal();

    if(window.currentUser) { supabase.from('transactions').upsert(transactionData).then(({error}) => { if(error) console.warn("Supabase Erro:", error); }); }
};

window.deleteTransaction = function(id) { 
    if(confirm("Expurgar registro?")) { 
        window.transactions = window.transactions.filter(t => t.id !== id); localStorage.setItem('transactions', JSON.stringify(window.transactions)); window.renderApp(); 
        if(window.currentUser) supabase.from('transactions').delete().eq('id', id);
    } 
};

window.openFinanceiroModal = function() { document.getElementById('financeiroModal').classList.remove('hidden'); setTimeout(() => document.getElementById('desc').focus(), 100); };
window.closeFinanceiroModal = function() { document.getElementById('financeiroModal').classList.add('hidden'); window.cancelEdit(); };
window.cancelEdit = function() { editingId = null; document.getElementById('transactionForm').reset(); document.getElementById('date').value = localDateString; document.getElementById('formTitle').innerText = "NOVO LANÇAMENTO"; document.getElementById('cancelEditBtn').classList.add('hidden'); document.getElementById('financeiroModal').classList.add('hidden'); };
window.startEdit = function(id) { const t = window.transactions.find(t => t.id === id); if (!t) return; editingId = id; document.getElementById('desc').value = t.desc; document.getElementById('amount').value = t.amount; document.getElementById('type').value = t.type; document.getElementById('paymentMethod').value = t.paymentMethod; document.getElementById('category').value = t.category; document.getElementById('date').value = t.date; document.getElementById('formTitle').innerText = "Modificar"; document.getElementById('cancelEditBtn').classList.remove('hidden'); window.openFinanceiroModal(); };

// =========================================================================
// CRUD: AGENDA
// =========================================================================
let agendaEditingId = null;
window.handleConditionChange = function() { const condition = getVal('agendaCondition'); const iw = document.getElementById('installmentsWrapper'); const aw = document.getElementById('advanceWrapper'); if(iw) iw.classList.toggle('hidden', condition !== 'Parcelado'); if(aw) aw.classList.toggle('hidden', condition !== 'Adiantamento'); if(condition === 'Adiantamento') window.calculateRemainingValue(); };
window.calculateRemainingValue = function() { const cv = parseSafeFloat(getVal('agendaValue')); const av = parseSafeFloat(getVal('agendaAdvanceValue')); const rem = cv - av; const disp = document.getElementById('agendaRemainingDisplay'); if(disp) disp.innerText = formatCurrency(rem >= 0 ? rem : 0); };

window.handleAppointment = async function(e) {
    e.preventDefault(); 
    const cDate = getVal('agendaDate'); const cTime = getVal('agendaTime'); const status = getVal('agendaStatus');
    const todayISO = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (cDate > todayISO && (status === 'Em Andamento' || status === 'Concluido')) { alert("Bloqueio Logístico: Status não pode ser 'Concluído' antes da data do show."); return; }

    let exRec = window.appointments.find(i => i.id === agendaEditingId); let osCalc = exRec ? exRec.osNumber : 'OS-' + Date.now().toString().slice(-6);
    
    // Objeto Supabase Style
    const appDataSupabase = { id: agendaEditingId || generateId(), user_id: window.currentUser ? window.currentUser.id : null, os_number: osCalc, client: getVal('agendaClient').trim(), date: cDate, time: cTime, location: getVal('agendaLocation'), zona: getVal('agendaZona'), value: parseSafeFloat(getVal('agendaValue')), advance_value: parseSafeFloat(getVal('agendaAdvanceValue')), condition: getVal('agendaCondition'), payment_method: getVal('agendaPaymentMethod'), status: status, technical_notes: getVal('agendaContractualNotes'), contractual_notes: getVal('agendaContractualNotes') };
    
    // Objeto Local RAM Style
    const apptDataLocal = { id: appDataSupabase.id, osNumber: osCalc, contact: getVal('agendaContact'), responsible: getVal('agendaResponsible'), role: getVal('agendaRole'), eventType: getVal('agendaEventType'), client: appDataSupabase.client, service: getVal('agendaService'), category: getVal('agendaCategory'), value: appDataSupabase.value, condition: appDataSupabase.condition, paymentMethod: appDataSupabase.payment_method, advanceValue: appDataSupabase.advance_value, date: cDate, time: cTime, location: appDataSupabase.location, bairro: getVal('agendaBairro'), cidade: getVal('agendaCidade'), zona: appDataSupabase.zona, contractualNotes: appDataSupabase.contractual_notes, status: status, social: getVal('agendaSocial') };

    if (agendaEditingId) { let idx = window.appointments.findIndex(a => a.id === agendaEditingId); if(idx !== -1) window.appointments[idx] = apptDataLocal; } 
    else { window.appointments.push(apptDataLocal); }
    localStorage.setItem('appointments', JSON.stringify(window.appointments));

    if(window.currentUser) { supabase.from('appointments').upsert(appDataSupabase).then(({error}) => { if(error) console.error("Supabase Erro:", error); }); }
    
    document.getElementById('agendaForm').reset(); window.cancelAgendaEdit(); window.closeAgendaModal(); window.renderApp();
};

window.deleteAppointment = function(id) { if(confirm("Remover OS?")) { window.appointments = window.appointments.filter(a => a.id !== id); localStorage.setItem('appointments', JSON.stringify(window.appointments)); window.renderApp(); if(window.currentUser) supabase.from('appointments').delete().eq('id', id); } };
window.openAgendaModal = function() { document.getElementById('agendaModal').classList.remove('hidden'); };
window.closeAgendaModal = function() { document.getElementById('agendaModal').classList.add('hidden'); window.cancelAgendaEdit(); };
window.cancelAgendaEdit = function() { agendaEditingId = null; document.getElementById('agendaForm').reset(); document.getElementById('agendaDate').value = localDateString; document.getElementById('agendaModal').classList.add('hidden'); };

// =========================================================================
// CRUD: CRM E FUNIL
// =========================================================================
let crmEditingId = null;

window.handleCRMSave = async function(e) {
    e.preventDefault(); 
    const name = getVal('crmDirectName').trim(); const phone = getVal('crmDirectPhone'); const stage = getVal('crmDirectStage'); const evType = getVal('crmDirectEventType'); const exVal = parseSafeFloat(getVal('crmDirectValue')); const isEf = (stage === 'Fechado' || stage === 'Pós-venda');

    let clientData = { id: crmEditingId || generateId(), clientCode: window.generateClientCode(), name: name, clientName: name, phone: phone, contact: phone, stage: stage, eventType: evType, expectedValue: exVal, social: getVal('crmDirectSocial'), campaignId: window.currentActiveCampaignId || null };

    if(crmEditingId) {
        window.crmEfetivados = window.crmEfetivados.filter(c => c.id !== crmEditingId); window.crmProvaveis = window.crmProvaveis.filter(p => p.id !== crmEditingId);
    }
    
    if (isEf) window.crmEfetivados.push(clientData); else window.crmProvaveis.push(clientData);
    localStorage.setItem('crmProvaveis', JSON.stringify(window.crmProvaveis)); localStorage.setItem('crmEfetivados', JSON.stringify(window.crmEfetivados));
    
    document.getElementById('crmUnifiedForm').reset(); window.cancelCRMEdit(); window.renderApp();

    if(window.currentUser) {
        const supaData = { id: clientData.id, user_id: window.currentUser.id, client_code: clientData.clientCode, name: name, phone: phone, social: clientData.social, event_type: evType, stage: stage, campaign_id: clientData.campaignId };
        supabase.from('crm_clients').upsert(supaData).then(({error}) => { if(error) console.error(error); });
    }
};

window.cancelCRMEdit = function() { crmEditingId = null; document.getElementById('crmUnifiedForm').reset(); document.getElementById('crmCancelEditBtn').classList.add('hidden'); document.getElementById('crmSubmitBtn').innerHTML = "<i class='fa-solid fa-plus mr-1'></i> Capturar"; };
window.startCRMEdit = function(id, isEf) { crmEditingId = id; const c = isEf ? window.crmEfetivados.find(x => x.id === id) : window.crmProvaveis.find(x => x.id === id); if(!c) return; document.getElementById('crmDirectName').value = c.name || c.clientName; document.getElementById('crmDirectPhone').value = c.phone || c.contact; document.getElementById('crmDirectStage').value = c.stage; document.getElementById('crmCancelEditBtn').classList.remove('hidden'); document.getElementById('crmSubmitBtn').innerHTML = "<i class='fa-solid fa-check mr-1'></i> Salvar"; };

window.deleteClient = function(id, isEf, origin) {
    if(confirm("Excluir Cliente Permanentemente?")) {
        window.crmEfetivados = window.crmEfetivados.filter(c => c.id !== id); window.crmProvaveis = window.crmProvaveis.filter(p => p.id !== id);
        localStorage.setItem('crmEfetivados', JSON.stringify(window.crmEfetivados)); localStorage.setItem('crmProvaveis', JSON.stringify(window.crmProvaveis));
        window.renderApp();
        if(window.currentUser) supabase.from('crm_clients').delete().eq('id', id);
    }
};

window.moveCard = async function(id, isEf, newStage) { 
    if(!newStage) return; 
    let c = isEf ? window.crmEfetivados.find(x => x.id === id) : window.crmProvaveis.find(x => x.id === id);
    if(c) {
        c.stage = newStage;
        if(newStage === 'Fechado' || newStage === 'Pós-venda') {
            window.crmEfetivados.push(c); window.crmProvaveis = window.crmProvaveis.filter(x => x.id !== id);
        } else {
            window.crmProvaveis.push(c); window.crmEfetivados = window.crmEfetivados.filter(x => x.id !== id);
        }
        localStorage.setItem('crmEfetivados', JSON.stringify(window.crmEfetivados)); localStorage.setItem('crmProvaveis', JSON.stringify(window.crmProvaveis));
        window.renderApp();
        if(window.currentUser) supabase.from('crm_clients').update({ stage: newStage }).eq('id', id);
    }
};

window.drag = (ev, id, isEf) => { ev.dataTransfer.setData("id", id); ev.dataTransfer.setData("isEf", isEf); ev.target.classList.add('dragging'); };
window.dragEnter = (ev) => { ev.preventDefault(); ev.currentTarget.classList.add('drag-over'); };
window.dragLeave = (ev) => { ev.currentTarget.classList.remove('drag-over'); };
window.allowDrop = (ev) => { ev.preventDefault(); };
window.drop = (ev, newStage) => { ev.preventDefault(); ev.currentTarget.classList.remove('drag-over'); const id = ev.dataTransfer.getData("id"); const isEf = ev.dataTransfer.getData("isEf") === 'true'; window.moveCard(id, isEf, newStage); };

// =========================================================================
// GDE, ÁREA TÉCNICA E LOGÍSTICA (O RIDER)
// =========================================================================

window.currentGdeEvent = null;
window.openGdeDashboard = function(eventId, eventName, eventCache) {
    window.currentGdeEvent = { id: eventId, name: eventName, cache: eventCache || 0 };
    document.getElementById('gdeTitle').innerText = `GDE - ${eventName.toUpperCase()}`;
    document.getElementById('gdeCacheValue').innerText = formatCurrency(eventCache || 0);
    window.refreshGdeDashboard(); document.getElementById('gdeDashboardModal').classList.remove('hidden');
};
window.closeGdeDashboard = () => { document.getElementById('gdeDashboardModal').classList.add('hidden'); window.currentGdeEvent = null; };

window.refreshGdeDashboard = function() {
    if (!window.currentGdeEvent) return;
    const evTxs = window.transactions.filter(t => t.eventId === window.currentGdeEvent.id);
    const tbody = document.getElementById('gdeTableBody'); if(!tbody) return; tbody.innerHTML = '';
    
    let totalIn = 0; let totalOut = 0;
    evTxs.forEach(t => {
        if(t.type === 'entrada') totalIn += t.amount; else totalOut += t.amount;
        tbody.innerHTML += `<tr class="border-b border-[#2C1013]"><td class="p-4">${formatDateBR(t.date)}</td><td class="p-4">${t.category}</td><td class="p-4">${t.desc}</td><td class="p-4 text-center ${t.type==='entrada'?'text-[#27D980]':'text-[#FF4D4F]'}">${t.type.toUpperCase()}</td><td class="p-4 text-right">${formatCurrency(t.amount)}</td><td class="p-4 text-center"><button onclick="window.deleteGdeTransaction('${t.id}')" class="text-[#FF4D4F]"><i class="fa-solid fa-trash"></i></button></td></tr>`;
    });
    
    document.getElementById('gdeTotalIn').innerText = formatCurrency(totalIn);
    document.getElementById('gdeTotalOut').innerText = formatCurrency(totalOut);
    document.getElementById('gdeBalance').innerText = formatCurrency(window.currentGdeEvent.cache + totalIn - totalOut);
};

window.handleInlineGdeSubmit = async function(e) {
    e.preventDefault();
    const tData = { id: generateId(), user_id: window.currentUser ? window.currentUser.id : null, desc_text: getVal('inlineGdeDesc'), amount: parseSafeFloat(getVal('inlineGdeAmount')), type: getVal('inlineGdeType'), payment_method: getVal('inlineGdePay'), category: getVal('inlineGdeCat'), date: getVal('inlineGdeDate'), event_id: window.currentGdeEvent.id };
    
    window.transactions.push({ id: tData.id, desc: tData.desc_text, amount: tData.amount, type: tData.type, paymentMethod: tData.payment_method, category: tData.category, date: tData.date, eventId: tData.event_id });
    localStorage.setItem('transactions', JSON.stringify(window.transactions)); window.refreshGdeDashboard(); document.getElementById('inlineGdeDesc').value = '';
    
    if(window.currentUser) supabase.from('transactions').upsert(tData);
};

window.deleteGdeTransaction = function(id) { 
    if(confirm("Remover despesa do GDE?")) { 
        window.transactions = window.transactions.filter(t => t.id !== id); localStorage.setItem('transactions', JSON.stringify(window.transactions)); window.refreshGdeDashboard(); 
        if(window.currentUser) supabase.from('transactions').delete().eq('id', id); 
    } 
};

// =========================================================================
// SISTEMA CORE DE RENDERIZAÇÃO (O HUB CENTRAL)
// =========================================================================

window.switchTab = function(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    let targetId = 'view' + tab.charAt(0).toUpperCase() + tab.slice(1); if (tab === 'crm') targetId = 'viewCRM';
    const view = document.getElementById(targetId); if(view) view.classList.remove('hidden');
    
    const btnNormal = "w-full flex items-center gap-4 h-[60px] px-4 rounded-[18px] hover:bg-[#2C1013] text-[#B7B7B7] hover:text-[#D9111F] transition group";
    const btnActive = "w-full flex items-center gap-4 h-[60px] px-4 rounded-[18px] bg-[#D9111F] text-white shadow-[0_0_15px_rgba(217,17,31,0.4)] transition group";
    
    ['btnTabDashboard', 'btnTabFinanceiro', 'btnTabAgenda', 'btnTabClientes', 'btnTabCRM', 'btnTabJuridico', 'btnTabTecnica', 'btnTabCrew', 'btnTabManual'].forEach(id => { const el = document.getElementById(id); if(el) { el.className = btnNormal; el.style.background = ""; } });
    let activeBtnId = 'btnTab' + tab.charAt(0).toUpperCase() + tab.slice(1); if (tab === 'crm') activeBtnId = 'btnTabCRM';
    const activeBtn = document.getElementById(activeBtnId); if(activeBtn) activeBtn.className = btnActive;
    
    if(tab === 'crm' && typeof window.renderCampaignsLobby === 'function') window.renderCampaignsLobby();
    window.renderApp();
};

window.renderApp = function() {
    // Essa função coordena a injeção visual dos arrays (Financeiro, Agenda, CRM) no DOM
    const fStart = getVal('finStartFilter') || globalStartDate; const fEnd = getVal('finEndFilter') || globalEndDate;
    
    // RENDER: Caixa
    const list = document.getElementById('transactionList');
    if (list) {
        list.innerHTML = '';
        const tFil = window.transactions.filter(t => t.date >= fStart && t.date <= fEnd).sort((a,b) => new Date(b.date) - new Date(a.date));
        tFil.forEach(t => {
            list.innerHTML += `<tr class="border-b border-[#2C1013]"><td class="p-4 text-[#B7B7B7]">${formatDateBR(t.date)}</td><td class="p-4 font-bold text-white">${t.desc}</td><td class="p-4"><span class="bg-[#2C1013] px-2 py-1 rounded text-[11px]">${t.category}</span></td><td class="p-4 text-center font-bold ${t.type==='entrada'?'text-[#27D980]':'text-[#FF4D4F]'}">${formatCurrency(t.amount)}</td><td class="p-4 text-center"><button onclick="window.startEdit('${t.id}')" class="text-[#F5A623] mx-1"><i class="fa-solid fa-pen"></i></button><button onclick="window.deleteTransaction('${t.id}')" class="text-[#FF4D4F] mx-1"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        });
    }

    // RENDER: Dashboard e Dashboard Counters
    if(typeof window.atualizarDashboard === 'function') window.atualizarDashboard();
};

window.atualizarDashboard = function() {
    const drh = document.getElementById('dashReceberHoje'); if(drh) {
        let aReceberHoje = 0;
        window.appointments.forEach(a => { if (a.date === localDateString && a.status !== 'Concluido') { aReceberHoje += ((a.value || 0) - (a.advanceValue || 0)); } });
        drh.innerText = formatCurrency(aReceberHoje);
    }
};

window.onload = () => { 
    window.loadSavedBrandData(); 
    window.updateAutoLockUI(); 
    syncDates(globalStartDate, globalEndDate); 
    if(window.updateEfetivadosDatalist) window.updateEfetivadosDatalist(); 
    const dtNode = document.getElementById('agendaBookingDateTime'); if(dtNode) dtNode.value = getNowDateTimeString();
    window.switchTab('dashboard'); 
};

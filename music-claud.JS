// ==========================================
// MEDIUS CORE SDK - MOTOR MUSIC PILOT
// INFRAESTRUTURA: SUPABASE (PostgreSQL)
// PARTE 1: INICIALIZAÇÃO
// ==========================================

// Substitua pelas suas credenciais reais do Supabase
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

// Inicialização do Cliente (Modo Camaleão via CDN)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expõe globalmente para a malha HTML
window.supabase = supabase;

console.log("🔥 Motor Supabase injetado na malha operando a 200km/h.");
// ==========================================
// PARTE 2: MÓDULO DE ACESSO (CADASTRO E LOGOUT)
// ==========================================

window.cadastrarUsuario = async function(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        alert("Erro na blindagem de cadastro: " + error.message);
    } else {
        alert("Conta criada com sucesso! Verifique seu e-mail ou faça login.");
    }
};

window.recuperarSenha = async function(email) {
    if (!email) { alert("Digite seu e-mail no campo para recuperar a senha."); return; }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        alert("Falha na recuperação: " + error.message);
    } else {
        alert("Código de resgate enviado para a base. Verifique seu e-mail!");
    }
};

window.sairDoSistema = async function() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert("Erro ao abortar conexão: " + error.message);
    } else {
        location.reload();
    }
};
// ==========================================
// PARTE 3: O RADAR (SESSÃO E LOGIN)
// ==========================================

// Monitoramento de Sessão Blindado (Nativo Supabase)
supabase.auth.onAuthStateChange(async (event, session) => {
    const loginScreen = document.getElementById('loginScreen'); 
    const appContainer = document.getElementById('appContainer');
    
    if (session) {
        console.log("Sincronia estabelecida. Piloto na cabine:", session.user.email);
        if(loginScreen) loginScreen.classList.add('hidden'); 
        if(appContainer) appContainer.classList.remove('hidden');
        
        // Dispara o carregamento dos módulos de dados de forma segura
        if (typeof window.carregarTransactionsDoSupabase === 'function') window.carregarTransactionsDoSupabase();
        if (typeof window.carregarAppointmentsDoSupabase === 'function') window.carregarAppointmentsDoSupabase();
        if (typeof window.carregarCRMDoSupabase === 'function') window.carregarCRMDoSupabase();
        if (typeof window.carregarCrewDoSupabase === 'function') window.carregarCrewDoSupabase();
    } else {
        console.log("Sinal perdido. Aguardando login.");
        if(loginScreen) loginScreen.classList.remove('hidden'); 
        if(appContainer) appContainer.classList.add('hidden');
    }
});

// Refatoração Blindada do Botão de Login
document.addEventListener("DOMContentLoaded", () => {
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
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: em,
                    password: pw
                });

                if (error) {
                    alert("Acesso Negado: " + error.message);
                    btn.innerHTML = origText; 
                    btn.disabled = false;
                } else {
                    document.getElementById('loginScreen').classList.add('hidden');
                    document.getElementById('appContainer').classList.remove('hidden');
                    btn.innerHTML = origText; 
                    btn.disabled = false;
                }
            } catch (err) {
                alert("Erro crítico no motor de login: " + err.message);
                btn.innerHTML = origText; 
                btn.disabled = false;
            }
        });
    }

    const btnCriarConta = document.getElementById('btnCriarConta');
    if (btnCriarConta) {
        btnCriarConta.addEventListener('click', () => {
            const em = document.getElementById('loginEmail').value;
            const pw = document.getElementById('loginPassword').value;
            if(em && pw) window.cadastrarUsuario(em, pw);
            else alert("Preencha e-mail e senha para iniciar o cadastro!");
        });
    }
});
// ==========================================
// PARTE 4: SINCRONIZAÇÃO DE DADOS (CAIXA E AGENDA)
// ==========================================

window.carregarTransactionsDoSupabase = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error("Erro ao carregar transações:", error.message);
    } else {
        window.transactions = data || [];
        if (typeof window.renderApp === 'function') window.renderApp();
    }
};

window.salvarTransactionSupabase = async function(transacaoObj) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Sessão expirada. Faça login novamente."); return; }

    transacaoObj.user_id = user.id;

    const { data, error } = await supabase
        .from('transactions')
        .upsert([transacaoObj])
        .select();

    if (error) {
        alert("Erro ao salvar lançamento no caixa: " + error.message);
    } else {
        console.log("Transação salva na nuvem.");
        window.carregarTransactionsDoSupabase();
    }
};

window.carregarAppointmentsDoSupabase = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error("Erro ao carregar agenda:", error.message);
    } else {
        window.appointments = data || [];
        if (typeof window.renderApp === 'function') window.renderApp();
    }
};

window.salvarAppointmentSupabase = async function(agendaObj) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Sessão expirada."); return; }

    agendaObj.user_id = user.id;

    const { data, error } = await supabase
        .from('appointments')
        .upsert([agendaObj])
        .select();

    if (error) {
        alert("Erro ao salvar agenda: " + error.message);
    } else {
        console.log("Agenda sincronizada com o Supabase.");
        window.carregarAppointmentsDoSupabase();
    }
};
// ==========================================
// PARTE 5: EXTENSÃO DE DADOS (CRM E CREW)
// ==========================================

window.carregarCRMDoSupabase = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('crm_clients')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error("Erro ao carregar CRM:", error.message);
    } else {
        window.crmClients = data || [];
        if (typeof window.renderApp === 'function') window.renderApp();
    }
};

window.salvarCRMSupabase = async function(crmObj) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Sessão expirada."); return; }

    crmObj.user_id = user.id;

    const { data, error } = await supabase
        .from('crm_clients')
        .upsert([crmObj])
        .select();

    if (error) {
        alert("Erro ao salvar lead no CRM: " + error.message);
    } else {
        console.log("Lead sincronizado com sucesso.");
        window.carregarCRMDoSupabase();
    }
};

window.carregarCrewDoSupabase = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error("Erro ao carregar crew:", error.message);
    } else {
        window.crewMembers = data || [];
        if (typeof window.renderApp === 'function') window.renderApp();
    }
};

window.salvarCrewSupabase = async function(crewObj) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Sessão expirada."); return; }

    crewObj.user_id = user.id;

    const { data, error } = await supabase
        .from('crew_members')
        .upsert([crewObj])
        .select();

    if (error) {
        alert("Erro ao salvar parceiro técnico: " + error.message);
    } else {
        console.log("Parceiro salvo na nuvem.");
        window.carregarCrewDoSupabase();
    }
};

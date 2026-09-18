// ==========================================
// MEDIUS CORE SDK - MOTOR MUSIC PILOT
// INFRAESTRUTURA: SUPABASE (PostgreSQL)
// ==========================================

// 1. CHAVES GLOBAIS (Substitua pelas suas credenciais reais do Supabase)
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

// 2. INICIALIZAÇÃO DO CLIENTE (Modo Camaleão via CDN)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expõe globalmente para o restante do sistema
window.supabase = supabase;

console.log("🔥 Motor Supabase injetado na malha operando a 200km/h.");

// ==========================================
// MÓDULO 1: AUTENTICAÇÃO (Substituindo Firebase)
// ==========================================

window.cadastrarUsuario = async function(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        alert("Erro na blindagem de cadastro: " + error.message);
    } else {
        alert("Conta criada com sucesso! Verifique seu e-mail (se confirmação estiver ativa no Supabase) ou faça login.");
    }
};

window.recuperarSenha = async function(email) {
    if (!email) { alert("Digite seu e-mail no campo para recuperar."); return; }
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

// Monitoramento de Sessão (O Radar)
supabase.auth.onAuthStateChange((event, session) => {
    const loginScreen = document.getElementById('loginScreen'); 
    const appContainer = document.getElementById('appContainer');
    
    if (session) {
        console.log("Sincronia estabelecida. Piloto na cabine:", session.user.email);
        if(loginScreen) loginScreen.classList.add('hidden'); 
        if(appContainer) appContainer.classList.remove('hidden');
        
        // Chamaremos o carregamento de dados aqui nas próximas etapas (transactions, appointments, etc)
    } else {
        console.log("Sinal perdido. Aguardando login.");
        if(loginScreen) loginScreen.classList.remove('hidden'); 
        if(appContainer) appContainer.classList.add('hidden');
    }
});

// Refatoração do botão de Login
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
            
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: em,
                password: pw
            });

            if (error) {
                alert("Acesso Negado. Credenciais inválidas.");
                btn.innerHTML = origText; 
                btn.disabled = false;
            } else {
                // O onAuthStateChange cuida de esconder o login
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
// MÓDULO 2: SINCRONIZAÇÃO DE DADOS (SUPABASE)
// ==========================================

// 1. CARREGAR TRANSAÇÕES (Caixa)
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

// 2. SALVAR OU ATUALIZAR TRANSAÇÃO
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
        console.log("Transação salva com sucesso na nuvem.");
        window.carregarTransactionsDoSupabase();
    }
};

// 3. CARREGAR AGENDA DE SHOWS E OS
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

// 4. SALVAR OU ATUALIZAR AGENDA / OS
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
// MÓDULO 2 (EXTENSÃO): CRM E CREW (SUPABASE)
// ==========================================

// 5. CARREGAR CLIENTES E CRM
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

// 6. SALVAR OU ATUALIZAR CLIENTE / CRM
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

// 7. CARREGAR CREW & PARCEIROS
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

// 8. SALVAR OU ATUALIZAR CREW
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
// Monitoramento de Sessão Blindado (Fim do Loop)
supabase.auth.onAuthStateChanged(async (event, session) => {
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

// Refatoração Blindada do Botão de Login (Elimina travamentos)
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
                    // Força a ocultação imediata do login para evitar o loop visual
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
});

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
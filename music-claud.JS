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

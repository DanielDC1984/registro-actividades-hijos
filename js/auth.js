// ============================================================
// 📋 MODELO: USUARIOS Y AUTENTICACIÓN (sincronizado con Supabase)
// ============================================================
const Auth = {
    TABLE: "usuarios",
    CACHE_KEY: "usuarios_cache", // respaldo local para modo offline
    CURRENT_KEY: "usuario_actual", // sesión activa: sigue siendo local a este dispositivo
    users: [],

    // Trae la lista completa desde Supabase (con respaldo local si falla la red)
    async load() {
        try {
            const { data, error } = await supabaseClient.from(this.TABLE).select("*");
            if (error) throw error;
            this.users = data || [];
            if (this.users.length === 0) {
                // Primera vez: sembrar usuario admin por defecto
                const admin = { username: "admin", password: "123321", role: "admin", approved: true, blocked: false };
                await this._upsertRemote(admin);
                this.users = [admin];
            }
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.users));
        } catch (err) {
            console.error("Error cargando usuarios de Supabase:", err);
            const cached = localStorage.getItem(this.CACHE_KEY);
            this.users = cached ? JSON.parse(cached) : [{ username: "admin", password: "123321", role: "admin", approved: true, blocked: false }];
        }
        return this.users;
    },

    // Getters síncronos: usan la lista ya cargada en memoria (llamar load() antes)
    getUsers() { return this.users; },
    getPendingUsers() { return this.users.filter(u => u.role === "user" && !u.approved); },

    async _upsertRemote(user) {
        const { error } = await supabaseClient.from(this.TABLE).upsert({ ...user, updated_at: new Date().toISOString() });
        if (error) throw error;
    },
    async _deleteRemote(username) {
        const { error } = await supabaseClient.from(this.TABLE).delete().eq("username", username);
        if (error) throw error;
    },
    _cache() { localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.users)); },

    getCurrentUser() {
        const stored = localStorage.getItem(this.CURRENT_KEY);
        if (!stored) return null;
        try { return JSON.parse(stored); } catch (e) { return null; }
    },
    setCurrentUser(user) { localStorage.setItem(this.CURRENT_KEY, JSON.stringify(user)); },
    clearCurrentUser() { localStorage.removeItem(this.CURRENT_KEY); },

    // Devuelve { ok: true, user } o { ok: false, reason: 'invalid'|'blocked'|'pending'|'network', error? }
    async login(username, password) {
        try {
            await this.load(); // refresca antes de validar, por si se registró desde otro dispositivo
            const user = this.users.find(u => u.username === username && u.password === password);
            if (!user) return { ok: false, reason: "invalid" };
            if (user.blocked) return { ok: false, reason: "blocked" };
            if (!user.approved) return { ok: false, reason: "pending" };
            this.setCurrentUser(user);
            return { ok: true, user };
        } catch (err) {
            console.error("Error iniciando sesión:", err);
            return { ok: false, reason: "network", error: err.message || String(err) };
        }
    },

    // Devuelve { ok: true } o { ok: false, reason: 'exists' | 'network', error? }
    async register(username, password) {
        try {
            await this.load();
            if (this.users.find(u => u.username === username)) return { ok: false, reason: "exists" };
            const nuevo = { username, password, role: "user", approved: false, blocked: false };
            await this._upsertRemote(nuevo);
            this.users.push(nuevo);
            this._cache();
            return { ok: true };
        } catch (err) {
            console.error("Error registrando usuario:", err);
            return { ok: false, reason: "network", error: err.message || String(err) };
        }
    },

    async approve(username) {
        const user = this.users.find(u => u.username === username);
        if (!user) return false;
        user.approved = true;
        await this._upsertRemote(user);
        this._cache();
        return true;
    },

    async block(username) {
        const user = this.users.find(u => u.username === username);
        if (!user || user.username === "admin") return false;
        user.blocked = true;
        await this._upsertRemote(user);
        this._cache();
        return true;
    },

    async unblock(username) {
        const user = this.users.find(u => u.username === username);
        if (!user) return false;
        user.blocked = false;
        await this._upsertRemote(user);
        this._cache();
        return true;
    },

    // Devuelve { ok: true } o { ok: false, reason: 'is_admin' }
    async remove(username) {
        if (username === "admin") return { ok: false, reason: "is_admin" };
        await this._deleteRemote(username);
        this.users = this.users.filter(u => u.username !== username);
        this._cache();
        return { ok: true };
    },

    logout() { this.clearCurrentUser(); },

    // Escucha cambios de otros dispositivos (nuevos registros, aprobaciones, etc.)
    subscribeRealtime(onChange) {
        supabaseClient
            .channel("cambios-usuarios")
            .on("postgres_changes", { event: "*", schema: "public", table: this.TABLE },
                () => { this.load().then(onChange); })
            .subscribe();
    },
};

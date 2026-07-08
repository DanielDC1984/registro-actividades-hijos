// ============================================================
// 📋 MODELO: USUARIOS Y AUTENTICACIÓN
// ============================================================
const Auth = {
    USERS_KEY: "usuarios_registrados",
    CURRENT_KEY: "usuario_actual",

    getUsers() {
        const stored = localStorage.getItem(this.USERS_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { /* datos corruptos, se recrean abajo */ }
        }
        const defaultUsers = [{ username: "admin", password: "123321", role: "admin", approved: true, blocked: false }];
        this.saveUsers(defaultUsers);
        return defaultUsers;
    },

    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    getCurrentUser() {
        const stored = localStorage.getItem(this.CURRENT_KEY);
        if (!stored) return null;
        try { return JSON.parse(stored); } catch (e) { return null; }
    },

    setCurrentUser(user) {
        localStorage.setItem(this.CURRENT_KEY, JSON.stringify(user));
    },

    clearCurrentUser() {
        localStorage.removeItem(this.CURRENT_KEY);
    },

    getPendingUsers() {
        return this.getUsers().filter(u => u.role === "user" && !u.approved);
    },

    // Devuelve { ok: true, user } o { ok: false, reason: 'invalid'|'blocked'|'pending' }
    login(username, password) {
        const user = this.getUsers().find(u => u.username === username && u.password === password);
        if (!user) return { ok: false, reason: "invalid" };
        if (user.blocked) return { ok: false, reason: "blocked" };
        if (!user.approved) return { ok: false, reason: "pending" };
        this.setCurrentUser(user);
        return { ok: true, user };
    },

    // Devuelve { ok: true } o { ok: false, reason: 'exists' }
    register(username, password) {
        const users = this.getUsers();
        if (users.find(u => u.username === username)) return { ok: false, reason: "exists" };
        users.push({ username, password, role: "user", approved: false, blocked: false });
        this.saveUsers(users);
        return { ok: true };
    },

    approve(username) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return false;
        user.approved = true;
        this.saveUsers(users);
        return true;
    },

    block(username) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);
        if (!user || user.username === "admin") return false;
        user.blocked = true;
        this.saveUsers(users);
        return true;
    },

    unblock(username) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return false;
        user.blocked = false;
        this.saveUsers(users);
        return true;
    },

    // Devuelve { ok: true } o { ok: false, reason: 'is_admin' }
    remove(username) {
        if (username === "admin") return { ok: false, reason: "is_admin" };
        let users = this.getUsers();
        users = users.filter(u => u.username !== username);
        this.saveUsers(users);
        localStorage.removeItem(`actividadesData_${username}`); // limpieza de datos legacy por usuario
        return { ok: true };
    },

    logout() {
        this.clearCurrentUser();
    },
};

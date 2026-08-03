// ============================================================
// 📊 MODELO: DATOS DE LA FAMILIA (LocalStorage + Supabase)
// ============================================================
const Store = {
    STORAGE_KEY: "actividadesData_global",
    data: { hijos: [], actividades: [], registros: [] },

    // ---------- Carga inicial ----------
    load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try { this.data = JSON.parse(stored); } catch (e) { console.error("Error parseando LocalStorage:", e); }
        }

        // Migrar registros antiguos que solo tenían "fecha" (sin hora)
        this.data.registros = (this.data.registros || []).map(r => (
            r.fecha && !r.fechaHora ? { ...r, fechaHora: r.fecha + "T00:00" } : r
        ));

        if (!this.data.hijos || this.data.hijos.length === 0) {
            this.data.hijos = [
                { id: 1, nombre: "Mateo", edad: 5 },
                { id: 2, nombre: "Sofía", edad: 3 },
            ];
        }
        if (!this.data.actividades || this.data.actividades.length === 0) {
            this.data.actividades = [
                { id: 1, nombre: "Lectura" },
                { id: 2, nombre: "Dibujo" },
                { id: 3, nombre: "Deporte" },
                { id: 4, nombre: "Música" },
            ];
        }
        if (this.data.registros.length === 0) {
            const ahora = getFechaHoraLocal();
            this.data.registros = [
                { id: 1, hijoId: 1, actividadId: 1, descripcion: "Leyó 10 páginas", fechaHora: ahora, usuario: "admin" },
                { id: 2, hijoId: 2, actividadId: 2, descripcion: "Dibujó un paisaje", fechaHora: ahora, usuario: "admin" },
            ];
        }
        this.saveLocal();
    },

    saveLocal() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    },

    // Guarda local y sincroniza a Supabase (fire-and-forget)
    persist() {
        this.saveLocal();
        this.saveToSupabase();
    },

    // ---------- Supabase ----------
    async loadFromSupabase() {
        const { data: dbData, error } = await supabaseClient
            .from("familias")
            .select("*")
            .eq("id", FAMILIA_ID)
            .single();
        if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows yet
        if (dbData) {
            this.data.hijos = dbData.hijos || [];
            this.data.actividades = dbData.actividades || [];
            this.data.registros = dbData.registros || [];
            this.saveLocal();
        }
    },

    async saveToSupabase() {
        const { error } = await supabaseClient.from("familias").upsert({
            id: FAMILIA_ID,
            hijos: this.data.hijos,
            actividades: this.data.actividades,
            registros: this.data.registros,
            updated_at: new Date().toISOString(),
        });
        if (error) throw error;
    },

    subscribeRealtime(onRemoteChange) {
        supabaseClient
            .channel("cambios-familia")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "familias", filter: `id=eq.${FAMILIA_ID}` },
                payload => {
                    if (!payload.new) return;
                    this.data.hijos = payload.new.hijos || [];
                    this.data.actividades = payload.new.actividades || [];
                    this.data.registros = payload.new.registros || [];
                    this.saveLocal();
                    onRemoteChange();
                })
            .subscribe(status => { if (status === "SUBSCRIBED") console.log("📡 Escuchando cambios..."); });
    },

    // ---------- Lookups ----------
    getNombreHijo(id) {
        const h = this.data.hijos.find(h => h.id === id);
        return h ? h.nombre : "Desconocido";
    },
    getNombreActividad(id) {
        const a = this.data.actividades.find(a => a.id === id);
        return a ? a.nombre : "Desconocida";
    },

    // ---------- CRUD: Hijos ----------
    addHijo(nombre, edad) {
        this.data.hijos.push({ id: Date.now(), nombre, edad: edad ? parseInt(edad, 10) : null });
        this.persist();
    },
    deleteHijo(id) {
        this.data.hijos = this.data.hijos.filter(h => h.id !== id);
        this.persist();
    },

    // ---------- CRUD: Actividades (catálogo) ----------
    addActividad(nombre) {
        this.data.actividades.push({ id: Date.now(), nombre });
        this.persist();
    },
    deleteActividad(id) {
        this.data.actividades = this.data.actividades.filter(a => a.id !== id);
        this.persist();
    },

    // ---------- CRUD: Registros ----------
    addRegistro({ hijoId, actividadId, descripcion, fechaHora, usuario }) {
        this.data.registros.push({
            id: Date.now(), hijoId, actividadId,
            descripcion: descripcion || "Sin descripción",
            fechaHora, usuario: usuario || "anonimo",
        });
        this.persist();
    },
    updateRegistro(id, cambios) {
        const index = this.data.registros.findIndex(r => r.id === id);
        if (index === -1) return false;
        this.data.registros[index] = { ...this.data.registros[index], ...cambios };
        this.persist();
        return true;
    },
    deleteRegistro(id) {
        this.data.registros = this.data.registros.filter(r => r.id !== id);
        this.persist();
    },

    // ---------- Filtros para reportes ----------
    registrosDeHoy() {
        const hoy = getFechaLocal();
        return this.data.registros.filter(r => (r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha) === hoy);
    },
    registrosEnRango(desde, hasta) {
        return this.data.registros.filter(r => {
            const f = r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha;
            return f >= desde && f <= hasta;
        });
    },
    registrosDeHijo(hijoId) {
        return this.data.registros.filter(r => r.hijoId == hijoId);
    },
};

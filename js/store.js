// ============================================================
// 📊 MODELO: DATOS DE LA FAMILIA (LocalStorage + Supabase)
// ============================================================
const Store = {
    STORAGE_KEY: "actividadesData_global",
    data: {
        hijos: [],
        actividades: [],
        registros: [],
        recompensas: [],
        canjes: [],
        auditLog: [],
        anuncio: {
            activo: true,
            titulo: "📢 ¡Nueva actualización en el sistema!",
            mensaje: "¡Hola a todos! A partir de ahora, cada actividad registrada otorga PUNTOS. Pueden competir en el 🏆 Ranking Familiar y canjear sus puntos por premios en la 🎁 Tienda de Recompensas."
        }
    },

    // Helper de seguridad: verifica si el usuario en sesión es Admin
    isAdmin() {
        if (typeof Auth === "undefined") return false;
        const user = Auth.getCurrentUser();
        return Boolean(user && (user.role === "admin" || user.username === "admin"));
    },

    // ---------- Carga inicial ----------
    load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try { this.data = JSON.parse(stored); } catch (e) { console.error("Error parseando LocalStorage:", e); }
        }

        // Asegurar que las listas existan
        if (!this.data.hijos) this.data.hijos = [];
        if (!this.data.actividades) this.data.actividades = [];
        if (!this.data.registros) this.data.registros = [];
        if (!this.data.recompensas) this.data.recompensas = [];
        if (!this.data.canjes) this.data.canjes = [];
        if (!this.data.auditLog) this.data.auditLog = [];
        if (!this.data.anuncio) {
            this.data.anuncio = {
                activo: true,
                titulo: "📢 ¡Nueva actualización en el sistema!",
                mensaje: "¡Hola a todos! A partir de ahora, cada actividad registrada otorga PUNTOS. Pueden competir en el 🏆 Ranking Familiar y canjear sus puntos por premios en la 🎁 Tienda de Recompensas."
            };
        }

        // Migrar registros antiguos que solo tenían "fecha" (sin hora)
        this.data.registros = (this.data.registros || []).map(r => (
            r.fecha && !r.fechaHora ? { ...r, fechaHora: r.fecha + "T00:00" } : r
        ));

        // Asegurar campo puntos en actividades
        this.data.actividades = this.data.actividades.map(a => ({
            ...a,
            puntos: typeof a.puntos === "number" ? a.puntos : (parseInt(a.puntos, 10) || 0)
        }));

        if (this.data.hijos.length === 0) {
            this.data.hijos = [
                { id: 1, nombre: "Mateo", edad: 5 },
                { id: 2, nombre: "Sofía", edad: 3 },
            ];
        }
        if (this.data.actividades.length === 0) {
            this.data.actividades = [
                { id: 1, nombre: "Lectura", puntos: 10 },
                { id: 2, nombre: "Dibujo", puntos: 5 },
                { id: 3, nombre: "Deporte", puntos: 15 },
                { id: 4, nombre: "Música", puntos: 10 },
            ];
        }
        if (this.data.recompensas.length === 0) {
            this.data.recompensas = [
                { id: 101, nombre: "1 hora de videojuegos / pantalla", puntos: 50, icono: "🎮" },
                { id: 102, nombre: "Salida a comer helado", puntos: 80, icono: "🍦" },
                { id: 103, nombre: "Elegir la película del fin de semana", puntos: 100, icono: "🎬" },
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

    // Guarda local y sincroniza a Supabase
    async persist() {
        this.saveLocal();
        await this.saveToSupabase();
    },

    // ---------- Supabase ----------
    async loadFromSupabase() {
        try {
            const { data: dbData, error } = await supabaseClient
                .from("familias")
                .select("*")
                .eq("id", FAMILIA_ID)
                .single();

            if (error && error.code !== "PGRST116") {
                console.warn("Aviso al consultar Supabase:", error.message);
                return;
            }

            if (dbData) {
                if (dbData.hijos && dbData.hijos.length > 0) this.data.hijos = dbData.hijos;
                
                if (dbData.actividades && dbData.actividades.length > 0) {
                    // Carga autoritativa desde Supabase (los puntos remotos prevalecen sobre manipulaciones locales)
                    this.data.actividades = dbData.actividades.map(remoteAct => {
                        const remotePts = typeof remoteAct.puntos === "number" ? remoteAct.puntos : (parseInt(remoteAct.puntos, 10) || 0);
                        return { ...remoteAct, puntos: remotePts };
                    });

                    // Cargar recompensas, canjes, anuncio y auditoría incrustados en actividades[0] si existen
                    if (dbData.actividades[0]) {
                        if (dbData.actividades[0]._recompensas) this.data.recompensas = dbData.actividades[0]._recompensas;
                        if (dbData.actividades[0]._canjes) this.data.canjes = dbData.actividades[0]._canjes;
                        if (dbData.actividades[0]._anuncio) this.data.anuncio = dbData.actividades[0]._anuncio;
                        if (dbData.actividades[0]._auditLog) this.data.auditLog = dbData.actividades[0]._auditLog;
                    }
                }

                if (dbData.registros && dbData.registros.length > 0) this.data.registros = dbData.registros;
                if (dbData.recompensas && dbData.recompensas.length > 0) this.data.recompensas = dbData.recompensas;
                if (dbData.canjes && dbData.canjes.length > 0) this.data.canjes = dbData.canjes;
                if (dbData.anuncio) this.data.anuncio = dbData.anuncio;

                this.saveLocal();
            }
        } catch (e) {
            console.error("Error al cargar de Supabase:", e);
        }
    },

    async saveToSupabase() {
        try {
            // Incrustar recompensas, canjes, anuncio y auditoría en actividades[0]
            const actividadesToSave = this.data.actividades.map((a, idx) => {
                if (idx === 0) {
                    return {
                        ...a,
                        _recompensas: this.data.recompensas || [],
                        _canjes: this.data.canjes || [],
                        _anuncio: this.data.anuncio || null,
                        _auditLog: this.data.auditLog || []
                    };
                }
                return a;
            });

            const payload = {
                id: FAMILIA_ID,
                hijos: this.data.hijos,
                actividades: actividadesToSave,
                registros: this.data.registros
            };

            let { error } = await supabaseClient.from("familias").upsert(payload, { onConflict: "id" });

            if (error) {
                console.warn("Upsert falló en Supabase, realizando update directo:", error.message);
                const { error: errUpdate } = await supabaseClient
                    .from("familias")
                    .update(payload)
                    .eq("id", FAMILIA_ID);

                if (errUpdate) console.error("Error en update Supabase:", errUpdate.message);
                else console.log("✅ Supabase actualizado mediante update()");
            } else {
                console.log("✅ Supabase actualizado mediante upsert()");
            }
        } catch (e) {
            console.error("Excepción en saveToSupabase:", e);
        }
    },

    subscribeRealtime(onRemoteChange) {
        supabaseClient
            .channel("cambios-familia")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "familias", filter: `id=eq.${FAMILIA_ID}` },
                payload => {
                    if (!payload.new) return;
                    if (payload.new.hijos) this.data.hijos = payload.new.hijos;
                    if (payload.new.actividades) {
                        this.data.actividades = payload.new.actividades.map(a => ({
                            ...a,
                            puntos: typeof a.puntos === "number" ? a.puntos : (parseInt(a.puntos, 10) || 0)
                        }));
                        if (payload.new.actividades[0]) {
                            if (payload.new.actividades[0]._recompensas) this.data.recompensas = payload.new.actividades[0]._recompensas;
                            if (payload.new.actividades[0]._canjes) this.data.canjes = payload.new.actividades[0]._canjes;
                            if (payload.new.actividades[0]._anuncio) this.data.anuncio = payload.new.actividades[0]._anuncio;
                        }
                    }
                    if (payload.new.registros) this.data.registros = payload.new.registros;
                    this.saveLocal();
                    onRemoteChange();
                })
            .subscribe(status => { if (status === "SUBSCRIBED") console.log("📡 Escuchando cambios..."); });
    },

    // ---------- Anuncio del Sistema ----------
    updateAnuncio(activo, titulo, mensaje) {
        if (!this.isAdmin()) {
            console.warn("⛔ Intento no autorizado de modificar anuncio");
            if (typeof showToast === "function") showToast("❌ Permiso denegado: solo Admin", true);
            return false;
        }
        this.data.anuncio = {
            activo: Boolean(activo),
            titulo: titulo || "📢 Anuncio",
            mensaje: mensaje || ""
        };
        this.persist();
        return true;
    },

    // ---------- Lookups ----------
    getNombreHijo(id) {
        const h = this.data.hijos.find(h => h.id == id);
        return h ? h.nombre : "Desconocido";
    },
    getNombreActividad(id) {
        const a = this.data.actividades.find(a => a.id == id);
        return a ? a.nombre : "Desconocida";
    },
    getPuntosActividad(id) {
        const a = this.data.actividades.find(a => a.id == id);
        return a && typeof a.puntos === "number" ? a.puntos : (a ? parseInt(a.puntos, 10) || 0 : 0);
    },

    // ---------- Puntos y Ranking ----------
    updatePuntosActividad(actividadId, puntos) {
        if (!this.isAdmin()) {
            console.warn("⛔ Intento no autorizado de modificar puntos");
            if (typeof showToast === "function") showToast("❌ Permiso denegado: solo el Administrador puede modificar los puntos", true);
            return false;
        }

        const act = this.data.actividades.find(a => a.id == actividadId);
        if (act) {
            const nuevoPts = Math.max(0, parseInt(puntos, 10) || 0);
            const anteriorPts = act.puntos || 0;

            if (nuevoPts !== anteriorPts) {
                // Registrar entrada de Auditoría
                if (!this.data.auditLog) this.data.auditLog = [];
                const user = Auth.getCurrentUser();
                const usuarioNombre = user ? user.username : "desconocido";
                const fechaStr = typeof getFechaHoraLocal === "function" ? getFechaHoraLocal() : new Date().toISOString();

                this.data.auditLog.unshift({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    tipo: "cambio_puntos",
                    actividadId: act.id,
                    actividadNombre: act.nombre,
                    puntosAnteriores: anteriorPts,
                    puntosNuevos: nuevoPts,
                    usuario: usuarioNombre,
                    fechaHora: fechaStr
                });

                if (this.data.auditLog.length > 50) {
                    this.data.auditLog = this.data.auditLog.slice(0, 50);
                }

                act.puntos = nuevoPts;
                this.persist();
                return true;
            }
            return true;
        }
        return false;
    },

    getPuntosGanadosHijo(hijoId, desde = null, hasta = null) {
        let registros = this.data.registros.filter(r => r.hijoId == hijoId);
        if (desde && hasta) {
            registros = registros.filter(r => {
                const f = r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha;
                return f >= desde && f <= hasta;
            });
        }
        return registros.reduce((sum, r) => sum + this.getPuntosActividad(r.actividadId), 0);
    },

    getPuntosCanjeadosHijo(hijoId) {
        return (this.data.canjes || [])
            .filter(c => c.hijoId == hijoId && c.estado === "aprobado")
            .reduce((sum, c) => sum + (c.puntos || 0), 0);
    },

    getPuntosDisponiblesHijo(hijoId) {
        const ganados = this.getPuntosGanadosHijo(hijoId);
        const canjeados = this.getPuntosCanjeadosHijo(hijoId);
        return Math.max(0, ganados - canjeados);
    },

    getInsigniasHijo(hijoId) {
        const insignias = [];
        const registros = this.data.registros.filter(r => r.hijoId == hijoId);
        const totalPuntos = this.getPuntosGanadosHijo(hijoId);

        if (registros.length >= 1) insignias.push({ icono: "🌟", nombre: "Primeros Pasos", desc: "Primera actividad registrada" });
        if (registros.length >= 10) insignias.push({ icono: "⚡", nombre: "Super Activo", desc: "10+ actividades realizadas" });
        if (totalPuntos >= 50) insignias.push({ icono: "🚀", nombre: "Impulso de 50 Pts", desc: "50+ puntos acumulados" });
        if (totalPuntos >= 100) insignias.push({ icono: "👑", nombre: "Centenario de Puntos", desc: "100+ puntos acumulados" });

        const lecturas = registros.filter(r => {
            const nombreAct = this.getNombreActividad(r.actividadId).toLowerCase();
            return nombreAct.includes("lectura") || nombreAct.includes("leer");
        });
        if (lecturas.length >= 3) insignias.push({ icono: "📚", nombre: "Lector Estrella", desc: "3+ actividades de lectura" });

        return insignias;
    },

    getRanking(filtro = "general", desde = null, hasta = null) {
        let fDesde = desde;
        let fHasta = hasta;
        const hoy = getFechaLocal();

        if (filtro === "diario") {
            fDesde = hoy;
            fHasta = hoy;
        } else if (filtro === "semanal") {
            const now = new Date();
            const day = now.getDay() || 7; // Convert Sunday to 7
            if (day !== 1) now.setHours(-24 * (day - 1));
            fDesde = now.toISOString().split("T")[0];
            const endWeek = new Date(now);
            endWeek.setDate(endWeek.getDate() + 6);
            fHasta = endWeek.toISOString().split("T")[0];
        } else if (filtro === "mensual") {
            const now = new Date();
            fDesde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
            fHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        }

        const ranking = this.data.hijos.map(h => {
            const puntos = this.getPuntosGanadosHijo(h.id, fDesde, fHasta);
            const totalActividades = this.data.registros.filter(r => {
                if (r.hijoId != h.id) return false;
                if (fDesde && fHasta) {
                    const f = r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha;
                    return f >= fDesde && f <= fHasta;
                }
                return true;
            }).length;

            return {
                id: h.id,
                nombre: h.nombre,
                edad: h.edad,
                puntos: puntos,
                puntosDisponibles: this.getPuntosDisponiblesHijo(h.id),
                totalActividades: totalActividades,
                insignias: this.getInsigniasHijo(h.id)
            };
        });

        ranking.sort((a, b) => b.puntos - a.puntos);
        return ranking;
    },

    // ---------- CRUD: Recompensas y Canjes ----------
    addRecompensa(nombre, puntos, icono = "🎁") {
        const nRecompensa = { id: Date.now(), nombre, puntos: parseInt(puntos, 10), icono };
        this.data.recompensas.push(nRecompensa);
        this.persist();
        return nRecompensa;
    },

    deleteRecompensa(id) {
        this.data.recompensas = this.data.recompensas.filter(r => r.id != id);
        this.persist();
    },

    solicitarCanje(hijoId, recompensaId, usuario) {
        const rec = this.data.recompensas.find(r => r.id == recompensaId);
        if (!rec) return { ok: false, msg: "Recompensa no encontrada" };

        const disp = this.getPuntosDisponiblesHijo(hijoId);
        if (disp < rec.puntos) {
            return { ok: false, msg: `Puntos insuficientes. Tienes ${disp} pts y se requieren ${rec.puntos} pts.` };
        }

        const canje = {
            id: Date.now(),
            hijoId,
            recompensaId,
            nombreRecompensa: rec.nombre,
            puntos: rec.puntos,
            fechaHora: getFechaHoraLocal(),
            estado: "pendiente", // pendiente, aprobado, rechazado
            usuario
        };
        this.data.canjes.push(canje);
        this.persist();
        return { ok: true, canje };
    },

    responderCanje(canjeId, estado) {
        if (!this.isAdmin()) {
            if (typeof showToast === "function") showToast("❌ Solo Admin puede responder canjes", true);
            return false;
        }
        const canje = this.data.canjes.find(c => c.id == canjeId);
        if (canje) {
            canje.estado = estado; // 'aprobado' | 'rechazado'
            this.persist();
            return true;
        }
        return false;
    },

    // ---------- CRUD: Hijos ----------
    addHijo(nombre, edad) {
        if (!this.isAdmin()) return false;
        this.data.hijos.push({ id: Date.now(), nombre, edad: edad ? parseInt(edad, 10) : null });
        this.persist();
        return true;
    },
    deleteHijo(id) {
        if (!this.isAdmin()) return false;
        this.data.hijos = this.data.hijos.filter(h => h.id !== id);
        this.persist();
        return true;
    },

    // ---------- CRUD: Actividades (catálogo) ----------
    addActividad(nombre, puntos = 0) {
        if (!this.isAdmin()) return false;
        this.data.actividades.push({ id: Date.now(), nombre, puntos: parseInt(puntos, 10) || 0 });
        this.persist();
        return true;
    },
    deleteActividad(id) {
        if (!this.isAdmin()) return false;
        this.data.actividades = this.data.actividades.filter(a => a.id !== id);
        this.persist();
        return true;
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

    // ---------- Ordenamiento y Filtros para reportes ----------
    ordenarPorFechaReciente(registros) {
        if (!Array.isArray(registros)) return [];
        return [...registros].sort((a, b) => {
            const valA = a.fechaHora || (a.fecha ? a.fecha + "T00:00" : "");
            const valB = b.fechaHora || (b.fecha ? b.fecha + "T00:00" : "");
            if (valA !== valB) {
                return valB.localeCompare(valA); // Más reciente primero ("2026-08-02T15:00" > "2026-08-02T10:00")
            }
            return (b.id || 0) - (a.id || 0); // Desempate por ID (timestamp)
        });
    },

    registrosDeHoy() {
        const hoy = getFechaLocal();
        const filtrados = this.data.registros.filter(r => (r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha) === hoy);
        return this.ordenarPorFechaReciente(filtrados);
    },
    registrosEnRango(desde, hasta) {
        const filtrados = this.data.registros.filter(r => {
            const f = r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha;
            return f >= desde && f <= hasta;
        });
        return this.ordenarPorFechaReciente(filtrados);
    },
    registrosDeHijo(hijoId) {
        const filtrados = this.data.registros.filter(r => r.hijoId == hijoId);
        return this.ordenarPorFechaReciente(filtrados);
    },
    registrosTodos() {
        return this.ordenarPorFechaReciente(this.data.registros || []);
    },
};

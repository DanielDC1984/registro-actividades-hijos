// ============================================================
// ðŸ“Š MODELO: DATOS DE LA FAMILIA (LocalStorage + Supabase)
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
            titulo: "ðŸ“¢ Â¡Nueva actualizaciÃ³n en el sistema!",
            mensaje: "Â¡Hola a todos! A partir de ahora, cada actividad registrada otorga PUNTOS. Pueden competir en el ðŸ† Ranking Familiar y canjear sus puntos por premios en la ðŸŽ Tienda de Recompensas."
        }
    },

    // Helper de seguridad: verifica si el usuario en sesiÃ³n es Admin
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
                titulo: "ðŸ“¢ Â¡Nueva actualizaciÃ³n en el sistema!",
                mensaje: "Â¡Hola a todos! A partir de ahora, cada actividad registrada otorga PUNTOS. Pueden competir en el ðŸ† Ranking Familiar y canjear sus puntos por premios en la ðŸŽ Tienda de Recompensas."
            };
        }

        // Migrar registros antiguos que solo tenÃ­an "fecha" (sin hora)
        this.data.registros = (this.data.registros || []).map(r => (
            r.fecha && !r.fechaHora ? { ...r, fechaHora: r.fecha + "T00:00" } : r
        ));

        // Asegurar campo puntos y activa en actividades
        this.data.actividades = this.data.actividades.map(a => ({
            ...a,
            puntos: typeof a.puntos === "number" ? a.puntos : (parseInt(a.puntos, 10) || 0),
            activa: typeof a.activa === "boolean" ? a.activa : true
        }));

        // Asegurar campo activa en recompensas
        this.data.recompensas = (this.data.recompensas || []).map(r => ({
            ...r,
            puntos: typeof r.puntos === "number" ? r.puntos : (parseInt(r.puntos, 10) || 1),
            activa: typeof r.activa === "boolean" ? r.activa : true
        }));

        if (this.data.hijos.length === 0) {
            this.data.hijos = [
                { id: 1, nombre: "Mateo", edad: 5 },
                { id: 2, nombre: "SofÃ­a", edad: 3 },
            ];
        }
        if (this.data.actividades.length === 0) {
            this.data.actividades = [
                { id: 1, nombre: "Lectura", puntos: 10, activa: true },
                { id: 2, nombre: "Dibujo", puntos: 5, activa: true },
                { id: 3, nombre: "Deporte", puntos: 15, activa: true },
                { id: 4, nombre: "MÃºsica", puntos: 10, activa: true },
            ];
        }
        if (!stored && !this.data.recompensas.length) {
            this.data.recompensas = [
                { id: 101, nombre: "1 hora de videojuegos / pantalla", puntos: 50, icono: "ðŸŽ®", activa: true },
                { id: 102, nombre: "Salida a comer helado", puntos: 80, icono: "ðŸ¦", activa: true },
                { id: 103, nombre: "Elegir la pelÃ­cula del fin de semana", puntos: 100, icono: "ðŸŽ¬", activa: true },
            ];
        }
        if (!this.data.canjes) this.data.canjes = [];
        if (!this.data.registros) this.data.registros = [];
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
            const { data, error } = await supabaseClient.from("familias").select("*").eq("id", FAMILIA_ID).single();
            if (error && error.code !== "PGRST116") throw error;

            if (data) {
                const dbData = data;
                if (dbData.hijos && dbData.hijos.length > 0) this.data.hijos = dbData.hijos;

                if (dbData.actividades && dbData.actividades.length > 0) {
                    this.data.actividades = dbData.actividades.map(remoteAct => {
                        const remotePts = typeof remoteAct.puntos === "number" ? remoteAct.puntos : (parseInt(remoteAct.puntos, 10) || 0);
                        const isActiva = typeof remoteAct.activa === "boolean" ? remoteAct.activa : true;
                        return { ...remoteAct, puntos: remotePts, activa: isActiva };
                    });

                    // Cargar recompensas, canjes, anuncio y auditorÃ­a incrustados en actividades[0] si existen (autoritativos)
                    if (dbData.actividades[0]) {
                        if (Array.isArray(dbData.actividades[0]._recompensas)) this.data.recompensas = dbData.actividades[0]._recompensas;
                        if (Array.isArray(dbData.actividades[0]._canjes)) this.data.canjes = dbData.actividades[0]._canjes;
                        if (dbData.actividades[0]._anuncio) this.data.anuncio = dbData.actividades[0]._anuncio;
                        if (dbData.actividades[0]._auditLog) this.data.auditLog = dbData.actividades[0]._auditLog;
                    }
                }

                // NOTA: la tabla familias NO tiene columnas raÃ­z "recompensas", "canjes", ni "anuncio".
                // Esos datos viven ÃšNICAMENTE en actividades[0]._recompensas, ._canjes, ._anuncio
                if (Array.isArray(dbData.registros)) this.data.registros = dbData.registros;

                this.saveLocal();
            }
        } catch (e) {
            console.error("Error al cargar de Supabase:", e);
        }
    },

    async saveToSupabase() {
        try {
            // Incrustar recompensas, canjes, anuncio y auditorÃ­a en actividades[0]
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

            // IMPORTANTE: Solo incluir columnas que existen en la tabla de Supabase.
            // La tabla "familias" tiene: id, hijos, actividades, registros
            // Las recompensas, canjes y anuncio viajan incrustados en actividades[0]._recompensas, ._canjes, ._anuncio
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
            .subscribe(status => { if (status === "SUBSCRIBED") console.log("ðŸ“¡ Escuchando cambios..."); });
    },

    // ---------- Anuncio del Sistema ----------
    async updateAnuncio(activo, titulo, mensaje) {
        if (!this.isAdmin()) {
            console.warn("â›” Intento no autorizado de modificar anuncio");
            if (typeof showToast === "function") showToast("âŒ Permiso denegado: solo Admin", true);
            return false;
        }
        this.data.anuncio = {
            activo: Boolean(activo),
            titulo: titulo || "ðŸ“¢ Anuncio",
            mensaje: mensaje || ""
        };
        await this.persist();
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
    async updatePuntosActividad(actividadId, puntos) {
        if (!this.isAdmin()) {
            console.warn("â›” Intento no autorizado de modificar puntos");
            if (typeof showToast === "function") showToast("âŒ Permiso denegado: solo el Administrador puede modificar los puntos", true);
            return false;
        }

        const act = this.data.actividades.find(a => a.id == actividadId);
        if (act) {
            const nuevoPts = Math.max(0, parseInt(puntos, 10) || 0);
            const anteriorPts = act.puntos || 0;

            if (nuevoPts !== anteriorPts) {
                // Registrar entrada de AuditorÃ­a
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
                await this.persist();
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

        if (registros.length >= 1) insignias.push({ icono: "ðŸŒŸ", nombre: "Primeros Pasos", desc: "Primera actividad registrada" });
        if (registros.length >= 10) insignias.push({ icono: "âš¡", nombre: "Super Activo", desc: "10+ actividades realizadas" });
        if (totalPuntos >= 50) insignias.push({ icono: "ðŸš€", nombre: "Impulso de 50 Pts", desc: "50+ puntos acumulados" });
        if (totalPuntos >= 100) insignias.push({ icono: "ðŸ‘‘", nombre: "Centenario de Puntos", desc: "100+ puntos acumulados" });

        const lecturas = registros.filter(r => {
            const nombreAct = this.getNombreActividad(r.actividadId).toLowerCase();
            return nombreAct.includes("lectura") || nombreAct.includes("leer");
        });
        if (lecturas.length >= 3) insignias.push({ icono: "ðŸ“š", nombre: "Lector Estrella", desc: "3+ actividades de lectura" });

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
    async addRecompensa(nombre, puntos, icono = "ðŸŽ") {
        if (!this.isAdmin()) return false;
        const nRecompensa = {
            id: Date.now(),
            nombre: (nombre || "").trim(),
            puntos: Math.max(1, parseInt(puntos, 10) || 1),
            icono,
            activa: true
        };
        this.data.recompensas.push(nRecompensa);
        await this.persist();
        return nRecompensa;
    },

    async updateRecompensa(id, nombre, puntos) {
        if (!this.isAdmin()) return false;
        const rec = this.data.recompensas.find(r => r.id == id);
        if (rec) {
            rec.nombre = (nombre || "").trim() || rec.nombre;
            rec.puntos = Math.max(1, parseInt(puntos, 10) || 1);
            await this.persist();
            return true;
        }
        return false;
    },

    async toggleEstadoRecompensa(id) {
        if (!this.isAdmin()) return false;
        const rec = this.data.recompensas.find(r => r.id == id);
        if (rec) {
            rec.activa = (rec.activa === false) ? true : false;
            await this.persist();
            return true;
        }
        return false;
    },

    async deleteRecompensa(id) {
        if (!this.isAdmin()) return false;
        this.data.recompensas = this.data.recompensas.filter(r => r.id != id);
        await this.persist();
        return true;
    },

    async solicitarCanje(hijoId, recompensaId, usuario) {
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
        await this.persist();
        return { ok: true, canje };
    },

    async solicitarCanjeEspecial({ hijoId, nombrePremio, puntosPropuestos, usuario }) {
        if (!hijoId || !nombrePremio || !puntosPropuestos) {
            return { ok: false, msg: "Completa los datos del premio especial" };
        }
        const pts = Math.max(1, parseInt(puntosPropuestos, 10) || 1);
        const canje = {
            id: Date.now(),
            hijoId,
            recompensaId: "especial",
            nombreRecompensa: `âœ¨ ${nombrePremio.trim()}`,
            puntosPropuestos: pts,
            puntos: pts,
            fechaHora: typeof getFechaHoraLocal === "function" ? getFechaHoraLocal() : new Date().toISOString(),
            estado: "pendiente",
            esEspecial: true,
            usuario
        };
        this.data.canjes.push(canje);
        await this.persist();
        return { ok: true, canje };
    },

    async contraproponerCanjeAdmin(canjeId, nuevosPuntos, notaAdmin) {
        if (!this.isAdmin()) return false;
        const canje = this.data.canjes.find(c => c.id == canjeId);
        if (canje) {
            const pts = Math.max(1, parseInt(nuevosPuntos, 10) || 1);
            canje.estado = "contrapropuesta";
            canje.puntosContrapropuesta = pts;
            canje.puntos = pts;
            canje.notaContrapropuesta = (notaAdmin || "").trim();
            await this.persist();
            return true;
        }
        return false;
    },

    async responderContrapropuestaUsuario(canjeId, aceptar) {
        const canje = this.data.canjes.find(c => c.id == canjeId);
        if (!canje || canje.estado !== "contrapropuesta") return { ok: false, msg: "Solicitud no encontrada o no estÃ¡ en contrapropuesta" };

        if (aceptar) {
            const ptsRequeridos = canje.puntosContrapropuesta || canje.puntos;
            const disp = this.getPuntosDisponiblesHijo(canje.hijoId);
            if (disp < ptsRequeridos) {
                return { ok: false, msg: `Puntos insuficientes. Se requieren ${ptsRequeridos} pts y tienes ${disp} pts.` };
            }
            canje.estado = "aprobado";
            canje.puntos = ptsRequeridos;
            await this.persist();
            return { ok: true, estado: "aprobado" };
        } else {
            canje.estado = "rechazado";
            await this.persist();
            return { ok: true, estado: "rechazado" };
        }
    },

    async responderCanje(canjeId, estado) {
        if (!this.isAdmin()) {
            if (typeof showToast === "function") showToast("âŒ Solo Admin puede responder canjes", true);
            return false;
        }
        const canje = this.data.canjes.find(c => c.id == canjeId);
        if (canje) {
            canje.estado = estado; // 'aprobado' | 'rechazado'
            await this.persist();
            return true;
        }
        return false;
    },

    // ---------- CRUD: Hijos ----------
    async addHijo(nombre, edad) {
        if (!this.isAdmin()) return false;
        this.data.hijos.push({ id: Date.now(), nombre, edad: edad ? parseInt(edad, 10) : null });
        await this.persist();
        return true;
    },
    async deleteHijo(id) {
        if (!this.isAdmin()) return false;
        this.data.hijos = this.data.hijos.filter(h => h.id !== id);
        await this.persist();
        return true;
    },

    // ---------- CRUD: Actividades (catÃ¡logo) ----------
    async addActividad(nombre, puntos = 0) {
        if (!this.isAdmin()) return false;
        this.data.actividades.push({ id: Date.now(), nombre, puntos: parseInt(puntos, 10) || 0 });
        await this.persist();
        return true;
    },
    async deleteActividad(id) {
        if (!this.isAdmin()) return false;
        this.data.actividades = this.data.actividades.filter(a => a.id !== id);
        await this.persist();
        return true;
    },
    async toggleEstadoActividad(id) {
        if (!this.isAdmin()) return false;
        const act = this.data.actividades.find(a => a.id == id);
        if (act) {
            act.activa = (act.activa === false) ? true : false;
            await this.persist();
            return true;
        }
        return false;
    },

    getPuntosGanadosHijo(hijoId, desde = null, hasta = null) {
        let registros = (this.data.registros || []).filter(r => r.hijoId == hijoId && r.estado !== "anulado");
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

    // ---------- CRUD: Registros ----------
    async addRegistro({ hijoId, actividadId, descripcion, fechaHora, usuario }) {
        const hoy = (fechaHora || "").split("T")[0] || (typeof getFechaLocal === "function" ? getFechaLocal() : new Date().toISOString().split("T")[0]);
        const yaExisteHoy = (this.data.registros || []).some(r => r.hijoId == hijoId && r.actividadId == actividadId && r.estado !== "anulado" && (r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha) === hoy);

        const nReg = {
            id: Date.now(),
            hijoId,
            actividadId,
            descripcion: descripcion || "Sin descripción",
            fechaHora: fechaHora || (typeof getFechaHoraLocal === "function" ? getFechaHoraLocal() : new Date().toISOString()),
            usuario: usuario || "anonimo",
            estado: "aprobado",
            esPosibleDuplicado: yaExisteHoy
        };

        this.data.registros.push(nReg);
        await this.persist();
        return { ok: true, registro: nReg, esDuplicado: yaExisteHoy };
    },

    async anularRegistro(id, motivo = "Anulado por el Administrador") {
        if (!this.isAdmin()) return false;
        const reg = (this.data.registros || []).find(r => r.id == id);
        if (reg) {
            reg.estado = "anulado";
            reg.motivoAnulacion = motivo;
            if (!this.data.auditLog) this.data.auditLog = [];
            const user = Auth.getCurrentUser();
            this.data.auditLog.unshift({
                id: Date.now() + Math.floor(Math.random() * 1000),
                tipo: "anulacion_actividad",
                registroId: reg.id,
                hijoId: reg.hijoId,
                usuario: user ? user.username : "admin",
                motivo,
                fechaHora: typeof getFechaHoraLocal === "function" ? getFechaHoraLocal() : new Date().toISOString()
            });
            await this.persist();
            return true;
        }
        return false;
    },

    async updateRegistro(id, cambios) {
        const index = this.data.registros.findIndex(r => r.id === id);
        if (index === -1) return false;
        this.data.registros[index] = { ...this.data.registros[index], ...cambios };
        await this.persist();
        return true;
    },

    async deleteRegistro(id) {
        if (!this.isAdmin()) return false;
        this.data.registros = this.data.registros.filter(r => r.id !== id);
        await this.persist();
        return true;
    },

    // ---------- Denuncias / Irregularidades ----------
    async addDenuncia({ registroId, detalle, usuarioReporta }) {
        if (!registroId || !detalle) return { ok: false, msg: "Selecciona un registro y describe la observaciÃ³n" };
        if (!this.data.denuncias) this.data.denuncias = [];
        const denuncia = {
            id: Date.now(),
            registroId: parseInt(registroId, 10),
            detalle: (detalle || "").trim(),
            usuarioReporta: usuarioReporta || "anonimo",
            fechaHora: typeof getFechaHoraLocal === "function" ? getFechaHoraLocal() : new Date().toISOString(),
            atendida: false
        };
        this.data.denuncias.push(denuncia);
        await this.persist();
        return { ok: true, denuncia };
    },

    async atenderDenuncia(denunciaId, anularAsociado = false, motivoAnulacion = "") {
        if (!this.isAdmin()) return false;
        if (!this.data.denuncias) this.data.denuncias = [];
        const d = this.data.denuncias.find(item => item.id == denunciaId);
        if (d) {
            d.atendida = true;
            if (anularAsociado && d.registroId) {
                this.anularRegistro(d.registroId, motivoAnulacion || `Anulado por denuncia #${d.id}`);
            }
            await this.persist();
            return true;
        }
        return false;
    },

    // ---------- AnalÃ­ticas y EstadÃ­sticas ----------
    getEstadisticasActividades({ filtroFecha = "semana", fechaInicio = null, fechaFin = null, hijoId = null } = {}) {
        let registros = (this.data.registros || []).filter(r => r.estado !== "anulado");
        
        if (hijoId) {
            registros = registros.filter(r => r.hijoId == hijoId);
        }

        const hoy = typeof getFechaLocal === "function" ? getFechaLocal() : new Date().toISOString().split("T")[0];
        if (filtroFecha === "hoy") {
            registros = registros.filter(r => (r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha) === hoy);
        } else if (filtroFecha === "semana") {
            const now = new Date();
            const day = now.getDay() || 7;
            if (day !== 1) now.setHours(-24 * (day - 1));
            const fDesde = now.toISOString().split("T")[0];
            const endWeek = new Date(now);
            endWeek.setDate(endWeek.getDate() + 6);
            const fHasta = endWeek.toISOString().split("T")[0];
            registros = registros.filter(r => {
                const f = r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha;
                return f >= fDesde && f <= fHasta;
            });
        } else if (filtroFecha === "mes") {
            const now = new Date();
            const fDesde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
            const fHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
            registros = registros.filter(r => {
                const f = r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha;
                return f >= fDesde && f <= fHasta;
            });
        } else if (filtroFecha === "rango" && fechaInicio && fechaFin) {
            registros = registros.filter(r => {
                const f = r.fechaHora ? r.fechaHora.split("T")[0] : r.fecha;
                return f >= fechaInicio && f <= fechaFin;
            });
        }

        const totalRegistros = registros.length;
        let totalPuntos = 0;
        const conteoActividades = {};
        const conteoHijos = {};

        registros.forEach(r => {
            const actId = r.actividadId;
            const actNombre = this.getNombreActividad(actId);
            const pts = this.getPuntosActividad(actId);
            totalPuntos += pts;

            if (!conteoActividades[actId]) {
                conteoActividades[actId] = { id: actId, nombre: actNombre, cantidad: 0, puntosTotales: 0 };
            }
            conteoActividades[actId].cantidad += 1;
            conteoActividades[actId].puntosTotales += pts;

            const hId = r.hijoId;
            const hNombre = this.getNombreHijo(hId);
            const keyHijoAct = `${hId}_${actId}`;
            if (!conteoHijos[keyHijoAct]) {
                conteoHijos[keyHijoAct] = { hijoId: hId, hijoNombre: hNombre, actividadNombre: actNombre, cantidad: 0, puntosTotales: 0 };
            }
            conteoHijos[keyHijoAct].cantidad += 1;
            conteoHijos[keyHijoAct].puntosTotales += pts;
        });

        const rankingActividades = Object.values(conteoActividades).map(a => ({
            ...a,
            porcentaje: totalRegistros > 0 ? Math.round((a.cantidad / totalRegistros) * 100) : 0
        }));
        rankingActividades.sort((a, b) => b.cantidad - a.cantidad);

        const desgloseHijos = Object.values(conteoHijos);
        desgloseHijos.sort((a, b) => b.cantidad - a.cantidad);

        return {
            totalRegistros,
            totalPuntos,
            rankingActividades,
            desgloseHijos
        };
    },

    // ---------- Ordenamiento y Filtros para reportes ----------
    ordenarPorFechaReciente(registros) {
        if (!Array.isArray(registros)) return [];
        return [...registros].sort((a, b) => {
            const valA = a.fechaHora || (a.fecha ? a.fecha + "T00:00" : "");
            const valB = b.fechaHora || (b.fecha ? b.fecha + "T00:00" : "");
            if (valA !== valB) {
                return valB.localeCompare(valA); // MÃ¡s reciente primero ("2026-08-02T15:00" > "2026-08-02T10:00")
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




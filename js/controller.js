// ============================================================
// 🎮 CONTROLADOR: EVENTOS Y FLUJO DE LA APP
// ============================================================
const AppController = {
    isRegisterMode: false,
    rankingFiltroActual: "general",

    // ---------- Autenticación ----------
    async iniciarSesion(username, password) {
        const res = await Auth.login(username, password);
        // Limpiar contraseña de la memoria de inputs inmediatamente
        const passEl = document.getElementById("loginPassword");
        const userEl = document.getElementById("loginUsername");
        if (passEl) passEl.value = "";

        if (!res.ok) {
            if (res.reason === "blocked") View.mostrarError("❌ Tu cuenta ha sido bloqueada");
            else if (res.reason === "pending") View.mostrarInfo("⏳ Cuenta pendiente de aprobación");
            else if (res.reason === "network") View.mostrarError(`❌ Error de conexión: ${res.error}`);
            else View.mostrarError("❌ Usuario o contraseña incorrectos");
            return;
        }

        if (userEl) userEl.value = "";
        sessionStorage.removeItem("anuncioMostradoEnSesion");
        View.setUserDisplayName(res.user.username);
        this.mostrarApp();
        showToast("✅ Sesión iniciada");
    },

    async registrarUsuario(username, password) {
        const res = await Auth.register(username, password);
        const passEl = document.getElementById("loginPassword");
        if (passEl) passEl.value = "";

        if (!res.ok) {
            if (res.reason === "network") View.mostrarError(`❌ Error de conexión: ${res.error}`);
            else View.mostrarError("❌ El usuario ya existe");
            return;
        }
        View.mostrarExito("✅ Registro exitoso. Espera aprobación.");
        setTimeout(() => {
            document.getElementById("loginSuccess").style.display = "none";
            if (!this.isRegisterMode) this.toggleAuthMode();
        }, 3000);
    },

    cerrarSesion() {
        Auth.logout();
        sessionStorage.removeItem("anuncioMostradoEnSesion");
        const form = document.getElementById("loginForm");
        if (form) form.reset();
        View.mostrarLogin();
        showToast("👋 Sesión cerrada");
    },

    toggleAuthMode() {
        this.isRegisterMode = !this.isRegisterMode;
        View.setModoRegistro(this.isRegisterMode);
    },

    // ---------- Admin: usuarios ----------
    async aprobarUsuario(username) {
        if (await Auth.approve(username)) { this._refrescarAdmin(); showToast(`✅ Usuario "${username}" aprobado`); }
    },
    async bloquearUsuario(username) {
        if (await Auth.block(username)) { this._refrescarAdmin(); showToast(`🔒 Usuario "${username}" bloqueado`); }
    },
    async desbloquearUsuario(username) {
        if (await Auth.unblock(username)) { this._refrescarAdmin(); showToast(`🔓 Usuario "${username}" desbloqueado`); }
    },
    async eliminarUsuario(username) {
        if (username === "admin") { showToast("❌ No puedes eliminar al administrador", true); return; }
        if (!confirm(`¿Eliminar permanentemente al usuario "${username}"?`)) return;
        const res = await Auth.remove(username);
        if (res.ok) { this._refrescarAdmin(); showToast(`🗑️ Usuario "${username}" eliminado`); }
    },
    _refrescarAdmin() {
        View.renderAdminPanel(Auth.getUsers());
        View.actualizarContadoresAdmin(Auth.getPendingUsers().length);
    },

    // ---------- App shell / rol ----------
    mostrarApp() {
        View.mostrarApp();
        Store.load();
        View.renderAll();
        this._aplicarUI();
        
        // Mostrar anuncio SOLO UNA VEZ por inicio de sesión
        if (!sessionStorage.getItem("anuncioMostradoEnSesion")) {
            View.mostrarModalAnuncio();
            sessionStorage.setItem("anuncioMostradoEnSesion", "true");
        }

        Store.loadFromSupabase()
            .then(() => {
                View.renderAll();
                View.updateSyncStatus("online", "Conectado");
            })
            .catch(err => {
                console.error("Error cargando de Supabase:", err);
                View.updateSyncStatus("offline", "Offline");
            });
    },

    _aplicarUI() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        View.aplicarRolUsuario(user);
        if (user.role === "admin") this._refrescarAdmin();
    },

    // ---------- Navegación y Menú lateral ----------
    switchView(viewTarget) {
        if (!viewTarget) return;
        const targetViewEl = document.getElementById(`view-${viewTarget}`);
        if (!targetViewEl) return;

        document.querySelectorAll(".sidebar-item").forEach(i => {
            if (i.getAttribute("data-view") === viewTarget) {
                i.classList.add("active");
            } else {
                i.classList.remove("active");
            }
        });

        document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
        targetViewEl.classList.add("active");

        if (viewTarget === "admin") this._refrescarAdmin();
        if (viewTarget === "completo") View.renderReporteCompleto();
        if (viewTarget === "ranking") View.renderRanking(this.rankingFiltroActual);
        if (viewTarget === "recompensas") View.renderRecompensas();
        if (viewTarget === "puntos-config") View.renderPuntosConfig();
        if (viewTarget === "denuncias") View.renderModuloDenuncias();
        if (viewTarget === "estadisticas") View.renderEstadisticas();

        // En pantallas móviles (< 768px), cerrar el menú al cambiar de vista
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const appContainer = document.getElementById("appContainer");
        if (window.innerWidth < 768) {
            if (sidebar) sidebar.classList.remove("open");
            if (overlay) overlay.classList.remove("show");
            if (appContainer) appContainer.classList.remove("sidebar-open");
        }
    },

    initMenu() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const toggleBtn = document.getElementById("menuToggle");
        const appContainer = document.getElementById("appContainer");

        // Estado inicial por defecto en PC (abierto)
        if (window.innerWidth >= 768) {
            if (sidebar) sidebar.classList.add("open");
            if (appContainer) appContainer.classList.add("sidebar-open");
        }

        if (toggleBtn) {
            toggleBtn.addEventListener("click", e => {
                e.stopPropagation();
                if (sidebar) sidebar.classList.toggle("open");
                if (appContainer) appContainer.classList.toggle("sidebar-open");
                if (window.innerWidth < 768 && overlay) {
                    overlay.classList.toggle("show");
                }
            });
        }

        if (overlay) {
            overlay.addEventListener("click", () => {
                if (sidebar) sidebar.classList.remove("open");
                if (appContainer) appContainer.classList.remove("sidebar-open");
                overlay.classList.remove("show");
            });
        }

        document.querySelectorAll(".sidebar-item").forEach(item => {
            item.addEventListener("click", e => {
                e.preventDefault();
                const viewTarget = item.getAttribute("data-view");
                this.switchView(viewTarget);
            });
        });
    },

    // ---------- Ranking Filtros ----------
    setRankingFiltro(filtro) {
        this.rankingFiltroActual = filtro;
        document.querySelectorAll(".ranking-tabs .btn-tab").forEach(btn => btn.classList.remove("active"));
        const activeBtn = Array.from(document.querySelectorAll(".ranking-tabs .btn-tab")).find(b => b.textContent.toLowerCase().includes(filtro));
        if (activeBtn) activeBtn.classList.add("active");

        const rangoBox = document.getElementById("rankingRangoInputs");
        if (filtro === "rango") {
            rangoBox.style.display = "flex";
        } else {
            rangoBox.style.display = "none";
            View.renderRanking(filtro);
        }
    },

    filtrarRankingRango() {
        const desde = document.getElementById("rankingFechaDesde").value;
        const hasta = document.getElementById("rankingFechaHasta").value;
        if (!desde || !hasta) { showToast("⚠️ Selecciona ambas fechas para el ranking", true); return; }
        View.renderRanking("rango", desde, hasta);
    },

    // ---------- Puntos y Anuncio Admin ----------
    guardarPuntosActividad(actividadId, puntos) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Acción solo permitida para el Administrador", true); return; }
        if (Store.updatePuntosActividad(actividadId, puntos)) {
            View.renderAll();
            showToast("✅ Puntos guardados correctamente");
        }
    },

    guardarTodosPuntos() {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Acción solo permitida para el Administrador", true); return; }

        // Forzar blur en todos los inputs para que el teclado virtual confirme valores
        Store.data.actividades.forEach(a => {
            const el = document.getElementById(`inputPuntos_${a.id}`);
            if (el) el.blur();
        });

        // Pequeño delay (150ms) para que el blur confirme los valores en móvil
        setTimeout(() => {
            let actualizados = 0;
            Store.data.actividades.forEach(a => {
                const el = document.getElementById(`inputPuntos_${a.id}`);
                if (el) {
                    const nuevoPts = Math.max(0, parseInt(el.value, 10) || 0);
                    if (Store.updatePuntosActividad(a.id, nuevoPts)) actualizados++;
                }
            });

            if (actualizados > 0) {
                View.renderAll();
                showToast(`✅ ${actualizados} actividad${actualizados > 1 ? 'es' : ''} guardada${actualizados > 1 ? 's' : ''} correctamente`);
            } else {
                showToast("⚠️ No se encontraron actividades para guardar", true);
            }
        }, 150);
    },

    guardarAnuncio(activo, titulo, mensaje) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Acción solo permitida para el Administrador", true); return; }

        // Leer valores directamente del DOM con blur() para garantizar valor correcto en móvil
        const checkboxEl = document.getElementById("anuncioActivoInput");
        const tituloEl   = document.getElementById("anuncioTituloInput");
        const mensajeEl  = document.getElementById("anuncioMensajeInput");
        if (checkboxEl) checkboxEl.blur();
        if (tituloEl)   tituloEl.blur();
        if (mensajeEl)  mensajeEl.blur();

        const activoFinal  = checkboxEl  ? checkboxEl.checked  : activo;
        const tituloFinal  = tituloEl    ? tituloEl.value.trim()  || "📢 Anuncio" : titulo;
        const mensajeFinal = mensajeEl   ? mensajeEl.value.trim()  : mensaje;

        Store.updateAnuncio(activoFinal, tituloFinal, mensajeFinal);
        showToast(`✅ Anuncio ${activoFinal ? 'activado' : 'desactivado'} y guardado`);
    },

    // ---------- Recompensas ----------
    solicitarCanje(recompensaId, hijoId) {
        const user = Auth.getCurrentUser();
        if (!user) return;
        if (!hijoId) { showToast("⚠️ Selecciona un hijo para solicitar el canje", true); return; }

        const res = Store.solicitarCanje(parseInt(hijoId, 10), parseInt(recompensaId, 10), user.username);
        if (!res.ok) {
            showToast(`❌ ${res.msg}`, true);
        } else {
            View.renderRecompensas();
            showToast("🎉 ¡Solicitud de canje enviada a aprobación!");
            if (typeof confetti === "function") confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        }
    },

    solicitarPremioEspecial(hijoId, nombrePremio, puntosPropuestos) {
        const user = Auth.getCurrentUser();
        if (!user) { showToast("⚠️ Debes iniciar sesión", true); return; }
        if (!hijoId || !nombrePremio || !puntosPropuestos) {
            showToast("⚠️ Completa todos los campos del premio especial", true);
            return;
        }

        const res = Store.solicitarCanjeEspecial({
            hijoId: parseInt(hijoId, 10),
            nombrePremio,
            puntosPropuestos,
            usuario: user.username
        });

        if (!res.ok) {
            showToast(`❌ ${res.msg}`, true);
        } else {
            View.renderRecompensas();
            const form = document.getElementById("formPremioEspecial");
            if (form) form.reset();
            showToast("✨ Propuesta de premio especial enviada a la Administración");
            if (typeof confetti === "function") confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        }
    },

    contraproponerCanjeAdmin(canjeId) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo el admin puede realizar contrapropuestas", true); return; }

        const canje = Store.data.canjes.find(c => c.id == canjeId);
        if (!canje) return;

        const nuevosPuntos = prompt(`Propón una nueva cantidad de PUNTOS para "${canje.nombreRecompensa}" (Propuesta usuario: ${canje.puntosPropuestos || canje.puntos} pts):`, canje.puntosPropuestos || canje.puntos);
        if (nuevosPuntos === null) return;

        const ptsVal = Math.max(1, parseInt(nuevosPuntos, 10) || 0);
        if (!ptsVal) { showToast("⚠️ Ingresa un número válido de puntos", true); return; }

        const notaAdmin = prompt("Escribe una nota aclaratoria para el usuario (opcional):", "Puntos ajustados por administración");

        if (Store.contraproponerCanjeAdmin(canjeId, ptsVal, notaAdmin || "")) {
            View.renderRecompensas();
            showToast("🔄 Contrapropuesta enviada al usuario");
        }
    },

    responderContrapropuestaUsuario(canjeId, aceptar) {
        const res = Store.responderContrapropuestaUsuario(canjeId, aceptar);
        if (!res.ok) {
            showToast(`❌ ${res.msg}`, true);
        } else {
            View.renderRecompensas();
            View.renderRanking(this.rankingFiltroActual);
            if (aceptar) {
                showToast("🎉 ¡Contrapropuesta aceptada! Premio canjeado.");
                if (typeof confetti === "function") confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            } else {
                showToast("❌ Contrapropuesta rechazada");
            }
        }
    },

    responderCanje(canjeId, estado) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo el admin puede responder canjes", true); return; }
        if (Store.responderCanje(canjeId, estado)) {
            View.renderRecompensas();
            View.renderRanking(this.rankingFiltroActual);
            showToast(estado === "aprobado" ? "✅ Canje aprobado con éxito" : "❌ Canje rechazado");
            if (estado === "aprobado" && typeof confetti === "function") {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
        }
    },

    // ---------- Formularios ----------
    initForms() {
        document.getElementById("formActividad").addEventListener("submit", e => {
            e.preventDefault();
            const user = Auth.getCurrentUser();
            const hijoId = parseInt(document.getElementById("selectHijo").value, 10);
            const actividadId = parseInt(document.getElementById("selectActividad").value, 10);
            const descripcion = document.getElementById("descActividad").value.trim();
            const fechaHora = document.getElementById("fechaHoraActividad").value;
            if (!hijoId || !actividadId || !fechaHora) { showToast("⚠️ Completa todos los campos", true); return; }

            const res = Store.addRegistro({ hijoId, actividadId, descripcion, fechaHora, usuario: user ? user.username : "anonimo" });
            View.renderAll();
            e.target.reset();
            document.getElementById("fechaHoraActividad").value = getFechaHoraLocal();

            const pts = Store.getPuntosActividad(actividadId);
            if (res && res.esDuplicado) {
                showToast(`⚠️ Atención: Esta actividad ya fue registrada hoy para este hijo. Guardada con advertencia (+${pts} pts)`, true);
            } else {
                showToast(`✅ Actividad registrada (+${pts} pts)`);
            }
            if (typeof confetti === "function") confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
        });

        const formDen = document.getElementById("formDenunciaDirecta");
        if (formDen) {
            formDen.addEventListener("submit", e => {
                e.preventDefault();
                const user = Auth.getCurrentUser();
                const registroId = document.getElementById("selectRegistroDenuncia").value;
                const detalle = document.getElementById("detalleDenunciaInput").value.trim();
                if (!registroId || !detalle) { showToast("⚠️ Selecciona un registro y escribe el motivo", true); return; }

                const res = Store.addDenuncia({ registroId, detalle, usuarioReporta: user ? user.username : "anonimo" });
                if (res.ok) {
                    formDen.reset();
                    View.renderModuloDenuncias();
                    showToast("🚨 Observación/Denuncia registrada correctamente");
                } else {
                    showToast(`❌ ${res.msg}`, true);
                }
            });
        }

        document.getElementById("formHijo").addEventListener("submit", e => {
            e.preventDefault();
            const nombre = document.getElementById("nombreHijo").value.trim();
            const edad = document.getElementById("edadHijo").value;
            if (!nombre) { showToast("⚠️ Ingresa un nombre", true); return; }
            Store.addHijo(nombre, edad);
            View.renderAll();
            e.target.reset();
            showToast("✅ Hijo agregado");
        });

        document.getElementById("formActividadGestion").addEventListener("submit", e => {
            e.preventDefault();
            const nombre = document.getElementById("nombreActividad").value.trim();
            if (!nombre) { showToast("⚠️ Ingresa un nombre", true); return; }
            Store.addActividad(nombre, 0);
            View.renderAll();
            e.target.reset();
            showToast("✅ Actividad creada");
        });

        const formRec = document.getElementById("formNuevaRecompensa");
        if (formRec) {
            formRec.addEventListener("submit", e => {
                e.preventDefault();
                const nombre = document.getElementById("recompensaNombre").value.trim();
                const puntos = document.getElementById("recompensaPuntos").value;
                if (!nombre || !puntos) { showToast("⚠️ Completa los campos", true); return; }
                Store.addRecompensa(nombre, puntos);
                View.renderRecompensas();
                e.target.reset();
                showToast("✅ Recompensa agregada");
            });
        }

        document.getElementById("formEditar").addEventListener("submit", e => {
            e.preventDefault();
            const id = parseInt(document.getElementById("editRegistroId").value, 10);
            const registro = Store.data.registros.find(r => r.id === id);
            const user = Auth.getCurrentUser();
            const isAdmin = user && (user.role === "admin" || user.username === "admin");
            const isOwner = user && registro && registro.usuario === user.username;

            if (!isAdmin && !isOwner) {
                showToast("❌ Solo puedes editar tus propios registros", true);
                return;
            }

            const hijoId = parseInt(document.getElementById("editSelectHijo").value, 10);
            const actividadId = parseInt(document.getElementById("editSelectActividad").value, 10);
            const descripcion = document.getElementById("editDescripcion").value.trim();
            const fechaHora = document.getElementById("editFechaHora").value;
            if (!hijoId || !actividadId || !fechaHora) { showToast("⚠️ Completa todos los campos", true); return; }
            if (!Store.updateRegistro(id, { hijoId, actividadId, descripcion: descripcion || "Sin descripción", fechaHora })) {
                showToast("⚠️ Registro no encontrado", true); return;
            }
            View.renderAll();
            View.cerrarModalEditar();
            showToast("✅ Registro actualizado");
        });

        document.getElementById("btnFiltrarRango").addEventListener("click", () => {
            View.renderReporteRango(document.getElementById("fechaDesde").value, document.getElementById("fechaHasta").value);
        });
        document.getElementById("btnFiltrarHijo").addEventListener("click", () => {
            View.renderReporteHijo(document.getElementById("selectHijoReporte").value);
        });

        document.getElementById("loginForm").addEventListener("submit", e => {
            e.preventDefault();
            const username = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value;
            if (!username || !password) { View.mostrarError("Completa todos los campos"); return; }
            this.isRegisterMode ? this.registrarUsuario(username, password) : this.iniciarSesion(username, password);
        });
        document.getElementById("toggleAuthLink").addEventListener("click", () => this.toggleAuthMode());

        const formPass = document.getElementById("formCambiarPassword");
        if (formPass) {
            formPass.addEventListener("submit", e => {
                e.preventDefault();
                const oldP = document.getElementById("passActualInput").value;
                const newP = document.getElementById("passNuevaInput").value;
                const confP = document.getElementById("passConfirmarInput").value;
                this.cambiarMiPassword(oldP, newP, confP);
            });
        }

        const formEspecial = document.getElementById("formPremioEspecial");
        if (formEspecial) {
            formEspecial.addEventListener("submit", e => {
                e.preventDefault();
                const hijoId = document.getElementById("selectHijoPremioEspecial").value;
                const nombre = document.getElementById("nombrePremioEspecial").value.trim();
                const puntos = document.getElementById("puntosPremioEspecial").value;
                this.solicitarPremioEspecial(hijoId, nombre, puntos);
            });
        }
    },

    // ---------- Cambiar Contraseñas ----------
    async cambiarMiPassword(oldPass, newPass, confirmPass) {
        if (!oldPass || !newPass || !confirmPass) {
            showToast("⚠️ Completa todos los campos de contraseña", true);
            return;
        }
        if (newPass !== confirmPass) {
            showToast("⚠️ La nueva contraseña y la confirmación no coinciden", true);
            return;
        }
        if (newPass.length < 6) {
            showToast("⚠️ La contraseña debe tener al menos 6 caracteres", true);
            return;
        }

        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo el Administrador puede realizar esta acción", true); return; }

        const res = await Auth.changePassword(user.username, oldPass, newPass);
        if (res.ok) {
            View.cerrarModalCambiarPassword();
            showToast("✅ Contraseña actualizada correctamente");
        } else if (res.reason === "wrong_password") {
            showToast("❌ La contraseña actual es incorrecta", true);
        } else {
            showToast("❌ Error al actualizar contraseña", true);
        }
    },

    async adminCambiarPassword(targetUsername) {
        const currentUser = Auth.getCurrentUser();
        const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.username === "admin");
        if (!isAdmin) { showToast("❌ Solo el Administrador puede realizar esta acción", true); return; }

        const nuevaPass = prompt(`Escribe la nueva contraseña para el usuario "${targetUsername}" (mínimo 6 caracteres):`);
        if (nuevaPass === null) return;
        if (!nuevaPass || nuevaPass.trim().length < 6) {
            showToast("⚠️ La contraseña debe tener al menos 6 caracteres", true);
            return;
        }

        const res = await Auth.adminResetPassword(targetUsername, nuevaPass.trim());
        if (res.ok) {
            this._refrescarAdmin();
            showToast(`✅ Contraseña de "${targetUsername}" restablecida`);
        } else {
            showToast("❌ Error al cambiar la contraseña", true);
        }
    },

    // ---------- CRUD desde botones inline ----------
    eliminarHijo(id) {
        if (!confirm("¿Eliminar este hijo?")) return;
        Store.deleteHijo(id);
        View.renderAll();
        showToast("🗑️ Hijo removido");
    },

    eliminarActividadGestion(id) {
        if (!confirm("¿Eliminar esta actividad?")) return;
        Store.deleteActividad(id);
        View.renderAll();
        showToast("🗑️ Actividad removida");
    },

    anularRegistroAdmin(id) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo Admin puede anular actividades", true); return; }

        const motivo = prompt("Motivo de la anulación (opcional):", "Anulado por irregularidad");
        if (motivo === null) return;

        if (Store.anularRegistro(id, motivo)) {
            View.renderAll();
            showToast("🚫 Actividad anulada correctamente. Puntos descontados.");
        }
    },

    atenderDenunciaAdmin(denunciaId, anularAsociado) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo Admin puede procesar denuncias", true); return; }

        if (Store.atenderDenuncia(denunciaId, anularAsociado, "Anulado tras revisión de denuncia")) {
            View.renderModuloDenuncias();
            View.renderAll();
            showToast(anularAsociado ? "🚫 Denuncia atendida y actividad anulada." : "✅ Denuncia marcada como atendida.");
        }
    },

    toggleEstadoActividad(id) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo el Administrador puede realizar esta acción", true); return; }

        if (Store.toggleEstadoActividad(id)) {
            View.renderAll();
            const act = Store.data.actividades.find(a => a.id == id);
            const estadoText = (act && act.activa !== false) ? "habilitada" : "deshabilitada";
            showToast(`✅ Actividad "${act ? act.nombre : ''}" ${estadoText}`);
        }
    },

    eliminarRecompensa(id) {
        if (!confirm("¿Eliminar esta recompensa?")) return;
        Store.deleteRecompensa(id);
        View.renderRecompensas();
        showToast("🗑️ Recompensa eliminada");
    },

    guardarEdicionRecompensa(id, nombre, puntos) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo Admin puede editar premios", true); return; }

        if (!nombre || !nombre.trim()) { showToast("⚠️ Escribe un nombre para el premio", true); return; }
        if (!puntos || parseInt(puntos, 10) < 1) { showToast("⚠️ El costo debe ser al menos 1 punto", true); return; }

        if (Store.updateRecompensa(id, nombre.trim(), puntos)) {
            View.renderRecompensas();
            showToast("✅ Premio actualizado correctamente");
        }
    },

    toggleEstadoRecompensa(id) {
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        if (!isAdmin) { showToast("❌ Solo Admin puede habilitar/deshabilitar premios", true); return; }

        if (Store.toggleEstadoRecompensa(id)) {
            View.renderRecompensas();
            const rec = Store.data.recompensas.find(r => r.id == id);
            const estadoText = (rec && rec.activa !== false) ? "habilitado" : "deshabilitado";
            showToast(`✅ Premio "${rec ? rec.nombre : ''}" ${estadoText}`);
        }
    },

    eliminarRegistro(id) {
        const registro = Store.data.registros.find(r => r.id === id);
        if (!registro) { showToast("⚠️ Registro no encontrado", true); return; }
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        const isOwner = user && registro.usuario === user.username;

        if (!isAdmin && !isOwner) {
            showToast("❌ Solo puedes eliminar tus propios registros", true);
            return;
        }

        if (!confirm("¿Eliminar este registro?")) return;
        Store.deleteRegistro(id);
        View.renderAll();
        showToast("🗑️ Registro eliminado");
    },

    abrirModalEditar(id) {
        const registro = Store.data.registros.find(r => r.id === id);
        if (!registro) { showToast("⚠️ Registro no encontrado", true); return; }
        const user = Auth.getCurrentUser();
        const isAdmin = user && (user.role === "admin" || user.username === "admin");
        const isOwner = user && registro.usuario === user.username;

        if (!isAdmin && !isOwner) {
            showToast("❌ Solo puedes editar tus propios registros", true);
            return;
        }
        View.abrirModalEditar(registro);
    },

    // ---------- Sincronización manual (botón 🔄 del topbar) ----------
    sincronizarAhora() {
        View.updateSyncStatus("syncing", "Sincronizando...");
        Store.loadFromSupabase()
            .then(() => { View.renderAll(); View.updateSyncStatus("online", "Conectado"); showToast("🔄 Datos actualizados"); })
            .catch(err => { console.error(err); View.updateSyncStatus("offline", "Offline"); showToast("❌ Error al sincronizar", true); });
    },

    // ---------- Exportar PDF ----------
    exportarPDF(tipoReporte) {
        let lista = [], titulo = "";
        if (tipoReporte === "diario") {
            lista = Store.registrosDeHoy();
            titulo = `📅 Reporte Diario - ${formatearFechaTexto(getFechaLocal())}`;
        } else if (tipoReporte === "rango") {
            const desde = document.getElementById("fechaDesde").value;
            const hasta = document.getElementById("fechaHasta").value;
            if (!desde || !hasta) { showToast("Selecciona ambas fechas", true); return; }
            lista = Store.registrosEnRango(desde, hasta);
            titulo = `📆 Reporte por Rango (${formatearFechaTexto(desde)} - ${formatearFechaTexto(hasta)})`;
        } else if (tipoReporte === "hijo") {
            const hijoId = document.getElementById("selectHijoReporte").value;
            if (!hijoId) { showToast("Selecciona un hijo", true); return; }
            lista = Store.registrosDeHijo(hijoId);
            titulo = `👤 Reporte de ${Store.getNombreHijo(parseInt(hijoId, 10))}`;
        } else if (tipoReporte === "completo") {
            lista = Store.registrosTodos();
            titulo = "📊 Reporte Completo - Todos los registros";
        }

        lista = Store.ordenarPorFechaReciente(lista);

        if (lista.length === 0) { showToast("No hay datos para exportar", true); return; }

        const contenedor = document.createElement("div");
        contenedor.style.cssText = "padding:20px;background:#fff;font-family:Arial,sans-serif;";

        const tituloEl = document.createElement("h1");
        tituloEl.textContent = titulo;
        tituloEl.style.cssText = "color:#1a2a3a;border-bottom:3px solid #4a6cf7;padding-bottom:10px;margin-bottom:16px;font-size:20px;";
        contenedor.appendChild(tituloEl);

        const fechaEl = document.createElement("p");
        fechaEl.textContent = `📅 Generado: ${formatearFechaTexto(getFechaLocal())} ${new Date().toLocaleTimeString()}`;
        fechaEl.style.cssText = "color:#6b7a8f;font-size:13px;margin-bottom:16px;";
        contenedor.appendChild(fechaEl);

        const headers = ["#", "Hijo", "Actividad", "Puntos", "Descripción", "Fecha / Hora", "Reportado por"];
        const anchos = ["4%", "12%", "12%", "10%", "30%", "16%", "16%"];

        let rows = "";
        lista.forEach((r, i) => {
            const fh = formatearFechaHoraMostrar(r.fechaHora || r.fecha || "");
            const pts = Store.getPuntosActividad(r.actividadId);
            rows += `<tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:8px 10px;">${i + 1}</td>
                <td style="padding:8px 10px;">${Store.getNombreHijo(r.hijoId)}</td>
                <td style="padding:8px 10px;">${Store.getNombreActividad(r.actividadId)}</td>
                <td style="padding:8px 10px;font-weight:bold;color:#4a6cf7;">+${pts} pts</td>
                <td style="padding:8px 10px;">${r.descripcion || "Sin descripción"}</td>
                <td style="padding:8px 10px;line-height:1.4;">
                    ${fh.fecha}<br><span style="font-size:10px;color:#6b7a8f;">🕐 ${fh.hora || "--:--"}</span>
                </td>
                <td style="padding:8px 10px;">${r.usuario || "admin"}</td>
            </tr>`;
        });

        const tabla = document.createElement("table");
        tabla.style.cssText = "width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;";
        tabla.innerHTML = `
            <colgroup>${anchos.map(a => `<col style="width:${a};">`).join("")}</colgroup>
            <thead><tr>${headers.map(h => `<th style="background:#1a2a3a;color:#fff;padding:8px 10px;text-align:left;">${h}</th>`).join("")}</tr></thead>
            <tbody>${rows}</tbody>`;
        contenedor.appendChild(tabla);

        const totalEl = document.createElement("p");
        totalEl.textContent = `📊 Total: ${lista.length} registros`;
        totalEl.style.cssText = "margin-top:16px;font-weight:600;color:#1a2a3a;text-align:right;font-size:14px;";
        contenedor.appendChild(totalEl);

        const footerEl = document.createElement("p");
        footerEl.textContent = `Generado automáticamente · ${new Date().toLocaleString()}`;
        footerEl.style.cssText = "margin-top:20px;padding-top:12px;border-top:1px solid #eef2f7;font-size:10px;color:#8a9aa8;text-align:center;";
        contenedor.appendChild(footerEl);

        html2pdf().set({
            margin: 10,
            filename: `${titulo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, width: 800 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        }).from(contenedor).save()
            .then(() => showToast("✅ PDF descargado"))
            .catch(err => { console.error(err); showToast("❌ Error al generar PDF", true); });
    },

    // ---------- Arranque ----------
    async init() {
        this.initMenu();
        this.initForms();
        Store.subscribeRealtime(() => { View.renderAll(); showToast("🔄 Datos sincronizados en tiempo real"); });
        Auth.subscribeRealtime(() => {
            const user = Auth.getCurrentUser();
            if (user && user.role === "admin") this._refrescarAdmin();
        });

        // 1. Restaurar sesión activa de inmediato desde localStorage para evitar deslogueos al recargar
        const user = Auth.getCurrentUser();
        if (user) {
            View.setUserDisplayName(user.username);
            this.mostrarApp();
        } else {
            View.mostrarLogin();
        }

        // 2. Cargar usuarios remotos de Supabase en segundo plano para actualizar estado
        try {
            await Auth.load();
            if (user) {
                const valido = Auth.getUsers().find(u => u.username === user.username && u.approved && !u.blocked);
                if (!valido && user.username !== "admin" && user.role !== "admin") {
                    this.cerrarSesion();
                    showToast("🔒 Tu sesión ha sido desaprobada o bloqueada por el Administrador", true);
                }
            }
        } catch (e) {
            console.warn("Modo de red diferido:", e);
        }
    },
};

window.AppController = AppController;
document.addEventListener("DOMContentLoaded", () => AppController.init());

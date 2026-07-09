// ============================================================
// 🎮 CONTROLADOR: EVENTOS Y FLUJO DE LA APP
// ============================================================
const AppController = {
    isRegisterMode: false,

    // ---------- Autenticación ----------
    async iniciarSesion(username, password) {
        const res = await Auth.login(username, password);
        if (!res.ok) {
            if (res.reason === "blocked") View.mostrarError("❌ Tu cuenta ha sido bloqueada");
            else if (res.reason === "pending") View.mostrarInfo("⏳ Cuenta pendiente de aprobación");
            else if (res.reason === "network") View.mostrarError(`❌ Error de conexión: ${res.error}`);
            else View.mostrarError("❌ Usuario o contraseña incorrectos");
            return;
        }
        View.setUserDisplayName(res.user.username);
        this.mostrarApp();
        showToast("✅ Sesión iniciada");
    },

    async registrarUsuario(username, password) {
        const res = await Auth.register(username, password);
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
        Store.loadFromSupabase()
            .then(() => { View.renderAll(); View.updateSyncStatus("online", "Conectado"); })
            .catch(err => { console.error("Error cargando de Supabase:", err); View.updateSyncStatus("offline", "Offline"); });
    },

    _aplicarUI() {
        const user = Auth.getCurrentUser();
        if (!user) return;
        View.aplicarRolUsuario(user);
        if (user.role === "admin") this._refrescarAdmin();
    },

    // ---------- Menú lateral ----------
    initMenu() {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        document.getElementById("menuToggle").addEventListener("click", () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("show");
        });
        overlay.addEventListener("click", () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); });

        document.querySelectorAll(".sidebar-item").forEach(item => {
            item.addEventListener("click", () => {
                const viewTarget = item.getAttribute("data-view");
                if (!viewTarget) return;
                document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
                document.getElementById(`view-${viewTarget}`).classList.add("active");
                if (viewTarget === "admin") this._refrescarAdmin();
                if (viewTarget === "completo") View.renderReporteCompleto();
                if (window.innerWidth < 768) { sidebar.classList.remove("open"); overlay.classList.remove("show"); }
            });
        });
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

            Store.addRegistro({ hijoId, actividadId, descripcion, fechaHora, usuario: user ? user.username : "anonimo" });
            View.renderAll();
            e.target.reset();
            document.getElementById("fechaHoraActividad").value = getFechaHoraLocal();
            showToast("✅ Actividad registrada");
        });

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
            Store.addActividad(nombre);
            View.renderAll();
            e.target.reset();
            showToast("✅ Actividad creada");
        });

        document.getElementById("formEditar").addEventListener("submit", e => {
            e.preventDefault();
            const id = parseInt(document.getElementById("editRegistroId").value, 10);
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
    eliminarRegistro(id) {
        if (!confirm("¿Eliminar este registro?")) return;
        Store.deleteRegistro(id);
        View.renderAll();
        showToast("🗑️ Registro eliminado");
    },
    abrirModalEditar(id) {
        const registro = Store.data.registros.find(r => r.id === id);
        if (!registro) { showToast("⚠️ Registro no encontrado", true); return; }
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
            lista = Store.data.registros;
            titulo = "📊 Reporte Completo - Todos los registros";
        }

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

        const headers = ["#", "Hijo", "Actividad", "Descripción", "Fecha / Hora", "Reportado por"];
        // Anchos fijos por columna (%) para que la tabla nunca se desborde del margen,
        // sin importar qué tan larga sea la descripción.
        const anchos = ["4%", "13%", "13%", "34%", "18%", "18%"];

        let rows = "";
        lista.forEach((r, i) => {
            const fh = formatearFechaHoraMostrar(r.fechaHora || r.fecha || "");
            rows += `<tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:8px 10px;word-wrap:break-word;overflow-wrap:break-word;">${i + 1}</td>
                <td style="padding:8px 10px;word-wrap:break-word;overflow-wrap:break-word;">${Store.getNombreHijo(r.hijoId)}</td>
                <td style="padding:8px 10px;word-wrap:break-word;overflow-wrap:break-word;">${Store.getNombreActividad(r.actividadId)}</td>
                <td style="padding:8px 10px;word-wrap:break-word;overflow-wrap:break-word;white-space:normal;">${r.descripcion || "Sin descripción"}</td>
                <td style="padding:8px 10px;line-height:1.4;word-wrap:break-word;">
                    ${fh.fecha}<br><span style="font-size:10px;color:#6b7a8f;">🕐 ${fh.hora || "--:--"}</span>
                </td>
                <td style="padding:8px 10px;word-wrap:break-word;overflow-wrap:break-word;">${r.usuario || "admin"}</td>
            </tr>`;
        });

        const tabla = document.createElement("table");
        tabla.style.cssText = "width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;";
        tabla.innerHTML = `
            <colgroup>${anchos.map(a => `<col style="width:${a};">`).join("")}</colgroup>
            <thead><tr>${headers.map((h, i) => `<th style="background:#1a2a3a;color:#fff;padding:8px 10px;text-align:left;word-wrap:break-word;">${h}</th>`).join("")}</tr></thead>
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

        await Auth.load();
        const user = Auth.getCurrentUser();
        if (user) {
            const valido = Auth.getUsers().find(u => u.username === user.username && u.approved && !u.blocked);
            if (valido) { View.setUserDisplayName(user.username); this.mostrarApp(); return; }
        }
        View.mostrarLogin();
    },
};

document.addEventListener("DOMContentLoaded", () => AppController.init());

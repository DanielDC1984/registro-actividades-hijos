// ============================================================
// 🎨 VISTA: RENDERIZADO DEL DOM
// ============================================================
const View = {
    // ---------- Login / App shell ----------
    mostrarLogin() {
        document.getElementById("loginContainer").style.display = "flex";
        document.getElementById("appContainer").classList.remove("active");
    },

    mostrarApp() {
        document.getElementById("loginContainer").style.display = "none";
        document.getElementById("appContainer").classList.add("active");
    },

    setUserDisplayName(username) {
        document.getElementById("userDisplayName").textContent = username;
    },

    mostrarError(msg) {
        this._setMensaje("loginError", msg);
    },
    mostrarExito(msg) {
        this._setMensaje("loginSuccess", msg);
    },
    mostrarInfo(msg) {
        this._setMensaje("loginInfo", msg);
    },
    ocultarMensajesLogin() {
        ["loginError", "loginSuccess", "loginInfo"].forEach(id => document.getElementById(id).style.display = "none");
    },
    _setMensaje(id, msg) {
        this.ocultarMensajesLogin();
        const el = document.getElementById(id);
        el.textContent = msg;
        el.style.display = "block";
    },

    setModoRegistro(isRegisterMode) {
        const link = document.getElementById("toggleAuthLink");
        const btn = document.getElementById("loginBtn");
        const title = document.querySelector(".login-box h1");
        const subtitle = document.getElementById("loginSubtitle");
        if (isRegisterMode) {
            link.textContent = "← Volver";
            btn.textContent = "📝 Registrarme";
            title.textContent = "Crear Cuenta";
            subtitle.textContent = "Regístrate para solicitar acceso";
        } else {
            link.textContent = "📝 Registrarme";
            btn.textContent = "🚀 Iniciar Sesión";
            title.textContent = "Registro de Actividades";
            subtitle.textContent = "Inicia sesión para gestionar las actividades";
        }
        this.ocultarMensajesLogin();
    },

    // ---------- Estado de sincronización ----------
    updateSyncStatus(state, text) {
        const dot = document.getElementById("statusDot");
        const label = document.getElementById("statusText");
        if (dot && label) { dot.className = `dot ${state}`; label.textContent = text; }
    },

    // ---------- Rol / panel admin ----------
    aplicarRolUsuario(user) {
        const adminPanel = document.getElementById("adminPanelGroup");
        const roleBadge = document.getElementById("userRoleBadge");
        const esAdmin = user.role === "admin";
        adminPanel.style.display = esAdmin ? "block" : "none";
        roleBadge.textContent = esAdmin ? "Administrador" : "Usuario";
        roleBadge.className = esAdmin ? "role-badge admin" : "role-badge user";
        document.querySelectorAll('[data-view="hijos"]').forEach(el => el.style.display = esAdmin ? "flex" : "none");
        document.querySelectorAll('[data-view="actividades"]').forEach(el => el.style.display = esAdmin ? "flex" : "none");
    },

    actualizarContadoresAdmin(pendientes) {
        document.getElementById("pendingCount").textContent = pendientes;
        document.getElementById("adminPendingCount").textContent = pendientes;
    },

    renderAdminPanel(users) {
        const container = document.getElementById("adminUserList");
        if (users.length === 0) {
            container.innerHTML = `<div class="empty-state"><span class="emoji">👥</span><p>No hay usuarios registrados</p></div>`;
            return;
        }
        let html = "<h3>📋 Usuarios del Sistema</h3>";
        users.forEach(u => {
            let statusClass, statusText;
            if (u.role === "admin") { statusClass = "approved"; statusText = "👑 Admin"; }
            else if (u.blocked) { statusClass = "blocked"; statusText = "🔒 Bloqueado"; }
            else if (u.approved) { statusClass = "approved"; statusText = "✅ Aprobado"; }
            else { statusClass = "pending"; statusText = "⏳ Pendiente"; }

            let actionsHtml;
            if (u.role !== "admin") {
                actionsHtml = "";
                if (!u.approved) actionsHtml += `<button class="btn-approve" onclick="AppController.aprobarUsuario('${u.username}')">✅ Aprobar</button>`;
                if (u.blocked) actionsHtml += `<button class="btn-unblock" onclick="AppController.desbloquearUsuario('${u.username}')">🔓 Desbloquear</button>`;
                else if (u.approved) actionsHtml += `<button class="btn-block" onclick="AppController.bloquearUsuario('${u.username}')">🔒 Bloquear</button>`;
                actionsHtml += `<button class="btn-delete-user" onclick="AppController.eliminarUsuario('${u.username}')">🗑️ Eliminar</button>`;
            } else {
                actionsHtml = `<span style="font-size:11px;color:#6b7a8f;">👑 Administrador</span>`;
            }

            html += `
                <div class="user-item">
                    <div class="user-data">
                        <span class="name">👤 ${u.username}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="actions">${actionsHtml}</div>
                </div>`;
        });
        container.innerHTML = html;
    },

    // ---------- Contadores generales ----------
    actualizarContadores(data) {
        document.getElementById("hijosCount").textContent = data.hijos.length;
        document.getElementById("actividadesCount").textContent = data.actividades.length;
        document.getElementById("totalRegistros").textContent = data.registros.length;
    },

    // ---------- Selects (hijo / actividad) ----------
    populateSelects(data) {
        let hijosHtml = '<option value="">Seleccionar...</option>';
        data.hijos.forEach(h => {
            hijosHtml += `<option value="${h.id}">${h.nombre}${h.edad ? " (" + h.edad + " años)" : ""}</option>`;
        });
        let actHtml = '<option value="">Seleccionar...</option>';
        data.actividades.forEach(a => { actHtml += `<option value="${a.id}">${a.nombre}</option>`; });

        ["selectHijo", "selectHijoReporte", "editSelectHijo"].forEach(id => document.getElementById(id).innerHTML = hijosHtml);
        ["selectActividad", "editSelectActividad"].forEach(id => document.getElementById(id).innerHTML = actHtml);

        document.getElementById("fechaHoraActividad").value = getFechaHoraLocal();
    },

    // ---------- Hijos / Actividades (gestión) ----------
    renderHijos(hijos) {
        const container = document.getElementById("listaHijos");
        if (hijos.length === 0) { container.innerHTML = '<div class="empty-state"><p>No hay hijos registrados</p></div>'; return; }
        container.innerHTML = hijos.map(h => `
            <div class="child-card">
                <div class="child-info">
                    <div class="child-name">👤 ${h.nombre}</div>
                    <div class="child-age">${h.edad ? h.edad + " años" : "Sin edad"}</div>
                </div>
                <button class="btn-delete" onclick="AppController.eliminarHijo(${h.id})">Eliminar</button>
            </div>`).join("");
    },

    renderActividadesGestion(actividades) {
        const container = document.getElementById("listaActividadesGestion");
        if (actividades.length === 0) { container.innerHTML = '<div class="empty-state"><p>No hay actividades registradas</p></div>'; return; }
        container.innerHTML = actividades.map(a => `
            <div class="child-card">
                <div class="child-info"><div class="child-name">🎯 ${a.nombre}</div></div>
                <button class="btn-delete" onclick="AppController.eliminarActividadGestion(${a.id})">Eliminar</button>
            </div>`).join("");
    },

    // ---------- Reportes ----------
    generarTabla(lista, titulo, mostrarUsuario = false) {
        if (lista.length === 0) return `<div class="empty-state"><span class="emoji">📭</span><p>No hay actividades registradas</p></div>`;
        let html = `
            <div class="reporte-titulo">
                <span>${titulo}</span>
                <span class="fecha-info">📊 ${lista.length} registros</span>
            </div>
            <div style="overflow-x:auto;">
                <table class="tabla-reporte">
                    <thead><tr>
                        <th>#</th><th>👤 Hijo</th><th>🎯 Actividad</th>
                        <th>📝 Descripción</th><th>📅 Fecha / Hora</th>
                        ${mostrarUsuario ? "<th>👤 Usuario</th>" : ""}
                        <th class="col-acciones">Acciones</th>
                    </tr></thead>
                    <tbody>`;
        lista.forEach((r, i) => {
            const fh = formatearFechaHoraMostrar(r.fechaHora || r.fecha || "");
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td><span class="badge-hijo">${Store.getNombreHijo(r.hijoId)}</span></td>
                    <td><span class="badge-actividad">${Store.getNombreActividad(r.actividadId)}</span></td>
                    <td class="descripcion-cell">${r.descripcion || "Sin descripción"}</td>
                    <td class="fecha-hora-cell">
                        <span class="fecha">${fh.fecha}</span>
                        <span class="hora">🕐 ${fh.hora || "--:--"}</span>
                    </td>
                    ${mostrarUsuario ? `<td class="usuario-cell">${r.usuario || "admin"}</td>` : ""}
                    <td class="col-acciones">
                        <button class="btn-edit" onclick="AppController.abrirModalEditar(${r.id})">✏️</button>
                        <button class="btn-delete-reg" onclick="AppController.eliminarRegistro(${r.id})">🗑️</button>
                    </td>
                </tr>`;
        });
        html += `</tbody></table></div>`;
        return html;
    },

    renderReporteDiario() {
        const lista = Store.registrosDeHoy();
        document.getElementById("diarioCount").textContent = lista.length;
        document.getElementById("diarioLista").innerHTML = this.generarTabla(lista, `📅 Reporte Diario - ${formatearFechaTexto(getFechaLocal())}`);
    },

    renderReporteRango(desde, hasta) {
        const container = document.getElementById("rangoLista");
        if (!desde || !hasta) { container.innerHTML = `<div class="empty-state"><p>📅 Selecciona ambas fechas</p></div>`; return; }
        const lista = Store.registrosEnRango(desde, hasta);
        container.innerHTML = lista.length === 0
            ? `<div class="empty-state"><span class="emoji">📭</span><p>No hay registros en este rango</p></div>`
            : this.generarTabla(lista, `📆 Reporte por Rango (${formatearFechaTexto(desde)} - ${formatearFechaTexto(hasta)})`);
    },

    renderReporteHijo(hijoId) {
        const container = document.getElementById("hijoLista");
        if (!hijoId) { container.innerHTML = `<div class="empty-state"><p>👤 Selecciona un hijo</p></div>`; return; }
        const lista = Store.registrosDeHijo(hijoId);
        container.innerHTML = lista.length === 0
            ? `<div class="empty-state"><span class="emoji">📭</span><p>Este hijo no tiene actividades</p></div>`
            : this.generarTabla(lista, `👤 Reporte de ${Store.getNombreHijo(parseInt(hijoId, 10))}`);
    },

    renderReporteCompleto() {
        const lista = Store.data.registros;
        document.getElementById("completoCount").textContent = lista.length;
        document.getElementById("completoLista").innerHTML = this.generarTabla(lista, "📊 Reporte Completo - Todos los registros", true);
    },

    renderAll() {
        this.actualizarContadores(Store.data);
        this.populateSelects(Store.data);
        this.renderHijos(Store.data.hijos);
        this.renderActividadesGestion(Store.data.actividades);
        this.renderReporteDiario();
        this.renderReporteCompleto();
    },

    // ---------- Modal edición ----------
    abrirModalEditar(registro) {
        document.getElementById("editRegistroId").value = registro.id;
        document.getElementById("editSelectHijo").value = registro.hijoId;
        document.getElementById("editSelectActividad").value = registro.actividadId;
        document.getElementById("editDescripcion").value = registro.descripcion || "";
        document.getElementById("editFechaHora").value = registro.fechaHora || (registro.fecha ? registro.fecha + "T00:00" : getFechaHoraLocal());
        document.getElementById("modalEditar").classList.add("active");
    },
    cerrarModalEditar() {
        document.getElementById("modalEditar").classList.remove("active");
    },
};

// ============================================================
// 🎨 VISTA: RENDERIZADO DEL DOM
// ============================================================
const View = {
    // ---------- Login / App shell ----------
    mostrarLogin() {
        const form = document.getElementById("loginForm");
        if (form) form.reset();
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

    mostrarError(msg) { this._setMensaje("loginError", msg); },
    mostrarExito(msg) { this._setMensaje("loginSuccess", msg); },
    mostrarInfo(msg) { this._setMensaje("loginInfo", msg); },
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

    // ---------- Modal Anuncio ----------
    mostrarModalAnuncio(forzar = false) {
        const anuncio = Store.data.anuncio;
        if (!forzar && (!anuncio || !anuncio.activo)) return;

        const elTitulo = document.getElementById("anuncioTitulo");
        const elMensaje = document.getElementById("anuncioMensaje");
        if (elTitulo) elTitulo.textContent = (anuncio && anuncio.titulo) || "📢 ¡Atención!";
        if (elMensaje) elMensaje.textContent = (anuncio && anuncio.mensaje) || "Sin mensaje definido.";

        const modal = document.getElementById("modalAnuncio");
        if (modal) modal.classList.add("active");
    },

    cerrarModalAnuncio() {
        const modal = document.getElementById("modalAnuncio");
        if (modal) modal.classList.remove("active");
    },

    // ---------- Modal Cambiar Contraseña ----------
    abrirModalCambiarPassword() {
        const modal = document.getElementById("modalCambiarPassword");
        const form = document.getElementById("formCambiarPassword");
        if (form) form.reset();
        if (modal) modal.classList.add("active");
    },

    cerrarModalCambiarPassword() {
        const modal = document.getElementById("modalCambiarPassword");
        if (modal) modal.classList.remove("active");
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

        const adminFormRec = document.getElementById("adminFormRecompensa");
        if (adminFormRec) adminFormRec.style.display = esAdmin ? "block" : "none";

        const adminCanjes = document.getElementById("adminCanjesPendientes");
        if (adminCanjes) adminCanjes.style.display = esAdmin ? "block" : "none";

        const btnPass = document.getElementById("btnCambiarMiPassword");
        if (btnPass) btnPass.style.display = esAdmin ? "flex" : "none";

        document.querySelectorAll('[data-view="hijos"]').forEach(el => el.style.display = esAdmin ? "flex" : "none");
        document.querySelectorAll('[data-view="actividades"]').forEach(el => el.style.display = esAdmin ? "flex" : "none");
        document.querySelectorAll('[data-view="puntos-config"]').forEach(el => el.style.display = esAdmin ? "flex" : "none");
    },

    actualizarContadoresAdmin(pendientes) {
        document.getElementById("pendingCount").textContent = pendientes;
        document.getElementById("adminPendingCount").textContent = pendientes;
    },

    renderAdminPanel(users) {
        const container = document.getElementById("adminUserList");
        if (!container) return;
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

            let actionsHtml = "";
            if (u.role !== "admin") {
                if (!u.approved) actionsHtml += `<button class="btn-approve" onclick="AppController.aprobarUsuario('${u.username}')">✅ Aprobar</button>`;
                if (u.blocked) actionsHtml += `<button class="btn-unblock" onclick="AppController.desbloquearUsuario('${u.username}')">🔓 Desbloquear</button>`;
                else if (u.approved) actionsHtml += `<button class="btn-block" onclick="AppController.bloquearUsuario('${u.username}')">🔒 Bloquear</button>`;
                actionsHtml += `<button class="btn-block" style="background:#6366f1;" onclick="AppController.adminCambiarPassword('${u.username}')">🔑 Pass</button>`;
                actionsHtml += `<button class="btn-delete-user" onclick="AppController.eliminarUsuario('${u.username}')">🗑️ Eliminar</button>`;
            } else {
                actionsHtml = `<button class="btn-block" style="background:#6366f1;" onclick="View.abrirModalCambiarPassword()">🔑 Cambiar Pass</button>`;
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

        const denunciasEl = document.getElementById("denunciasCount");
        if (denunciasEl) {
            const pendientes = (data.denuncias || []).filter(d => !d.atendida).length;
            denunciasEl.textContent = pendientes;
            denunciasEl.style.background = pendientes > 0 ? "#ef4444" : "rgba(255,255,255,0.2)";
        }
    },

    // ---------- Selects (hijo / actividad) ----------
    populateSelects(data) {
        let hijosHtml = '<option value="">Seleccionar...</option>';
        data.hijos.forEach(h => {
            hijosHtml += `<option value="${h.id}">${h.nombre}${h.edad ? " (" + h.edad + " años)" : ""}</option>`;
        });

        let actHtmlNew = '<option value="">Seleccionar...</option>';
        let actHtmlEdit = '<option value="">Seleccionar...</option>';

        data.actividades.forEach(a => {
            const pts = a.puntos || 0;
            const esActiva = a.activa !== false;
            if (esActiva) {
                actHtmlNew += `<option value="${a.id}">${a.nombre} (⭐ ${pts} pts)</option>`;
            }
            actHtmlEdit += `<option value="${a.id}">${a.nombre} (⭐ ${pts} pts)${esActiva ? '' : ' [Deshabilitada]'}</option>`;
        });

        ["selectHijo", "selectHijoReporte", "editSelectHijo", "selectHijoPremioEspecial", "selectHijoFiltroDenuncia", "selectHijoEstadisticas"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = hijosHtml;
        });

        const elNew = document.getElementById("selectActividad");
        if (elNew) elNew.innerHTML = actHtmlNew;

        const elEdit = document.getElementById("editSelectActividad");
        if (elEdit) elEdit.innerHTML = actHtmlEdit;

        const fEl = document.getElementById("fechaHoraActividad");
        if (fEl && !fEl.value) fEl.value = getFechaHoraLocal();

        this.actualizarSelectRegistrosDenuncia();
    },

    actualizarSelectRegistrosDenuncia() {
        const selectHijo = document.getElementById("selectHijoFiltroDenuncia");
        const selectRegistro = document.getElementById("selectRegistroDenuncia");
        if (!selectRegistro) return;

        const hijoId = selectHijo ? selectHijo.value : "";
        let registros = Store.registrosTodos().filter(r => r.estado !== "anulado");
        if (hijoId) {
            registros = registros.filter(r => r.hijoId == hijoId);
        }

        if (registros.length === 0) {
            selectRegistro.innerHTML = `<option value="">No hay actividades disponibles para denunciar</option>`;
            return;
        }

        let html = `<option value="">Selecciona un registro observado...</option>`;
        registros.forEach(r => {
            const fh = formatearFechaHoraMostrar(r.fechaHora || r.fecha || "");
            const hNombre = Store.getNombreHijo(r.hijoId);
            const aNombre = Store.getNombreActividad(r.actividadId);
            const pts = Store.getPuntosActividad(r.actividadId);
            html += `<option value="${r.id}">👤 ${hNombre} - 🎯 ${aNombre} (⭐ ${pts} pts) - ${fh.fecha} ${fh.hora}</option>`;
        });
        selectRegistro.innerHTML = html;
    },

    observarRegistroDirecto(registroId) {
        if (typeof AppController !== "undefined" && typeof AppController.switchView === "function") {
            AppController.switchView("denuncias");
        }
        const selectReg = document.getElementById("selectRegistroDenuncia");
        if (selectReg) selectReg.value = registroId;

        const inputDet = document.getElementById("detalleDenunciaInput");
        if (inputDet) inputDet.focus();
    },

    // ---------- Hijos / Actividades ----------
    renderHijos(hijos) {
        const container = document.getElementById("listaHijos");
        if (!container) return;
        if (hijos.length === 0) { container.innerHTML = '<div class="empty-state"><p>No hay hijos registrados</p></div>'; return; }
        container.innerHTML = hijos.map(h => `
            <div class="child-card">
                <div class="child-info">
                    <div class="child-name">👤 ${h.nombre}</div>
                    <div class="child-age">${h.edad ? h.edad + " años" : "Sin edad"} · Puntos totales: <strong>${Store.getPuntosGanadosHijo(h.id)} pts</strong></div>
                </div>
                <button class="btn-delete" onclick="AppController.eliminarHijo(${h.id})">Eliminar</button>
            </div>`).join("");
    },

    renderActividadesGestion(actividades) {
        const container = document.getElementById("listaActividadesGestion");
        if (!container) return;
        if (actividades.length === 0) { container.innerHTML = '<div class="empty-state"><p>No hay actividades registradas</p></div>'; return; }
        container.innerHTML = actividades.map(a => {
            const esActiva = a.activa !== false;
            return `
            <div class="child-card">
                <div class="child-info">
                    <div class="child-name" style="display:flex;align-items:center;gap:8px;">
                        <span>🎯 ${a.nombre}</span>
                        <span style="font-size:11px;padding:2px 8px;border-radius:12px;font-weight:700;background:${esActiva ? '#dcfce7' : '#fee2e2'};color:${esActiva ? '#16a34a' : '#dc2626'};">
                            ${esActiva ? '🟢 Habilitada' : '🔴 Deshabilitada'}
                        </span>
                    </div>
                    <div class="child-age">Valor actual: <strong>⭐ ${a.puntos || 0} pts</strong></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <button class="btn-block" style="background:${esActiva ? '#f59e0b' : '#10b981'};color:#fff;padding:6px 12px;font-size:12px;border:none;border-radius:10px;cursor:pointer;" onclick="AppController.toggleEstadoActividad(${a.id})">
                        ${esActiva ? '🚫 Deshabilitar' : '✅ Habilitar'}
                    </button>
                    <button class="btn-delete" onclick="AppController.eliminarActividadGestion(${a.id})">Eliminar</button>
                </div>
            </div>`;
        }).join("");
    },

    // ---------- Configuración de Puntos y Anuncio (Admin) ----------
    renderPuntosConfig() {
        const container = document.getElementById("puntosConfigLista");
        if (!container) return;
        const actividades = Store.data.actividades;
        const anuncio = Store.data.anuncio || { activo: true, titulo: "📢 Anuncio", mensaje: "" };

        let html = `
            <!-- PANEL: MENSAJE DE BIENVENIDA -->
            <div class="admin-panel" style="margin-bottom:20px;">
                <h3>📢 Mensaje de Bienvenida para Usuarios</h3>
                <p style="color:#6b7a8f;font-size:13px;margin-bottom:12px;">Escribe un aviso para mostrar a todos los usuarios al iniciar sesión:</p>
                
                <div class="form-group" style="margin-bottom:10px;">
                    <label style="font-size:13px;display:flex;align-items:center;gap:6px;">
                        <input type="checkbox" id="anuncioActivoInput" ${anuncio.activo ? "checked" : ""} style="width:auto;margin:0;">
                        <strong>Mostrar anuncio al iniciar sesión</strong>
                    </label>
                </div>
                <div class="form-group" style="margin-bottom:10px;">
                    <label>Título del Anuncio</label>
                    <input type="text" id="anuncioTituloInput" value="${anuncio.titulo || ''}" placeholder="Ej: 📢 ¡Novedad en el sistema!">
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Mensaje del Anuncio</label>
                    <textarea id="anuncioMensajeInput" rows="3" placeholder="Mensaje que verán los usuarios...">${anuncio.mensaje || ''}</textarea>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn-primary" style="width:auto;padding:10px 20px;" onclick="AppController.guardarAnuncio(document.getElementById('anuncioActivoInput').checked, document.getElementById('anuncioTituloInput').value, document.getElementById('anuncioMensajeInput').value)">💾 Guardar Anuncio</button>
                    <button type="button" style="width:auto;padding:10px 20px;background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;" onclick="View.mostrarModalAnuncio(true)">👁️ Previsualizar Anuncio</button>
                </div>
            </div>

            <!-- PANEL: PUNTOS POR ACTIVIDAD -->
            <div class="admin-panel">
                <h3>⚙️ Puntos por Tipo de Actividad</h3>
                <p style="color:#6b7a8f;font-size:13px;margin-bottom:14px;">Define los puntos que ganarán los niños al realizar cada tarea:</p>
                <div class="puntos-grid">`;

        if (actividades.length === 0) {
            html += '<div class="empty-state"><p>No hay actividades registradas para configurar puntos</p></div>';
        } else {
            actividades.forEach(a => {
                const pts = a.puntos || 0;
                html += `
                    <div class="punto-item">
                        <div class="punto-info">
                            <span class="act-name">🎯 ${a.nombre}</span>
                            <span id="ptsDisplay_${a.id}" style="font-size:12px;color:#6b7a8f;">Actual: <strong>${pts} pts</strong></span>
                        </div>
                        <div class="punto-input-group">
                            <input
                                type="number"
                                id="inputPuntos_${a.id}"
                                value="${pts}"
                                min="0" max="1000"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                oninput="document.getElementById('ptsDisplay_${a.id}').innerHTML='Actual: <strong>' + (this.value||0) + ' pts</strong>'"
                            >
                            <button class="btn-primary" style="width:auto;padding:6px 14px;font-size:13px;"
                                onclick="(function(){
                                    var el = document.getElementById('inputPuntos_${a.id}');
                                    if(el){ el.blur(); AppController.guardarPuntosActividad(${a.id}, el.value); }
                                })()">💾 Guardar</button>
                        </div>
                    </div>`;
            });
        }
        html += `
                </div>
                <!-- BOTÓN MAESTRO: GUARDAR TODO -->
                <div style="
                    margin-top: 18px;
                    padding-top: 16px;
                    border-top: 2px dashed #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                ">
                    <p style="margin:0; font-size:12px; color:#6b7a8f;">
                        💡 Guarda todos los cambios de puntos en una sola acción
                    </p>
                    <button
                        id="btnGuardarTodosPuntos"
                        onclick="AppController.guardarTodosPuntos()"
                        style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 12px 24px;
                            background: linear-gradient(135deg, #6366f1, #8b5cf6);
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-size: 15px;
                            font-weight: 700;
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(99,102,241,0.4);
                            transition: all 0.2s ease;
                            letter-spacing: 0.3px;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(99,102,241,0.55)';"
                        onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(99,102,241,0.4)';"
                    >
                        💾 Guardar Todos los Puntos
                    </button>
                </div>
            </div>

            <!-- PANEL: HISTORIAL DE AUDITORÍA Y SEGURIDAD -->
            <div class="admin-panel" style="margin-top:20px;">
                <h3>📜 Historial de Cambios de Puntos (Auditoría)</h3>
                <p style="color:#6b7a8f;font-size:13px;margin-bottom:14px;">Registro en tiempo real de todas las modificaciones de puntos realizadas por los administradores:</p>
                <div class="audit-list">`;

        const logs = Store.data.auditLog || [];
        if (logs.length === 0) {
            html += `<div class="empty-state"><p style="font-size:13px;color:#8a9aa8;">Sin modificaciones registradas aún</p></div>`;
        } else {
            logs.forEach(log => {
                const fechaFmt = log.fechaHora ? log.fechaHora.replace('T', ' ') : 'Fecha desconocida';
                html += `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 14px;
                        background: #f8fafc;
                        border-radius: 10px;
                        border: 1px solid #e2e8f0;
                        margin-bottom: 8px;
                        flex-wrap: wrap;
                        gap: 8px;
                        font-size: 13px;
                    ">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <span style="font-weight:700; color:#1e293b;">🎯 ${log.actividadNombre || 'Actividad'}</span>
                            <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:12px; font-weight:600; font-size:12px;">
                                ${log.puntosAnteriores} pts ➔ ${log.puntosNuevos} pts
                            </span>
                        </div>
                        <div style="color:#64748b; font-size:12px; display:flex; gap:12px; align-items:center;">
                            <span>👤 <strong>${log.usuario}</strong></span>
                            <span>🕒 ${fechaFmt}</span>
                        </div>
                    </div>`;
            });
        }

        html += `</div></div>`;
        container.innerHTML = html;
    },

    // ---------- Ranking ----------
    renderRanking(filtro = "general", desde = null, hasta = null) {
        const containerPodio = document.getElementById("rankingPodio");
        const containerLista = document.getElementById("rankingLista");
        const containerChart = document.getElementById("rankingChart");
        if (!containerPodio || !containerLista) return;

        const ranking = Store.getRanking(filtro, desde, hasta);
        const user = Auth.getCurrentUser();

        if (ranking.length === 0) {
            containerPodio.innerHTML = "";
            containerLista.innerHTML = `<div class="empty-state"><span class="emoji">🏆</span><p>No hay hijos registrados para mostrar ranking</p></div>`;
            if (containerChart) containerChart.innerHTML = "";
            return;
        }

        // ── Podio (Top 3) ────────────────────────────────────
        const avatarColors = ["#f59e0b", "#94a3b8", "#cd7c3f"];
        const podiumIcons  = ["🥇", "🥈", "🥉"];
        const podiumLabels = ["1°", "2°", "3°"];

        let podioHtml = `<div class="podium">`;

        // Orden visual: 2° | 1° | 3°
        const orden = [ranking[1], ranking[0], ranking[2]];
        const clases = ["place-2", "place-1", "place-3"];
        const posiciones = [1, 0, 2];

        orden.forEach((item, i) => {
            if (!item) return;
            const pos = posiciones[i];
            const iniciales = item.nombre.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
            podioHtml += `
                <div class="podium-place ${clases[i]}">
                    <div class="podium-medal">${podiumIcons[pos]}</div>
                    <div class="avatar" style="background:${avatarColors[pos]};color:#fff;font-weight:800;font-size:18px;border-radius:50%;width:52px;height:52px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">${iniciales}</div>
                    <div class="name">${item.nombre}</div>
                    <div class="points">⭐ ${item.puntos} pts</div>
                    <div class="bar">${podiumLabels[pos]}</div>
                </div>`;
        });
        podioHtml += `</div>`;
        containerPodio.innerHTML = podioHtml;

        // ── Lista Completa de Posiciones (Apilada Vertical) ──
        const maxPuntos = ranking[0] && ranking[0].puntos > 0 ? ranking[0].puntos : 1;

        let listHtml = `
            <div class="admin-panel">
                <h3>🏆 Lista Completa de Posiciones</h3>
                <div class="ranking-rows">`;

        ranking.forEach((item, index) => {
            const pct = Math.round((item.puntos / maxPuntos) * 100);
            const medallasHtml = item.insignias.map(ins =>
                `<span class="badge-medalla" title="${ins.nombre}: ${ins.desc}">${ins.icono} ${ins.nombre}</span>`
            ).join(" ");

            let posIcon, posStyle;
            if (index === 0)      { posIcon = "🥇"; posStyle = "background:#fef9c3;border:2px solid #fbbf24;"; }
            else if (index === 1) { posIcon = "🥈"; posStyle = "background:#f8fafc;border:2px solid #94a3b8;"; }
            else if (index === 2) { posIcon = "🥉"; posStyle = "background:#fdf6ee;border:2px solid #cd7c3f;"; }
            else                  { posIcon = `#${index + 1}`; posStyle = "background:#fff;"; }

            const barColor = index === 0 ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                           : index === 1 ? "linear-gradient(90deg,#64748b,#94a3b8)"
                           : index === 2 ? "linear-gradient(90deg,#cd7c3f,#e4a06a)"
                           : "linear-gradient(90deg,#4a6cf7,#7c5cfc)";

            const iniciales = item.nombre.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

            listHtml += `
                <div class="ranking-row-item" style="${posStyle};padding:14px;border-radius:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
                        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                            <span style="font-size:${index < 3 ? '24px' : '16px'};font-weight:800;min-width:28px;text-align:center;flex-shrink:0;">${posIcon}</span>
                            <div style="width:40px;height:40px;border-radius:50%;background:${avatarColors[Math.min(index,2)] || '#4a6cf7'};color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.12);">${iniciales}</div>
                            <div style="flex:1;min-width:0;overflow:hidden;">
                                <div style="font-weight:800;font-size:16px;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.nombre}</div>
                                <div style="font-size:12px;color:#64748b;font-weight:500;margin-top:2px;word-break:break-word;">📋 ${item.totalActividades} act. · 💰 ${item.puntosDisponibles} pts disp.</div>
                            </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0;">
                            <span style="font-size:15px;font-weight:800;color:#4a6cf7;white-space:nowrap;background:#eff6ff;padding:4px 10px;border-radius:12px;display:inline-block;">⭐ ${item.puntos} pts</span>
                        </div>
                    </div>
                    <div class="progress-bar-bg" style="margin-top:10px;">
                        <div class="progress-bar-fill" style="width:${pct}%;background:${barColor};"></div>
                    </div>
                    ${item.insignias.length > 0 ? `<div class="row-badges" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${medallasHtml}</div>` : ""}
                </div>`;
        });
        listHtml += `</div></div>`;
        containerLista.innerHTML = listHtml;
    },

    renderHistorialCanjes(filtroEstado = "todos", filtroHijo = "todos", targetId = null, textoBusqueda = "") {
        const containers = targetId ? [document.getElementById(targetId)] : [document.getElementById("historialCanjesContainer"), document.getElementById("historialCanjesTiendaContainer")];
        const validContainers = containers.filter(Boolean);
        if (validContainers.length === 0) return;

        const canjes = Store.data.canjes || [];
        const hijos  = Store.data.hijos  || [];
        const query = (textoBusqueda || "").toLowerCase().trim();

        // Ordenamiento estricto: desde el más reciente hasta el más antiguo por fecha/ID
        let lista = canjes.filter(c => {
            const porEstado = filtroEstado === "todos" || c.estado === filtroEstado;
            const porHijo   = filtroHijo === "todos" || String(c.hijoId) === String(filtroHijo);
            let porTexto = true;
            if (query) {
                const nombrePremio = (c.nombreRecompensa || "").toLowerCase();
                const usuario = (c.usuario || "").toLowerCase();
                porTexto = nombrePremio.includes(query) || usuario.includes(query);
            }
            return porEstado && porHijo && porTexto;
        }).sort((a, b) => {
            const timeA = a.fechaHora ? new Date(a.fechaHora).getTime() : (a.id || 0);
            const timeB = b.fechaHora ? new Date(b.fechaHora).getTime() : (b.id || 0);
            return timeB - timeA; // Más reciente primero
        });

        const estadoBadge = {
            pendiente:      `<span style="background:#fef9c3;color:#b45309;border:1px solid #fcd34d;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;display:inline-block;word-break:keep-all;">⏳ Pendiente</span>`,
            aprobado:       `<span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;display:inline-block;word-break:keep-all;">✅ Aprobado</span>`,
            rechazado:      `<span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;display:inline-block;word-break:keep-all;">❌ Rechazado</span>`,
            contrapropuesta:`<span style="background:#e0f2fe;color:#0369a1;border:1px solid #7dd3fc;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;display:inline-block;word-break:keep-all;">🔄 Contrapropuesta</span>`,
        };

        const hijoOptions = hijos.map(h =>
            `<option value="${h.id}" ${String(filtroHijo) === String(h.id) ? 'selected' : ''}>${h.nombre}</option>`
        ).join("");

        let html = `
            <div class="admin-panel" style="margin-top:24px;">
                <h3>📜 Tabla de Solicitudes de Recompensas (Ordenadas de Reciente a Antiguo)</h3>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end;">
                    <div class="form-group" style="margin:0;min-width:140px;flex:1;">
                        <label style="font-size:12px;">Estado</label>
                        <select id="histFiltroEstado" style="padding:8px 12px;border-radius:10px;border:1px solid #cbd5e1;font-size:13px;background:#fff;" onchange="View.renderHistorialCanjes(this.value, document.getElementById('histFiltroHijo').value, null, document.getElementById('histFiltroBusqueda').value)">
                            <option value="todos" ${filtroEstado==="todos"?"selected":""}>📋 Todos los Estados</option>
                            <option value="aprobado" ${filtroEstado==="aprobado"?"selected":""}>✅ Aprobados / Aceptados</option>
                            <option value="rechazado" ${filtroEstado==="rechazado"?"selected":""}>❌ Rechazados</option>
                            <option value="contrapropuesta" ${filtroEstado==="contrapropuesta"?"selected":""}>🔄 Contrapropuesta</option>
                            <option value="pendiente" ${filtroEstado==="pendiente"?"selected":""}>⏳ Pendientes</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin:0;min-width:140px;flex:1;">
                        <label style="font-size:12px;">Hijo Beneficiario</label>
                        <select id="histFiltroHijo" style="padding:8px 12px;border-radius:10px;border:1px solid #cbd5e1;font-size:13px;background:#fff;" onchange="View.renderHistorialCanjes(document.getElementById('histFiltroEstado').value, this.value, null, document.getElementById('histFiltroBusqueda').value)">
                            <option value="todos" ${filtroHijo==="todos"?"selected":""}>👨‍👧 Todos los Hijos</option>
                            ${hijoOptions}
                        </select>
                    </div>
                    <div class="form-group" style="margin:0;min-width:180px;flex:2;">
                        <label style="font-size:12px;">🔍 Buscar Premio o Usuario</label>
                        <input type="text" id="histFiltroBusqueda" value="${query}" placeholder="Ej: Helado, @admin..." style="padding:8px 12px;border-radius:10px;border:1px solid #cbd5e1;font-size:13px;background:#fff;" oninput="View.renderHistorialCanjes(document.getElementById('histFiltroEstado').value, document.getElementById('histFiltroHijo').value, null, this.value)">
                    </div>
                    <div style="margin-left:auto;font-size:13px;color:#64748b;padding-bottom:8px;">
                        Mostrando <strong>${lista.length}</strong> solicitud${lista.length !== 1 ? "es" : ""}
                    </div>
                </div>`;

        if (lista.length === 0) {
            html += `<div style="text-align:center;padding:36px;color:#94a3b8;font-size:14px;">
                📭 No hay solicitudes registradas con estos filtros.
            </div>`;
        } else {
            html += `
            <div class="tabla-scroll-container" style="width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;margin-top:10px;">
                <table class="tabla-reporte" style="min-width:700px;">
                    <thead>
                        <tr>
                            <th style="white-space:nowrap;">#</th>
                            <th style="white-space:nowrap;">🎁 Premio / Recompensa</th>
                            <th style="white-space:nowrap;">👤 Hijo Beneficiario</th>
                            <th style="white-space:nowrap;">⭐ Puntos</th>
                            <th style="white-space:nowrap;">👤 Solicitado por</th>
                            <th style="white-space:nowrap;">📅 Fecha y Hora</th>
                            <th style="white-space:nowrap;">📌 Estado</th>
                            <th style="white-space:nowrap;">💬 Detalle / Nota Admin</th>
                        </tr>
                    </thead>
                    <tbody>`;
            lista.forEach((c, idx) => {
                const esPremioEspecial = c.esEspecial || c.recompensaId === "especial";
                const pts = c.puntosContrapropuesta || c.puntosPropuestos || c.puntos;
                const rowBg = c.estado === "aprobado" ? "#f0fdf4"
                            : c.estado === "rechazado" ? "#fff1f2"
                            : c.estado === "contrapropuesta" ? "#f0f9ff"
                            : "#fffbeb";

                let cleanNombre = (c.nombreRecompensa || "").replace(/âœ¨|âœ|Ã|ðŸŽ®|ðŸ|â/g, "").trim();
                if (!cleanNombre) cleanNombre = "Premio Especial";

                html += `
                    <tr style="background:${rowBg};">
                        <td style="white-space:nowrap;"><strong>${idx + 1}</strong></td>
                        <td>
                            <span style="font-weight:700;color:#1e293b;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">
                                ${esPremioEspecial ? '<span style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;">✨ Especial</span>' : ''}
                                ${cleanNombre}
                            </span>
                        </td>
                        <td style="white-space:nowrap;"><span class="badge-hijo" style="white-space:nowrap;display:inline-block;">👤 ${Store.getNombreHijo(c.hijoId)}</span></td>
                        <td style="white-space:nowrap;"><span class="badge-puntos" style="white-space:nowrap;display:inline-block;">⭐ ${pts} pts</span></td>
                        <td style="white-space:nowrap;"><span class="usuario-cell" style="white-space:nowrap;">@${c.usuario || 'usuario'}</span></td>
                        <td style="white-space:nowrap;"><span class="fecha-hora-cell" style="white-space:nowrap;">${(c.fechaHora || '').replace('T', ' ').slice(0, 16)}</span></td>
                        <td style="white-space:nowrap;">${estadoBadge[c.estado] || estadoBadge['pendiente']}</td>
                        <td style="font-size:12px;color:#475569;">
                            ${c.notaContrapropuesta ? `💬 <em>"${c.notaContrapropuesta}"</em>` : (c.puntosPropuestos ? `Sugeridos: ${c.puntosPropuestos} pts` : '-')}
                        </td>
                    </tr>`;
            });
            html += `</tbody></table></div>`;
        }
        html += `</div>`;

        validContainers.forEach(el => { el.innerHTML = html; });
    },

    // ---------- Recompensas ----------
    renderRecompensas() {
        const user = Auth.getCurrentUser();
        const statusBox = document.getElementById("recompensasHijoStatus");
        const listaBox = document.getElementById("listaRecompensas");
        const pendientesBox = document.getElementById("listaCanjesPendientes");
        if (!listaBox) return;

        const hijos = Store.data.hijos;
        const recompensas = Store.data.recompensas || [];
        const canjes = Store.data.canjes || [];

        // Status bar con saldo de hijos
        if (hijos.length > 0) {
            let statusHtml = `<div class="saldo-card"><h4>💰 Saldo de Puntos Disponibles para Canjear:</h4><div class="saldo-grid">`;
            hijos.forEach(h => {
                const disp = Store.getPuntosDisponiblesHijo(h.id);
                const totalG = Store.getPuntosGanadosHijo(h.id);
                statusHtml += `
                    <div class="saldo-item">
                        <span class="hijo-n">👤 ${h.nombre}:</span>
                        <span class="hijo-p">⭐ <strong>${disp} pts</strong> <small>(Ganados: ${totalG})</small></span>
                    </div>`;
            });
            statusHtml += `</div></div>`;
            statusBox.innerHTML = statusHtml;
        } else {
            statusBox.innerHTML = "";
        }

        // RESTRICCIÓN DE SEGURIDAD: Mostrar contrapropuestas pendientes ÚNICAMENTE al usuario que solicitó la recompensa
        const contrapropuestas = canjes.filter(c => c.estado === "contrapropuesta" && user && c.usuario === user.username);
        if (contrapropuestas.length > 0 && statusBox) {
            let cpHtml = `<div style="margin-top:14px;"><h4 style="color:#d97706;margin-bottom:8px;">🔄 Contrapropuestas de Premios Pendientes de Tu Respuesta:</h4>`;
            contrapropuestas.forEach(c => {
                const disp = Store.getPuntosDisponiblesHijo(c.hijoId);
                const ptsReq = c.puntosContrapropuesta || c.puntos;
                const alcanzo = disp >= ptsReq;
                cpHtml += `
                    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px;margin-bottom:10px;">
                        <div style="font-weight:700;color:#92400e;font-size:14px;">🔄 ${c.nombreRecompensa}</div>
                        <div style="color:#78350f;font-size:13px;margin-top:2px;">
                            Para: 👤 <strong>${Store.getNombreHijo(c.hijoId)}</strong> (Puntos dispon.: ⭐ ${disp} pts)
                        </div>
                        <div style="font-size:13px;color:#92400e;margin-top:4px;">
                            Puntos propuestos por ti: <s>${c.puntosPropuestos || c.puntos} pts</s> ➔ <strong>Propuesta Admin: ⭐ ${ptsReq} pts</strong>
                        </div>
                        ${c.notaContrapropuesta ? `<div style="font-size:12px;color:#b45309;margin-top:4px;font-style:italic;">💬 Nota Admin: "${c.notaContrapropuesta}"</div>` : ''}
                        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                            <button class="btn-primary" style="padding:6px 14px;font-size:12px;background:#16a34a;" ${!alcanzo ? 'disabled' : ''} onclick="AppController.responderContrapropuestaUsuario(${c.id}, true)">
                                ✅ Aceptar Contrapropuesta (${ptsReq} pts) ${!alcanzo ? ' - Faltan Pts' : ''}
                            </button>
                            <button class="btn-secondary" style="padding:6px 14px;font-size:12px;background:#ef4444;color:#fff;border:none;" onclick="AppController.responderContrapropuestaUsuario(${c.id}, false)">❌ Rechazar Contrapropuesta</button>
                        </div>
                    </div>`;
            });
            cpHtml += `</div>`;
            statusBox.innerHTML += cpHtml;
        }

        // Si es Admin, renderizar canjes pendientes con opción de Contrapropuesta
        const esAdminUser = user && (user.role === "admin" || user.username === "admin");
        const adminCanjesBox = document.getElementById("adminCanjesPendientes");

        if (adminCanjesBox) {
            adminCanjesBox.style.display = esAdminUser ? "block" : "none";
        }

        if (esAdminUser && pendientesBox) {
            const pendientes = canjes.filter(c => c.estado === "pendiente");
            if (pendientes.length === 0) {
                pendientesBox.innerHTML = `<p style="color:#6b7a8f;font-size:13px;margin:0;">No hay solicitudes de canje o premios especiales pendientes por revisar.</p>`;
            } else {
                let pth = "";
                pendientes.forEach(c => {
                    const esPremioEspecial = c.esEspecial || c.recompensaId === "especial";
                    const badgeEspecial = esPremioEspecial ? `<span style="background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;margin-left:6px;">✨ Premio Especial Propuesto</span>` : "";
                    const ptsTxt = c.puntosPropuestos ? `⭐ ${c.puntosPropuestos} pts (Sugeridos por usuario)` : `⭐ ${c.puntos} pts`;

                    pth += `
                        <div class="user-item" style="padding:12px;margin-bottom:10px;${esPremioEspecial ? 'background:#f0fdf4;border:1px solid #bbf7d0;' : ''}">
                            <div class="user-data" style="flex:1;">
                                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                    <span class="name" style="font-size:14px;color:#1e293b;">👤 ${Store.getNombreHijo(c.hijoId)}</span>
                                    ${badgeEspecial}
                                </div>
                                <div style="font-size:13px;color:#334155;margin-top:3px;">
                                    Solicita: <strong style="color:#0f172a;">${c.nombreRecompensa}</strong> (${ptsTxt})
                                </div>
                                <div style="font-size:12px;color:#64748b;margin-top:2px;">
                                    Enviado por: <strong>@${c.usuario || 'usuario'}</strong> · <small>${c.fechaHora || ''}</small>
                                </div>
                            </div>
                            <div class="actions" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                                <button class="btn-approve" style="padding:6px 12px;font-size:12px;" onclick="AppController.responderCanje(${c.id}, 'aprobado')">✅ Aprobar</button>
                                <button class="btn-block" style="background:#f59e0b;color:#fff;padding:6px 12px;font-size:12px;" onclick="AppController.contraproponerCanjeAdmin(${c.id})">🔄 Contrapropuesta</button>
                                <button class="btn-delete-user" style="padding:6px 12px;font-size:12px;" onclick="AppController.responderCanje(${c.id}, 'rechazado')">❌ Rechazar</button>
                            </div>
                        </div>`;
                });
                pendientesBox.innerHTML = pth;
            }
        }

        // Renderizar siempre la tabla del historial de solicitudes de canjes
        this.renderHistorialCanjes("todos", "todos", "historialCanjesTiendaContainer");

        // Renderizar catálogo de recompensas
        if (recompensas.length === 0) {
            listaBox.innerHTML = `<div class="empty-state"><span class="emoji">🎁</span><p>No hay recompensas disponibles aún</p></div>`;
            return;
        }

        let html = `<div class="recompensas-grid-container">`;
        recompensas.forEach(rec => {
            const esActiva = rec.activa !== false;
            let selectHijoOptions = `<option value="">Seleccionar hijo para canjear...</option>`;
            hijos.forEach(h => {
                const disp = Store.getPuntosDisponiblesHijo(h.id);
                const alcanzo = disp >= rec.puntos;
                selectHijoOptions += `<option value="${h.id}" ${(!alcanzo || !esActiva) ? "disabled" : ""}>👤 ${h.nombre} (${disp} pts) ${!alcanzo ? "- Faltan pts" : ""}</option>`;
            });

            html += `
                <div class="recompensa-card" style="${!esActiva ? 'opacity:0.8;background:#f8fafc;border:2px dashed #cbd5e1;' : ''}">
                    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:8px;">
                        <span class="rec-icon" style="margin:0;">${rec.icono || "🎁"}</span>
                        <span style="font-size:11px;padding:2px 8px;border-radius:12px;font-weight:700;background:${esActiva ? '#dcfce7' : '#fee2e2'};color:${esActiva ? '#16a34a' : '#dc2626'};">
                            ${esActiva ? '🟢 Habilitado' : '🔴 Deshabilitado'}
                        </span>
                    </div>

                    <div id="viewRec_${rec.id}">
                        <div class="rec-title">${rec.nombre}</div>
                        <div class="rec-cost">⭐ ${rec.puntos} Puntos</div>
                    </div>

                    ${esAdminUser ? `
                    <div id="editRec_${rec.id}" style="display:none;width:100%;margin-bottom:10px;text-align:left;">
                        <div style="margin-bottom:6px;">
                            <label style="font-size:11px;color:#64748b;font-weight:600;">Nombre del Premio:</label>
                            <input type="text" id="inputEditNombreRec_${rec.id}" value="${rec.nombre}" style="width:100%;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;">
                        </div>
                        <div style="margin-bottom:8px;">
                            <label style="font-size:11px;color:#64748b;font-weight:600;">Puntos Costo:</label>
                            <input type="number" id="inputEditPuntosRec_${rec.id}" value="${rec.puntos}" min="1" style="width:100%;padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;">
                        </div>
                        <div style="display:flex;gap:6px;">
                            <button type="button" class="btn-primary" style="padding:6px 12px;font-size:12px;flex:1;" onclick="(function(){
                                var n = document.getElementById('inputEditNombreRec_${rec.id}').value;
                                var p = document.getElementById('inputEditPuntosRec_${rec.id}').value;
                                AppController.guardarEdicionRecompensa(${rec.id}, n, p);
                            })()">💾 Guardar</button>
                            <button type="button" class="btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="document.getElementById('editRec_${rec.id}').style.display='none'; document.getElementById('viewRec_${rec.id}').style.display='block';">Cancelar</button>
                        </div>
                    </div>
                    ` : ''}

                    <div class="rec-action" style="width:100%;">
                        ${esActiva ? `
                            <select id="selectCanjeHijo_${rec.id}" class="select-canje-hijo">
                                ${selectHijoOptions}
                            </select>
                            <button class="btn-primary" style="margin-top:8px;padding:8px;" onclick="AppController.solicitarCanje(${rec.id}, document.getElementById('selectCanjeHijo_${rec.id}').value)">🎁 Solicitar Canje</button>
                        ` : `
                            <div style="font-size:12px;color:#94a3b8;font-style:italic;margin-top:8px;text-align:center;">⚠️ Premio deshabilitado temporalmente</div>
                        `}

                        ${esAdminUser ? `
                            <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">
                                <button type="button" style="flex:1;background:#6366f1;color:#fff;border:none;padding:6px 8px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;" onclick="document.getElementById('viewRec_${rec.id}').style.display='none'; document.getElementById('editRec_${rec.id}').style.display='block';">✏️ Editar</button>
                                <button type="button" style="flex:1;background:${esActiva ? '#f59e0b' : '#10b981'};color:#fff;border:none;padding:6px 8px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;" onclick="AppController.toggleEstadoRecompensa(${rec.id})">${esActiva ? '🚫 Deshabilitar' : '✅ Habilitar'}</button>
                                <button type="button" class="btn-delete-reg" style="flex:1;padding:6px 8px;font-size:11px;" onclick="AppController.eliminarRecompensa(${rec.id})">🗑️ Eliminar</button>
                            </div>
                        ` : ''}
                    </div>
                </div>`;
        });
        html += `</div>`;
        listaBox.innerHTML = html;
        this.renderHistorialCanjes("todos", "todos", "historialCanjesTiendaContainer");
    },

    // ---------- Reportes ----------
    generarTabla(lista, titulo, mostrarUsuario = false) {
        if (!lista || lista.length === 0) return `<div class="empty-state"><span class="emoji">📭</span><p>No hay actividades registradas</p></div>`;
        
        // Ordenar siempre desde el más nuevo hasta el más antiguo por Fecha y Hora
        const listaOrdenada = Store.ordenarPorFechaReciente(lista);

        const user = Auth.getCurrentUser();
        const isAdmin = user && user.role === "admin";

        let html = `
            <div class="reporte-titulo">
                <span>${titulo}</span>
                <span class="fecha-info">📊 ${listaOrdenada.length} registros</span>
            </div>
            <div class="tabla-scroll-container" style="width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;">
                <table class="tabla-reporte">
                    <thead><tr>
                        <th>#</th><th>👤 Hijo</th><th>🎯 Actividad</th><th>⭐ Puntos</th>
                        <th>📝 Descripción</th><th>📅 Fecha / Hora</th>
                        ${mostrarUsuario ? "<th>👤 Usuario</th>" : ""}
                        <th class="col-acciones">Acciones</th>
                    </tr></thead>
                    <tbody>`;

        listaOrdenada.forEach((r, i) => {
            const fh = formatearFechaHoraMostrar(r.fechaHora || r.fecha || "");
            const pts = Store.getPuntosActividad(r.actividadId);
            const isOwner = user && r.usuario === user.username;
            const canModify = isAdmin || isOwner;
            const esAnulado = r.estado === "anulado";
            const esDuplicado = r.esPosibleDuplicado;

            let badgesEstado = "";
            if (esAnulado) {
                badgesEstado = `<br><span style="font-size:10px;padding:2px 6px;border-radius:8px;background:#fee2e2;color:#dc2626;font-weight:700;">🚫 Anulado (${r.motivoAnulacion || "Irregularidad"})</span>`;
            } else if (esDuplicado) {
                badgesEstado = `<br><span style="font-size:10px;padding:2px 6px;border-radius:8px;background:#fef3c7;color:#d97706;font-weight:700;">⚠️ Posible duplicado de hoy</span>`;
            }

            html += `
                <tr style="${esAnulado ? 'opacity:0.65;background:#fff5f5;text-decoration:line-through;' : ''}">
                    <td>${i + 1}</td>
                    <td><span class="badge-hijo">${Store.getNombreHijo(r.hijoId)}</span></td>
                    <td>
                        <span class="badge-actividad">${Store.getNombreActividad(r.actividadId)}</span>
                        ${badgesEstado}
                    </td>
                    <td><span class="badge-puntos">${esAnulado ? '0 pts' : '+' + pts + ' pts'}</span></td>
                    <td class="descripcion-cell">${r.descripcion || "Sin descripción"}</td>
                    <td class="fecha-hora-cell">
                        <span class="fecha">${fh.fecha}</span>
                        <span class="hora">🕐 ${fh.hora || "--:--"}</span>
                    </td>
                    ${mostrarUsuario ? `<td class="usuario-cell">${r.usuario || "admin"}</td>` : ""}
                    <td class="col-acciones" style="white-space:nowrap;">
                        ${isAdmin && !esAnulado ? `
                            <button style="background:#ef4444;color:#fff;border:none;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer;margin-right:2px;" onclick="AppController.anularRegistroAdmin(${r.id})" title="Anular actividad y restar puntos">🚫 Anular</button>
                        ` : ''}
                        ${canModify && !esAnulado ? `
                            <button class="btn-edit" onclick="AppController.abrirModalEditar(${r.id})" title="Editar">✏️</button>
                            <button class="btn-delete-reg" onclick="AppController.eliminarRegistro(${r.id})" title="Eliminar">🗑️</button>
                        ` : ''}
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
        const lista = Store.registrosTodos();
        document.getElementById("completoCount").textContent = lista.length;
        document.getElementById("completoLista").innerHTML = this.generarTabla(lista, "📊 Reporte Completo - Todos los registros", true);
    },

    // ---------- Módulo de Denuncias / Observaciones ----------
    renderModuloDenuncias() {
        this.actualizarSelectRegistrosDenuncia();

        const user = Auth.getCurrentUser();
        const usernameLower = user ? (user.username || "").toLowerCase() : "";
        const esAdminUser = user && (user.role === "admin" || usernameLower === "admin" || Store.isAdmin());
        const adminBox = document.getElementById("adminBuzonDenuncias");
        const listEl = document.getElementById("listaDenunciasAdmin");

        if (adminBox) adminBox.style.display = "block";
        if (listEl) {
            const denuncias = Store.data.denuncias || [];
            const listaMostrar = esAdminUser 
                ? [...denuncias].sort((a, b) => b.id - a.id) 
                : denuncias.filter(d => (d.usuarioReporta || "").toLowerCase() === usernameLower).sort((a, b) => b.id - a.id);

            if (listaMostrar.length === 0) {
                listEl.innerHTML = `<p style="color:#6b7a8f;font-size:13px;margin:0;padding:14px;background:#fff;border-radius:10px;border:1px dashed #cbd5e1;text-align:center;">
                    ${esAdminUser ? "🎉 No hay observaciones o denuncias en el sistema." : "📭 No has registrado observaciones aún."}
                </p>`;
            } else {
                let html = "";
                listaMostrar.forEach(d => {
                    const reg = (Store.data.registros || []).find(r => r.id == d.registroId);
                    const regText = reg ? `👤 ${Store.getNombreHijo(reg.hijoId)} - 🎯 ${Store.getNombreActividad(reg.actividadId)} (${reg.fechaHora || reg.fecha || ''})` : `Registro #${d.registroId}`;
                    const yaAnulado = reg && reg.estado === "anulado";
                    const estadoBadge = d.atendida ? `<span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;">✅ Atendida</span>`
                                                    : `<span style="background:#fef9c3;color:#b45309;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;">⏳ Pendiente de revisión</span>`;

                    html += `
                        <div class="user-item" style="background:#fff;border:1px solid #fef08a;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                            <div class="user-data" style="flex:1;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                                    <div style="font-weight:700;color:#92400e;font-size:14px;">🚨 Observación de @${d.usuarioReporta}</div>
                                    <div>${estadoBadge}</div>
                                </div>
                                <div style="font-size:12px;color:#6b7a8f;">Fecha reportada: ${(d.fechaHora || '').replace('T', ' ').slice(0, 16)}</div>
                                <div style="font-size:13px;color:#78350f;margin-top:4px;font-style:italic;background:#fffbeb;padding:8px;border-radius:8px;border:1px solid #fde68a;">💬 "${d.detalle}"</div>
                                <div style="font-size:12px;color:#b45309;margin-top:6px;font-weight:600;">
                                    📌 Registro Asociado: ${regText} ${yaAnulado ? ' <span style="color:#dc2626;font-weight:700;">(Ya anulado)</span>' : ''}
                                </div>
                            </div>
                            ${esAdminUser ? `
                            <div class="actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
                                ${!yaAnulado ? `
                                    <button type="button" class="btn-delete-user" style="padding:6px 12px;font-size:12px;" onclick="AppController.atenderDenunciaAdmin(${d.id}, true)">🚫 Anular Actividad Observada</button>
                                ` : ''}
                                ${!d.atendida ? `
                                    <button type="button" class="btn-primary" style="padding:6px 12px;font-size:12px;background:#16a34a;" onclick="AppController.atenderDenunciaAdmin(${d.id}, false)">✅ Marcar Atendida</button>
                                ` : ''}
                            </div>
                            ` : ''}
                        </div>`;
                });
                listEl.innerHTML = html;
            }
        }
    },

    // ---------- Estadísticas y Métricas ----------
    toggleFechasPersonalizadasEstadisticas() {
        const val = document.getElementById("selectFiltroFechaEstadisticas").value;
        const box = document.getElementById("boxFechasPersonalizadasEst");
        if (box) box.style.display = val === "rango" ? "flex" : "none";
    },

    renderEstadisticas() {
        const filtroFecha = document.getElementById("selectFiltroFechaEstadisticas") ? document.getElementById("selectFiltroFechaEstadisticas").value : "semana";
        const fechaInicio = document.getElementById("fechaInicioEstadisticas") ? document.getElementById("fechaInicioEstadisticas").value : null;
        const fechaFin = document.getElementById("fechaFinEstadisticas") ? document.getElementById("fechaFinEstadisticas").value : null;
        const hijoId = document.getElementById("selectHijoEstadisticas") ? document.getElementById("selectHijoEstadisticas").value : null;

        const stats = Store.getEstadisticasActividades({ filtroFecha, fechaInicio, fechaFin, hijoId });

        const boxResumen = document.getElementById("estadisticasResumen");
        const boxTop = document.getElementById("topActividadesContainer");
        const boxDesglose = document.getElementById("desgloseHijoContainer");

        if (boxResumen) {
            boxResumen.innerHTML = `
                <div class="saldo-card" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;">
                    <h4 style="color:#1e40af;margin-bottom:12px;">📊 Resumen del Periodo:</h4>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
                        <div style="background:#fff;padding:12px;border-radius:12px;text-align:center;">
                            <div style="font-size:24px;font-weight:800;color:#2563eb;">${stats.totalRegistros}</div>
                            <div style="font-size:12px;color:#64748b;font-weight:600;">Total Actividades</div>
                        </div>
                        <div style="background:#fff;padding:12px;border-radius:12px;text-align:center;">
                            <div style="font-size:24px;font-weight:800;color:#16a34a;">⭐ ${stats.totalPuntos}</div>
                            <div style="font-size:12px;color:#64748b;font-weight:600;">Puntos Generados</div>
                        </div>
                        <div style="background:#fff;padding:12px;border-radius:12px;text-align:center;">
                            <div style="font-size:24px;font-weight:800;color:#7c3aed;">${stats.rankingActividades.length}</div>
                            <div style="font-size:12px;color:#64748b;font-weight:600;">Tipos Únicos</div>
                        </div>
                    </div>
                </div>`;
        }

        if (boxTop) {
            if (stats.rankingActividades.length === 0) {
                boxTop.innerHTML = `<div class="empty-state"><span class="emoji">📊</span><p>No hay datos registrados en este periodo</p></div>`;
            } else {
                let html = `
                    <div class="admin-panel">
                        <h3>🏆 Top Actividades Más Realizadas</h3>
                        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">`;
                stats.rankingActividades.forEach((item, index) => {
                    let medal = `#${index + 1}`;
                    if (index === 0) medal = "🥇";
                    else if (index === 1) medal = "🥈";
                    else if (index === 2) medal = "🥉";

                    html += `
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px 14px;border-radius:10px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                                <span style="font-weight:700;font-size:14px;">${medal} 🎯 ${item.nombre}</span>
                                <span style="font-weight:700;color:#2563eb;font-size:13px;">${item.cantidad} veces (${item.porcentaje}%) · ⭐ ${item.puntosTotales} pts</span>
                            </div>
                            <div style="background:#e2e8f0;height:8px;border-radius:4px;overflow:hidden;">
                                <div style="background:linear-gradient(90deg,#3b82f6,#6366f1);height:100%;width:${item.porcentaje}%;"></div>
                            </div>
                        </div>`;
                });
                html += `</div></div>`;
                boxTop.innerHTML = html;
            }
        }

        if (boxDesglose) {
            if (stats.desgloseHijos.length === 0) {
                boxDesglose.innerHTML = "";
            } else {
                let html = `
                    <div class="admin-panel">
                        <h3>👥 Desglose de Actividades por Hijo</h3>
                        <div style="overflow-x:auto;margin-top:10px;">
                            <table class="tabla-reporte">
                                <thead><tr><th>👤 Hijo</th><th>🎯 Actividad</th><th>🔢 Frecuencia</th><th>⭐ Puntos Totales</th></tr></thead>
                                <tbody>`;
                stats.desgloseHijos.forEach(item => {
                    html += `
                        <tr>
                            <td><span class="badge-hijo">${item.hijoNombre}</span></td>
                            <td><span class="badge-actividad">${item.actividadNombre}</span></td>
                            <td><strong>${item.cantidad} veces</strong></td>
                            <td><span class="badge-puntos">⭐ ${item.puntosTotales} pts</span></td>
                        </tr>`;
                });
                html += `</tbody></table></div></div>`;
                boxDesglose.innerHTML = html;
            }
        }
    },

    renderAll() {
        this.actualizarContadores(Store.data);
        this.populateSelects(Store.data);
        this.renderHijos(Store.data.hijos);
        this.renderActividadesGestion(Store.data.actividades);
        this.renderReporteDiario();
        this.renderReporteCompleto();
        this.renderPuntosConfig();
        this.renderRanking(AppController.rankingFiltroActual);
        this.renderRecompensas();
        this.renderModuloDenuncias();
        this.renderEstadisticas();
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

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

        ["selectHijo", "selectHijoReporte", "editSelectHijo"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = hijosHtml;
        });

        const elNew = document.getElementById("selectActividad");
        if (elNew) elNew.innerHTML = actHtmlNew;

        const elEdit = document.getElementById("editSelectActividad");
        if (elEdit) elEdit.innerHTML = actHtmlEdit;

        const fEl = document.getElementById("fechaHoraActividad");
        if (fEl && !fEl.value) fEl.value = getFechaHoraLocal();
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

        if (ranking.length === 0) {
            containerPodio.innerHTML = "";
            containerLista.innerHTML = `<div class="empty-state"><span class="emoji">🏆</span><p>No hay hijos registrados para mostrar ranking</p></div>`;
            if (containerChart) containerChart.innerHTML = "";
            return;
        }

        // Render Podio (Top 3)
        let podioHtml = "";
        if (ranking.length > 0) {
            const primero = ranking[0];
            const segundo = ranking[1];
            const tercero = ranking[2];

            podioHtml = `<div class="podium">`;

            // 2do Lugar
            if (segundo) {
                podioHtml += `
                    <div class="podium-place place-2">
                        <div class="avatar">🥈</div>
                        <div class="name">${segundo.nombre}</div>
                        <div class="points">${segundo.puntos} pts</div>
                        <div class="bar">2°</div>
                    </div>`;
            }

            // 1er Lugar
            podioHtml += `
                <div class="podium-place place-1">
                    <div class="avatar">👑 🥇</div>
                    <div class="name">${primero.nombre}</div>
                    <div class="points">${primero.puntos} pts</div>
                    <div class="bar">1°</div>
                </div>`;

            // 3er Lugar
            if (tercero) {
                podioHtml += `
                    <div class="podium-place place-3">
                        <div class="avatar">🥉</div>
                        <div class="name">${tercero.nombre}</div>
                        <div class="points">${tercero.puntos} pts</div>
                        <div class="bar">3°</div>
                    </div>`;
            }

            podioHtml += `</div>`;
        }
        containerPodio.innerHTML = podioHtml;

        // Render Lista Completa de Puntuaciones
        const maxPuntos = ranking[0] && ranking[0].puntos > 0 ? ranking[0].puntos : 1;
        let listHtml = `
            <div class="admin-panel">
                <h3>📊 Tabla Completa de Posiciones</h3>
                <div class="ranking-rows">`;

        ranking.forEach((item, index) => {
            const pct = Math.round((item.puntos / maxPuntos) * 100);
            const medallasHtml = item.insignias.map(ins => `<span class="badge-medalla" title="${ins.nombre}: ${ins.desc}">${ins.icono} ${ins.nombre}</span>`).join(" ");

            let posEmoji = `#${index + 1}`;
            if (index === 0) posEmoji = "🥇";
            else if (index === 1) posEmoji = "🥈";
            else if (index === 2) posEmoji = "🥉";

            listHtml += `
                <div class="ranking-row-item">
                    <div class="row-header">
                        <div class="row-left">
                            <span class="row-pos">${posEmoji}</span>
                            <span class="row-name">👤 ${item.nombre}</span>
                            <span class="row-acts">(${item.totalActividades} actividades)</span>
                        </div>
                        <div class="row-right">
                            <span class="row-pts">⭐ ${item.puntos} pts</span>
                        </div>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width:${pct}%;"></div>
                    </div>
                    ${item.insignias.length > 0 ? `<div class="row-badges">${medallasHtml}</div>` : ""}
                </div>`;
        });
        listHtml += `</div></div>`;
        containerLista.innerHTML = listHtml;
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

        // Si es Admin, renderizar canjes pendientes
        const esAdminUser = user && (user.role === "admin" || user.username === "admin");
        if (esAdminUser && pendientesBox) {
            const pendientes = canjes.filter(c => c.estado === "pendiente");
            if (pendientes.length === 0) {
                pendientesBox.innerHTML = `<p style="color:#6b7a8f;font-size:13px;">No hay solicitudes de canje pendientes.</p>`;
            } else {
                let pth = "";
                pendientes.forEach(c => {
                    pth += `
                        <div class="user-item">
                            <div class="user-data">
                                <span class="name">👤 ${Store.getNombreHijo(c.hijoId)}</span>
                                <span>solicita <strong>${c.nombreRecompensa}</strong> (⭐ ${c.puntos} pts)</span>
                                <small style="color:#6b7a8f;">Por ${c.usuario}</small>
                            </div>
                            <div class="actions">
                                <button class="btn-approve" onclick="AppController.responderCanje(${c.id}, 'aprobado')">✅ Aprobar</button>
                                <button class="btn-delete-user" onclick="AppController.responderCanje(${c.id}, 'rechazado')">❌ Rechazar</button>
                            </div>
                        </div>`;
                });
                pendientesBox.innerHTML = pth;
            }
        }

        // Renderizar catálogo de recompensas
        if (recompensas.length === 0) {
            listaBox.innerHTML = `<div class="empty-state"><span class="emoji">🎁</span><p>No hay recompensas disponibles aún</p></div>`;
            return;
        }

        let html = `<div class="recompensas-grid-container">`;
        recompensas.forEach(rec => {
            let selectHijoOptions = `<option value="">Seleccionar hijo para canjear...</option>`;
            hijos.forEach(h => {
                const disp = Store.getPuntosDisponiblesHijo(h.id);
                const alcanzo = disp >= rec.puntos;
                selectHijoOptions += `<option value="${h.id}" ${!alcanzo ? "disabled" : ""}>👤 ${h.nombre} (${disp} pts) ${!alcanzo ? "- Faltan pts" : ""}</option>`;
            });

            html += `
                <div class="recompensa-card">
                    <div class="rec-icon">${rec.icono || "🎁"}</div>
                    <div class="rec-title">${rec.nombre}</div>
                    <div class="rec-cost">⭐ ${rec.puntos} Puntos</div>
                    <div class="rec-action">
                        <select id="selectCanjeHijo_${rec.id}" class="select-canje-hijo">
                            ${selectHijoOptions}
                        </select>
                        <button class="btn-primary" style="margin-top:8px;padding:8px;" onclick="AppController.solicitarCanje(${rec.id}, document.getElementById('selectCanjeHijo_${rec.id}').value)">🎁 Solicitar Canje</button>
                        ${esAdminUser ? `<button class="btn-delete-reg" style="margin-top:6px;width:100%;" onclick="AppController.eliminarRecompensa(${rec.id})">🗑️ Eliminar Premio</button>` : ""}
                    </div>
                </div>`;
        });
        html += `</div>`;
        listaBox.innerHTML = html;
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
            <div style="overflow-x:auto;">
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

            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td><span class="badge-hijo">${Store.getNombreHijo(r.hijoId)}</span></td>
                    <td><span class="badge-actividad">${Store.getNombreActividad(r.actividadId)}</span></td>
                    <td><span class="badge-puntos">+${pts} pts</span></td>
                    <td class="descripcion-cell">${r.descripcion || "Sin descripción"}</td>
                    <td class="fecha-hora-cell">
                        <span class="fecha">${fh.fecha}</span>
                        <span class="hora">🕐 ${fh.hora || "--:--"}</span>
                    </td>
                    ${mostrarUsuario ? `<td class="usuario-cell">${r.usuario || "admin"}</td>` : ""}
                    <td class="col-acciones">
                        ${canModify ? `
                            <button class="btn-edit" onclick="AppController.abrirModalEditar(${r.id})" title="Editar">✏️</button>
                            <button class="btn-delete-reg" onclick="AppController.eliminarRegistro(${r.id})" title="Eliminar">🗑️</button>
                        ` : `
                            <span style="font-size:11px;color:#94a3b8;font-style:italic;" title="Solo el creador o admin pueden modificar">🔒 Protegido</span>
                        `}
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

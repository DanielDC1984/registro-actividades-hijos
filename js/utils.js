// ============================================================
// 🕒 UTILIDADES DE FECHA / HORA
// ============================================================
function getFechaHoraLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    const horas = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");
    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
}

function getFechaLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function formatearFechaMostrar(fecha) {
    if (!fecha) return "";
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function formatearFechaHoraMostrar(fechaHora) {
    if (!fechaHora) return { fecha: "", hora: "" };
    const [fecha, hora] = fechaHora.split("T");
    if (hora) return { fecha: formatearFechaMostrar(fecha), hora: hora.substring(0, 5) };
    return { fecha: formatearFechaMostrar(fecha), hora: "" };
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatearFechaTexto(fecha) {
    if (!fecha) return "";
    const [anio, mes, dia] = fecha.split("-");
    return `${dia} de ${MESES[parseInt(mes, 10) - 1]} de ${anio}`;
}

// ============================================================
// 📅 RANGOS DE FECHA (usado por estadísticas y ranking)
// ============================================================
// Calcula { fDesde, fHasta } según el filtro: "hoy" | "semana" | "mes" | "rango"
// Para "rango" simplemente reenvía fechaInicio/fechaFin recibidas.
function getRangoFecha(filtro, fechaInicio = null, fechaFin = null) {
    const hoy = getFechaLocal();

    if (filtro === "hoy" || filtro === "diario") {
        return { fDesde: hoy, fHasta: hoy };
    }
    if (filtro === "semana" || filtro === "semanal") {
        const now = new Date();
        const day = now.getDay() || 7; // Domingo -> 7
        if (day !== 1) now.setHours(-24 * (day - 1));
        const fDesde = now.toISOString().split("T")[0];
        const endWeek = new Date(now);
        endWeek.setDate(endWeek.getDate() + 6);
        const fHasta = endWeek.toISOString().split("T")[0];
        return { fDesde, fHasta };
    }
    if (filtro === "mes" || filtro === "mensual") {
        const now = new Date();
        const fDesde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const fHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        return { fDesde, fHasta };
    }
    if (filtro === "rango") {
        return { fDesde: fechaInicio, fHasta: fechaFin };
    }
    return { fDesde: null, fHasta: null };
}

// ============================================================
// 📅 RANGOS DE FECHA (usado por estadísticas y ranking)
// ============================================================
// Calcula { fDesde, fHasta } según el filtro: "hoy" | "semana" | "mes" | "rango"
// Para "rango" simplemente reenvía fechaInicio/fechaFin recibidas.
function getRangoFecha(filtro, fechaInicio = null, fechaFin = null) {
    if (filtro === "hoy" || filtro === "diario") {
        const hoy = getFechaLocal();
        return { fDesde: hoy, fHasta: hoy };
    }
    if (filtro === "semana" || filtro === "semanal") {
        const now = new Date();
        const day = now.getDay() || 7; // Domingo -> 7
        if (day !== 1) now.setHours(-24 * (day - 1));
        const fDesde = now.toISOString().split("T")[0];
        const endWeek = new Date(now);
        endWeek.setDate(endWeek.getDate() + 6);
        const fHasta = endWeek.toISOString().split("T")[0];
        return { fDesde, fHasta };
    }
    if (filtro === "mes" || filtro === "mensual") {
        const now = new Date();
        const fDesde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const fHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        return { fDesde, fHasta };
    }
    if (filtro === "rango") {
        return { fDesde: fechaInicio, fHasta: fechaFin };
    }
    return { fDesde: null, fHasta: null };
}

// ============================================================
// 🔐 HASH DE CONTRASEÑAS (PBKDF2 vía Web Crypto API del navegador)
// ============================================================
// Formato guardado: "pbkdf2:<iteraciones>:<saltHex>:<hashHex>"
// Contraseñas antiguas sin ese prefijo se siguen aceptando (texto plano)
// y se migran automáticamente a hash en el primer login exitoso (ver Auth.login).
const PBKDF2_PREFIX = "pbkdf2";
const PBKDF2_ITERATIONS = 100000;

function _bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function _hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    return bytes;
}
async function _derivarHash(password, saltBytes, iterations) {
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
        keyMaterial, 256
    );
    return _bufferToHex(derivedBits);
}

// Genera un hash nuevo (con salt aleatorio) para guardar en la base de datos
async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hashHex = await _derivarHash(password, salt, PBKDF2_ITERATIONS);
    return `${PBKDF2_PREFIX}:${PBKDF2_ITERATIONS}:${_bufferToHex(salt)}:${hashHex}`;
}

// Detecta si un valor guardado ya está hasheado (formato nuevo) o es texto plano (formato antiguo)
function esPasswordHasheada(valorGuardado) {
    return typeof valorGuardado === "string" && valorGuardado.startsWith(`${PBKDF2_PREFIX}:`);
}

// Verifica una contraseña ingresada contra el valor guardado (hasheado o texto plano)
async function verificarPassword(password, valorGuardado) {
    if (!esPasswordHasheada(valorGuardado)) return password === valorGuardado;
    const [, iterStr, saltHex, hashHex] = valorGuardado.split(":");
    const iterations = parseInt(iterStr, 10);
    const salt = _hexToBuffer(saltHex);
    const calculado = await _derivarHash(password, salt, iterations);
    return calculado === hashHex;
}

// ============================================================
// 🔔 TOAST
// ============================================================
function showToast(msg, isError = false) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.background = isError ? "#ef4444" : "#1a2a3a";
    t.classList.add("show");
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove("show"), 3000);
}

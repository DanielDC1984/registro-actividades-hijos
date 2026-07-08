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

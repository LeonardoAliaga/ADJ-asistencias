// Public/js/admin.js
import { cargarUsuarios, initUserFormEvents } from "./admin/users.js";
import { cargarArchivosExcel, initModalEvents } from "./admin/excel-preview.js";
import { initWhatsappAdmin } from "./admin/whatsapp.js";

// --- FUNCIÓN DE NAVEGACIÓN ---
async function mostrarVista(vistaId, buttonId) {
  // Ocultar todas las vistas
  document.querySelectorAll(".vista-content").forEach((el) => {
    el.style.display = "none";
  });

  // Mostrar la vista activa o default
  const vistaActiva = document.getElementById(vistaId);
  if (vistaActiva) {
    vistaActiva.style.display = "block";
  } else {
    document.getElementById("vista-principal").style.display = "block";
    buttonId = "btn-vista-inicio";
  }

  // Actualizar botones del navbar
  document.querySelectorAll(".nav-button").forEach((btn) => {
    btn.classList.remove("active");
  });
  const botonActivo = document.getElementById(buttonId);
  if (botonActivo) {
    botonActivo.classList.add("active");
  }

  // Cargar datos según la vista
  if (vistaId === "vista-usuarios-completa") {
    await cargarUsuarios(true);
  } else if (vistaId === "vista-whatsapp") {
    initWhatsappAdmin();
  } else if (vistaId === "vista-principal") {
    // Recarga segura de datos principales
    try {
      await cargarUsuarios();
    } catch (e) {
      console.error(e);
    }
    try {
      await cargarArchivosExcel();
    } catch (e) {
      console.error(e);
    }
    try {
      await cargarHorarios();
    } catch (e) {
      console.error(e);
    }
  }
}

// Helper para mensajes globales
function showGlobalMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message;
  element.className = isError ? "form-message error" : "form-message success";
  element.style.display = "block";
  setTimeout(() => {
    element.style.display = "none";
  }, 4000);
}

// --- LÓGICA DE HORARIOS GENERAL ---

// Rellena los <select> con horas y minutos
function populateTimeSelects(hrSelect, minSelect) {
  // Limpiar opciones previas
  hrSelect.innerHTML = "";
  minSelect.innerHTML = "";

  // Horas 01-12
  for (let i = 1; i <= 12; i++) {
    const val = i.toString().padStart(2, "0");
    hrSelect.add(new Option(val, val));
  }
  // Minutos 00-59
  for (let i = 0; i < 60; i++) {
    const val = i.toString().padStart(2, "0");
    minSelect.add(new Option(val, val));
  }
}

// Setea los valores en los selects basándose en hora militar "HH:MM"
function setPickerFrom24h(time24h, hrSelect, minSelect, ampmSelect) {
  if (!time24h || typeof time24h !== "string" || !time24h.includes(":")) return;

  const [hoursStr, minutesStr] = time24h.split(":");
  let hours = parseInt(hoursStr);
  const minutes = minutesStr; // String "00"

  const ampm = hours >= 12 ? "PM" : "AM";

  // Convertir a formato 12h
  let hr12 = hours % 12;
  if (hr12 === 0) hr12 = 12;

  // Asignar valores
  hrSelect.value = hr12.toString().padStart(2, "0");
  minSelect.value = minutes;
  ampmSelect.value = ampm;
}

// Obtiene la hora militar "HH:MM" desde los selects
function get24hFromPicker(hrId, minId, ampmId) {
  let hours = parseInt(document.getElementById(hrId).value, 10);
  const minutes = document.getElementById(minId).value;
  const ampm = document.getElementById(ampmId).value;

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Función principal de carga de horarios
async function cargarHorarios() {
  const ent_hr = document.getElementById("entrada-hr");
  const ent_min = document.getElementById("entrada-min");
  const ent_ampm = document.getElementById("entrada-ampm");
  const tol_hr = document.getElementById("tolerancia-hr");
  const tol_min = document.getElementById("tolerancia-min");
  const tol_ampm = document.getElementById("tolerancia-ampm");

  if (!ent_hr || !tol_hr) return;

  // 1. Rellenar las opciones SIEMPRE si están vacías
  if (ent_hr.options.length === 0) {
    populateTimeSelects(ent_hr, ent_min);
    populateTimeSelects(tol_hr, tol_min);
  }

  try {
    const res = await fetch("/api/horarios");
    // Si falla la red, usamos un objeto vacío para no romper el UI
    const data = res.ok ? await res.json() : {};

    // Default fallback si no hay datos
    const config =
      data && data.default
        ? data.default
        : { entrada: "08:00", tolerancia: "08:15" };

    if (config.entrada)
      setPickerFrom24h(config.entrada, ent_hr, ent_min, ent_ampm);
    if (config.tolerancia)
      setPickerFrom24h(config.tolerancia, tol_hr, tol_min, tol_ampm);
  } catch (error) {
    console.error("Error cargando horarios:", error);
    // En caso de error crítico, setear valores visuales por defecto
    setPickerFrom24h("08:00", ent_hr, ent_min, ent_ampm);
    setPickerFrom24h("08:15", tol_hr, tol_min, tol_ampm);
  }
}

// Listener del formulario de horarios
const formHorarios = document.getElementById("form-horarios");
if (formHorarios) {
  formHorarios.onsubmit = async function (e) {
    e.preventDefault();
    const payload = {
      default: {
        entrada: get24hFromPicker("entrada-hr", "entrada-min", "entrada-ampm"),
        tolerancia: get24hFromPicker(
          "tolerancia-hr",
          "tolerancia-min",
          "tolerancia-ampm"
        ),
      },
    };

    try {
      const res = await fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.exito || res.ok)
        showGlobalMessage("msg-horarios", "Horario general guardado.");
      else
        showGlobalMessage(
          "msg-horarios",
          data.mensaje || "Error al guardar",
          true
        );
    } catch (err) {
      showGlobalMessage("msg-horarios", "Error de conexión", true);
    }
  };
}

// --- EVENTOS DE BOTONES (NAVEGACIÓN) ---
document.getElementById("btn-vista-inicio").onclick = () =>
  mostrarVista("vista-principal", "btn-vista-inicio");
document.getElementById("btn-vista-usuarios").onclick = () =>
  mostrarVista("vista-usuarios-completa", "btn-vista-usuarios");
document.getElementById("btn-vista-whatsapp").onclick = () =>
  mostrarVista("vista-whatsapp", "btn-vista-whatsapp");

// --- FORMULARIO AGREGAR DOCENTE ---
const formAgregar = document.getElementById("form-agregar");
if (formAgregar) {
  formAgregar.onsubmit = async function (e) {
    e.preventDefault();
    const codigo = document.getElementById("codigo").value.trim().toUpperCase();
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const rol = "docente";

    const diasAsistencia = [];
    document
      .querySelectorAll("#dias-asistencia-selector .day-btn.active")
      .forEach((btn) => {
        diasAsistencia.push(btn.getAttribute("data-day"));
      });

    if (!codigo || !nombre || !apellido) {
      showGlobalMessage(
        "msg-agregar-usuario",
        "Faltan datos obligatorios.",
        true
      );
      return;
    }
    if (diasAsistencia.length === 0) {
      showGlobalMessage(
        "msg-agregar-usuario",
        "Selecciona días de asistencia.",
        true
      );
      return;
    }

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          nombre,
          apellido,
          rol,
          dias_asistencia: diasAsistencia,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);

      showGlobalMessage("msg-agregar-usuario", data.mensaje);
      this.reset();

      // Restaurar días activos por defecto (L-S) si se desea, o dejar limpio
      document
        .querySelectorAll("#dias-asistencia-selector .day-btn")
        .forEach((btn) => {
          if (btn.dataset.day !== "D") btn.classList.add("active");
        });

      await cargarUsuarios(true);
    } catch (error) {
      showGlobalMessage("msg-agregar-usuario", error.message, true);
    }
  };
}

// --- FORMULARIO EDITAR DOCENTE ---
const formEditar = document.getElementById("form-editar");
if (formEditar) {
  formEditar.onsubmit = async function (e) {
    e.preventDefault();
    const original = document.getElementById("edit-original-codigo").value;
    const codigo = document
      .getElementById("edit-codigo")
      .value.trim()
      .toUpperCase();
    const nombre = document.getElementById("edit-nombre").value.trim();
    const apellido = document.getElementById("edit-apellido").value.trim();
    const rol = "docente";
    const dias = [];
    document
      .querySelectorAll("#edit-dias-asistencia-selector .day-btn.active")
      .forEach((btn) => {
        dias.push(btn.getAttribute("data-day"));
      });

    try {
      const res = await fetch(`/api/usuarios/${original}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          nombre,
          apellido,
          rol,
          dias_asistencia: dias,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);

      showGlobalMessage("msg-editar-usuario", data.mensaje);
      document.getElementById("edit-user-modal").style.display = "none";
      await cargarUsuarios(true);
    } catch (error) {
      showGlobalMessage("msg-editar-usuario", error.message, true);
    }
  };
}

// --- FORMULARIO JUSTIFICAR ---
const formJustificar = document.getElementById("form-justificar-falta");
if (formJustificar) {
  formJustificar.onsubmit = async function (e) {
    e.preventDefault();
    const codigo = document.getElementById("justificar-alumno-hidden").value;
    const fecha = document.getElementById("justificar-fecha").value;
    const filtroInput = document.getElementById("justificar-usuario-filtro");

    if (!codigo || !fecha) {
      return showGlobalMessage(
        "msg-justificar-falta",
        "Faltan datos (fecha o docente).",
        true
      );
    }

    // Formato fecha input (YYYY-MM-DD) a backend (DD-MM-YYYY)
    const parts = fecha.split("-");
    const fechaFmt = `${parts[2]}-${parts[1]}-${parts[0]}`;

    try {
      const res = await fetch("/api/excel/justificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, fecha: fechaFmt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje);

      showGlobalMessage("msg-justificar-falta", data.mensaje);
      filtroInput.value = "";
      document.getElementById("justificar-alumno-hidden").value = "";
    } catch (e) {
      showGlobalMessage("msg-justificar-falta", e.message, true);
    }
  };
}

// --- BOTÓN LOGOUT ---
document.getElementById("btn-logout").onclick = async () => {
  await fetch("/admin/logout", { method: "POST" });
  window.location.href = "/admin";
};

// --- CAMBIO CONTRASEÑA ---
document.getElementById("form-password").onsubmit = async function (e) {
  e.preventDefault();
  const nueva = document.getElementById("nueva-password").value;
  try {
    const res = await fetch("/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nueva }),
    });
    const d = await res.json();
    if (res.ok) {
      showGlobalMessage("msg-password", d.mensaje);
      this.reset();
    } else showGlobalMessage("msg-password", d.mensaje, true);
  } catch (e) {
    showGlobalMessage("msg-password", e.message, true);
  }
};

// --- INICIALIZACIÓN (WINDOW.ONLOAD) ---
window.onload = async function () {
  console.log("Admin Panel Inicializando...");

  // 1. Establecer fecha de hoy en 'Justificar' (Al principio para que no falle si la red falla)
  try {
    const dateInput = document.getElementById("justificar-fecha");
    if (dateInput) {
      const today = new Date();
      // Ajuste simple para zona horaria local (Perú/Sistema)
      // toLocaleDateString('en-CA') devuelve formato YYYY-MM-DD
      const localISODate = today.toLocaleDateString("en-CA");
      dateInput.value = localISODate;
    }
  } catch (e) {
    console.error("Error seteando fecha:", e);
  }

  // 2. Inicializar eventos UI
  initModalEvents();
  initUserFormEvents();

  // 3. Cargar datos iniciales (Protegido con try/catch individual)
  try {
    await cargarHorarios();
  } catch (e) {
    console.error("Fallo cargarHorarios", e);
  }
  try {
    await cargarUsuarios();
  } catch (e) {
    console.error("Fallo cargarUsuarios", e);
  }
  try {
    await cargarArchivosExcel();
  } catch (e) {
    console.error("Fallo cargarArchivosExcel", e);
  }

  // 4. Mostrar vista por defecto
  mostrarVista("vista-principal", "btn-vista-inicio");
};

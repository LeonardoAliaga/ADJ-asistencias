// Public/js/admin.js
import { cargarUsuarios, initUserFormEvents } from "./admin/users.js";
import { cargarArchivosExcel, initModalEvents } from "./admin/excel-preview.js";
import { initWhatsappAdmin } from "./admin/whatsapp.js";

async function mostrarVista(vistaId, buttonId) {
  document.querySelectorAll(".vista-content").forEach((el) => {
    el.style.display = "none";
  });
  const vistaActiva = document.getElementById(vistaId);
  if (vistaActiva) {
    vistaActiva.style.display = "block";
  } else {
    document.getElementById("vista-principal").style.display = "block";
    buttonId = "btn-vista-inicio";
  }

  document.querySelectorAll(".nav-button").forEach((btn) => {
    btn.classList.remove("active");
  });
  const botonActivo = document.getElementById(buttonId);
  if (botonActivo) {
    botonActivo.classList.add("active");
  }

  if (vistaId === "vista-usuarios-completa") {
    await cargarUsuarios(true);
  } else if (vistaId === "vista-whatsapp") {
    initWhatsappAdmin();
  } else if (vistaId === "vista-principal") {
    await cargarUsuarios();
    await cargarArchivosExcel();
    await cargarHorarios(); // <-- Cargar horarios
  }
}

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

// --- LÓGICA DE HORARIOS ---
// Helpers para los selectores de hora
function populateTimeSelects(hrSelect, minSelect) {
  hrSelect.innerHTML = "";
  minSelect.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const val = i.toString().padStart(2, "0");
    hrSelect.options.add(new Option(val, val));
  }
  for (let i = 0; i < 60; i++) {
    const val = i.toString().padStart(2, "0");
    minSelect.options.add(new Option(val, val));
  }
}

function setPickerFrom24h(time24h, hrSelect, minSelect, ampmSelect) {
  if (!time24h) return;
  const [hours, minutes] = time24h.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  let hr12 = hours % 12;
  if (hr12 === 0) hr12 = 12;
  hrSelect.value = hr12.toString().padStart(2, "0");
  minSelect.value = minutes.toString().padStart(2, "0");
  ampmSelect.value = ampm;
}

function get24hFromPicker(hrId, minId, ampmId) {
  let hours = parseInt(document.getElementById(hrId).value, 10);
  const minutes = document.getElementById(minId).value;
  const ampm = document.getElementById(ampmId).value;
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

async function cargarHorarios() {
  const em_hr = document.getElementById("entrada-manana-hr");
  const em_min = document.getElementById("entrada-manana-min");
  const em_ampm = document.getElementById("entrada-manana-ampm");
  const tm_hr = document.getElementById("tolerancia-manana-hr");
  const tm_min = document.getElementById("tolerancia-manana-min");
  const tm_ampm = document.getElementById("tolerancia-manana-ampm");

  const et_hr = document.getElementById("entrada-tarde-hr");
  const et_min = document.getElementById("entrada-tarde-min");
  const et_ampm = document.getElementById("entrada-tarde-ampm");
  const tt_hr = document.getElementById("tolerancia-tarde-hr");
  const tt_min = document.getElementById("tolerancia-tarde-min");
  const tt_ampm = document.getElementById("tolerancia-tarde-ampm");

  if (!em_hr) return;

  if (em_hr.options.length === 0) {
    populateTimeSelects(em_hr, em_min);
    populateTimeSelects(tm_hr, tm_min);
    populateTimeSelects(et_hr, et_min);
    populateTimeSelects(tt_hr, tt_min);
  }

  try {
    const res = await fetch("/api/horarios");
    const data = await res.json();
    const config = data.default || {}; // Usamos solo el default

    // Cargar datos
    if (config.mañana) {
      setPickerFrom24h(config.mañana.entrada, em_hr, em_min, em_ampm);
      setPickerFrom24h(config.mañana.tolerancia, tm_hr, tm_min, tm_ampm);
    }
    if (config.tarde) {
      setPickerFrom24h(config.tarde.entrada, et_hr, et_min, et_ampm);
      setPickerFrom24h(config.tarde.tolerancia, tt_hr, tt_min, tt_ampm);
    }
  } catch (error) {
    console.error("Error cargando horarios:", error);
  }
}

// Guardar Horarios
const formHorarios = document.getElementById("form-horarios");
if (formHorarios) {
  formHorarios.onsubmit = async function (e) {
    e.preventDefault();
    const payload = {
      ciclo: "default", // Siempre guardamos en default
      horarios: {
        mañana: {
          entrada: get24hFromPicker(
            "entrada-manana-hr",
            "entrada-manana-min",
            "entrada-manana-ampm"
          ),
          tolerancia: get24hFromPicker(
            "tolerancia-manana-hr",
            "tolerancia-manana-min",
            "tolerancia-manana-ampm"
          ),
        },
        tarde: {
          entrada: get24hFromPicker(
            "entrada-tarde-hr",
            "entrada-tarde-min",
            "entrada-tarde-ampm"
          ),
          tolerancia: get24hFromPicker(
            "tolerancia-tarde-hr",
            "tolerancia-tarde-min",
            "tolerancia-tarde-ampm"
          ),
        },
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
        showGlobalMessage(
          "msg-horarios",
          "Horarios actualizados correctamente."
        );
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

// Navegación
document.getElementById("btn-vista-inicio").onclick = () =>
  mostrarVista("vista-principal", "btn-vista-inicio");
document.getElementById("btn-vista-usuarios").onclick = () =>
  mostrarVista("vista-usuarios-completa", "btn-vista-usuarios");
document.getElementById("btn-vista-whatsapp").onclick = () =>
  mostrarVista("vista-whatsapp", "btn-vista-whatsapp");

// Agregar Docente
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
      .forEach((btn) => diasAsistencia.push(btn.getAttribute("data-day")));

    if (!codigo || !nombre || !apellido || diasAsistencia.length === 0) {
      showGlobalMessage(
        "msg-agregar-usuario",
        "Todos los campos son obligatorios",
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
      await cargarUsuarios(true);
    } catch (error) {
      showGlobalMessage("msg-agregar-usuario", error.message, true);
    }
  };
}

// Editar Docente
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
      .forEach((btn) => dias.push(btn.getAttribute("data-day")));

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

// Justificar
const formJustificar = document.getElementById("form-justificar-falta");
if (formJustificar) {
  formJustificar.onsubmit = async function (e) {
    e.preventDefault();
    const codigo = document.getElementById("justificar-alumno-hidden").value;
    const fecha = document.getElementById("justificar-fecha").value;
    if (!codigo || !fecha)
      return showGlobalMessage("msg-justificar-falta", "Faltan datos", true);

    // Formato DD-MM-YYYY
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
      document.getElementById("justificar-usuario-filtro").value = "";
      document.getElementById("justificar-alumno-hidden").value = "";
    } catch (e) {
      showGlobalMessage("msg-justificar-falta", e.message, true);
    }
  };
}

// Acceso
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

document.getElementById("btn-logout").onclick = async () => {
  await fetch("/admin/logout", { method: "POST" });
  window.location.href = "/admin";
};

// Init
window.onload = async function () {
  initModalEvents();
  await cargarHorarios(); // Cargar al inicio
  await cargarUsuarios();
  await cargarArchivosExcel();
  initUserFormEvents();
  mostrarVista("vista-principal", "btn-vista-inicio");

  // Fecha hoy en justificar
  const d = new Date();
  const dateStr = d.toISOString().split("T")[0];
  const dateIn = document.getElementById("justificar-fecha");
  if (dateIn) dateIn.value = dateStr;
};

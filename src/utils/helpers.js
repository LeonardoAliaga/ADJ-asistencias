// src/utils/helpers.js (LIMPIO)
const fs = require("fs");
const path = require("path");

const horariosPath = path.join(__dirname, "../../data/horarios.json");

// Obtener configuración de horarios
function obtenerHorarios() {
  try {
    if (!fs.existsSync(horariosPath)) {
      // Estructura simplificada solo para Default (Docentes)
      const defaultHorarios = {
        default: {
          mañana: { entrada: "08:00", tolerancia: "08:15" },
          tarde: { entrada: "14:00", tolerancia: "14:15" },
        },
      };
      fs.writeFileSync(horariosPath, JSON.stringify(defaultHorarios, null, 2));
      return defaultHorarios;
    }
    const data = JSON.parse(fs.readFileSync(horariosPath, "utf8"));
    // Asegurar estructura mínima
    if (!data.default) {
      data.default = {
        mañana: { entrada: "08:00", tolerancia: "08:15" },
        tarde: { entrada: "14:00", tolerancia: "14:15" },
      };
    }
    return data;
  } catch (error) {
    console.error("Utils: Error horarios.json", error);
    return { default: { mañana: {}, tarde: {} } };
  }
}

function getDayAbbreviation(fecha) {
  const dayNames = ["D", "L", "M", "MI", "J", "V", "S"];
  return dayNames[fecha.getDay()];
}

function convertTo12Hour(time24h) {
  if (!time24h || typeof time24h !== "string" || !time24h.includes(":"))
    return time24h;
  const [hour, minute] = time24h.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  return date
    .toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "")
    .toUpperCase();
}

function convertirAHoras(horaStr) {
  if (typeof horaStr !== "string" || !horaStr.includes(":")) return -1;
  const [h, m] = horaStr.trim().split(":").map(Number);
  return h + m / 60;
}

// Lógica simplificada: Ya no recibe "cicloUsuario"
function estadoAsistencia(cicloUsuarioIgnorado, turno, horaStr) {
  const horariosConfig = obtenerHorarios();
  const horaNum = convertirAHoras(horaStr);

  // Siempre usar configuración 'default'
  const horarioTurno = horariosConfig.default
    ? horariosConfig.default[turno]
    : null;

  if (!horarioTurno) return "tarde"; // Fallback

  const hEntrada = convertirAHoras(horarioTurno.entrada);
  const hTol = convertirAHoras(horarioTurno.tolerancia);

  if (horaNum < hEntrada) return "puntual";
  if (horaNum <= hTol) return "tolerancia";
  return "tarde";
}

function normalizarTexto(txt = "") {
  return txt
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getFullName(usuario = {}) {
  if (!usuario) return "";
  const apellido = usuario.apellido ? usuario.apellido.toString().trim() : "";
  const nombre = usuario.nombre ? usuario.nombre.toString().trim() : "";
  return `${apellido} ${nombre}`.trim();
}

module.exports = {
  convertirAHoras,
  estadoAsistencia,
  normalizarTexto,
  obtenerHorarios,
  getDayAbbreviation,
  convertTo12Hour,
  getFullName,
};

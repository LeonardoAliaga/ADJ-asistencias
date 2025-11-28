// src/utils/helpers.js
const fs = require("fs");
const path = require("path");

const horariosPath = path.join(__dirname, "../../data/horarios.json");

function obtenerHorarios() {
  try {
    if (!fs.existsSync(horariosPath)) {
      const defaultHorarios = {
        default: { entrada: "08:00", tolerancia: "08:15" },
      };
      fs.writeFileSync(horariosPath, JSON.stringify(defaultHorarios, null, 2));
      return defaultHorarios;
    }
    const data = JSON.parse(fs.readFileSync(horariosPath, "utf8"));
    if (!data.default) {
      data.default = { entrada: "08:00", tolerancia: "08:15" };
    }
    return data;
  } catch (error) {
    console.error("Utils: Error horarios.json", error);
    return { default: { entrada: "08:00", tolerancia: "08:15" } };
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

// Función general para docentes (sin turno/ciclo)
function estadoAsistencia(cicloIgnored, turnoIgnored, horaStr) {
  const horariosConfig = obtenerHorarios();
  const horaNum = convertirAHoras(horaStr);

  const config = horariosConfig.default; // Siempre usa default

  const hEntrada = convertirAHoras(config.entrada);
  const hTol = convertirAHoras(config.tolerancia);

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

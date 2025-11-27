// src/routes/registrar.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { guardarRegistro } = require("../services/excel.service");
const {
  estadoAsistencia,
  getDayAbbreviation,
  convertTo12Hour,
  getFullName,
} = require("../utils/helpers");
const {
  sendMessage,
  isWhatsappReady,
} = require("../../Whatsapp/WhatsappClient");

const router = express.Router();
const usuariosPath = path.join(__dirname, "../../data/usuarios.json");
const whatsappConfigPath = path.join(
  __dirname,
  "../../data/whatsappConfig.json"
);

const readWhatsappConfig = () => {
  try {
    if (fs.existsSync(whatsappConfigPath)) {
      return JSON.parse(fs.readFileSync(whatsappConfigPath, "utf8"));
    }
  } catch (e) {
    console.error(e);
  }
  return { enabledGeneral: false };
};

router.post("/", async (req, res) => {
  let codigo = req.body.codigo;
  if (codigo) codigo = codigo.toUpperCase();

  let isJustified = false;
  if (codigo && codigo.endsWith("J") && codigo.length > 1) {
    isJustified = true;
    codigo = codigo.substring(0, codigo.length - 1);
  }

  let usuarios = [];
  try {
    usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf8"));
  } catch (err) {
    return res
      .status(500)
      .json({ exito: false, mensaje: "Error leyendo usuarios." });
  }

  const usuario = usuarios.find((u) => u.codigo === codigo);
  if (!usuario) {
    return res
      .status(404)
      .json({ exito: false, mensaje: "Código no encontrado" });
  }

  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaStr = fecha.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const horaNum = parseFloat(horaStr.replace(":", ".")); // Simple para comparar turno

  // --- CALCULAR ESTADO PARA DOCENTE ---
  // Asumimos turno Mañana si es antes de la 1PM (13:00), Tarde si es después.
  // Esto permite usar los dos horarios configurados.
  const turnoDetectado = horaNum < 13 ? "mañana" : "tarde";
  const estado = estadoAsistencia("default", turnoDetectado, horaStr);

  // Guardar
  const guardado = await guardarRegistro(
    usuario,
    fechaStr,
    horaStr,
    isJustified
  );
  if (!guardado) {
    return res
      .status(409)
      .json({ exito: false, mensaje: "Ya registrado hoy." });
  }

  let hora12h = convertTo12Hour(horaStr);
  if (isJustified) hora12h += " (J)";

  // --- WHATSAPP DOCENTE ---
  const waConfig = readWhatsappConfig();
  if (
    waConfig.enabledGeneral &&
    isWhatsappReady() &&
    waConfig.teacherNotificationsEnabled
  ) {
    let emoji = "✅";
    if (estado === "tarde") emoji = "❌";
    else if (estado === "tolerancia") emoji = "⚠️";

    // Target único configurado
    const target = waConfig.teacherTargetId;
    if (target) {
      const msg = `Docente *${getFullName(
        usuario
      )}*\nIngreso: *${hora12h}* ${emoji}\nEstado: ${estado.toUpperCase()}`;
      sendMessage(target, msg);
    }
  }

  res.json({
    exito: true,
    nombre: getFullName(usuario),
    hora: hora12h,
    rol: "docente",
    estado: estado, // Devolver estado para mostrar color en frontend
    turno: turnoDetectado,
  });
});

module.exports = router;

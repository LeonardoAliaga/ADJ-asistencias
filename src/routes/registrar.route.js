// src/routes/registrar.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const color = require("ansi-colors");
const { guardarRegistro } = require("../services/excel.service");
const {
  estadoAsistencia,
  convertTo12Hour,
  getFullName,
  getLogHeader,
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
const FILE_TAG = "registrar.route.js";

const readWhatsappConfig = () => {
  try {
    if (fs.existsSync(whatsappConfigPath))
      return JSON.parse(fs.readFileSync(whatsappConfigPath, "utf8"));
  } catch (e) {}
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

  console.log(
    `${getLogHeader(FILE_TAG)} Registro: ${codigo} ${
      isJustified ? "(Justificado)" : ""
    }`
  );

  let usuarios = [];
  try {
    usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf8"));
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: "Error usuarios." });
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

  // 1. Calcular estado inicial por hora
  let estado = estadoAsistencia(null, null, horaStr);

  // 2. CORRECCIÓN: Si está justificado manualmente, sobrescribimos el estado "tarde"
  if (isJustified) {
    estado = "tardanza_justificada"; // Esto activará el color naranja en el log y excel updater
  }

  const guardado = await guardarRegistro(
    usuario,
    fechaStr,
    horaStr,
    isJustified,
    estado
  );

  if (!guardado) {
    return res
      .status(409)
      .json({ exito: false, mensaje: "Ya registrado hoy." });
  }

  // Log correcto con el estado final
  console.log(
    `${getLogHeader(FILE_TAG)} ${color.green("Registrado:")} ${getFullName(
      usuario
    )} [${estado}]`
  );

  let hora12h = convertTo12Hour(horaStr);
  if (isJustified) hora12h += " (J)";

  const waConfig = readWhatsappConfig();
  if (
    waConfig.enabledGeneral &&
    isWhatsappReady() &&
    waConfig.teacherNotificationsEnabled
  ) {
    let emoji = "✅";
    if (estado === "tarde") emoji = "❌";
    else if (estado === "tolerancia" || estado === "tardanza_justificada")
      emoji = "⚠️";

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
    estado: estado,
  });
});

module.exports = router;

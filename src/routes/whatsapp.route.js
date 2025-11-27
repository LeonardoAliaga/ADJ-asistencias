// src/routes/whatsapp.route.js (LIMPIO)
const express = require("express");
const fs = require("fs");
const path = require("path");
const {
  getGroupChats,
  isWhatsappReady,
  getQR,
  forceRestart,
  sendMessage,
  MessageMedia,
} = require("../../Whatsapp/WhatsappClient");
const { generateReportImage } = require("../services/report-generator");

const router = express.Router();
const configPath = path.join(__dirname, "../../data/whatsappConfig.json");

// Función para leer la configuración (SIMPLIFICADA)
const readConfig = () => {
  const defaultConfig = {
    enabledGeneral: false,
    // Eliminado studentNotificationsEnabled
    teacherNotificationsEnabled: false,
    automatedReportEnabled: false, // Para permitir el reporte manual
    // Eliminado studentRules
    teacherTargetType: "number",
    teacherTargetId: null,
    automatedReport: {
      targets: [], // Solo guardamos los targets para el reporte manual
    },
  };

  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf8");
      const config = JSON.parse(data);

      // Combinar con defaults para asegurar estructura
      return {
        ...defaultConfig,
        ...config,
        automatedReport: {
          ...defaultConfig.automatedReport,
          ...(config.automatedReport || {}),
        },
      };
    }
  } catch (error) {
    console.error("Error leyendo configuración de WhatsApp:", error);
  }
  return defaultConfig;
};

// Función para guardar la configuración
const saveConfig = (config) => {
  try {
    const dataDir = path.dirname(configPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Configuración de WhatsApp guardada.");
    return true;
  } catch (error) {
    console.error("Error guardando configuración de WhatsApp:", error);
    return false;
  }
};

// --- RUTAS API ---

// GET /whatsapp/api/config
router.get("/config", (req, res) => {
  const config = readConfig();
  res.json({ exito: true, config });
});

// POST /whatsapp/api/config
router.post("/config", (req, res) => {
  const newConfig = req.body;

  // Validación simplificada solo para campos de docentes y generales
  if (
    typeof newConfig.enabledGeneral !== "boolean" ||
    typeof newConfig.teacherNotificationsEnabled !== "boolean" ||
    typeof newConfig.automatedReportEnabled !== "boolean" ||
    !newConfig.teacherTargetType ||
    !newConfig.automatedReport
  ) {
    console.error("Datos de configuración inválidos recibidos:", newConfig);
    return res
      .status(400)
      .json({ exito: false, mensaje: "Formato de configuración inválido." });
  }

  // Limpiar campos que no nos interesan antes de guardar
  const cleanConfig = {
    enabledGeneral: newConfig.enabledGeneral,
    teacherNotificationsEnabled: newConfig.teacherNotificationsEnabled,
    automatedReportEnabled: newConfig.automatedReportEnabled,
    teacherTargetType: newConfig.teacherTargetType,
    teacherTargetId: newConfig.teacherTargetId,
    automatedReport: {
      targets: newConfig.automatedReport.targets || [],
    },
  };

  if (saveConfig(cleanConfig)) {
    res.json({ exito: true, mensaje: "Configuración guardada." });
  } else {
    res
      .status(500)
      .json({ exito: false, mensaje: "Error al guardar la configuración." });
  }
});

// GET /whatsapp/api/status
router.get("/status", (req, res) => {
  const readyState = isWhatsappReady();
  res.json({ exito: true, isReady: readyState });
});

// GET /whatsapp/api/qr
router.get("/qr", (req, res) => {
  const qr = getQR();
  res.json({ exito: true, qr: qr });
});

// GET /whatsapp/api/groups
router.get("/groups", async (req, res) => {
  if (!isWhatsappReady()) {
    return res.status(503).json({
      exito: false,
      mensaje: "WhatsApp no está conectado.",
      groups: [],
    });
  }
  try {
    const groups = await getGroupChats();
    // Ordenar alfabéticamente
    groups.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ exito: true, groups });
  } catch (error) {
    console.error("Error en API /groups:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al obtener los grupos.",
      groups: [],
    });
  }
});

// POST /whatsapp/api/restart
router.post("/restart", (req, res) => {
  try {
    forceRestart("manual_restart_request");
    res.json({
      exito: true,
      mensaje: "Reiniciando cliente. Espera unos segundos...",
    });
  } catch (e) {
    res
      .status(500)
      .json({ exito: false, mensaje: "Error al intentar reiniciar." });
  }
});

// POST /whatsapp/api/send-report-manual
router.post("/send-report-manual", async (req, res) => {
  const { ciclo, turno, groupId } = req.body;

  if (!isWhatsappReady()) {
    return res
      .status(503)
      .json({ exito: false, mensaje: "WhatsApp no está conectado." });
  }

  // Validación básica
  if (!groupId) {
    return res
      .status(400)
      .json({ exito: false, mensaje: "Falta el ID del grupo." });
  }

  // Como es solo para docentes, podemos ignorar ciclo/turno si vienen vacíos o forzarlos
  // pero el frontend ya envía "DOCENTES" / "docentes".
  const cicloFinal = ciclo || "DOCENTES";
  const turnoFinal = turno || "docentes";

  console.log(
    `API: Enviando reporte manual de ${cicloFinal} al grupo ${groupId}`
  );

  try {
    const imageBuffer = await generateReportImage(cicloFinal, turnoFinal);

    if (!imageBuffer) {
      return res.status(404).json({
        exito: false,
        mensaje: `No hay registros de asistencia hoy para generar el reporte.`,
      });
    }

    const media = new MessageMedia(
      "image/png",
      imageBuffer.toString("base64"),
      `Reporte_Docentes_${new Date().toISOString().split("T")[0]}.png`
    );

    const sent = await sendMessage(groupId, media);

    if (sent) {
      res.json({ exito: true, mensaje: "Reporte enviado." });
    } else {
      res
        .status(500)
        .json({ exito: false, mensaje: "Falló el envío del mensaje." });
    }
  } catch (error) {
    console.error("Error en envío manual:", error);
    res.status(500).json({
      exito: false,
      mensaje: `Error generando reporte: ${error.message}`,
    });
  }
});

module.exports = router;

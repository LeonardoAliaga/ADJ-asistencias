// src/routes/whatsapp.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const color = require("ansi-colors");
const {
  getGroupChats,
  isWhatsappReady,
  getQR,
  forceRestart,
  sendMessage,
  MessageMedia,
} = require("../../Whatsapp/WhatsappClient");
const { generateReportImage } = require("../services/report-generator");
const { getLogHeader } = require("../utils/helpers");

const router = express.Router();
const configPath = path.join(__dirname, "../../data/whatsappConfig.json");
const FILE_TAG = "whatsapp.route.js";

// --- LECTURA DE CONFIGURACIÓN (Solo Docentes) ---
const readConfig = () => {
  const defaultConfig = {
    enabledGeneral: false,
    teacherNotificationsEnabled: false,
    automatedReportEnabled: false, // Siempre false para forzar manual o externo
    teacherTargetType: "number",
    teacherTargetId: null,
    automatedReport: {
      targets: [], // Array para destinos del reporte manual
    },
  };

  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf8");
      const config = JSON.parse(data);

      // Mezclar con default para asegurar estructura limpia
      return {
        ...defaultConfig,
        ...config,
        // Filtrar propiedades basura de versiones anteriores
        automatedReport: {
          ...defaultConfig.automatedReport,
          ...(config.automatedReport || {}),
        },
      };
    }
  } catch (error) {
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Error leyendo config:")}`,
      error
    );
  }
  return defaultConfig;
};

// --- GUARDADO DE CONFIGURACIÓN ---
const saveConfig = (config) => {
  try {
    const dataDir = path.dirname(configPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(
      `${getLogHeader(FILE_TAG)} ${color.green(
        "Configuración guardada correctamente."
      )}`
    );
    return true;
  } catch (error) {
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Error guardando config:")}`,
      error
    );
    return false;
  }
};

// --- RUTAS API ---

// GET Configuración
router.get("/config", (req, res) => {
  const config = readConfig();
  res.json({ exito: true, config });
});

// POST Configuración
router.post("/config", (req, res) => {
  const newConfig = req.body;

  // Validación simple
  if (
    typeof newConfig.enabledGeneral !== "boolean" ||
    typeof newConfig.teacherNotificationsEnabled !== "boolean" ||
    !newConfig.teacherTargetType ||
    !newConfig.automatedReport
  ) {
    console.warn(
      `${getLogHeader(FILE_TAG)} ${color.yellow(
        "Intento de guardar configuración inválida."
      )}`
    );
    return res.status(400).json({ exito: false, mensaje: "Datos inválidos." });
  }

  // Limpieza de objeto antes de guardar (Ignorar campos de alumnos)
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
    res.json({ exito: true, mensaje: "Configuración actualizada." });
  } else {
    res
      .status(500)
      .json({ exito: false, mensaje: "Error al escribir en disco." });
  }
});

// Estado del Cliente
router.get("/status", (req, res) => {
  const readyState = isWhatsappReady();
  res.json({ exito: true, isReady: readyState });
});

// Obtener QR
router.get("/qr", (req, res) => {
  const qr = getQR();
  // Log solo si hay QR para no saturar consola en polling
  if (qr) console.log(`${getLogHeader(FILE_TAG)} Cliente web solicitó QR.`);
  res.json({ exito: true, qr: qr });
});

// Listar Grupos
router.get("/groups", async (req, res) => {
  if (!isWhatsappReady()) {
    return res
      .status(503)
      .json({ exito: false, mensaje: "WhatsApp desconectado.", groups: [] });
  }
  try {
    const groups = await getGroupChats();
    // Ordenar alfabéticamente
    groups.sort((a, b) => a.name.localeCompare(b.name));
    console.log(`${getLogHeader(FILE_TAG)} Listados ${groups.length} grupos.`);
    res.json({ exito: true, groups });
  } catch (error) {
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Error obteniendo grupos:")}`,
      error
    );
    res
      .status(500)
      .json({ exito: false, mensaje: "Error interno.", groups: [] });
  }
});

// Reinicio Forzado
router.post("/restart", (req, res) => {
  console.warn(
    `${getLogHeader(FILE_TAG)} ${color.yellow(
      "Solicitud manual de reinicio recibida."
    )}`
  );
  try {
    forceRestart();
    res.json({ exito: true, mensaje: "Reiniciando cliente..." });
  } catch (e) {
    res
      .status(500)
      .json({ exito: false, mensaje: "Error al intentar reiniciar." });
  }
});

// Enviar Reporte Manualmente
router.post("/send-report-manual", async (req, res) => {
  const { groupId } = req.body; // Solo necesitamos el ID del grupo destino

  if (!isWhatsappReady()) {
    return res
      .status(503)
      .json({ exito: false, mensaje: "WhatsApp no está conectado." });
  }

  if (!groupId) {
    return res
      .status(400)
      .json({ exito: false, mensaje: "Falta el ID del grupo." });
  }

  console.log(
    `${getLogHeader(
      FILE_TAG
    )} Generando reporte manual para grupo: ${groupId}...`
  );

  try {
    // Generar imagen de la hoja "Docentes" (ciclo y turno fijos)
    const imageBuffer = await generateReportImage("DOCENTES", "docentes");

    if (!imageBuffer) {
      console.warn(
        `${getLogHeader(FILE_TAG)} ${color.yellow(
          "Reporte vacío o sin datos para hoy."
        )}`
      );
      return res.status(404).json({
        exito: false,
        mensaje: "No hay registros de asistencia hoy para generar el reporte.",
      });
    }

    const todayStr = new Date().toLocaleDateString("es-PE").replace(/\//g, "-");
    const media = new MessageMedia(
      "image/png",
      imageBuffer.toString("base64"),
      `Reporte_Docentes_${todayStr}.png`
    );

    const sent = await sendMessage(groupId, media);

    if (sent) {
      console.log(
        `${getLogHeader(FILE_TAG)} ${color.green("Reporte enviado con éxito.")}`
      );
      res.json({ exito: true, mensaje: "Reporte enviado correctamente." });
    } else {
      console.error(
        `${getLogHeader(FILE_TAG)} ${color.red(
          "Fallo al enviar mensaje (sendMessage devolvió false)."
        )}`
      );
      res.status(500).json({
        exito: false,
        mensaje: "No se pudo enviar el mensaje a WhatsApp.",
      });
    }
  } catch (error) {
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Excepción enviando reporte:")}`,
      error
    );
    res.status(500).json({
      exito: false,
      mensaje: `Error interno: ${error.message}`,
    });
  }
});

module.exports = router;

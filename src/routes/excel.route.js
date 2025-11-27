// src/routes/excel.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { normalizarTexto, getFullName } = require("../utils/helpers.js");
const {
  estiloFaltaJustificada,
  estiloFalta,
  estiloNoAsiste,
  estiloDocenteRegistrado,
} = require("../services/excel/excel.constants.js");

const router = express.Router();
const registrosPath = path.join(__dirname, "../../Registros");
const usuariosPath = path.join(__dirname, "../../data/usuarios.json");

// Helper para asegurar que la carpeta Registros exista
function ensureRegistrosDir() {
  try {
    if (!fs.existsSync(registrosPath)) {
      fs.mkdirSync(registrosPath, { recursive: true });
      console.log("Excel Route: Carpeta Registros creada.");
    }
  } catch (err) {
    console.error("Excel Route: Error al crear carpeta Registros:", err);
  }
}

// GET /api/excel - Listar archivos Excel
router.get("/", (req, res) => {
  ensureRegistrosDir();
  try {
    const archivos = fs
      .readdirSync(registrosPath)
      .filter((f) => f.endsWith(".xlsx") && !f.startsWith("~"));
    // Ordenar para mostrar los más recientes primero
    archivos.sort((a, b) => {
      const dateA = a.split(" ")[0].split("-").reverse().join("");
      const dateB = b.split(" ")[0].split("-").reverse().join("");
      return dateB.localeCompare(dateA); // Orden descendente
    });
    res.json(archivos);
  } catch (err) {
    console.error("Excel Route: Error al listar archivos:", err);
    res.status(500).json([]);
  }
});

// GET /api/excel/:archivo - Descargar archivo Excel
router.get("/:archivo", (req, res) => {
  const archivo = req.params.archivo;
  if (
    archivo.includes("..") ||
    archivo.includes("/") ||
    !archivo.endsWith(".xlsx")
  ) {
    return res.status(400).send("Nombre de archivo inválido.");
  }
  const ruta = path.join(registrosPath, archivo);

  if (!fs.existsSync(ruta)) {
    return res.status(404).send("Archivo no encontrado.");
  }
  res.download(ruta, archivo, (err) => {
    if (err) {
      console.error(`Excel Route: Error al descargar ${archivo}:`, err);
      if (!res.headersSent) {
        res.status(500).send("Error al descargar el archivo.");
      }
    }
  });
});

// GET /api/excel/preview/:archivo
router.get("/preview/:archivo", async (req, res) => {
  const archivo = req.params.archivo;
  if (
    archivo.includes("..") ||
    archivo.includes("/") ||
    !archivo.endsWith(".xlsx")
  ) {
    return res.status(400).json({ mensaje: "Nombre de archivo inválido." });
  }
  const ruta = path.join(registrosPath, archivo);

  if (!fs.existsSync(ruta)) {
    return res.status(404).json({ mensaje: "Archivo no encontrado" });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(ruta);

    const sheetsData = [];

    // Mapa de colores solo para docentes y estados generales
    const colorMap = {
      [estiloFalta.fill.fgColor.argb.substring(2)]: "falta",
      [estiloNoAsiste.fill.fgColor.argb.substring(2)]: "no_asiste",
      [estiloDocenteRegistrado.fill.fgColor.argb.substring(2)]: "docente",
      [estiloFaltaJustificada.fill.fgColor.argb.substring(2)]:
        "falta_justificada",
    };

    workbook.eachSheet((worksheet) => {
      let csvContent = "";

      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        let rowValues = [];
        let rowHasContent = false;
        let isTitleRow = false;
        let isHeaderRow = false;
        let attendanceStatus = "";

        for (let colNumber = 1; colNumber <= 5; colNumber++) {
          const cell = row.getCell(colNumber);
          let value = cell.value;
          let finalValue = "";

          if (
            colNumber === 1 &&
            cell.isMerged &&
            typeof value === "string" &&
            value.startsWith("REGISTRO DE ASISTENCIA")
          ) {
            finalValue = value;
            rowHasContent = true;
            isTitleRow = true;
            rowValues.push(`"${finalValue.replace(/"/g, '""')}"`);
            break;
          }
          if (
            colNumber === 1 &&
            typeof value === "string" &&
            (value === "N°" || value?.toString().toUpperCase().includes("N°"))
          ) {
            isHeaderRow = true;
          }

          if (value !== null && value !== undefined) {
            if (typeof value === "object" && value && value.richText) {
              finalValue = value.richText.map((rt) => rt.text).join("");
            } else if (value instanceof Date) {
              if (colNumber === 5) {
                finalValue = value
                  .toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .replace(/\s/g, "")
                  .toUpperCase();
              } else {
                finalValue = value.toLocaleDateString("es-PE");
              }
            } else if (
              typeof value === "object" &&
              value &&
              value.result !== undefined
            ) {
              let resultValue = value.result;
              if (resultValue instanceof Date && colNumber === 5) {
                finalValue = resultValue
                  .toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .replace(/\s/g, "")
                  .toUpperCase();
              } else {
                finalValue = String(resultValue);
              }
            } else {
              finalValue = String(value);
            }

            finalValue = finalValue.trim();
            if (finalValue.length > 0) rowHasContent = true;

            // Detectar estado
            if (!isTitleRow && !isHeaderRow && colNumber === 5) {
              const upperVal = finalValue.toUpperCase();

              if (upperVal === "FALTA") {
                attendanceStatus = "falta";
              } else if (upperVal === "NO ASISTE") {
                attendanceStatus = "no_asiste";
              } else if (upperVal === "F. JUSTIFICADA") {
                attendanceStatus = "falta_justificada";
              } else if (finalValue) {
                const fillColor = cell.fill;
                if (
                  fillColor &&
                  fillColor.type === "pattern" &&
                  fillColor.pattern === "solid" &&
                  fillColor.fgColor &&
                  fillColor.fgColor.argb
                ) {
                  const bgColor = fillColor.fgColor.argb
                    .toUpperCase()
                    .substring(2);
                  attendanceStatus = colorMap[bgColor] || "registrado";
                } else {
                  attendanceStatus = "registrado";
                }
              }
            }
          }

          if (/[",\n\r]/.test(finalValue)) {
            finalValue = `"${finalValue.replace(/"/g, '""')}"`;
          }
          rowValues.push(finalValue);
        }

        if (rowHasContent) {
          if (!isTitleRow && !isHeaderRow) {
            rowValues.push(attendanceStatus || "");
          } else if (isHeaderRow) {
            rowValues.push("ESTADO");
          }
          while (rowValues.length < 6) {
            rowValues.push("");
          }
          csvContent += rowValues.slice(0, 6).join(",") + "\n";
        } else if (rowNumber > 1) {
          csvContent += "\n";
        }
      });

      sheetsData.push({ name: worksheet.name, content: csvContent.trim() });
    });

    res.json({ exito: true, sheets: sheetsData });
  } catch (error) {
    console.error(`Excel Preview: Error al procesar ${archivo}:`, error);
    res.status(500).json({
      mensaje: "Error al procesar el archivo XLSX.",
      detalle: error.message,
    });
  }
});

// POST /api/excel/justificar
router.post("/justificar", async (req, res) => {
  const { codigo, fecha } = req.body;

  if (!codigo || !fecha) {
    return res
      .status(400)
      .json({ exito: false, mensaje: "Faltan código o fecha." });
  }

  const fileName = `${fecha}.xlsx`;
  const rutaExcel = path.join(registrosPath, fileName);

  if (!fs.existsSync(rutaExcel)) {
    return res
      .status(404)
      .json({ exito: false, mensaje: `El archivo ${fileName} no existe.` });
  }

  try {
    const usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf8"));
    const usuario = usuarios.find((u) => u.codigo === codigo);

    if (!usuario) {
      return res
        .status(404)
        .json({ exito: false, mensaje: "Código de usuario no encontrado." });
    }

    // Simplificado: Solo buscar en hoja Docentes
    const sheetName = "Docentes";

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(rutaExcel);
    const hoja = workbook.getWorksheet(sheetName);

    if (!hoja) {
      return res
        .status(404)
        .json({ exito: false, mensaje: `Hoja ${sheetName} no encontrada.` });
    }

    let filaEncontrada = null;
    hoja.eachRow((row) => {
      let celdaNombre = row.getCell(2).value;
      if (typeof celdaNombre === "object" && celdaNombre?.richText) {
        celdaNombre = celdaNombre.richText.map((t) => t.text).join("");
      }

      if (
        normalizarTexto(celdaNombre?.toString() || "") ===
        normalizarTexto(getFullName(usuario))
      ) {
        filaEncontrada = row;
        return false;
      }
    });

    if (!filaEncontrada) {
      return res.status(404).json({
        exito: false,
        mensaje: `Docente ${getFullName(usuario)} no encontrado en la hoja.`,
      });
    }

    const celdaEstado = filaEncontrada.getCell(5);
    const valorActual = celdaEstado.value?.toString().toUpperCase();

    if (valorActual === "FALTA") {
      celdaEstado.value = "F. JUSTIFICADA";
      celdaEstado.style = {
        fill: { ...estiloFaltaJustificada.fill },
        font: { ...estiloFaltaJustificada.font },
        alignment: { ...estiloFaltaJustificada.alignment },
        border: { ...estiloFaltaJustificada.border },
      };

      await workbook.xlsx.writeFile(rutaExcel);
      res.json({ exito: true, mensaje: "Falta justificada correctamente." });
    } else if (valorActual === "F. JUSTIFICADA") {
      res
        .status(400)
        .json({ exito: false, mensaje: "Esta falta ya estaba justificada." });
    } else {
      res.status(400).json({
        exito: false,
        mensaje: `No se puede justificar. Estado actual: ${
          valorActual || "VACÍO"
        }.`,
      });
    }
  } catch (error) {
    console.error("Error al justificar falta:", error);
    res
      .status(500)
      .json({ exito: false, mensaje: "Error interno del servidor." });
  }
});

module.exports = router;

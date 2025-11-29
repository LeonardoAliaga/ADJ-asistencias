// src/routes/excel.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const color = require("ansi-colors");
const {
  getLogHeader,
  normalizarTexto,
  getFullName,
} = require("../utils/helpers.js");
const {
  estiloFaltaJustificada,
  estiloPuntual,
  estiloOrange,
  estiloTarde,
  estiloFalta,
  estiloNoAsiste,
  estiloDocenteRegistrado,
} = require("../services/excel/excel.constants.js");

const router = express.Router();
const registrosPath = path.join(__dirname, "../../Registros");
const usuariosPath = path.join(__dirname, "../../data/usuarios.json");
const FILE_TAG = "excel.route.js";

// ... (GET / y GET /:archivo IGUALES) ...
router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(registrosPath)) fs.mkdirSync(registrosPath);
    const archivos = fs
      .readdirSync(registrosPath)
      .filter((f) => f.endsWith(".xlsx") && !f.startsWith("~"));
    archivos.sort((a, b) => {
      const da = a.split(" ")[0].split("-").reverse().join("");
      const db = b.split(" ")[0].split("-").reverse().join("");
      return db.localeCompare(da);
    });
    res.json(archivos);
  } catch (e) {
    res.status(500).json([]);
  }
});

router.get("/:archivo", (req, res) => {
  const p = path.join(registrosPath, req.params.archivo);
  if (fs.existsSync(p)) res.download(p);
  else res.status(404).send("No encontrado");
});

// --- RUTA PREVIEW CORREGIDA ---
router.get("/preview/:archivo", async (req, res) => {
  const archivo = req.params.archivo;
  const ruta = path.join(registrosPath, archivo);

  if (!fs.existsSync(ruta))
    return res.status(404).json({ mensaje: "Archivo no encontrado" });

  console.log(`${getLogHeader(FILE_TAG)} Generando preview: ${archivo}`);

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(ruta);
    const sheetsData = [];

    const colorMap = {
      [estiloPuntual.fill.fgColor.argb.substring(2)]: "puntual",
      [estiloOrange.fill.fgColor.argb.substring(2)]: "tolerancia",
      [estiloTarde.fill.fgColor.argb.substring(2)]: "tarde",
      [estiloFaltaJustificada.fill.fgColor.argb.substring(2)]:
        "falta_justificada",
      [estiloFalta.fill.fgColor.argb.substring(2)]: "falta",
      [estiloNoAsiste.fill.fgColor.argb.substring(2)]: "no_asiste",
    };

    workbook.eachSheet((worksheet) => {
      let csvContent = "";

      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        let rowValues = [];
        let rowHasContent = false;
        let isTitleRow = false;
        let isHeaderRow = false;
        let attendanceStatus = "";

        // Solo 3 Columnas
        for (let colNumber = 1; colNumber <= 3; colNumber++) {
          const cell = row.getCell(colNumber);
          let value = cell.value;
          let finalValue = "";

          if (
            colNumber === 1 &&
            cell.isMerged &&
            typeof value === "string" &&
            value.startsWith("REGISTRO")
          ) {
            finalValue = value;
            rowHasContent = true;
            isTitleRow = true;
            rowValues.push(`"${finalValue}"`);
            break;
          }
          if (colNumber === 1 && String(value).includes("N°"))
            isHeaderRow = true;

          if (value !== null && value !== undefined) {
            if (typeof value === "object" && value.richText) {
              finalValue = value.richText.map((rt) => rt.text).join("");
            } else if (value instanceof Date) {
              if (colNumber === 3)
                finalValue = value
                  .toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .toUpperCase();
              else finalValue = value.toLocaleDateString("es-PE");
            } else if (typeof value === "object" && value.result) {
              finalValue = String(value.result);
            } else {
              finalValue = String(value);
            }

            finalValue = finalValue.trim();
            if (finalValue.length > 0) rowHasContent = true;

            // Detectar estado en Columna 3
            if (!isTitleRow && !isHeaderRow && colNumber === 3) {
              const upperVal = finalValue.toUpperCase();
              if (upperVal === "FALTA") attendanceStatus = "falta";
              else if (upperVal === "NO ASISTE") attendanceStatus = "no_asiste";
              else if (upperVal === "F. JUSTIFICADA")
                attendanceStatus = "falta_justificada";
              else if (
                cell.fill &&
                cell.fill.fgColor &&
                cell.fill.fgColor.argb
              ) {
                const hexColor = cell.fill.fgColor.argb.substring(2);
                attendanceStatus = colorMap[hexColor] || "registrado";
                if (upperVal.endsWith("(J)"))
                  attendanceStatus = "tardanza_justificada";
              }
            }
          }

          // IMPORTANTE: Reemplazar comas para no romper el CSV simulado
          finalValue = finalValue.replace(/,/g, " ").replace(/"/g, "");
          rowValues.push(finalValue);
        }

        if (rowHasContent) {
          if (!isTitleRow && !isHeaderRow) rowValues.push(attendanceStatus);
          else if (isHeaderRow) rowValues.push(""); // Dejar vacío el estado del header para que no pinte nada

          while (rowValues.length < 4) rowValues.push("");
          csvContent += rowValues.slice(0, 4).join(",") + "\n";
        } else if (rowNumber > 1) {
          csvContent += "\n";
        }
      });
      sheetsData.push({ name: worksheet.name, content: csvContent.trim() });
    });

    res.json({ exito: true, sheets: sheetsData });
  } catch (error) {
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Error preview:")}`,
      error
    );
    res.status(500).json({ mensaje: "Error preview" });
  }
});

// ... (POST JUSTIFICAR IGUAL QUE ANTES) ...
router.post("/justificar", async (req, res) => {
  const { codigo, fecha } = req.body;
  const fileName = `${fecha}.xlsx`;
  const p = path.join(registrosPath, fileName);
  if (!fs.existsSync(p))
    return res.status(404).json({ exito: false, mensaje: "No existe archivo" });

  try {
    const uDB = JSON.parse(fs.readFileSync(usuariosPath));
    const user = uDB.find((u) => u.codigo === codigo);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(p);
    const ws = wb.getWorksheet("Docentes");
    let rowF = null;
    ws.eachRow((r) => {
      const n = r.getCell(2).value;
      const t =
        typeof n === "object" && n.richText
          ? n.richText.map((x) => x.text).join("")
          : String(n);
      if (normalizarTexto(t) === normalizarTexto(getFullName(user))) rowF = r;
    });
    if (!rowF)
      return res.status(404).json({ exito: false, mensaje: "No en excel" });

    const cell = rowF.getCell(3);
    if (String(cell.value) === "FALTA") {
      cell.value = "F. JUSTIFICADA";
      // Usamos estiloFaltaJustificada importado
      cell.style = {
        ...estiloFaltaJustificada,
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };
      await wb.xlsx.writeFile(p);
      res.json({ exito: true, mensaje: "Justificado" });
    } else {
      res.status(400).json({ exito: false, mensaje: "No es falta" });
    }
  } catch (e) {
    res.status(500).json({ exito: false });
  }
});

module.exports = router;

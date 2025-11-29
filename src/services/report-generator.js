// src/services/report-generator.js
const { createCanvas, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const {
  estiloFalta,
  estiloNoAsiste,
  estiloPuntual,
  estiloOrange,
  estiloTarde,
  estiloFaltaJustificada,
  fillEncabezadoDocente,
  estiloEncabezadoBase,
} = require("./excel/excel.constants.js");

try {
  registerFont(
    path.join(__dirname, "../../Public/fonts/ZTGatha-SemiBold.otf"),
    { family: "Gatha" }
  );
  registerFont(path.join(__dirname, "../../Public/fonts/coolvetica rg.otf"), {
    family: "Coolvetica",
  });
} catch (err) {}

// Colores para canvas (Hex sin #)
const getHex = (argb) => "#" + argb.substring(2);

const styles = {
  puntual: {
    bg: getHex(estiloPuntual.fill.fgColor.argb),
    text: getHex(estiloPuntual.font.color.argb),
  },
  tolerancia: {
    bg: getHex(estiloOrange.fill.fgColor.argb),
    text: getHex(estiloOrange.font.color.argb),
  },
  tarde: {
    bg: getHex(estiloTarde.fill.fgColor.argb),
    text: getHex(estiloTarde.font.color.argb),
  },
  falta: {
    bg: getHex(estiloFalta.fill.fgColor.argb),
    text: getHex(estiloFalta.font.color.argb),
  },
  falta_justificada: {
    bg: getHex(estiloFaltaJustificada.fill.fgColor.argb),
    text: getHex(estiloFaltaJustificada.font.color.argb),
  },
  no_asiste: {
    bg: getHex(estiloNoAsiste.fill.fgColor.argb),
    text: getHex(estiloNoAsiste.font.color.argb),
  },
  registrado: { bg: "#E7E6E6", text: "#000000" },

  header: {
    bg: getHex(fillEncabezadoDocente.fgColor.argb),
    text: getHex(estiloEncabezadoBase.font.color.argb),
  },
  base: { bg: "#FFFFFF", text: "#000000" },
  title: { text: "#000000", font: "bold 20px Gatha, sans-serif" },
  headerFont: "bold 16px Coolvetica, sans-serif",
  dataFont: "15px Coolvetica, sans-serif",
};

const ROW_HEIGHT = 30;
const TITLE_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PADDING = 10;
// Anchos 3 columnas: N°(40), Docente(350), Hora(150)
const COL_WIDTHS = [40, 350, 150];
const TOTAL_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0) + PADDING * 2;
const registrosPath = path.join(__dirname, "../../Registros");

// Mapa de colores Excel -> Estado interno
const colorMap = {
  [estiloPuntual.fill.fgColor.argb]: "puntual",
  [estiloOrange.fill.fgColor.argb]: "tolerancia",
  [estiloTarde.fill.fgColor.argb]: "tarde",
  [estiloFaltaJustificada.fill.fgColor.argb]: "falta_justificada",
  [estiloFalta.fill.fgColor.argb]: "falta",
};

async function getExcelData(fileName) {
  const ruta = path.join(registrosPath, fileName);
  if (!fs.existsSync(ruta)) return [];

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(ruta);
  const allSheetsData = [];

  workbook.eachSheet((worksheet) => {
    if (worksheet.name !== "Docentes") return;
    let currentSection = null;

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cellA = row.getCell(1).value?.toString() || "";

      if (cellA.startsWith("REGISTRO")) {
        currentSection = { title: cellA, headers: [], rows: [] };
        allSheetsData.push(currentSection);
      } else if (cellA.includes("N°") && currentSection) {
        // Headers: [N, Docente, Fecha]
        currentSection.headers = [
          row.getCell(1).value,
          row.getCell(2).value,
          row.getCell(3).value,
        ].map(String);
      } else if (!isNaN(parseInt(cellA)) && currentSection) {
        // Datos
        let nombre = row.getCell(2).value;
        if (typeof nombre === "object" && nombre.richText)
          nombre = nombre.richText.map((t) => t.text).join("");

        const cellTime = row.getCell(3);
        let cellTimeVal = cellTime.value;
        let status = "registrado";

        if (cellTimeVal instanceof Date) {
          cellTimeVal = cellTimeVal
            .toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(/\s/g, "")
            .toUpperCase();
        } else {
          cellTimeVal = cellTimeVal?.toString() || "";
        }

        // Estado por color
        if (
          cellTime.fill &&
          cellTime.fill.fgColor &&
          colorMap[cellTime.fill.fgColor.argb]
        ) {
          status = colorMap[cellTime.fill.fgColor.argb];
        } else if (cellTimeVal === "FALTA") status = "falta";
        else if (cellTimeVal === "NO ASISTE") status = "no_asiste";
        else if (cellTimeVal === "F. JUSTIFICADA") status = "falta_justificada";

        currentSection.rows.push({
          n: cellA,
          nombre: String(nombre),
          hora: cellTimeVal,
          status: status,
        });
      }
    });
  });
  return allSheetsData;
}

async function generateReportImage(ciclo, turno) {
  const today =
    new Date()
      .toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-") + ".xlsx";
  const allData = await getExcelData(today);
  if (!allData || allData.length === 0) return null;

  const sectionData = allData[0];
  const { title, headers, rows } = sectionData;
  if (rows.length === 0) return null;

  const totalHeight =
    TITLE_HEIGHT + HEADER_HEIGHT + rows.length * ROW_HEIGHT + PADDING * 2;
  const canvas = createCanvas(TOTAL_WIDTH, totalHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, TOTAL_WIDTH, totalHeight);

  let currentY = PADDING;

  // Título
  ctx.fillStyle = styles.title.text;
  ctx.font = styles.title.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(title, TOTAL_WIDTH / 2, currentY);
  currentY += TITLE_HEIGHT;

  // Encabezados
  ctx.font = styles.headerFont;
  let currentX = PADDING;
  ctx.fillStyle = styles.header.bg;
  ctx.fillRect(PADDING, currentY, TOTAL_WIDTH - PADDING * 2, HEADER_HEIGHT);
  ctx.fillStyle = styles.header.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < headers.length; i++) {
    const w = COL_WIDTHS[i];
    ctx.fillText(headers[i], currentX + w / 2, currentY + HEADER_HEIGHT / 2);
    currentX += w;
  }
  currentY += HEADER_HEIGHT;

  // Datos
  ctx.font = styles.dataFont;
  for (const row of rows) {
    currentX = PADDING;
    const rowValues = [row.n, row.nombre, row.hora];
    const statusStyle = styles[row.status] || styles.base;

    for (let i = 0; i < rowValues.length; i++) {
      const w = COL_WIDTHS[i];
      const isStatus = i === 2; // Columna 3 es status

      ctx.fillStyle = isStatus ? statusStyle.bg : styles.base.bg;
      ctx.fillRect(currentX, currentY, w, ROW_HEIGHT);
      ctx.fillStyle = isStatus ? statusStyle.text : styles.base.text;

      if (i === 1) {
        // Nombre left
        ctx.textAlign = "left";
        ctx.fillText(rowValues[i], currentX + 5, currentY + ROW_HEIGHT / 2);
      } else {
        ctx.textAlign = "center";
        ctx.fillText(rowValues[i], currentX + w / 2, currentY + ROW_HEIGHT / 2);
      }

      ctx.strokeStyle = "#DDDDDD";
      ctx.strokeRect(currentX, currentY, w, ROW_HEIGHT);
      currentX += w;
    }
    currentY += ROW_HEIGHT;
  }

  return canvas.toBuffer("image/png");
}

module.exports = { generateReportImage };

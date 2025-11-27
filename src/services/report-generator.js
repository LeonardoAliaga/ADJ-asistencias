// src/services/report-generator.js (LIMPIO)
const { createCanvas, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const {
  estiloFalta,
  estiloNoAsiste,
  estiloDocenteRegistrado,
  estiloFaltaJustificada,
  fillEncabezadoDocente,
  estiloEncabezadoBase,
} = require("./excel/excel.constants.js");

// Fuentes
try {
  registerFont(
    path.join(__dirname, "../../Public/fonts/ZTGatha-SemiBold.otf"),
    { family: "Gatha" }
  );
  registerFont(path.join(__dirname, "../../Public/fonts/coolvetica rg.otf"), {
    family: "Coolvetica",
  });
} catch (err) {
  console.warn("Report-Generator: Fuentes no cargadas.", err.message);
}

// Mapa de estilos visuales para el Canvas
const styles = {
  docente: {
    bg: "#" + estiloDocenteRegistrado.fill.fgColor.argb.substring(2),
    text:
      "#" +
      (estiloDocenteRegistrado.font.color
        ? estiloDocenteRegistrado.font.color.argb.substring(2)
        : "000000"),
  },
  falta: {
    bg: "#" + estiloFalta.fill.fgColor.argb.substring(2),
    text: "#" + estiloFalta.font.color.argb.substring(2),
  },
  no_asiste: {
    bg: "#" + estiloNoAsiste.fill.fgColor.argb.substring(2),
    text: "#" + estiloNoAsiste.font.color.argb.substring(2),
  },
  falta_justificada: {
    bg: "#" + estiloFaltaJustificada.fill.fgColor.argb.substring(2),
    text: "#" + estiloFaltaJustificada.font.color.argb.substring(2),
  },
  registrado: { bg: "#E7E6E6", text: "#000000" }, // Fallback
  header: {
    bg: "#" + fillEncabezadoDocente.fgColor.argb.substring(2),
    text: "#" + estiloEncabezadoBase.font.color.argb.substring(2),
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
const COL_WIDTHS = [40, 300, 90, 150, 100];
const TOTAL_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0) + PADDING * 2;
const registrosPath = path.join(__dirname, "../../Registros");

// Mapa de colores Excel -> Estado interno
const colorMap = {
  [estiloFalta.fill.fgColor.argb]: "falta",
  [estiloNoAsiste.fill.fgColor.argb]: "no_asiste",
  [estiloDocenteRegistrado.fill.fgColor.argb]: "docente",
  [estiloFaltaJustificada.fill.fgColor.argb]: "falta_justificada",
};

async function getExcelData(fileName) {
  const ruta = path.join(registrosPath, fileName);
  if (!fs.existsSync(ruta))
    throw new Error(`Archivo no encontrado: ${fileName}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(ruta);
  const allSheetsData = [];

  workbook.eachSheet((worksheet) => {
    // Solo procesar si es hoja de Docentes
    if (worksheet.name !== "Docentes") return;

    let currentSection = null;
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cellA = row.getCell(1);
      let cellAValue = cellA.value?.toString() || "";

      if (cellA.isMerged && cellAValue.startsWith("REGISTRO DE ASISTENCIA")) {
        currentSection = {
          title: cellAValue,
          headers: [],
          rows: [],
        };
        allSheetsData.push(currentSection);
      } else if (cellAValue.includes("N°") && currentSection) {
        currentSection.headers = [
          row.getCell(1).value,
          row.getCell(2).value,
          row.getCell(3).value,
          row.getCell(4).value,
          row.getCell(5).value,
        ].map((h) => h?.toString() || "");
      } else if (
        !isNaN(parseInt(cellAValue)) &&
        currentSection &&
        row.getCell(2).value
      ) {
        // Procesar fila de datos
        let nombre = row.getCell(2).value;
        if (typeof nombre === "object" && nombre.richText)
          nombre = nombre.richText.map((t) => t.text).join("");

        const cellE = row.getCell(5);
        let cellEValue = cellE.value;
        let status = "registrado";

        if (cellEValue instanceof Date) {
          cellEValue = cellEValue
            .toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(/\s/g, "")
            .toUpperCase();
        } else {
          cellEValue = cellEValue?.toString() || "";
        }

        // Determinar estado por color
        const cellEFill = cellE.fill;
        if (cellEFill && cellEFill.fgColor && cellEFill.fgColor.argb) {
          status = colorMap[cellEFill.fgColor.argb] || status;
        }

        // Fallback por texto
        const upperVal = cellEValue.toUpperCase();
        if (upperVal === "FALTA") status = "falta";
        else if (upperVal === "NO ASISTE") status = "no_asiste";
        else if (upperVal === "F. JUSTIFICADA") status = "falta_justificada";

        currentSection.rows.push({
          n: row.getCell(1).value?.toString() || "",
          nombre: nombre?.toString() || "",
          turno: row.getCell(3).value?.toString() || "",
          dias: row.getCell(4).value?.toString() || "",
          hora: cellEValue,
          status: status,
        });
      }
    });
  });
  return allSheetsData;
}

async function generateReportImage(cicloIgnored, turnoIgnored) {
  // Ignoramos ciclo/turno porque solo hay un reporte de docentes
  const today = new Date();
  const fileName =
    today
      .toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-") + ".xlsx";

  let sectionData;
  try {
    const allData = await getExcelData(fileName);
    if (allData.length > 0) sectionData = allData[0]; // Tomamos la primera sección (Docentes)
  } catch (err) {
    console.error(
      `Report-Generator: Error leyendo ${fileName}: ${err.message}`
    );
    return null;
  }

  if (!sectionData || sectionData.rows.length === 0) {
    console.log(`Report-Generator: No hay datos en ${fileName}.`);
    return null;
  }

  const { title, headers, rows } = sectionData;
  const totalHeight =
    TITLE_HEIGHT + HEADER_HEIGHT + rows.length * ROW_HEIGHT + PADDING * 2;
  const canvas = createCanvas(TOTAL_WIDTH, totalHeight);
  const ctx = canvas.getContext("2d");

  // Fondo blanco
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
    const width = COL_WIDTHS[i];
    ctx.fillText(
      headers[i],
      currentX + width / 2,
      currentY + HEADER_HEIGHT / 2
    );
    currentX += width;
  }
  currentY += HEADER_HEIGHT;

  // Datos
  ctx.font = styles.dataFont;
  for (const row of rows) {
    currentX = PADDING;
    const rowValues = [row.n, row.nombre, row.turno, row.dias, row.hora];
    const statusStyle = styles[row.status] || styles.base;

    for (let i = 0; i < rowValues.length; i++) {
      const width = COL_WIDTHS[i];
      const isStatusCell = i === 4;

      ctx.fillStyle = isStatusCell ? statusStyle.bg : styles.base.bg;
      ctx.fillRect(currentX, currentY, width, ROW_HEIGHT);
      ctx.fillStyle = isStatusCell ? statusStyle.text : styles.base.text;

      if (i === 1) {
        // Nombre alineado izquierda
        ctx.textAlign = "left";
        ctx.fillText(rowValues[i], currentX + 5, currentY + ROW_HEIGHT / 2);
      } else {
        // Resto centrado
        ctx.textAlign = "center";
        ctx.fillText(
          rowValues[i],
          currentX + width / 2,
          currentY + ROW_HEIGHT / 2
        );
      }

      ctx.strokeStyle = "#DDDDDD";
      ctx.strokeRect(currentX, currentY, width, ROW_HEIGHT);
      currentX += width;
    }
    currentY += ROW_HEIGHT;
  }

  return canvas.toBuffer("image/png");
}

module.exports = {
  generateReportImage,
};

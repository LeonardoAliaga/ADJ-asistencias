// src/services/excel.service.js
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const color = require("ansi-colors");
const { getDayAbbreviation, getLogHeader } = require("../utils/helpers.js");
const {
  determineExcelInfo,
  setColumnWidths,
} = require("./excel/excel.helpers.js");
const { generateTeacherSheetStructure } = require("./excel/excel.generator.js");
const { updateAttendanceRecord } = require("./excel/excel.updater.js");

const FILE_TAG = "excel.service.js";

async function guardarRegistro(
  usuario,
  fechaStr,
  horaStr,
  isJustified = false,
  estado = "tarde"
) {
  const excelInfo = determineExcelInfo(fechaStr, usuario);
  if (!excelInfo) return false;
  const { filePath, sheetName } = excelInfo;

  try {
    const fecha = new Date();
    const diaAbbr = getDayAbbreviation(fecha);
    const diaSemana = fecha
      .toLocaleDateString("es-PE", { weekday: "long" })
      .toUpperCase();
    const diaNumero = fecha.getDate().toString().padStart(2, "0");
    const nombreColumnaFecha = `${diaSemana} ${diaNumero}`;

    const workbook = new ExcelJS.Workbook();
    let hoja;
    let isNewSheet = false;

    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
      hoja = workbook.getWorksheet(sheetName);
      if (!hoja) {
        hoja = workbook.addWorksheet(sheetName);
        isNewSheet = true;
      }
    } else {
      hoja = workbook.addWorksheet(sheetName);
      isNewSheet = true;
    }

    if (isNewSheet) {
      if (sheetName === "Docentes") {
        generateTeacherSheetStructure(hoja, nombreColumnaFecha, diaAbbr);
      }
      setColumnWidths(hoja);
    }

    // PASAMOS EL ESTADO AQUÍ
    const actualizado = updateAttendanceRecord(
      hoja,
      usuario,
      horaStr,
      isJustified,
      estado
    );

    if (actualizado) {
      await workbook.xlsx.writeFile(filePath);
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error(`${getLogHeader(FILE_TAG)} ${color.red("Error:")}`, err);
    return false;
  }
}

module.exports = { guardarRegistro };

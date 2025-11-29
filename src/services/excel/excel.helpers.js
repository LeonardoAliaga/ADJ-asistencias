// src/services/excel/excel.helpers.js
const path = require("path");
const registrosPath = path.join(__dirname, "../../../Registros");

function determineExcelInfo(fechaStr, usuario) {
  // Siempre "Docentes"
  let sheetName = "Docentes";
  const baseName = fechaStr.replace(/\//g, "-");
  const fileName = `${baseName}.xlsx`;
  const filePath = path.join(registrosPath, fileName);

  return { filePath, sheetName };
}

function setColumnWidths(worksheet) {
  // Ajuste para 3 columnas: N°, Docente, Estado/Hora
  worksheet.columns = [
    { width: 6 }, // A: N°
    { width: 45 }, // B: Docente
    { width: 25 }, // C: Fecha/Hora
  ];
}

function applyBaseDataRowStyles(row, estiloBase, centerAlign, leftAlign) {
  // Aplicar estilos a las 3 columnas
  row.getCell(1).style = { ...estiloBase, alignment: centerAlign };
  row.getCell(2).style = { ...estiloBase, alignment: leftAlign }; // Nombre a la izquierda
  row.getCell(3).style = { ...estiloBase, alignment: centerAlign };
}

module.exports = {
  determineExcelInfo,
  setColumnWidths,
  applyBaseDataRowStyles,
};

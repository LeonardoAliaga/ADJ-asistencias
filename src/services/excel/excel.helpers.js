// src/services/excel/excel.helpers.js (LIMPIO)
const path = require("path");
const registrosPath = path.join(__dirname, "../../../Registros");

function determineExcelInfo(fechaStr, usuario) {
  let sheetName = "";

  if (usuario.rol === "docente") {
    sheetName = "Docentes";
  } else {
    // Si llegara un estudiante por error, lo mandamos a 'Otros' o retornamos null
    console.warn(`Rol no docente detectado: ${usuario.rol}`);
    return null;
  }

  const baseName = fechaStr.replace(/\//g, "-");
  const fileName = `${baseName}.xlsx`;
  const filePath = path.join(registrosPath, fileName);

  return { filePath, sheetName };
}

function setColumnWidths(worksheet) {
  worksheet.columns.forEach((col, index) => {
    let w = 10;
    if (index === 0) w = 5;
    else if (index === 1) w = 35;
    else if (index === 2) w = 10;
    else if (index === 3) w = 20;
    else if (index === 4) w = 15;
    col.width = w;
  });
}

function applyBaseDataRowStyles(row, estiloBase, centerAlign, leftAlign) {
  row.getCell(1).style = { ...estiloBase, alignment: centerAlign };
  row.getCell(2).style = { ...estiloBase, alignment: leftAlign };
  row.getCell(3).style = { ...estiloBase, alignment: centerAlign };
  row.getCell(4).style = { ...estiloBase, alignment: centerAlign };
}

module.exports = {
  determineExcelInfo,
  setColumnWidths,
  applyBaseDataRowStyles,
};

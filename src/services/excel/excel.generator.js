// src/services/excel/excel.generator.js
const fs = require("fs");
const path = require("path");
const { getFullName } = require("../../utils/helpers.js");
const {
  estiloFalta,
  estiloNoAsiste,
  estiloEncabezadoBase,
  fillEncabezadoDocente,
  estiloDatosBase,
  centerAlignment,
  leftAlignment,
} = require("./excel.constants.js");
const { applyBaseDataRowStyles } = require("./excel.helpers.js");

const usuariosPath = path.join(__dirname, "../../../data/usuarios.json");

function generateTeacherSheetStructure(hoja, nombreColumnaFecha, diaAbbr) {
  let fila = 1;
  const docentes = JSON.parse(fs.readFileSync(usuariosPath, "utf8"))
    .filter((u) => u.rol === "docente")
    .sort((a, b) => {
      const ka = (a.apellido || getFullName(a)).toUpperCase();
      const kb = (b.apellido || getFullName(b)).toUpperCase();
      return ka.localeCompare(kb, "es");
    });

  // Título: Merge solo A hasta C (3 columnas)
  hoja.getCell(`A${fila}`).value = "REGISTRO DE ASISTENCIA - DOCENTES";
  hoja.mergeCells(`A${fila}:C${fila}`);
  hoja.getCell(`A${fila}`).font = { bold: true, size: 14 };
  hoja.getCell(`A${fila}`).alignment = { horizontal: "center" };
  fila++;

  // Encabezado: Solo 3 valores
  hoja.getRow(fila).values = ["N°", "DOCENTE", nombreColumnaFecha];

  // Estilar las 3 celdas del encabezado
  for (let c = 1; c <= 3; c++) {
    const cell = hoja.getRow(fila).getCell(c);
    cell.style = {
      ...estiloEncabezadoBase,
      fill: { ...fillEncabezadoDocente },
    };
  }
  fila++;

  // Datos
  docentes.forEach((doc, i) => {
    const isScheduled =
      doc.dias_asistencia && doc.dias_asistencia.includes(diaAbbr);
    const initialStatus = isScheduled ? "FALTA" : "NO ASISTE";

    // Fila con solo 3 valores
    const row = hoja.addRow([i + 1, getFullName(doc), initialStatus]);

    applyBaseDataRowStyles(
      row,
      estiloDatosBase,
      centerAlignment,
      leftAlignment
    );

    // Pintar celda 3 (Estado inicial)
    const styleToApply = isScheduled ? estiloFalta : estiloNoAsiste;
    row.getCell(3).style = {
      fill: { ...styleToApply.fill },
      font: { ...styleToApply.font },
      alignment: { ...styleToApply.alignment },
      border: { ...styleToApply.border },
    };
  });
}

module.exports = {
  generateTeacherSheetStructure,
};

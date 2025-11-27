// src/services/excel/excel.generator.js (LIMPIO)
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

  // Título
  hoja.getCell(`A${fila}`).value = "REGISTRO DE ASISTENCIA - DOCENTES";
  hoja.mergeCells(`A${fila}:E${fila}`);
  hoja.getCell(`A${fila}`).font = { bold: true, size: 14 };
  hoja.getCell(`A${fila}`).alignment = { horizontal: "center" };
  fila++;

  // Encabezado
  hoja.getRow(fila).values = [
    "N°",
    "DOCENTE",
    "TURNO",
    "DÍAS ASISTENCIA",
    nombreColumnaFecha,
  ];
  hoja.getRow(fila).eachCell((cell) => {
    cell.style = {
      ...estiloEncabezadoBase,
      fill: { ...fillEncabezadoDocente },
    };
  });
  fila++;

  // Datos
  docentes.forEach((doc, i) => {
    const isScheduled =
      doc.dias_asistencia && doc.dias_asistencia.includes(diaAbbr);
    const initialStatus = isScheduled ? "FALTA" : "NO ASISTE";
    const diasAsistenciaStr = doc.dias_asistencia
      ? doc.dias_asistencia.join(", ")
      : "";
    const row = hoja.addRow([
      i + 1,
      getFullName(doc),
      "",
      diasAsistenciaStr,
      initialStatus,
    ]);

    applyBaseDataRowStyles(
      row,
      estiloDatosBase,
      centerAlignment,
      leftAlignment
    );

    const styleToApply = isScheduled ? estiloFalta : estiloNoAsiste;
    row.getCell(5).style = {
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

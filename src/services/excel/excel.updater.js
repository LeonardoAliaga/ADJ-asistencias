// src/services/excel/excel.updater.js (LIMPIO)
const {
  estiloFalta,
  estiloNoAsiste,
  estiloDocenteRegistrado,
  estiloDatosBase,
  centerAlignment,
  leftAlignment,
} = require("./excel.constants");
const {
  normalizarTexto,
  convertTo12Hour,
  getFullName,
} = require("../../utils/helpers");
const { applyBaseDataRowStyles } = require("./excel.helpers.js");

function updateAttendanceRecord(hoja, usuario, horaStr, isJustified = false) {
  let filaEncontrada = null;
  let numFila = -1;

  // Buscar la fila del usuario por nombre
  hoja.eachRow((row, rowNumber) => {
    const celdaNombre = row.getCell(2);
    if (!celdaNombre || !celdaNombre.value) return;

    let nombreCelda = celdaNombre.value;
    if (typeof nombreCelda === "object" && nombreCelda.richText) {
      nombreCelda = nombreCelda.richText.map((t) => t.text).join("");
    } else if (typeof nombreCelda === "object" && nombreCelda.text) {
      nombreCelda = nombreCelda.text;
    }

    const cellNorm = normalizarTexto(String(nombreCelda));
    const preferredNorm = normalizarTexto(getFullName(usuario));

    if (cellNorm === preferredNorm) {
      filaEncontrada = row;
      numFila = rowNumber;
      return false; // Break loop
    }
  });

  if (!filaEncontrada) {
    console.log(`❌ No se encontró a ${getFullName(usuario)} en la hoja.`);
    return false;
  }

  const celdaHora = filaEncontrada.getCell(5);
  const valorCelda = (celdaHora.value || "").toString().trim().toUpperCase();

  // Validar si ya tiene registro (permitir sobrescribir solo si es FALTA, NO ASISTE, etc.)
  if (
    valorCelda !== "" &&
    valorCelda !== "FALTA" &&
    valorCelda !== "NO ASISTE" &&
    valorCelda !== "F. JUSTIFICADA" &&
    !valorCelda.endsWith("(J)")
  ) {
    console.log(
      `⚠️ ${getFullName(usuario)} ya tiene registro: ${valorCelda}. Ignorado.`
    );
    return false;
  }

  const hora12h = convertTo12Hour(horaStr);
  let valorHoraParaExcel = hora12h;

  // Lógica Docente: Siempre aplica estilo azul
  if (isJustified) {
    valorHoraParaExcel = `${hora12h} (J)`;
  }
  const estiloCeldaHora = estiloDocenteRegistrado;

  // Preparar valores para actualizar la fila preservando datos existentes
  const numOriginal = filaEncontrada.getCell(1).value;
  const nombreOriginal = filaEncontrada.getCell(2).value;
  const turnoOriginal = filaEncontrada.getCell(3).value; // Debería estar vacío o ser irrelevante
  const diasOriginal = filaEncontrada.getCell(4).value;

  const nuevaFilaValores = [
    numOriginal,
    nombreOriginal,
    turnoOriginal,
    diasOriginal,
    valorHoraParaExcel,
  ];

  hoja.spliceRows(numFila, 1, nuevaFilaValores);
  const filaActualizada = hoja.getRow(numFila);

  // Re-aplicar estilos base a toda la fila
  applyBaseDataRowStyles(
    filaActualizada,
    estiloDatosBase,
    centerAlignment,
    leftAlignment
  );

  // Aplicar estilo específico a la celda de hora
  filaActualizada.getCell(5).style = {
    fill: { ...estiloCeldaHora.fill },
    font: { ...estiloCeldaHora.font },
    alignment: { ...estiloCeldaHora.alignment },
    border: { ...estiloCeldaHora.border },
  };

  console.log(
    `✅ Asistencia actualizada para ${getFullName(
      usuario
    )}: ${valorHoraParaExcel}`
  );
  return true;
}

module.exports = {
  updateAttendanceRecord,
};

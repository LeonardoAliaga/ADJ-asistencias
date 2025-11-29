// src/services/excel/excel.updater.js
const {
  estiloPuntual,
  estiloOrange,
  estiloTarde,
  estiloDocenteRegistrado,
  estiloDatosBase,
  centerAlignment,
  leftAlignment,
} = require("./excel.constants");
const {
  normalizarTexto,
  convertTo12Hour,
  getFullName,
  getLogHeader,
} = require("../../utils/helpers");
const { applyBaseDataRowStyles } = require("./excel.helpers.js");
const color = require("ansi-colors");

const FILE_TAG = "excel.updater.js";

function updateAttendanceRecord(
  hoja,
  usuario,
  horaStr,
  isJustified = false,
  estado = "tarde"
) {
  let filaEncontrada = null;
  let numFila = -1;

  hoja.eachRow((row, rowNumber) => {
    // Nombre en Columna 2
    const celdaNombre = row.getCell(2);
    if (!celdaNombre || !celdaNombre.value) return;

    let nombreCelda = celdaNombre.value;
    if (typeof nombreCelda === "object" && nombreCelda.richText) {
      nombreCelda = nombreCelda.richText.map((t) => t.text).join("");
    } else if (typeof nombreCelda === "object" && nombreCelda.text) {
      nombreCelda = nombreCelda.text;
    }

    if (
      normalizarTexto(String(nombreCelda)) ===
      normalizarTexto(getFullName(usuario))
    ) {
      filaEncontrada = row;
      numFila = rowNumber;
      return false;
    }
  });

  if (!filaEncontrada) return false;

  // Celda de Hora es la 3
  const celdaHora = filaEncontrada.getCell(3);
  const valorCelda = (celdaHora.value || "").toString().trim().toUpperCase();

  // Validar si ya está registrado (y no es falta)
  if (
    valorCelda !== "" &&
    valorCelda !== "FALTA" &&
    valorCelda !== "NO ASISTE" &&
    valorCelda !== "F. JUSTIFICADA" &&
    !valorCelda.endsWith("(J)")
  ) {
    return false;
  }

  const hora12h = convertTo12Hour(horaStr);
  let valorHoraParaExcel = hora12h;
  let estiloCeldaHora = estiloDocenteRegistrado; // Fallback

  // Definir color según estado
  if (isJustified) {
    valorHoraParaExcel = `${hora12h} (J)`;
    estiloCeldaHora = estiloOrange;
  } else {
    if (estado === "puntual") estiloCeldaHora = estiloPuntual;
    else if (estado === "tolerancia") estiloCeldaHora = estiloOrange;
    else if (estado === "tarde") estiloCeldaHora = estiloTarde;
  }

  // IMPORTANTE: Escribir DIRECTAMENTE en las celdas, sin usar spliceRows para no mover nada
  // Col 1: No se toca (N°)
  // Col 2: No se toca (Nombre)

  // Col 3: Hora + Estilo
  celdaHora.value = valorHoraParaExcel;
  celdaHora.style = {
    fill: { ...estiloCeldaHora.fill },
    font: { ...estiloCeldaHora.font },
    alignment: { ...estiloCeldaHora.alignment },
    border: { ...estiloCeldaHora.border },
  };

  console.log(
    `${getLogHeader(FILE_TAG)} ${color.green(
      "Asistencia actualizada:"
    )} ${valorHoraParaExcel} (${estado})`
  );
  return true;
}

module.exports = { updateAttendanceRecord };

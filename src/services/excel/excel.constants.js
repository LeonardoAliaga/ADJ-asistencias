// src/services/excel/excel.constants.js (LIMPIO)

const borderStyle = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};
const centerAlignment = { horizontal: "center", vertical: "middle" };
const leftAlignment = { horizontal: "left", vertical: "middle" };

// Estilos de estado
const estiloFalta = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } }, // Gris claro
  font: { bold: true, color: { argb: "FF000000" } },
  alignment: centerAlignment,
  border: borderStyle,
};

const estiloNoAsiste = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC0C0C0" } }, // Gris medio
  font: { bold: true, italic: true, color: { argb: "FF404040" } },
  alignment: centerAlignment,
  border: borderStyle,
};

const estiloFaltaJustificada = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB9C" } }, // Naranja claro
  font: { bold: true, color: { argb: "FF9C6500" } }, // Naranja oscuro
  alignment: centerAlignment,
  border: borderStyle,
};

// Estilo azul para docentes
const estiloDocenteRegistrado = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD6EAF8" } }, // Azul claro
  font: { bold: true, color: { argb: "FF1B4F72" } }, // Azul oscuro
  alignment: centerAlignment,
  border: borderStyle,
};

// Estilos base
const estiloDatosBase = {
  font: { bold: false, color: { argb: "FF000000" } },
  border: borderStyle,
};

const estiloEncabezadoBase = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  alignment: centerAlignment,
  border: borderStyle,
};

const fillEncabezadoDocente = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF008080" }, // Verde azulado (Teal)
};

module.exports = {
  borderStyle,
  centerAlignment,
  leftAlignment,
  estiloFalta,
  estiloNoAsiste,
  estiloFaltaJustificada,
  estiloDocenteRegistrado,
  estiloDatosBase,
  estiloEncabezadoBase,
  fillEncabezadoDocente,
};

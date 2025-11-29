// src/services/excel/excel.constants.js
const borderStyle = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};
const centerAlignment = { horizontal: "center", vertical: "middle" };
const leftAlignment = { horizontal: "left", vertical: "middle" };

// ESTILOS DE ESTADO (COLORES)

// Puntual -> Verde
const estiloPuntual = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } }, // Verde claro
  font: { bold: true, color: { argb: "FF006100" } }, // Verde oscuro
  alignment: centerAlignment,
  border: borderStyle,
};

// Tolerancia, Tardanza Justificada, Falta Justificada -> Naranja
const estiloOrange = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB9C" } }, // Naranja claro
  font: { bold: true, color: { argb: "FF9C5700" } }, // Naranja oscuro
  alignment: centerAlignment,
  border: borderStyle,
};

// Definimos explícitamente Falta Justificada (es el mismo estilo naranja)
const estiloFaltaJustificada = estiloOrange;

// Tardanza -> Rojo
const estiloTarde = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } }, // Rojo claro
  font: { bold: true, color: { argb: "FF9C0006" } }, // Rojo oscuro
  alignment: centerAlignment,
  border: borderStyle,
};

// Falta / No Asiste (Gris)
const estiloFalta = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } },
  font: { bold: true, color: { argb: "FF000000" } },
  alignment: centerAlignment,
  border: borderStyle,
};

const estiloNoAsiste = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC0C0C0" } },
  font: { bold: true, italic: true, color: { argb: "FF404040" } },
  alignment: centerAlignment,
  border: borderStyle,
};

// Docente Registrado (Azul - Default fallback)
const estiloDocenteRegistrado = {
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD6EAF8" } },
  font: { bold: true, color: { argb: "FF1B4F72" } },
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
  fgColor: { argb: "FF008080" }, // Teal
};

module.exports = {
  borderStyle,
  centerAlignment,
  leftAlignment,
  estiloPuntual,
  estiloOrange,
  estiloFaltaJustificada,
  estiloTarde,
  estiloFalta,
  estiloNoAsiste,
  estiloDocenteRegistrado,
  estiloDatosBase,
  estiloEncabezadoBase,
  fillEncabezadoDocente,
};

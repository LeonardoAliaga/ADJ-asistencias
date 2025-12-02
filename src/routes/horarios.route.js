// src/routes/horarios.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { obtainingHorarios, getLogHeader } = require("../utils/helpers"); // Asegúrate que el nombre en helpers.js es obtenerHorarios (lo corregí abajo)
const { obtenerHorarios } = require("../utils/helpers");

const router = express.Router();
const horariosPath = path.join(__dirname, "../../data/horarios.json");
const FILE_TAG = "horarios.route.js";

router.get("/", (req, res) => {
  res.json(obtenerHorarios());
});

router.post("/", (req, res) => {
  const nuevoHorario = req.body;
  if (!nuevoHorario || !nuevoHorario.default || !nuevoHorario.default.entrada) {
    return res.status(400).json({ mensaje: "Formato inválido." });
  }

  try {
    fs.writeFileSync(horariosPath, JSON.stringify(nuevoHorario, null, 2));
    console.log(`${getLogHeader(FILE_TAG)} Horarios actualizados.`);
    res.json({ mensaje: "Horario general actualizado." });
  } catch (err) {
    console.error(`${getLogHeader(FILE_TAG)} Error guardando:`, err);
    res.status(500).json({ mensaje: "Error interno." });
  }
});

module.exports = router;

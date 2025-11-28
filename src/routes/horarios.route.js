// src/routes/horarios.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { obtenerHorarios } = require("../utils/helpers");

const router = express.Router();
const horariosPath = path.join(__dirname, "../../data/horarios.json");

router.get("/", (req, res) => {
  res.json(obtenerHorarios());
});

router.post("/", (req, res) => {
  // Espera { default: { entrada, tolerancia } }
  const nuevoHorario = req.body;

  if (!nuevoHorario || !nuevoHorario.default || !nuevoHorario.default.entrada) {
    return res.status(400).json({ mensaje: "Formato inválido." });
  }

  try {
    fs.writeFileSync(horariosPath, JSON.stringify(nuevoHorario, null, 2));
    res.json({ mensaje: "Horario general actualizado." });
  } catch (err) {
    console.error("Error guardando horarios:", err);
    res.status(500).json({ mensaje: "Error interno." });
  }
});

module.exports = router;

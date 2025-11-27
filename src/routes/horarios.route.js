// src/routes/horarios.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { obtenerHorarios } = require("../utils/helpers");

const router = express.Router();
const horariosPath = path.join(__dirname, "../../data/horarios.json");

router.get("/", (req, res) => {
  const horarios = obtenerHorarios();
  res.json(horarios);
});

router.post("/", (req, res) => {
  const { ciclo, horarios } = req.body;
  // Validación básica
  if (!ciclo || !horarios || !horarios.mañana || !horarios.tarde) {
    return res.status(400).json({ mensaje: "Formato inválido." });
  }

  try {
    const configCompleta = obtenerHorarios();
    if (ciclo === "default") {
      configCompleta.default = horarios;
    } else {
      // Si por alguna razón llegan otros ciclos, los guardamos, pero la UI usa default
      if (!configCompleta.ciclos) configCompleta.ciclos = {};
      configCompleta.ciclos[ciclo] = horarios;
    }
    fs.writeFileSync(horariosPath, JSON.stringify(configCompleta, null, 2));
    res.json({ mensaje: "Horarios actualizados correctamente." });
  } catch (err) {
    console.error("Error guardando horarios:", err);
    res.status(500).json({ mensaje: "Error interno." });
  }
});

module.exports = router;

// src/routes/usuarios.route.js (LIMPIO)
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const usuariosPath = path.join(__dirname, "../../data/usuarios.json");

function readUsuarios() {
  if (!fs.existsSync(usuariosPath)) return [];
  return JSON.parse(fs.readFileSync(usuariosPath, "utf8"));
}

function saveUsuarios(usuarios) {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
}

router.get("/", (req, res) => {
  res.json(readUsuarios());
});

router.post("/", (req, res) => {
  const usuarios = readUsuarios();
  const nuevo = req.body;

  if (!nuevo.codigo || !nuevo.nombre) {
    return res.status(400).json({ mensaje: "Faltan datos." });
  }

  if (usuarios.some((u) => u.codigo === nuevo.codigo)) {
    return res.status(409).json({ mensaje: "El código ya existe." });
  }

  // Forzar datos de Docente
  const usuarioToSave = {
    codigo: String(nuevo.codigo).trim().toUpperCase(),
    nombre: String(nuevo.nombre).trim().toUpperCase(),
    apellido: String(nuevo.apellido).trim().toUpperCase(),
    rol: "docente",
    dias_asistencia: nuevo.dias_asistencia || ["L", "M", "MI", "J", "V", "S"],
    turno: "", // Docentes no tienen turno fijo en este modelo simplificado
    ciclo: "",
  };

  usuarios.push(usuarioToSave);
  saveUsuarios(usuarios);
  res.json({ exito: true, mensaje: "Docente agregado." });
});

router.put("/:codigo", (req, res) => {
  const usuarios = readUsuarios();
  const idx = usuarios.findIndex((u) => u.codigo === req.params.codigo);

  if (idx === -1) return res.status(404).json({ mensaje: "No encontrado" });

  const update = req.body;

  // Validar colisión si cambia el código
  if (
    update.codigo !== req.params.codigo &&
    usuarios.some((u) => u.codigo === update.codigo)
  ) {
    return res.status(409).json({ mensaje: "El nuevo código ya existe." });
  }

  usuarios[idx] = {
    ...usuarios[idx],
    codigo: update.codigo,
    nombre: update.nombre.toUpperCase(),
    apellido: update.apellido.toUpperCase(),
    dias_asistencia: update.dias_asistencia,
  };

  saveUsuarios(usuarios);
  res.json({ exito: true, mensaje: "Actualizado." });
});

router.delete("/:codigo", (req, res) => {
  const usuarios = readUsuarios();
  const filtrados = usuarios.filter((u) => u.codigo !== req.params.codigo);
  saveUsuarios(filtrados);
  res.json({ exito: true });
});

module.exports = router;

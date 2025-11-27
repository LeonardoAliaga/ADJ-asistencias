// src/routes/api.route.js
const express = require("express");
const registrarRouter = require("./registrar.route");
const usuariosRouter = require("./usuarios.route");
const notesRouter = require("./notes.route");
const excelRouter = require("./excel.route");

const router = express.Router();

// Montar los routers específicos en sus prefijos correspondientes
router.use("/registrar", registrarRouter);
router.use("/usuarios", usuariosRouter);
router.use("/notes", notesRouter);
router.use("/excel", excelRouter);

module.exports = router;

const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs");
const apiRouter = require("./src/routes/api.route");
const whatsappRouter = require("./src/routes/whatsapp.route.js");
// IMPORTAR LA FUNCIÓN DE INICIO EXPLICITO
const { startClient } = require("./Whatsapp/WhatsappClient");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "Public")));

app.use(
  session({
    secret: "1234",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const passwordPath = path.join(__dirname, "data/password.json");

function getPassword() {
  try {
    const data = fs.readFileSync(passwordPath, "utf8");
    return JSON.parse(data).password;
  } catch {
    try {
      fs.writeFileSync(
        passwordPath,
        JSON.stringify({ password: "admin123" }, null, 2)
      );
      return "admin123";
    } catch (writeError) {
      return "admin123";
    }
  }
}

app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === getPassword()) {
    req.session.admin = true;
    return res.json({ exito: true });
  }
  res.status(401).json({ exito: false, mensaje: "Contraseña incorrecta" });
});

app.post("/admin/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      res.clearCookie("connect.sid");
      return res.json({ exito: true });
    });
  } else {
    return res.json({ exito: true });
  }
});

const requireAdmin = (req, res, next) => {
  if (req.session && req.session.admin) {
    next();
  } else {
    if (req.path.startsWith("/api/") || req.path.startsWith("/whatsapp/api/")) {
      res.status(401).json({ exito: false, mensaje: "No autorizado" });
    } else {
      res.redirect("/admin");
    }
  }
};

app.post("/admin/password", requireAdmin, (req, res) => {
  const { nueva } = req.body;
  if (!nueva || nueva.length < 4) {
    return res
      .status(400)
      .json({ exito: false, mensaje: "Mínimo 4 caracteres" });
  }
  try {
    fs.writeFileSync(
      passwordPath,
      JSON.stringify({ password: nueva }, null, 2)
    );
    res.json({ exito: true, mensaje: "Contraseña actualizada" });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: "Error al guardar" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public/index.html"));
});

app.get("/admin", (req, res) => {
  if (req.session && req.session.admin) {
    res.sendFile(path.join(__dirname, "Public/pages/admin.html"));
  } else {
    res.sendFile(path.join(__dirname, "Public/pages/admin-login.html"));
  }
});

app.use("/api", apiRouter);
app.use("/whatsapp/api", requireAdmin, whatsappRouter);

// Carpetas
const registrosDir = path.join(__dirname, "Registros");
if (!fs.existsSync(registrosDir)) {
  try {
    fs.mkdirSync(registrosDir);
  } catch (e) {}
}
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir);
  } catch (e) {}
}

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  // INICIAMOS WHATSAPP AQUÍ, UNA SOLA VEZ
  startClient();
});

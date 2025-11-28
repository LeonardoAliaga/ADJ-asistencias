// Whatsapp/WhatsappClient.js
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const color = require("ansi-colors");
const fs = require("fs");
const path = require("path");

let isWhatsappReady = false;
let whatsappClient = null;
let currentQR = null;
let isInitializing = false;

const localAuthPath = path.join(__dirname, "../../LocalAuth");

const deleteLocalAuthAndRestart = async (trigger = "unknown") => {
  if (isInitializing) return;
  isInitializing = true;

  console.warn(
    `${color.red("Whatsapp")} Reiniciando sistema por: ${trigger}...`
  );
  isWhatsappReady = false;
  currentQR = null;

  if (whatsappClient) {
    try {
      await whatsappClient.destroy();
      console.log(`${color.yellow("Whatsapp")} Cliente anterior destruido.`);
    } catch (e) {
      console.error(
        `${color.red("Whatsapp")} Error al destruir (ignorable):`,
        e.message
      );
    }
    whatsappClient = null;
  }

  // Esperar liberación de archivos
  console.log(
    `${color.yellow("Whatsapp")} Esperando liberación de archivos...`
  );
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Borrar datos solo si es un error de sesión
  if (
    trigger === "auth_failure" ||
    trigger === "disconnected" ||
    trigger === "manual_restart"
  ) {
    try {
      if (fs.existsSync(localAuthPath)) {
        fs.rmSync(localAuthPath, { recursive: true, force: true });
        console.log(`${color.green("Whatsapp")} Carpeta LocalAuth borrada.`);
      }
    } catch (e) {
      console.error(
        `${color.red("Whatsapp")} No se pudo borrar LocalAuth (¿Bloqueado?):`,
        e.message
      );
    }
  }

  isInitializing = false;
  initializeWhatsappClient();
};

const initializeWhatsappClient = () => {
  if (whatsappClient) return;

  console.log(`${color.cyan("Whatsapp")} 🚀 Inicializando cliente...`);

  try {
    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        clientId: "client-one",
        dataPath: "LocalAuth",
      }),
      // CORRECCIÓN: Eliminamos webVersionCache para usar siempre la última compatible
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          // Eliminado --single-process que causa inestabilidad en Windows
        ],
      },
    });

    whatsappClient.on("qr", (qr) => {
      currentQR = qr;
      isWhatsappReady = false;
      console.log(`${color.yellow("Whatsapp")} 📱 Nuevo QR generado.`);
      qrcode.generate(qr, { small: true });
    });

    whatsappClient.on("ready", () => {
      currentQR = null;
      isWhatsappReady = true;
      console.log(`${color.green("Whatsapp")} ✅ LISTO Y CONECTADO.`);
    });

    whatsappClient.on("authenticated", () => {
      console.log(`${color.green("Whatsapp")} 🔐 Autenticado.`);
      currentQR = null;
    });

    whatsappClient.on("auth_failure", (msg) => {
      console.error(`${color.red("Whatsapp")} Fallo de autenticación:`, msg);
      deleteLocalAuthAndRestart("auth_failure");
    });

    whatsappClient.on("disconnected", (reason) => {
      console.warn(`${color.red("Whatsapp")} Desconectado:`, reason);
      isWhatsappReady = false;
      deleteLocalAuthAndRestart("disconnected");
    });

    whatsappClient.initialize().catch((err) => {
      console.error(
        `${color.red("Whatsapp")} Error inicialización:`,
        err.message
      );
      if (!isInitializing) deleteLocalAuthAndRestart("init_error");
    });
  } catch (error) {
    console.error(`${color.red("Whatsapp")} Error crítico constructor:`, error);
  }
};

const sendMessage = async (to, message) => {
  if (!isWhatsappReady || !whatsappClient) {
    console.warn(`${color.yellow("Whatsapp")} No listo. Mensaje no enviado.`);
    return false;
  }
  try {
    let chatId = to;
    if (!to.includes("@")) chatId = `${to}@c.us`;

    await whatsappClient.sendMessage(chatId, message);
    console.log(`${color.green("Whatsapp")} Enviado a ${chatId}`);
    return true;
  } catch (error) {
    console.error(`${color.red("Whatsapp")} Error enviando:`, error.message);
    return false;
  }
};

const getGroupChats = async () => {
  if (!isWhatsappReady || !whatsappClient) return [];
  try {
    const chats = await whatsappClient.getChats();
    return chats
      .filter((chat) => chat.isGroup)
      .map((chat) => ({ id: chat.id._serialized, name: chat.name }));
  } catch (error) {
    console.error("Error obteniendo grupos:", error);
    return [];
  }
};

module.exports = {
  startClient: initializeWhatsappClient,
  sendMessage,
  getGroupChats,
  isWhatsappReady: () => isWhatsappReady,
  getQR: () => currentQR,
  forceRestart: () => deleteLocalAuthAndRestart("manual_restart"),
  MessageMedia,
};

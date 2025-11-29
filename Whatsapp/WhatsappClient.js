// Whatsapp/WhatsappClient.js
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const color = require("ansi-colors");
const fs = require("fs");
const path = require("path");
const { getLogHeader } = require("../src/utils/helpers"); // Importar helper

let isWhatsappReady = false;
let whatsappClient = null;
let currentQR = null;
let isInitializing = false;

const localAuthPath = path.join(__dirname, "../../LocalAuth");
const FILE_TAG = "WhatsappClient.js"; // Etiqueta para este archivo

const deleteLocalAuthAndRestart = async (trigger = "unknown") => {
  if (isInitializing) return;
  isInitializing = true;

  console.warn(
    `${getLogHeader(FILE_TAG)} ${color.red(
      `Reiniciando sistema por: ${trigger}...`
    )}`
  );
  isWhatsappReady = false;
  currentQR = null;

  if (whatsappClient) {
    try {
      await whatsappClient.destroy();
      console.log(
        `${getLogHeader(FILE_TAG)} ${color.yellow(
          "Cliente anterior destruido."
        )}`
      );
    } catch (e) {
      console.error(
        `${getLogHeader(FILE_TAG)} ${color.red(
          "Error al destruir (ignorable):"
        )}`,
        e.message
      );
    }
    whatsappClient = null;
  }

  console.log(
    `${getLogHeader(FILE_TAG)} ${color.yellow(
      "Esperando liberación de archivos..."
    )}`
  );
  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (
    ["auth_failure", "disconnected", "manual_restart", "init_error"].includes(
      trigger
    )
  ) {
    try {
      if (fs.existsSync(localAuthPath)) {
        fs.rmSync(localAuthPath, { recursive: true, force: true });
        console.log(
          `${getLogHeader(FILE_TAG)} ${color.green(
            "Carpeta LocalAuth borrada."
          )}`
        );
      }
    } catch (e) {
      console.error(
        `${getLogHeader(FILE_TAG)} ${color.red(
          "No se pudo borrar LocalAuth:"
        )}`,
        e.message
      );
    }
  }

  isInitializing = false;
  initializeWhatsappClient();
};

const initializeWhatsappClient = () => {
  if (whatsappClient) {
    console.log(
      `${getLogHeader(FILE_TAG)} ${color.yellow(
        "El cliente ya está inicializado."
      )}`
    );
    return;
  }

  console.log(
    `${getLogHeader(FILE_TAG)} ${color.cyan("🚀 Iniciando cliente...")}`
  );

  try {
    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        clientId: "client-one",
        dataPath: "LocalAuth",
      }),
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
        ],
      },
    });

    whatsappClient.on("qr", (qr) => {
      currentQR = qr;
      isWhatsappReady = false;
      console.log(
        `${getLogHeader(FILE_TAG)} ${color.yellow("📱 Nuevo QR generado.")}`
      );
      qrcode.generate(qr, { small: true });
    });

    whatsappClient.on("ready", () => {
      currentQR = null;
      isWhatsappReady = true;
      console.log(
        `${getLogHeader(FILE_TAG)} ${color.green("✅ LISTO Y CONECTADO.")}`
      );
    });

    whatsappClient.on("authenticated", () => {
      console.log(
        `${getLogHeader(FILE_TAG)} ${color.green("🔐 Autenticado.")}`
      );
      currentQR = null;
    });

    whatsappClient.on("auth_failure", (msg) => {
      console.error(
        `${getLogHeader(FILE_TAG)} ${color.red("❌ Fallo de autenticación:")}`,
        msg
      );
      deleteLocalAuthAndRestart("auth_failure");
    });

    whatsappClient.on("disconnected", (reason) => {
      console.warn(
        `${getLogHeader(FILE_TAG)} ${color.red("⚠️ Desconectado:")}`,
        reason
      );
      isWhatsappReady = false;
      if (reason !== "NAVIGATION") deleteLocalAuthAndRestart("disconnected");
    });

    whatsappClient.initialize().catch((err) => {
      console.error(
        `${getLogHeader(FILE_TAG)} ${color.red("Error inicialización:")}`,
        err.message
      );
      if (!isInitializing) deleteLocalAuthAndRestart("init_error");
    });
  } catch (error) {
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Error crítico constructor:")}`,
      error
    );
  }
};

const sendMessage = async (to, message) => {
  if (!isWhatsappReady || !whatsappClient) {
    console.warn(
      `${getLogHeader(FILE_TAG)} ${color.yellow(
        "No listo. Mensaje no enviado."
      )}`
    );
    return false;
  }
  try {
    let chatId = to.includes("@") ? to : `${to}@c.us`;
    await whatsappClient.sendMessage(chatId, message);
    console.log(
      `${getLogHeader(FILE_TAG)} ${color.green(`Enviado a ${chatId}`)}`
    );
    return true;
  } catch (error) {
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Error enviando:")}`,
      error.message
    );
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
    console.error(
      `${getLogHeader(FILE_TAG)} ${color.red("Error obteniendo grupos:")}`,
      error
    );
    return [];
  }
};

const shutdownClient = async () => {
  if (whatsappClient) {
    console.log(
      `${getLogHeader(FILE_TAG)} ${color.cyan(
        "Apagando cliente por cierre de servidor..."
      )}`
    );
    try {
      await whatsappClient.destroy();
    } catch (e) {}
    whatsappClient = null;
    isWhatsappReady = false;
  }
};

module.exports = {
  startClient: initializeWhatsappClient,
  shutdownClient,
  sendMessage,
  getGroupChats,
  isWhatsappReady: () => isWhatsappReady,
  getQR: () => currentQR,
  forceRestart: () => deleteLocalAuthAndRestart("manual_restart"),
  MessageMedia,
};

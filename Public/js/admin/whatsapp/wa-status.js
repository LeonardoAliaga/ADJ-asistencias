// Public/js/admin/whatsapp/wa-status.js
import * as dom from "./wa-dom.js";

let pollInterval = null;
const POLL_INTERVAL_MS = 5000;

export async function updateWhatsappStatus() {
  if (!dom.statusIndicator) return;

  // Feedback visual inmediato
  dom.statusIndicator.textContent = "Conectando...";
  dom.statusIndicator.className = "status-checking";

  try {
    const res = await fetch("/whatsapp/api/status");
    const data = await res.json();

    if (data.exito && data.isReady) {
      // --- CONECTADO ---
      dom.statusIndicator.textContent = "CONECTADO";
      dom.statusIndicator.className = "status-connected";
      dom.statusMessage.textContent = "El cliente de WhatsApp está listo.";

      // Mostrar panel de configuración, ocultar panel de QR
      if (dom.configContent) dom.configContent.style.display = "block";
      if (dom.qrContainer) dom.qrContainer.style.display = "none";

      // Detener el polling si ya estamos conectados
      stopStatusPolling();
    } else {
      // --- DESCONECTADO ---
      dom.statusIndicator.textContent = "DESCONECTADO";
      dom.statusIndicator.className = "status-disconnected";
      dom.statusMessage.textContent =
        "Escanee el código QR para iniciar sesión.";

      // Ocultar panel de configuración, mostrar panel de QR
      if (dom.configContent) dom.configContent.style.display = "none";
      if (dom.qrContainer) dom.qrContainer.style.display = "block";

      // Intentar cargar y dibujar el QR
      await fetchAndRenderQR();

      // Seguir verificando estado cada 5s
      startStatusPolling();
    }
  } catch (error) {
    console.error("Error status:", error);
    dom.statusIndicator.textContent = "ERROR";
    dom.statusIndicator.className = "status-error";
    dom.statusMessage.textContent = "No se pudo conectar con el servidor.";
  }
}

async function fetchAndRenderQR() {
  if (!dom.qrCanvas) return;

  try {
    const res = await fetch("/whatsapp/api/qr");
    const data = await res.json();

    if (data.exito && data.qr) {
      dom.qrMessage.textContent = "QR recibido. Escanéalo con tu celular.";
      dom.qrCanvas.style.display = "block";

      // Limpiar el canvas antes de dibujar uno nuevo
      const ctx = dom.qrCanvas.getContext("2d");
      ctx.clearRect(0, 0, dom.qrCanvas.width, dom.qrCanvas.height);

      // Usar la librería global QRCode (cargada en admin.html)
      if (window.QRCode && window.QRCode.toCanvas) {
        window.QRCode.toCanvas(
          dom.qrCanvas,
          data.qr,
          { width: 260 },
          function (error) {
            if (error) console.error("Error dibujando QR en canvas:", error);
            else console.log("QR dibujado correctamente.");
          }
        );
      } else {
        console.error("Librería QRCode no encontrada en window.");
        dom.qrMessage.textContent =
          "Error: La librería QRCode no se cargó correctamente.";
      }
    } else {
      // Si no hay QR aún (cliente iniciándose)
      dom.qrMessage.textContent = "Esperando código QR del servidor...";
      dom.qrCanvas.style.display = "none";
    }
  } catch (e) {
    console.error("Error cargando QR:", e);
    dom.qrMessage.textContent = "Error de conexión al buscar QR.";
  }
}

function startStatusPolling() {
  if (!pollInterval) {
    console.log("Iniciando polling de estado WhatsApp...");
    pollInterval = setInterval(updateWhatsappStatus, POLL_INTERVAL_MS);
  }
}

export function stopStatusPolling() {
  if (pollInterval) {
    console.log("Deteniendo polling de estado WhatsApp.");
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

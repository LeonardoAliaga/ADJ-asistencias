// Public/js/admin/whatsapp.js
import * as dom from "./whatsapp/wa-dom.js";
import * as state from "./whatsapp/wa-state.js";
import {
  showUnsavedNotification,
  markUnsavedChanges,
  showMessage,
} from "./whatsapp/wa-helpers.js";
import {
  updateWhatsappStatus,
  stopStatusPolling,
} from "./whatsapp/wa-status.js";
import {
  loadWhatsappConfig,
  saveWhatsappConfig,
  loadGroups,
} from "./whatsapp/wa-config.js";
import { initTeacherRuleListeners } from "./whatsapp/wa-rules-teacher.js";
import { initReportRuleListeners } from "./whatsapp/wa-rules-report.js";

export function initWhatsappAdmin() {
  console.log("Init WhatsApp Admin...");
  state.setUnsavedChanges(false);
  showUnsavedNotification(false);

  updateWhatsappStatus();
  loadGroups(); // Cargar grupos para los selectores

  if (dom.refreshStatusBtn) dom.refreshStatusBtn.onclick = updateWhatsappStatus;

  if (dom.forceRestartBtn) {
    dom.forceRestartBtn.onclick = async () => {
      if (!confirm("¿Reiniciar sesión de WhatsApp?")) return;
      try {
        await fetch("/whatsapp/api/restart", { method: "POST" });
        setTimeout(updateWhatsappStatus, 3000);
      } catch (e) {
        alert("Error al reiniciar");
      }
    };
  }

  initTeacherRuleListeners();
  initReportRuleListeners();

  if (dom.saveConfigBtn) dom.saveConfigBtn.onclick = saveWhatsappConfig;

  // Toggles simples
  if (dom.enabledGeneralToggle)
    dom.enabledGeneralToggle.onchange = markUnsavedChanges;
  if (dom.teacherNotificationsToggle)
    dom.teacherNotificationsToggle.onchange = markUnsavedChanges;
}
